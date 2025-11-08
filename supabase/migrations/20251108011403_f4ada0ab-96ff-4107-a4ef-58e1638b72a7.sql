-- Create external_connections table to store external system connections
CREATE TABLE public.external_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  api_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by BIGINT REFERENCES users(id)
);

-- Create sync_log table to track synchronization operations
CREATE TABLE public.sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES external_connections(id) ON DELETE CASCADE,
  correspondence_id UUID REFERENCES correspondences(id) ON DELETE CASCADE,
  operation TEXT NOT NULL, -- 'export', 'receive', 'return', 'resend'
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  external_doc_id TEXT,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Create policies for external_connections (allow all for now)
CREATE POLICY "Users can view external connections"
ON public.external_connections
FOR SELECT
USING (true);

CREATE POLICY "Users can manage external connections"
ON public.external_connections
FOR ALL
USING (true);

-- Create policies for sync_log
CREATE POLICY "Users can view sync logs"
ON public.sync_log
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_external_connections_updated_at
BEFORE UPDATE ON public.external_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add external_doc_id to correspondences for tracking
ALTER TABLE public.correspondences 
ADD COLUMN IF NOT EXISTS external_doc_id TEXT,
ADD COLUMN IF NOT EXISTS external_connection_id UUID REFERENCES external_connections(id);

-- Create index for better performance
CREATE INDEX idx_correspondences_external_doc_id ON public.correspondences(external_doc_id);
CREATE INDEX idx_sync_log_correspondence_id ON public.sync_log(correspondence_id);
CREATE INDEX idx_sync_log_created_at ON public.sync_log(created_at DESC);