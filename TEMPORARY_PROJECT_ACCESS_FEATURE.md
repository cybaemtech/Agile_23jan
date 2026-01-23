# Temporary Project Access Feature Implementation

## Overview
Implemented a new feature to grant **temporary project access** to users without adding them to the team. This allows:
- **Team Members**: Full permanent access to all team projects
- **Project Members**: Limited temporary access to specific projects only

## Changes Made

### 1. Database Schema (`shared/schema.ts`)
- ✅ Added `projectMembers` table for temporary project access
- Fields: `id`, `projectId`, `userId`, `role`, `expiresAt`, `createdAt`, `updatedAt`
- Added relations: `projectMembersRelations`, updated `usersRelations` and `projectsRelations`
- Created insert schema and TypeScript types

### 2. Database Migration (`database/add_project_members.sql`)
- ✅ Created SQL migration script
- Includes foreign keys to `projects` and `users` tables
- Added unique constraint on `(projectId, userId)` to prevent duplicates
- Indexed `expiresAt` field for efficient expiry checking

### 3. Storage Layer (`server/DatabaseStorage.ts`)
- ✅ Added `addProjectMember()` - Add user to project with optional expiry
- ✅ Added `getProjectMembers()` - Get all project members
- ✅ Added `removeProjectMember()` - Remove user from project
- ✅ Added `cleanupExpiredProjectMembers()` - Auto-cleanup expired access

### 4. API Routes (`server/routes.ts`)
- ✅ `POST /api/projects/:projectId/members` - Add temporary project member
  - Validates user exists
  - Prevents adding users who are already team members
  - Requires Admin or Scrum Master role
- ✅ `GET /api/projects/:projectId/members` - Get project members with user details
- ✅ `DELETE /api/projects/:projectId/members/:userId` - Remove project member

### 5. Authentication Middleware (`server/auth-middleware.ts`)
- ✅ Updated `canAccessProject()` to check both:
  1. Project members (temporary access with expiry check)
  2. Team members (full permanent access)
- Validates expiration dates
- Provides appropriate error messages

### 6. UI Component (`client/src/components/modals/project-members-modal.tsx`)
- ✅ Created new modal for managing temporary project access
- Features:
  - Search and add users (excludes existing team/project members)
  - Set access level: VIEWER (read-only) or MEMBER (limited)
  - Set expiry period in days (default 30 days)
  - View all temporary members with expiry dates
  - Visual indicators for expiring/expired access
  - Remove temporary members
- Only accessible by Admins and Scrum Masters

### 7. Updated Team Members Modal (`client/src/components/modals/team-members-modal.tsx`)
- ✅ Updated access level information
- Clarifies that team members have **FULL permanent access**
- Added note about using project members feature for temporary access

## How to Use

### For Administrators/Scrum Masters:

#### 1. To Add Team Members (Full Access):
- Go to project/team settings
- Click "Manage Team Members"
- Add users to the team
- They will have **full permanent access** to all team projects

#### 2. To Add Temporary Project Members:
- Go to project settings
- Click "Manage Project Members" (new feature)
- Search and select a user
- Choose access level:
  - **Viewer**: Read-only access
  - **Member**: Can create limited work items
- Set expiry period (e.g., 30 days)
- Click "Add Temporary Member"

### Access Comparison:

| Feature | Team Members | Project Members |
|---------|-------------|-----------------|
| Access Type | **Full permanent** | Limited temporary |
| Projects | All team projects | Specific project only |
| Expiration | Never | Set expiry date |
| Permissions | All team features | Viewer or Member only |
| Work Items | Create all types | Limited types only |

## Database Migration

Run this SQL to create the new table:

```bash
# In your database
mysql -u your_user -p your_database < database/add_project_members.sql
```

Or execute the SQL directly:
```sql
CREATE TABLE IF NOT EXISTS project_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('ADMIN', 'MEMBER', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
    expires_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY project_user_idx (project_id, user_id),
    INDEX project_member_project_idx (project_id),
    INDEX project_member_user_idx (user_id),
    INDEX project_member_expires_at_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Integration Points

To integrate the new modal in your project settings page:

```tsx
import { ProjectMembersModal } from "@/components/modals/project-members-modal";

// In your component
const [showProjectMembersModal, setShowProjectMembersModal] = useState(false);

// Add button in settings
<Button onClick={() => setShowProjectMembersModal(true)}>
  Manage Project Members
</Button>

// Add modal
<ProjectMembersModal
  isOpen={showProjectMembersModal}
  onClose={() => setShowProjectMembersModal(false)}
  projectId={project.id}
  projectName={project.name}
  teamId={project.teamId}
/>
```

## Future Enhancements

Optional improvements for future iterations:
1. **Auto-cleanup job**: Schedule periodic cleanup of expired project members
2. **Email notifications**: Alert users when access is about to expire
3. **Access renewal**: Allow extending expiry dates
4. **Audit log**: Track who added/removed project members
5. **Bulk operations**: Add multiple users at once
6. **Custom permissions**: More granular permission control

## Testing Checklist

- [ ] Run database migration
- [ ] Verify project_members table is created
- [ ] Test adding temporary project member
- [ ] Test that team members cannot be added as project members
- [ ] Test expiry date validation
- [ ] Test removing project member
- [ ] Test access with expired membership
- [ ] Verify team members still have full access
- [ ] Test permission checks (Admin/Scrum Master only)

## Summary

This feature provides a flexible way to grant temporary, limited access to projects without the commitment of full team membership. Team members maintain their full permanent access, while project members get time-limited access for specific needs (contractors, external reviewers, temporary collaborators, etc.).
