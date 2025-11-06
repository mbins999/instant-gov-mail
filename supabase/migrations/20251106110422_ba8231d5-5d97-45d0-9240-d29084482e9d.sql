-- Create entities table for managing government entities
CREATE TABLE IF NOT EXISTS public.entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('sender', 'receiver', 'both')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- Policies for entities table
CREATE POLICY "Authenticated users can view entities"
  ON public.entities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert entities"
  ON public.entities
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update entities"
  ON public.entities
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete entities"
  ON public.entities
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert some default entities
INSERT INTO public.entities (name, type) VALUES
  ('وزارة الصحة', 'both'),
  ('وزارة التعليم', 'both'),
  ('وزارة الداخلية', 'both'),
  ('وزارة المالية', 'both'),
  ('وزارة العدل', 'both')
ON CONFLICT (name) DO NOTHING;