-- إنشاء جدول الجلسات
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '30 days')
);

-- فهرسة للبحث السريع
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);

-- تمكين RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- السماح للـ service role بإدارة الجلسات
CREATE POLICY "Service role can manage sessions"
ON public.sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- دالة للحصول على user_id من session token
CREATE OR REPLACE FUNCTION public.get_user_id_from_session()
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_token text;
  user_id_result bigint;
BEGIN
  -- محاولة الحصول على التوكن من HTTP headers
  session_token := current_setting('request.headers', true)::json->>'authorization';
  
  IF session_token IS NULL OR session_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- إزالة "Bearer " إذا كان موجودًا
  session_token := REPLACE(session_token, 'Bearer ', '');
  
  -- البحث عن الجلسة الصالحة
  SELECT s.user_id INTO user_id_result
  FROM public.sessions s
  WHERE s.token = session_token
    AND s.expires_at > now();
  
  RETURN user_id_result;
END;
$$;

-- تحديث RLS policies للجدول users
DROP POLICY IF EXISTS "Users view own data or admins view all" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

CREATE POLICY "Users view own data or admins view all"
ON public.users
FOR SELECT
TO authenticated, anon
USING (
  id = public.get_user_id_from_session() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = public.get_user_id_from_session()
      AND role = 'admin'::app_role
  )
);

CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
TO authenticated, anon
USING (id = public.get_user_id_from_session())
WITH CHECK (id = public.get_user_id_from_session());

-- تحديث RLS policies للجدول correspondences
DROP POLICY IF EXISTS "Users view own entity correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Users create for own entity" ON public.correspondences;
DROP POLICY IF EXISTS "Users update own correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Admins can delete correspondences" ON public.correspondences;

CREATE POLICY "Users view own entity correspondences"
ON public.correspondences
FOR SELECT
TO authenticated, anon
USING (
  from_entity = (SELECT entity_name FROM public.users WHERE id = public.get_user_id_from_session()) OR
  received_by_entity = (SELECT entity_name FROM public.users WHERE id = public.get_user_id_from_session()) OR
  created_by = public.get_user_id_from_session() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = public.get_user_id_from_session()
      AND role = 'admin'::app_role
  )
);

CREATE POLICY "Users create for own entity"
ON public.correspondences
FOR INSERT
TO authenticated, anon
WITH CHECK (
  from_entity = (SELECT entity_name FROM public.users WHERE id = public.get_user_id_from_session()) OR
  created_by = public.get_user_id_from_session() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = public.get_user_id_from_session()
      AND role = 'admin'::app_role
  )
);

CREATE POLICY "Users update own correspondences"
ON public.correspondences
FOR UPDATE
TO authenticated, anon
USING (
  created_by = public.get_user_id_from_session() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = public.get_user_id_from_session()
      AND role = 'admin'::app_role
  )
)
WITH CHECK (
  created_by = public.get_user_id_from_session() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = public.get_user_id_from_session()
      AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can delete correspondences"
ON public.correspondences
FOR DELETE
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = public.get_user_id_from_session()
      AND role = 'admin'::app_role
  )
);

-- تحديث RLS policies للجدول user_roles
DROP POLICY IF EXISTS "Users view own role or admins view all" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Users view own role or admins view all"
ON public.user_roles
FOR SELECT
TO authenticated, anon
USING (
  user_id = public.get_user_id_from_session() OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = public.get_user_id_from_session()
      AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated, anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = public.get_user_id_from_session()
      AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = public.get_user_id_from_session()
      AND role = 'admin'::app_role
  )
);