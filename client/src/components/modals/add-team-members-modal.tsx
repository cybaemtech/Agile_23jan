import { useState, useMemo, useRef, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { X, Search, Check } from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { emailSchema, User } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiRequest, apiGet } from '@/lib/api-config';
import { validateCorporateEmails } from '@/lib/email-validation';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddTeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  teamId: number | null;
}

const formSchema = z.object({
  selectedUsers: z.array(z.number()).min(1, {
    message: "Please select at least one user",
  }),
});

export function AddTeamMembersModal({
  isOpen,
  onClose,
  projectId,
  teamId,
}: AddTeamMembersModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/users'],
    queryFn: () => apiGet('/users'),
    enabled: isOpen,
  });

  // Fetch team members to exclude already-added members
  const { data: teamMembers = [] } = useQuery<any[]>({
    queryKey: [`/teams/${teamId}/members`],
    queryFn: () => apiGet(`/teams/${teamId}/members`),
    enabled: isOpen && !!teamId,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedUsers: [],
    },
  });

  const selectedUsers = form.watch('selectedUsers');

  // Filter users based on search query and exclude already-added members
  const teamMemberIds = teamMembers.map((m: any) => m.user?.id || m.userId);
  const availableUsers = users.filter((user) => !teamMemberIds.includes(user.id) && user.isActive);
  const filteredUsers = searchQuery.trim() 
    ? availableUsers.filter((user) =>
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableUsers.slice(0, 15); // Show first 15 active users by default

  // Reset highlighted index when dropdown or search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, showDropdown, filteredUsers.length]);

  const selectedUserDetails = users.filter((u) => selectedUsers.includes(u.id));

  const toggleUserSelection = (userId: number) => {
    const current = selectedUsers;
    if (current.includes(userId)) {
      form.setValue('selectedUsers', current.filter((id) => id !== userId));
    } else {
      form.setValue('selectedUsers', [...current, userId]);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!teamId) {
      toast({
        title: "Error",
        description: "This project is not associated with a team.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Add each selected user to the team
      const addMemberPromises = values.selectedUsers.map(async (userId) => {
        try {
          await apiRequest('POST', `/teams/${teamId}/members`, {
            userId: userId,
            role: "MEMBER",
          });
          return true;
        } catch (error) {
          console.error("Failed to add user to team:", error);
          return false;
        }
      });

      const results = await Promise.all(addMemberPromises);
      const successCount = results.filter((r) => r === true).length;

      if (successCount > 0) {
        toast({
          title: "Success!",
          description: `Added ${successCount} member${successCount > 1 ? 's' : ''} to the team.`,
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [`/teams/${teamId}/members`] });

        // Close the modal
        form.reset();
        onClose();
        setSearchQuery('');
        setShowDropdown(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to add members to the team.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding team members:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add Team Members</span>
            <Button variant="ghost" className="h-6 w-6 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Search Input */}
            <FormItem className="relative">
              <FormLabel className="text-sm font-medium">Search Members</FormLabel>
              <FormControl>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Click to see all active users or type to search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    onKeyDown={(e) => {
                      if (!showDropdown || filteredUsers.length === 0) return;
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredUsers[highlightedIndex]) {
                          toggleUserSelection(filteredUsers[highlightedIndex].id);
                          setSearchQuery('');
                          setShowDropdown(false);
                        }
                      } else if (e.key === 'Escape') {
                        setShowDropdown(false);
                      }
                    }}
                    className="pl-10"
                  />
                </div>
              </FormControl>
            </FormItem>

            {/* User Selection Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-white shadow-xl z-50" ref={dropdownRef}>
                <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
                  {searchQuery ? 
                    `Found ${filteredUsers.length} user(s)` : 
                    `Showing ${filteredUsers.length} of ${availableUsers.length} active users`
                  }
                </div>
                <ScrollArea className="max-h-[200px]">
                  {filteredUsers.length > 0 ? (
                    <div className="p-2">
                      {filteredUsers.map((user, idx) => (
                        <button
                          key={user.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleUserSelection(user.id);
                            setSearchQuery('');
                            setShowDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg mb-1 transition ${highlightedIndex === idx ? 'bg-blue-100 ring-2 ring-blue-300' : 'hover:bg-neutral-100'}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="text-xs bg-blue-50">
                                {user.fullName?.split(' ').map((n) => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left min-w-0">
                              <div className="text-sm font-medium truncate">{user.fullName}</div>
                              <div className="text-xs text-neutral-500 truncate">{user.email}</div>
                            </div>
                          </div>
                          {selectedUsers.includes(user.id) && (
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-neutral-500">
                      {searchQuery ? 'No users found' : 'No active users available'}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Selected Users List - Row Format */}
            {selectedUserDetails.length > 0 && (
              <div className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                <p className="text-sm font-medium text-blue-900 mb-3">
                  {selectedUserDetails.length} user{selectedUserDetails.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUserDetails.map((user) => (
                    <div key={user.id} className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm">
                      <Avatar className="h-5 w-5 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {user.fullName?.split(' ').map((n) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.fullName}</span>
                      <button
                        type="button"
                        onClick={() => toggleUserSelection(user.id)}
                        className="text-red-600 hover:text-red-800 ml-1 p-0.5 rounded hover:bg-red-50"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || selectedUsers.length === 0}>
                {loading ? "Adding..." : "Add Members"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}