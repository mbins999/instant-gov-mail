-- Add greeting field to correspondences table
ALTER TABLE public.correspondences
ADD COLUMN greeting text DEFAULT 'السيد/' NOT NULL;