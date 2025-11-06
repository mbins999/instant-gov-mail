-- Create storage bucket for correspondence PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('correspondence-pdfs', 'correspondence-pdfs', true);

-- Create RLS policies for correspondence-pdfs bucket
CREATE POLICY "Anyone can view correspondence PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'correspondence-pdfs');

CREATE POLICY "Authenticated users can upload correspondence PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'correspondence-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update correspondence PDFs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'correspondence-pdfs' AND auth.role() = 'authenticated');

-- Add pdf_url column to correspondences table
ALTER TABLE correspondences
ADD COLUMN IF NOT EXISTS pdf_url TEXT;