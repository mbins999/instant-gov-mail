-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop foreign key constraint from correspondences
ALTER TABLE public.correspondences 
DROP CONSTRAINT IF EXISTS correspondences_received_by_fkey;

-- Set received_by to NULL for all existing records
UPDATE public.correspondences SET received_by = NULL;

-- Create new users table with auto-incrementing ID
CREATE TABLE public.users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create user_roles table linked to new users table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
USING (true);

-- RLS Policies for user_roles table
CREATE POLICY "Users can view all roles"
ON public.user_roles FOR SELECT
USING (true);

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (true);

-- Update has_role function to work with new schema
CREATE OR REPLACE FUNCTION public.has_role(_user_id BIGINT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user by username
CREATE OR REPLACE FUNCTION public.get_user_by_username(username_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT u.id, u.username, u.full_name, u.entity_name, u.password_hash, ur.role
  INTO user_record
  FROM users u
  LEFT JOIN user_roles ur ON ur.user_id = u.id
  WHERE u.username = username_input;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id', user_record.id,
    'username', user_record.username,
    'full_name', user_record.full_name,
    'entity_name', user_record.entity_name,
    'password_hash', user_record.password_hash,
    'role', user_record.role
  );
END;
$$;

-- Update correspondences table to use new user ID type
ALTER TABLE public.correspondences
ALTER COLUMN received_by TYPE BIGINT USING NULL;

ALTER TABLE public.correspondences
ADD CONSTRAINT correspondences_received_by_fkey 
FOREIGN KEY (received_by) REFERENCES public.users(id) ON DELETE SET NULL;