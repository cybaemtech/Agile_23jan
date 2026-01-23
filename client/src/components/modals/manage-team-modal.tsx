
import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InactivateIcon, ActivateIcon, InactiveIcon } from "./user-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiRequest } from "@/lib/api-config";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
}

interface User {
  id: number;
  email: string;
  fullName: string;
  username: string;
  isActive: boolean;
  role: string;
  avatarUrl: string | null;
}

export const ManageTeamModal: React.FC<ManageTeamModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const { toast } = useToast();
  const [inactivatingUserId, setInactivatingUserId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  
  // Check if current user is administrator
  const isAdmin = currentUser?.role === 'ADMIN';
  const isScrumMasterOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SCRUM_MASTER';

  const { data: users = [], refetch: refetchUsers } = useQuery<User[]>({
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

  // Filter users by search (all fields)
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalCount = users.length;
  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = totalCount - activeCount;

  const inactivateMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('PATCH', `/users/${userId}`, { isActive: false });
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/users'] });
      queryClient.invalidateQueries({ queryKey: ['/users/all'] });
      setInactivatingUserId(null);
      toast({
        title: "Success",
        description: "User inactivated successfully",
      });
    },
    onError: (error: any) => {
      setInactivatingUserId(null);
      toast({
        title: "Error",
        description: error.message || "Failed to inactivate user",
        variant: "destructive",
      });
    },
  });

  const handleInactivateUser = (userId: number) => {
    setInactivatingUserId(userId);
    inactivateMutation.mutate(userId);
  };

  // Activate user mutation
  const activateMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('PATCH', `/users/${userId}`, { isActive: true });
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/users'] });
      setInactivatingUserId(null);
      toast({
        title: "Success",
        description: "User activated successfully",
      });
    },
    onError: (error: any) => {
      setInactivatingUserId(null);
      toast({
        title: "Error",
        description: error.message || "Failed to activate user",
        variant: "destructive",
      });
    },
  });

  const handleActivateUser = (userId: number) => {
    setInactivatingUserId(userId);
    activateMutation.mutate(userId);
  };

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest('PATCH', `/users/${userId}`, { role });
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/users'] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: number, newRole: string) => {
    // Only administrators can change roles
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can change user roles.",
        variant: "destructive",
      });
      return;
    }

    // Prevent changing own role
    if (userId === currentUser?.id) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot change your own role.",
        variant: "destructive",
      });
      return;
    }

    updateRoleMutation.mutate({ userId, role: newRole });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Manage Team Members</span>
            {isAdmin && (
              <Badge variant="outline" className="text-xs font-normal bg-red-50 text-red-600 border-red-200">
                Administrator Access
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div className="flex gap-4 text-sm">
              <span>Total: <b>{totalCount}</b></span>
              <span>Active: <b>{activeCount}</b></span>
              <span>Inactive: <b>{inactiveCount}</b></span>
            </div>
            <input
              type="text"
              className="border rounded px-2 py-1 text-sm w-full sm:w-64"
              placeholder="Search users (name, email, username, role)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No users found.</div>
            ) : (
              filteredUsers.map((user) => {
                const isCurrentUser = user.id === currentUser?.id;
                const canEditRole = isAdmin && !isCurrentUser;
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {user.fullName}
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Role selector for admin, badge for others */}
                      {canEditRole ? (
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">
                              <span className="font-semibold text-red-600">Administrator</span>
                            </SelectItem>
                            <SelectItem value="SCRUM_MASTER">
                              <span className="font-semibold text-blue-600">Scrum Master</span>
                            </SelectItem>
                            <SelectItem value="USER">
                              <span className="font-semibold text-gray-600">Team Member</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge 
                          variant="secondary" 
                          className={
                            user.role === 'ADMIN' 
                              ? 'bg-red-100 text-red-700 hover:bg-red-100 font-semibold' 
                              : user.role === 'SCRUM_MASTER' 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 font-semibold' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-100 font-semibold'
                          }
                        >
                          {user.role === 'ADMIN' 
                            ? 'Administrator' 
                            : user.role === 'SCRUM_MASTER' 
                            ? 'Scrum Master' 
                            : 'Team Member'}
                        </Badge>
                      )}
                      {/* Activate/Deactivate button - only for admin and scrum master */}
                      {isScrumMasterOrAdmin && !isCurrentUser && (
                        user.isActive ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={inactivatingUserId === user.id}
                            onClick={() => handleInactivateUser(user.id)}
                            title="Inactivate user"
                          >
                            <InactivateIcon />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={inactivatingUserId === user.id}
                            onClick={() => handleActivateUser(user.id)}
                            title="Activate user"
                          >
                            <ActivateIcon />
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
