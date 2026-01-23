-- Add github_url column to projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN projects.github_url IS 'URL to GitHub repository for the project';