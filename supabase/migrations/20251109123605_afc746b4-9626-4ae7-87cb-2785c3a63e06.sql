BEGIN;
DROP POLICY IF EXISTS "Only admins can manage entities" ON public.entities;

CREATE POLICY "Only admins can manage entities"
ON public.entities
AS PERMISSIVE
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = public.get_user_id_from_session()
      AND ur.role = 'admin'::public.app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = public.get_user_id_from_session()
      AND ur.role = 'admin'::public.app_role
  )
);
COMMIT;