import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { workItems } from "@shared/schema";

/**
 * Middleware to check if the current user has admin role
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // Get the user ID from the session
  const userId = (req as any).session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Not logged in" });
  }
  
  try {
    // Get the user record to check role using storage interface
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    
    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    // User is an admin, proceed
    next();
  } catch (error) {
    console.error("Error in admin middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Middleware to check if the current user has Scrum Master role (or higher)
 */
export const isScrumMasterOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // Get the user ID from the session
  const userId = (req as any).session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Not logged in" });
  }
  
  try {
    // Get the user record to check role using storage interface
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    
    if (user.role !== "ADMIN" && user.role !== "SCRUM_MASTER") {
      return res.status(403).json({ message: "Forbidden: Scrum Master or Admin access required" });
    }
    
    // User is a Scrum Master or Admin, proceed
    next();
  } catch (error) {
    console.error("Error in scrum master middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Middleware to check if a user can manage work items of specific types
 * Based on role-based access control rules:
 * - ADMIN: Full CREATE access to all (EPIC, FEATURE, STORY, TASK, BUG)
 * - SCRUM_MASTER: Full CREATE access to all (EPIC, FEATURE, STORY, TASK, BUG)
 * - PROJECT_MANAGER: Full CREATE access to all (EPIC, FEATURE, STORY, TASK, BUG)
 * - MEMBER - DEVELOPER & TESTER: 
 *   - EPIC: VIEW-ONLY
 *   - FEATURE: VIEW-ONLY
 *   - STORY: NO CREATE! ONLY UPDATE ACCESS, AND NO DELETE
 *   - TASK: CREATE
 *   - BUG: CREATE
 * - Project Members (temporary access):
 *   - VIEWER: VIEW-ONLY (no create)
 *   - MEMBER: Can CREATE TASK and BUG (same as regular members)
 */
export const canManageWorkItemType = (allowedTypes: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const isUpdate = req.method === 'PATCH';
    const isDelete = req.method === 'DELETE';
    const isCreate = req.method === 'POST';
    const workItemType = req.body.type;
    const projectId = req.body.projectId;
    
    // Only require type for POST (creation) requests
    if (isCreate && !workItemType) {
      return res.status(400).json({ message: "Work item type is required" });
    }

    // Require projectId for creation
    if (isCreate && !projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }
    
    // Get the user ID from the session
    const userId = (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Not logged in" });
    }
    
    try {
      // Get the user record to check role using storage interface
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
      }
      
      // Admin: Full access to all work item types in any project
      if (user.role === "ADMIN") {
        return next();
      }

      // ✅ VERIFY PROJECT ACCESS FIRST - Critical for project members!
      // For any operation, verify user has access to this project
      let hasProjectAccess = false;
      let projectMemberRole = null;

      if (projectId) {
        const project = await storage.getProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }

        // Check 1: Is user a temporary project member?
        const projectMembers = await storage.getProjectMembers(projectId);
        const projectMember = projectMembers.find(pm => pm.userId === userId);
        
        if (projectMember) {
          // Check if access has expired
          if (projectMember.expiresAt && new Date(projectMember.expiresAt) < new Date()) {
            return res.status(403).json({ 
              message: "Your temporary project access has expired. Contact admin for access." 
            });
          }
          hasProjectAccess = true;
          projectMemberRole = projectMember.role;
          console.log(`✅ User ${user.name} has PROJECT MEMBER access to project ${projectId} as ${projectMemberRole}`);
        }

        // Check 2: Is user a team member of the project's team?
        if (!hasProjectAccess && project.teamId) {
          const teamMembers = await storage.getTeamMembers(project.teamId);
          const isTeamMember = teamMembers.some(tm => tm.userId === userId);
          if (isTeamMember) {
            hasProjectAccess = true;
            console.log(`✅ User ${user.name} has TEAM MEMBER access to project ${projectId} via team ${project.teamId}`);
          }
        }

        // If user has no access to the project, deny
        if (!hasProjectAccess) {
          return res.status(403).json({ 
            message: "Project access denied: You must be a team member or have project access to work on this project." 
          });
        }
      }
      
      // Scrum Master and Project Manager: Full access to all work item types (if they have project access)
      if (user.role === "SCRUM_MASTER" || user.role === "PROJECT_MANAGER") {
        return next();
      }
      
      // For project members with VIEWER role - read-only access
      if (projectMemberRole === "VIEWER") {
        if (isCreate || isUpdate || isDelete) {
          return res.status(403).json({ 
            message: "Viewers have read-only access. Contact admin to upgrade your access level." 
          });
        }
        return next();
      }
      
      // For project members with MEMBER role or team members with USER role
      if (projectMemberRole === "MEMBER" || user.role === "USER") {
        // DELETE operations - Members cannot delete any work items
        if (isDelete) {
          return res.status(403).json({ 
            message: "Members cannot delete work items. Contact admin or scrum master." 
          });
        }
        
        // UPDATE operations
        if (isUpdate) {
          // Members can update STORY, TASK, and BUG
          // Check will be done at route level to ensure they're assigned
          return next();
        }
        
        // CREATE operations
        if (isCreate) {
          // Members can only CREATE TASK and BUG
          if (workItemType === "TASK" || workItemType === "BUG") {
            return next();
          }
          
          // Members cannot create EPIC, FEATURE, or STORY
          if (workItemType === "EPIC" || workItemType === "FEATURE") {
            return res.status(403).json({ 
              message: "Members have VIEW-ONLY access to EPIC and FEATURE. Only Admin, Scrum Master, or Project Manager can create them."
            });
          }
          
          if (workItemType === "STORY") {
            return res.status(403).json({ 
              message: "Members cannot CREATE STORY. They can only update existing stories. Contact Admin, Scrum Master, or Project Manager to create stories."
            });
          }
        }
      }
      
      // If role is not recognized, deny access
      return res.status(403).json({ 
        message: "Access denied: Invalid user role" 
      });
    } catch (error) {
      console.error("Error in work item type middleware:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

/**
 * Middleware to check if a user can delete a work item
 * Regular users cannot delete any work items
 * Scrum Masters can delete Story, Task, Bug
 * Admins can delete any work item
 */
export const canDeleteWorkItem = async (req: Request, res: Response, next: NextFunction) => {
  // Get the user ID from the session
  const userId = (req as any).session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Not logged in" });
  }
  
  try {
    // Get the user record to check role using storage interface
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    
    // If admin, allow deletion
    if (user.role === "ADMIN") {
      return next();
    }
    
    // For Scrum Master, we need to check the work item type
    if (user.role === "SCRUM_MASTER") {
      // Get the ID of the work item to be deleted
      const workItemId = parseInt(req.params.id);
      
      if (isNaN(workItemId)) {
        return res.status(400).json({ message: "Invalid work item ID" });
      }
      
      // Get the work item to check its type using storage interface
      const workItem = await storage.getWorkItem(workItemId);
      
      if (!workItem) {
        return res.status(404).json({ message: "Work item not found" });
      }
      
      // Scrum Masters can only delete STORY, TASK, BUG
      if (["STORY", "TASK", "BUG"].includes(workItem.type)) {
        return next();
      } else {
        return res.status(403).json({ 
          message: "Scrum Masters can only delete Stories, Tasks, and Bugs" 
        });
      }
    }
    
    // Regular users cannot delete any work items
    return res.status(403).json({ message: "Regular users cannot delete work items" });
    
  } catch (error) {
    console.error("Error in delete work item middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Middleware to check if a user can delete a project or team
 * Only Admins can delete projects and teams
 */
export const canDeleteEntity = async (req: Request, res: Response, next: NextFunction) => {
  // Get the user ID from the session
  const userId = (req as any).session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Not logged in" });
  }
  
  try {
    // Get the user record to check role using storage interface
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    
    // Only admins can delete projects and teams
    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only administrators can delete projects and teams" });
    }
    
    // User is an admin, proceed
    next();
  } catch (error) {
    console.error("Error in delete entity middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Middleware to check if a user can access a specific project
 * Only team members of the project's team can access the project
 */
export const canAccessProject = async (req: Request, res: Response, next: NextFunction) => {
  // Get the user ID from the session
  const userId = (req as any).session?.userId;
  const projectId = parseInt(req.params.id || req.params.projectId);
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Not logged in" });
  }
  
  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }
  
  try {
    // Get the user record
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    
    // Admins can access any project
    if (user.role === "ADMIN") {
      return next();
    }
    
    // Get the project
    const project = await storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Check if user is a temporary project member (non-team member with limited access)
    const projectMembers = await storage.getProjectMembers(projectId);
    const projectMember = projectMembers.find(member => member.userId === userId);
    
    if (projectMember) {
      // Check if access has expired
      if (projectMember.expiresAt && new Date(projectMember.expiresAt) < new Date()) {
        return res.status(403).json({ 
          message: "Project access denied: Your temporary access has expired" 
        });
      }
      // User has temporary project access (limited permissions)
      return next();
    }
    
    // If project has no team assigned, only admin and project members can access
    if (!project.teamId) {
      return res.status(403).json({ message: "Project access denied: No team assigned" });
    }
    
    // Check if user is a member of the project's team (full access)
    const teamMembers = await storage.getTeamMembers(project.teamId);
    const isTeamMember = teamMembers.some(member => member.userId === userId);
    
    if (!isTeamMember) {
      return res.status(403).json({ 
        message: "Project access denied: You must be a team member or have project access" 
      });
    }
    
    // User is a team member with full access
    next();
  } catch (error) {
    console.error("Error in project access middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};