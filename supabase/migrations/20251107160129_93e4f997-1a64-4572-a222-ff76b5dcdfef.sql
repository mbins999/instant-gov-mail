-- إصلاح مشكلة infinite recursion في RLS policies
-- إزالة الدالة القديمة التي تستخدم uuid
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- إنشاء دالة has_role الصحيحة التي تستخدم bigint
CREATE OR REPLACE FUNCTION public.has_role(_user_id bigint, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- تحديث RLS policies لجدول user_roles لتجنب infinite recursion
DROP POLICY IF EXISTS "Users view own role or admins view all" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- سياسة عرض الأدوار: المستخدم يرى دوره الخاص فقط أو المسؤول يرى الكل
CREATE POLICY "Users view own role or admins view all"
ON public.user_roles
FOR SELECT
USING (
  user_id = get_user_id_from_session()
  OR EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = get_user_id_from_session() 
      AND ur.role = 'admin'::app_role
  )
);

-- سياسة إضافة الأدوار: المسؤول فقط
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = get_user_id_from_session() 
      AND ur.role = 'admin'::app_role
  )
);

-- سياسة حذف الأدوار: المسؤول فقط
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = get_user_id_from_session() 
      AND ur.role = 'admin'::app_role
  )
);

-- تحديث RLS policies لجدول users
DROP POLICY IF EXISTS "Users view own data or admins view all" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

CREATE POLICY "Users view own data or admins view all"
ON public.users
FOR SELECT
USING (
  id = get_user_id_from_session()
  OR public.has_role(get_user_id_from_session(), 'admin'::app_role)
);

CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
USING (id = get_user_id_from_session())
WITH CHECK (id = get_user_id_from_session());

CREATE POLICY "Admins can insert users"
ON public.users
FOR INSERT
WITH CHECK (public.has_role(get_user_id_from_session(), 'admin'::app_role));

CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
USING (public.has_role(get_user_id_from_session(), 'admin'::app_role));

-- تحديث RLS policies لجدول correspondences
DROP POLICY IF EXISTS "Users view own entity correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Users create for own entity" ON public.correspondences;
DROP POLICY IF EXISTS "Users update own correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Admins can delete correspondences" ON public.correspondences;

CREATE POLICY "Users view own entity correspondences"
ON public.correspondences
FOR SELECT
USING (
  from_entity = (SELECT entity_name FROM users WHERE id = get_user_id_from_session())
  OR received_by_entity = (SELECT entity_name FROM users WHERE id = get_user_id_from_session())
  OR created_by = get_user_id_from_session()
  OR public.has_role(get_user_id_from_session(), 'admin'::app_role)
);

CREATE POLICY "Users create for own entity"
ON public.correspondences
FOR INSERT
WITH CHECK (
  from_entity = (SELECT entity_name FROM users WHERE id = get_user_id_from_session())
  OR created_by = get_user_id_from_session()
  OR public.has_role(get_user_id_from_session(), 'admin'::app_role)
);

CREATE POLICY "Users update own correspondences"
ON public.correspondences
FOR UPDATE
USING (
  created_by = get_user_id_from_session()
  OR public.has_role(get_user_id_from_session(), 'admin'::app_role)
)
WITH CHECK (
  created_by = get_user_id_from_session()
  OR public.has_role(get_user_id_from_session(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete correspondences"
ON public.correspondences
FOR DELETE
USING (public.has_role(get_user_id_from_session(), 'admin'::app_role));