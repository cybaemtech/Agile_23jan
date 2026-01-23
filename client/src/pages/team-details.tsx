import React from "react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Mail, Calendar, Shield, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/data-utils";
import { apiRequest, apiGet } from "@/lib/api-config";
import { User, Team, Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AddTeamMembersModal } from "@/components/modals/add-team-members-modal";


// Helper function to determine base path for links
const getBasePath = () => {
  if (typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/Agile/') || window.location.pathname === '/Agile')) {
    return '/Agile';
  }
  return '';
};

export default function TeamDetails() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Extract team ID from the current location
  const teamId = location.split('/').pop();
  const teamIdNum = teamId ? parseInt(teamId) : 0;
  const basePath = getBasePath();

  console.log('Team Details - Location:', location, 'Team ID:', teamId);

  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/auth/user'],
    queryFn: () => apiGet('/auth/user'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch teams
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/teams'],
    queryFn: () => apiGet('/teams'),
  });

  // Fetch team details
  const { data: team } = useQuery<Team>({
    queryKey: ['/teams', teamId],
    queryFn: () => apiGet(`/teams/${teamId}`),
    enabled: !!teamId,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/projects'],
    queryFn: () => apiGet('/projects'),
  });

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/users'],
    queryFn: () => apiGet('/users'),
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading: isLoadingMembers } = useQuery<any[]>({
    queryKey: [`/teams/${teamId}/members`],
    queryFn: () => apiGet(`/teams/${teamId}/members`),
    enabled: !!teamId,
    staleTime: 30 * 1000, // 30 seconds - refresh frequently to catch changes from project settings
    refetchOnWindowFocus: true, // Refresh when user switches back to this tab
  });

  // Get team projects, but only show projects where current user is assigned (or is Admin/Scrum Master)
  // isAdminOrScrum is declared below and used for both team and project access control
  // Assume each project has a 'members' array or fetch members for each project if needed
  const [projectMemberships, setProjectMemberships] = useState<{ [projectId: number]: boolean }>({});
  React.useEffect(() => {
    if (!currentUser || projects.length === 0) return;
    const fetchMemberships = async () => {
      const memberships: { [projectId: number]: boolean } = {};
      await Promise.all(projects.map(async (project) => {
        if (project.teamId !== teamIdNum) return;
        try {
          // Always fetch members from API (since project.members is not in type)
          let members: any[] = [];
          try {
            members = await apiGet(`/projects/${project.id}/team-members`);
          } catch {
            members = [];
          }
          memberships[project.id] = members.some((m: any) => m.user?.id === currentUser.id || m.id === currentUser.id);
        } catch {
          memberships[project.id] = false;
        }
      }));
      setProjectMemberships(memberships);
    };
    fetchMemberships();
  }, [projects, currentUser, teamIdNum]);

  // ...existing code...



  // Only assigned members, Admin, or Scrum can see the team
  const isAssignedMember = teamMembers.some((m: any) => m.user?.id === currentUser?.id);
  const isAdminOrScrum = currentUser?.role === 'ADMIN' || currentUser?.role === 'SCRUM_MASTER';

  // Admins/Scrum Masters see all team projects, others only those where they are assigned
  const teamProjects = projects.filter((project: Project) => {
    if (project.teamId !== teamIdNum) return false;
    if (isAdminOrScrum) return true;
    return projectMemberships[project.id];
  });

  // For admin/scrum master: show available projects that can be assigned to this team
  const availableProjects = isAdminOrScrum ? projects.filter((project: Project) =>
    project.teamId !== teamIdNum
  ) : [];

  // Function to assign team to project
  const assignTeamToProject = async (projectId: number) => {
    try {
      await apiRequest('PATCH', `/projects/${projectId}`, {
        teamId: teamIdNum
      });

      queryClient.invalidateQueries({ queryKey: ['/projects'] });
      toast({
        title: "Success",
        description: "Team assigned to project successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign team to project",
        variant: "destructive"
      });
    }
  };

  // Function to unassign team from project
  const unassignTeamFromProject = async (projectId: number) => {
    try {
      console.log(`[Unassign] Sending request to unassign team from project ${projectId}`);

      // Send only teamId as null (don't send updatedAt as it's auto-managed)
      const requestBody = {
        teamId: null
      };
      console.log(`[Unassign] Request body:`, requestBody);

      const response = await apiRequest('PATCH', `/projects/${projectId}`, requestBody);

      console.log(`[Unassign] Request successful`, response);

      queryClient.invalidateQueries({ queryKey: ['/projects'] });
      toast({
        title: "Success",
        description: "Team unassigned from project successfully",
      });
    } catch (error: any) {
      console.error(`[Unassign] Request failed:`, error);
      toast({
        title: "Error",
        description: error.message || "Failed to unassign team from project",
        variant: "destructive"
      });
    }
  };

  if (!isAssignedMember && !isAdminOrScrum) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You are not assigned to this team and do not have permission to view its details.</p>
          <Button onClick={() => setLocation('/teams')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar
        user={currentUser}
        teams={teams}
        projects={projects}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={currentUser}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              className="mr-6 font-medium"
              onClick={() => setLocation('/teams')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to teams
            </Button>
            {team && <h1 className="text-2xl font-bold">{team.name}</h1>}
          </div>
          {/* ...existing cards and dialogs... */}
          {!team ? (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4"></div>
                <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
              </div>
              <p className="text-gray-600 mt-4">Loading team details...</p>
              {teamId && (
                <p className="text-sm text-gray-500 mt-2">Team ID: {teamId}</p>
              )}
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="w-full flex flex-col md:flex-row gap-6">
                  {/* Team info card */}
                  <Card className="flex-1 min-w-[280px] max-w-[400px]">
                    <CardHeader>
                      <CardTitle className="text-xl">Team Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-neutral-500">Description</h3>
                          <p className="mt-1">{team.description || "No description provided"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-neutral-500">Created</h3>
                          <p className="mt-1">{formatDate(team.createdAt)}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-neutral-500">Team Lead</h3>
                          <div className="flex items-center mt-1">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>
                                {team.createdBy && users.length > 0
                                  ? users.find(u => u.id === team.createdBy)?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'TL'
                                  : currentUser?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'TL'}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {team.createdBy && users.length > 0
                                ? users.find(u => u.id === team.createdBy)?.fullName || 'Team Lead'
                                : currentUser?.fullName || 'Team Lead'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-neutral-500">Total Members</h3>
                          <p className="mt-1 text-lg font-semibold">{teamMembers.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Team Members
                    </CardTitle>
                    <Button onClick={() => setShowAddMembersModal(true)}>
                      Add New Member
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoadingMembers ? (
                      <div className="text-center py-8">
                        <div className="animate-pulse">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-neutral-500 mt-4">Loading team members...</p>
                      </div>
                    ) : teamMembers.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg bg-gray-50">
                        <div className="mx-auto w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-1">No team members yet</p>
                        <p className="text-sm text-gray-500 mb-4">Start building your team by adding members</p>
                        <Button onClick={() => setShowAddMembersModal(true)} className="bg-blue-600 hover:bg-blue-700">
                          <Users className="h-4 w-4 mr-2" />
                          Add First Member
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Members Stats */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 p-2 rounded-full">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-blue-900">
                                  {teamMembers.length} Member{teamMembers.length !== 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-blue-700">
                                  Active team collaborators
                                </p>
                              </div>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-sm text-blue-700 font-medium mb-2">
                                Role Distribution
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.from(new Set(teamMembers.map((m: any) => m.role || 'MEMBER'))).map(role => (
                                  <Badge key={role} variant="outline" className="text-xs border-blue-300 text-blue-800">
                                    {role.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Members List */}
                        <div className="border rounded-lg divide-y divide-gray-200 bg-white">
                          {teamMembers.map((member: any, index: number) => (
                            <div key={member.id} className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${index === 0 ? 'rounded-t-lg' : ''} ${index === teamMembers.length - 1 ? 'rounded-b-lg' : ''}`}>
                              <div className="flex items-center space-x-4 min-w-0 flex-1">
                                <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-gray-100">
                                  <AvatarImage
                                    src={member.user?.avatarUrl}
                                    alt={member.user?.fullName}
                                  />
                                  <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                                    {member.user?.fullName?.split(' ').map((n: string) => n[0]).join('') ||
                                      member.user?.username?.substring(0, 2)?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-medium text-gray-900 truncate" title={member.user?.fullName}>
                                      {member.user?.fullName || member.user?.username || 'Unknown User'}
                                    </h3>
                                    <Badge
                                      variant={member.role === 'ADMIN' ? 'default' : 'secondary'}
                                      className="text-xs px-2 py-1"
                                    >
                                      {(member.role || 'MEMBER').replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate" title={member.user?.email}>
                                      {member.user?.email}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                                {member.joinedAt && (
                                  <div className="text-xs text-gray-400 flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Joined </span>
                                    {formatDate(new Date(member.joinedAt))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Team Projects
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm">
                        {teamProjects.length} Project{teamProjects.length !== 1 ? 's' : ''}
                      </Badge>
                      {isAdminOrScrum && (
                        <Button onClick={() => setLocation('/projects/new')} className="bg-blue-600 hover:bg-blue-700">
                          Create New Project
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {teamProjects.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg bg-gray-50">
                        <div className="mx-auto w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mb-4">
                          <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-1">No projects assigned</p>
                        <p className="text-sm text-gray-500 mb-4">This team doesn't have any projects yet</p>
                        {isAdminOrScrum && (
                          <Button onClick={() => setLocation('/projects/new')} className="bg-blue-600 hover:bg-blue-700">
                            <Calendar className="h-4 w-4 mr-2" />
                            Create Project
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {teamProjects.map((project: any) => (
                          <div
                            key={project.id}
                            className="border rounded-lg p-6 hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 p-2 rounded-full">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg text-primary hover:underline cursor-pointer"
                                    onClick={() => setLocation(`/projects/${project.id}`)}>
                                    {project.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{project.key}</Badge>
                                    <Badge
                                      variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {project.status}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                      Assigned
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setLocation(`/projects/${project.id}`)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  View Details
                                </Button>
                                {isAdminOrScrum && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLocation(`/projects/${project.id}/settings`)}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    Manage Access
                                  </Button>
                                )}
                                {isAdminOrScrum && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => unassignTeamFromProject(project.id)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    Unassign
                                  </Button>
                                )}
                              </div>
                            </div>

                            {project.description && (
                              <p className="text-sm text-neutral-600 mb-3 leading-relaxed">
                                {project.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                              <div className="flex items-center space-x-4">
                                {project.createdAt && (
                                  <span>Created: {formatDate(project.createdAt)}</span>
                                )}
                                {project.startDate && (
                                  <span>Start: {formatDate(project.startDate)}</span>
                                )}
                                {project.endDate && (
                                  <span>End: {formatDate(project.endDate)}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600 font-medium">Team Project</span>
                                <div className={`w-2 h-2 rounded-full ${project.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Projects Section for Admin/Scrum Master */}
                {isAdminOrScrum && availableProjects.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Available Projects to Assign
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        These projects are not assigned to this team
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {availableProjects.map((project: any) => (
                          <div
                            key={project.id}
                            className="border rounded-lg p-6 hover:bg-gray-50 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gray-100 p-2 rounded-full">
                                  <Calendar className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-900">
                                    {project.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{project.key}</Badge>
                                    <Badge
                                      variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {project.status}
                                    </Badge>
                                    {project.teamId && (
                                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                        Assigned to other team
                                      </Badge>
                                    )}
                                    {!project.teamId && (
                                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                                        Unassigned
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setLocation(`/projects/${project.id}`)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => assignTeamToProject(project.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Assign to Team
                                </Button>
                              </div>
                            </div>

                            {project.description && (
                              <p className="text-sm text-neutral-600 leading-relaxed">
                                {project.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>

      <AddTeamMembersModal
        isOpen={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        projectId={0}
        teamId={teamIdNum}
      />
    </div>
  );
}