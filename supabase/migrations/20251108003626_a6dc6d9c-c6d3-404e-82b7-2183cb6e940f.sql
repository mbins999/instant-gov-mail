-- تعطيل RLS على جدول users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- حذف جميع policies القديمة على users
DROP POLICY IF EXISTS "Users view own data or admins view all" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- تعطيل RLS على user_roles
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- حذف policies على user_roles
DROP POLICY IF EXISTS "Users view own role or admins view all" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- تعطيل RLS على correspondences
ALTER TABLE public.correspondences DISABLE ROW LEVEL SECURITY;

-- حذف policies على correspondences
DROP POLICY IF EXISTS "Users view own entity correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Users create for own entity" ON public.correspondences;
DROP POLICY IF EXISTS "Users update own correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Admins can delete correspondences" ON public.correspondences;