-- Migration: Rename actual_hrs column to actual_hours for consistency with API
-- This fixes the issue where actual hours are not being saved properly

-- First check if the column exists with the old name
ALTER TABLE work_items CHANGE COLUMN actual_hrs actual_hours DECIMAL(10,2);

-- Update any existing records (if needed)
-- No data update needed as this is just a column rename