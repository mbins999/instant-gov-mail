-- ============================================
-- COMPREHENSIVE SECURITY FIX: RLS POLICIES
-- ============================================

-- 1. FIX USERS TABLE - Owner-based access only
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

-- Users can only view their own data OR admins can view all
CREATE POLICY "Users view own data or admins view all"
ON public.users FOR SELECT
TO authenticated
USING (
  id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
    AND role = 'admin'
  )
);

-- Users can update only their own data
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
TO authenticated
USING (id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint))
WITH CHECK (id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint));

-- ============================================
-- 2. FIX CORRESPONDENCES TABLE - Entity-based access
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Authenticated users can create correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Authenticated users can update correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Authenticated users can delete correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Allow all operations on correspondences" ON public.correspondences;

-- View: Users can see correspondences from their entity or received by their entity or if admin
CREATE POLICY "Users view own entity correspondences"
ON public.correspondences FOR SELECT
TO authenticated
USING (
  from_entity = (SELECT entity_name FROM users WHERE id = auth.uid()::text::bigint)
  OR 
  received_by_entity = (SELECT entity_name FROM users WHERE id = auth.uid()::text::bigint)
  OR
  created_by = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
    AND role = 'admin'
  )
);

-- Insert: Users can create correspondences for their own entity
CREATE POLICY "Users create for own entity"
ON public.correspondences FOR INSERT
TO authenticated
WITH CHECK (
  from_entity = (SELECT entity_name FROM users WHERE id = auth.uid()::text::bigint)
  OR
  created_by = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
    AND role = 'admin'
  )
);

-- Update: Users can update their own correspondences or if admin
CREATE POLICY "Users update own correspondences"
ON public.correspondences FOR UPDATE
TO authenticated
USING (
  created_by = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
    AND role = 'admin'
  )
)
WITH CHECK (
  created_by = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
    AND role = 'admin'
  )
);

-- Delete: Only admins can delete
CREATE POLICY "Admins can delete correspondences"
ON public.correspondences FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
    AND role = 'admin'
  )
);

-- ============================================
-- 3. FIX USER_ROLES TABLE - Restrict access
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Only admins can view all roles, users can view their own role
CREATE POLICY "Users view own role or admins view all"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  user_id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT id FROM users WHERE id = auth.uid()::text::bigint)
    AND role = 'admin'
  )
);