-- Add display_type column to correspondences table
ALTER TABLE correspondences 
ADD COLUMN IF NOT EXISTS display_type text NOT NULL DEFAULT 'content' CHECK (display_type IN ('content', 'attachment_only'));

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for attachments bucket
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');