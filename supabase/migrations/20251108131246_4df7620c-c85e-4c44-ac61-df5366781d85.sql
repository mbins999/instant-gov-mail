-- Create function to auto-create user role
CREATE OR REPLACE FUNCTION public.create_default_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default 'user' role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create role on user insert
CREATE TRIGGER create_user_role_on_insert
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.create_default_user_role();

COMMENT ON FUNCTION public.create_default_user_role() IS 'Automatically creates a default user role when a new user is inserted';