-- Migration: Add actual_hrs column to work_items table
ALTER TABLE work_items ADD COLUMN actual_hrs DECIMAL(10,2);