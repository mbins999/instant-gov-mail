-- إصلاح سياسات RLS لجدول entities بحيث تعتمد على get_user_id_from_session ورؤوس الطلب
-- وجعلها متاحة لدور public (لأننا لا نستخدم JWT مصادقة Supabase الافتراضية)

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Only authenticated users can view entities" ON public.entities;
DROP POLICY IF EXISTS "Only admins can manage entities" ON public.entities;

-- سياسة العرض: أي طلب يحمل جلسة صحيحة (x-user-id أو x-session-token) يمكنه القراءة
CREATE POLICY "View entities with valid session"
ON public.entities
FOR SELECT
TO public
USING (public.get_user_id_from_session() IS NOT NULL);

-- سياسة الإدراج: حصراً للمشرفين
CREATE POLICY "Admins can insert entities"
ON public.entities
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = public.get_user_id_from_session()
      AND ur.role = 'admin'::app_role
  )
);

-- سياسة التحديث: حصراً للمشرفين
CREATE POLICY "Admins can update entities"
ON public.entities
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = public.get_user_id_from_session()
      AND ur.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = public.get_user_id_from_session()
      AND ur.role = 'admin'::app_role
  )
);

-- سياسة الحذف: حصراً للمشرفين
CREATE POLICY "Admins can delete entities"
ON public.entities
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = public.get_user_id_from_session()
      AND ur.role = 'admin'::app_role
  )
);
