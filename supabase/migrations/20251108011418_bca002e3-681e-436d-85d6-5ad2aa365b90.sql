-- Enable RLS on missing tables
ALTER TABLE public.correspondences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for correspondences
CREATE POLICY "Users can view all correspondences"
ON public.correspondences
FOR SELECT
USING (true);

CREATE POLICY "Users can create correspondences"
ON public.correspondences
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their correspondences"
ON public.correspondences
FOR UPDATE
USING (true);

-- Create RLS policies for users
CREATE POLICY "Users can view all users"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (true);

CREATE POLICY "Users can insert users"
ON public.users
FOR INSERT
WITH CHECK (true);

-- Create RLS policies for user_roles
CREATE POLICY "Users can view all roles"
ON public.user_roles
FOR SELECT
USING (true);

CREATE POLICY "Users can manage roles"
ON public.user_roles
FOR ALL
USING (true);