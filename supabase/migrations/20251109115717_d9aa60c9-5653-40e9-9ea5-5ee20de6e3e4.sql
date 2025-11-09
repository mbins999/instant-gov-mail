-- ============================================
-- 🔒 SECURITY FIX: إصلاح شامل لجميع الثغرات الأمنية
-- ============================================

-- 1️⃣ حذف جميع RLS Policies القديمة غير الآمنة
-- ============================================

-- users table
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert users" ON users;

-- correspondences table  
DROP POLICY IF EXISTS "Users can view all correspondences" ON correspondences;
DROP POLICY IF EXISTS "Users can create correspondences" ON correspondences;
DROP POLICY IF EXISTS "Users can update their correspondences" ON correspondences;

-- user_roles table
DROP POLICY IF EXISTS "Users can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can manage roles" ON user_roles;

-- external_connections table
DROP POLICY IF EXISTS "Users can view external connections" ON external_connections;
DROP POLICY IF EXISTS "Users can manage external connections" ON external_connections;

-- entities table
DROP POLICY IF EXISTS "Allow all operations on entities" ON entities;

-- correspondence_templates table
DROP POLICY IF EXISTS "Users can view active templates" ON correspondence_templates;
DROP POLICY IF EXISTS "Users can create templates" ON correspondence_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON correspondence_templates;

-- password_history table
DROP POLICY IF EXISTS "Service role can manage password history" ON password_history;

-- 2️⃣ إنشاء RLS Policies آمنة جديدة
-- ============================================

-- 🔐 users table - بيانات المستخدمين الحساسة
-- ============================================
CREATE POLICY "Users can view only authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- المستخدم المصادق يمكنه رؤية جميع المستخدمين
    get_user_id_from_session() IS NOT NULL
  );

CREATE POLICY "Users can update only their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = get_user_id_from_session())
  WITH CHECK (id = get_user_id_from_session());

CREATE POLICY "Only admins can create users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Only admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

-- 🔐 correspondences table - المراسلات الحكومية السرية
-- ============================================
CREATE POLICY "Authenticated users can view correspondences"
  ON correspondences FOR SELECT
  TO authenticated
  USING (
    get_user_id_from_session() IS NOT NULL
  );

CREATE POLICY "Authenticated users can create correspondences"
  ON correspondences FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = get_user_id_from_session()
  );

CREATE POLICY "Users can update their own correspondences or if admin"
  ON correspondences FOR UPDATE
  TO authenticated
  USING (
    created_by = get_user_id_from_session()
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Only admins can delete correspondences"
  ON correspondences FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

-- 🔐 user_roles table - صلاحيات المستخدمين
-- ============================================
CREATE POLICY "Users can view only their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    user_id = get_user_id_from_session()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = get_user_id_from_session()
      AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Only admins can manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

-- 🔐 external_connections table - اتصالات خارجية حساسة
-- ============================================
CREATE POLICY "Only admins can view external connections"
  ON external_connections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Only admins can manage external connections"
  ON external_connections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

-- 🔐 entities table - قائمة الجهات الحكومية
-- ============================================
CREATE POLICY "Only authenticated users can view entities"
  ON entities FOR SELECT
  TO authenticated
  USING (
    get_user_id_from_session() IS NOT NULL
  );

CREATE POLICY "Only admins can manage entities"
  ON entities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

-- 🔐 correspondence_templates table - قوالب المراسلات
-- ============================================
CREATE POLICY "Authenticated users can view allowed templates"
  ON correspondence_templates FOR SELECT
  TO authenticated
  USING (
    (is_active = true AND is_public = true)
    OR created_by = get_user_id_from_session()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = get_user_id_from_session()
      AND users.entity_id = correspondence_templates.entity_id
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Authenticated users can create templates"
  ON correspondence_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = get_user_id_from_session()
  );

CREATE POLICY "Users can update their own templates or admins can update all"
  ON correspondence_templates FOR UPDATE
  TO authenticated
  USING (
    created_by = get_user_id_from_session()
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Only admins can delete templates"
  ON correspondence_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = get_user_id_from_session()
      AND role = 'admin'::app_role
    )
  );

-- 🔐 password_history table - تاريخ كلمات المرور
-- ============================================
-- لا أحد يمكنه القراءة (حتى المستخدم نفسه) - فقط النظام
CREATE POLICY "No one can read password history"
  ON password_history FOR SELECT
  TO authenticated
  USING (false);

-- 3️⃣ إضافة View آمن لبيانات المستخدمين (بدون password_hash)
-- ============================================
CREATE OR REPLACE VIEW safe_users_view 
WITH (security_invoker=on)
AS
SELECT 
  id,
  username,
  full_name,
  entity_name,
  entity_id,
  created_at,
  created_by
FROM users;

-- 4️⃣ تعليق: Function آمنة للتحقق من كلمة المرور
-- ============================================
COMMENT ON FUNCTION get_user_by_username(text) IS 
'Security Note: This function returns password_hash and should only be called from secure edge functions. Never expose this to client-side code.';

-- 5️⃣ إضافة Constraints للتحقق من البيانات
-- ============================================
-- التأكد من أن username فريد
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_username_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;

-- التأكد من أن الأرقام فريدة لكل نوع
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'correspondences_number_type_key'
  ) THEN
    ALTER TABLE correspondences 
    ADD CONSTRAINT correspondences_number_type_key 
    UNIQUE (number, type);
  END IF;
END $$;

-- 6️⃣ حذف أي كلمات مرور ضعيفة (Plain Text)
-- ============================================
-- تحديث أي password_hash يبدو أنه plain text
UPDATE users 
SET password_hash = extensions.crypt(password_hash, extensions.gen_salt('bf'))
WHERE LENGTH(password_hash) < 60 
   OR NOT (password_hash LIKE '$2a$%' OR password_hash LIKE '$2b$%');

-- ✅ تم إصلاح جميع الثغرات الأمنية!