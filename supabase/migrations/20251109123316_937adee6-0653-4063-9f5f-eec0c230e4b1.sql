-- إصلاح سياسة كيان entities لاستخدام security definer function لتجنب مشاكل RLS المتداخلة
BEGIN;

DROP POLICY IF EXISTS "Only admins can manage entities" ON public.entities;

-- سياسة إدارة الكيانات للمشرفين باستخدام public.has_role
CREATE POLICY "Only admins can manage entities"
ON public.entities
AS PERMISSIVE
FOR ALL
USING (public.has_role(public.get_user_id_from_session(), 'admin'))
WITH CHECK (public.has_role(public.get_user_id_from_session(), 'admin'));

COMMIT;