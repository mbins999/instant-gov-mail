-- إزالة القيد المرجعي على auth.users من user_roles
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;