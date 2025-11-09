-- تقييد عرض sync_log للمشرفين فقط
DROP POLICY IF EXISTS "Users can view sync logs" ON sync_log;

CREATE POLICY "Only admins can view sync logs"
ON sync_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = get_user_id_from_session()
      AND user_roles.role = 'admin'::app_role
  )
);