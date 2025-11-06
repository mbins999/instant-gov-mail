-- إزالة القيد المرجعي على auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- إزالة القيد المرجعي على auth.users من correspondences
ALTER TABLE correspondences DROP CONSTRAINT IF EXISTS correspondences_received_by_fkey;