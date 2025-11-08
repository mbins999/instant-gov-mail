-- Fix search_path security issue
CREATE OR REPLACE FUNCTION public.hash_user_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Check if password_hash is less than 60 characters (not a bcrypt hash)
  -- bcrypt hashes are always 60 characters long starting with $2a$ or $2b$
  IF NEW.password_hash IS NOT NULL AND (
    LENGTH(NEW.password_hash) < 60 OR 
    NOT (NEW.password_hash LIKE '$2a$%' OR NEW.password_hash LIKE '$2b$%')
  ) THEN
    -- Hash the password using crypt with blowfish algorithm (bcrypt)
    NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf'));
  END IF;
  
  RETURN NEW;
END;
$$;