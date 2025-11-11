-- Add status column to correspondences table
ALTER TABLE moi.correspondences ADD COLUMN IF NOT EXISTS status String DEFAULT '';
