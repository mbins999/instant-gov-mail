-- Fix critical security issues by updating RLS policies

-- ============================================
-- 1. Fix users table - Restrict access to authenticated users only
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

-- Only authenticated users can view user data (still permissive but requires auth)
-- In future, this should be restricted to own data only
CREATE POLICY "Authenticated users can view users"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Keep the existing update policy as is
-- Users can update their own data policy already exists

-- ============================================
-- 2. Fix correspondences table - Restrict access to authenticated users
-- ============================================

-- Drop the completely open policy
DROP POLICY IF EXISTS "Allow all operations on correspondences" ON public.correspondences;

-- Authenticated users can view all correspondences (requires login at minimum)
CREATE POLICY "Authenticated users can view correspondences"
ON public.correspondences FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can create correspondences
CREATE POLICY "Authenticated users can create correspondences"
ON public.correspondences FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update correspondences
CREATE POLICY "Authenticated users can update correspondences"
ON public.correspondences FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can delete correspondences
CREATE POLICY "Authenticated users can delete correspondences"
ON public.correspondences FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 3. Fix user_roles table - Already has proper INSERT/DELETE policies
-- ============================================

-- The existing SELECT policy is already permissive
-- Just update it to require authentication
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

-- Keep existing admin policies for INSERT and DELETE
-- They are already properly configured