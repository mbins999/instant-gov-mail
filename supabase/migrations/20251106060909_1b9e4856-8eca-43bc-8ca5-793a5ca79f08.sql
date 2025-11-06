-- Add responsible person and signature fields to correspondences table
ALTER TABLE public.correspondences
ADD COLUMN responsible_person text,
ADD COLUMN signature_url text;

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true);

-- Create RLS policies for signatures bucket
CREATE POLICY "Anyone can view signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signatures' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their signatures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete signatures"
ON storage.objects FOR DELETE
USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');