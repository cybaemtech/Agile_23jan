import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest, apiGet } from "@/lib/api-config";
import { UserPlus, UserMinus, Clock, Calendar } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isActive: boolean;
  role: string;
}

interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  expiresAt: string | null;
  createdAt: string;
  user: User;
}

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  teamId: number | null;
}

export function ProjectMembersModal({ 
  isOpen, 
  onClose, 
  projectId,
  projectName,
  teamId 
}: ProjectMembersModalProps) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const userInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("VIEWER");
  const [expiryDays, setExpiryDays] = useState<string>("30");

  // Fetch current user to check permissions
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/auth/user'],
    queryFn: () => apiGet('/auth/user'),
    retry: false,
  });

  const isScrumMasterOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SCRUM_MASTER';

  // Fetch project members (temporary access)
  const { data: projectMembers = [], refetch: refetchProjectMembers } = useQuery<ProjectMember[]>({
    queryKey: [`/projects/${projectId}/members`],
    enabled: isOpen && !!projectId,
    queryFn: async () => {
      const res = await apiRequest('GET', `/projects/${projectId}/members`);
      const members = await res.json();
      return members;
    }
  });

  // Fetch team members to exclude them
  const { data: teamMembers = [] } = useQuery<any[]>({
    queryKey: [`/teams/${teamId}/members`],
    enabled: isOpen && !!teamId,
    queryFn: () => apiGet(`/teams/${teamId}/members`),
  });

  // Fetch all users
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/users'],
    enabled: isOpen,
    queryFn: async () => {
      try {
        return await apiGet('/users');
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    },
  });

  // Get users who are not already team members or project members
  const teamMemberUserIds = new Set(teamMembers.map(member => member.userId));
  const projectMemberUserIds = new Set(projectMembers.map(member => member.userId));
  const availableUsers = allUsers.filter(user => 
    !teamMemberUserIds.has(user.id) && 
    !projectMemberUserIds.has(user.id) &&
    user.isActive
  );
  
  const filteredUsers = availableUsers.filter(user => {
    const q = userSearch.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.username?.toLowerCase().includes(q)
    );
  }).slice(0, 10);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [userSearch, showUserDropdown, filteredUsers.length]);

  // Add project member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: { userId: number; role: string; expiresAt: string | null }) => {
      return apiRequest('POST', `/projects/${projectId}/members`, data);
    },
    onSuccess: () => {
      refetchProjectMembers();
      queryClient.invalidateQueries({ queryKey: [`/projects/${projectId}/members`] });
      setSelectedUserId("");
      setSelectedRole("VIEWER");
      setExpiryDays("30");
      toast({
        title: "Member added",
        description: "Project member has been added successfully with temporary access.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add project member.",
        variant: "destructive",
      });
    },
  });

  // Remove project member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('DELETE', `/projects/${projectId}/members/${userId}`);
    },
    onSuccess: () => {
      refetchProjectMembers();
      queryClient.invalidateQueries({ queryKey: [`/projects/${projectId}/members`] });
      toast({
        title: "Member removed",
        description: "Project member has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove project member.",
        variant: "destructive",
      });
    },
  });

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user to add.",
        variant: "destructive",
      });
      return;
    }

    let expiresAt: string | null = null;
    if (expiryDays && parseInt(expiryDays) > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
      expiresAt = expiryDate.toISOString();
    }

    addMemberMutation.mutate({
      userId: parseInt(selectedUserId),
      role: selectedRole,
      expiresAt,
    });
  };

  const handleRemoveMember = (userId: number) => {
    removeMemberMutation.mutate(userId);
  };

  const formatExpiryDate = (expiresAt: string | null) => {
    if (!expiresAt) return "No expiration";
    const date = new Date(expiresAt);
    const now = new Date();
    const isExpired = date < now;
    const daysUntilExpiry = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isExpired) {
      return <span className="text-red-600 font-semibold">Expired</span>;
    }
    
    return (
      <span className={daysUntilExpiry <= 7 ? "text-orange-600 font-semibold" : ""}>
        {date.toLocaleDateString()} ({daysUntilExpiry} days)
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Temporary Project Access - {projectName}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Add users with temporary project access. Team members already have <strong>full access</strong>.
          </p>
        </DialogHeader>

        <div className="overflow-y-auto space-y-6 pr-2 max-h-[calc(90vh-180px)]">
          {/* Add new project member section - Only for Scrum Masters and Admins */}
          {isScrumMasterOrAdmin && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium text-base text-purple-800">Add Temporary Member</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative col-span-2">
                  <label className="block text-sm font-medium mb-1">Search Users</label>
                  <input
                    ref={userInputRef}
                    type="text"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={availableUsers.length === 0 ? "No available users" : "Search user by name or email..."}
                    value={userSearch}
                    onChange={e => {
                      setUserSearch(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    onBlur={() => setTimeout(() => setShowUserDropdown(false), 150)}
                    onKeyDown={e => {
                      if (!showUserDropdown || filteredUsers.length === 0) return;
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedIndex(idx => Math.min(idx + 1, filteredUsers.length - 1));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedIndex(idx => Math.max(idx - 1, 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredUsers[highlightedIndex]) {
                          setSelectedUserId(filteredUsers[highlightedIndex].id.toString());
                          setUserSearch(filteredUsers[highlightedIndex].fullName);
                          setShowUserDropdown(false);
                        }
                      }
                    }}
                    disabled={availableUsers.length === 0}
                  />
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-md shadow-xl z-[10000] max-h-60 overflow-y-auto">
                      {filteredUsers.map((user, idx) => (
                        <button
                          key={user.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-100 ${highlightedIndex === idx ? 'bg-purple-200' : ''}`}
                          onMouseDown={() => {
                            setSelectedUserId(user.id.toString());
                            setUserSearch(user.fullName);
                            setShowUserDropdown(false);
                          }}
                        >
                          {user.fullName} <span className="text-gray-500">({user.email})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Access Level</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEWER">Viewer (Read Only)</SelectItem>
                      <SelectItem value="MEMBER">Member (Limited)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Expires After (Days)</label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={expiryDays}
                    onChange={e => setExpiryDays(e.target.value)}
                    placeholder="30"
                  />
                </div>
                
                <div className="col-span-2 pt-2">
                  <Button 
                    onClick={handleAddMember}
                    disabled={!selectedUserId || addMemberMutation.isPending}
                    size="sm"
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Temporary Member
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Access Types</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Team Members:</strong> Have FULL permanent access to all project features</p>
              <p><strong>Temporary Members:</strong> Limited access that expires after specified period</p>
              <p><strong>Viewer:</strong> Can only view work items (read-only)</p>
              <p><strong>Member:</strong> Can view and create limited work items (STORY, TASK, BUG)</p>
            </div>
          </div>

          {/* Current temporary members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Temporary Project Members</h3>
              <Badge variant="secondary" className="text-xs">
                {projectMembers.length} {projectMembers.length === 1 ? 'member' : 'members'}
              </Badge>
            </div>
            
            {projectMembers.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border rounded-lg bg-gray-50">
                <Clock className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No temporary members</p>
                <p className="text-sm">Add users for temporary project access</p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y divide-gray-200">
                {projectMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={member.user?.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {member.user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{member.user?.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{member.user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{formatExpiryDate(member.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge variant="outline" className="min-w-[80px] justify-center text-xs">
                        {member.role}
                      </Badge>
                      {isScrumMasterOrAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={removeMemberMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                          title="Remove temporary access"
                        >
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
