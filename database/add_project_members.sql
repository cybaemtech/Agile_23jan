-- Create project_members table for temporary project access
-- This allows adding users to specific projects without making them team members
-- Team members have FULL access, project members have temporary/limited access

CREATE TABLE IF NOT EXISTS project_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('ADMIN', 'MEMBER', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
    expires_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign keys
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure a user can only be added once per project
    UNIQUE KEY project_user_idx (project_id, user_id),
    
    -- Indexes for performance
    INDEX project_member_project_idx (project_id),
    INDEX project_member_user_idx (user_id),
    INDEX project_member_expires_at_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE project_members COMMENT = 'Temporary project access for non-team members. Team members automatically have full access.';
