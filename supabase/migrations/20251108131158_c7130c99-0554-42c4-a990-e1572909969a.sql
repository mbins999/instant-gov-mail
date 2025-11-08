-- Fix the hash_user_password function to use extensions schema
CREATE OR REPLACE FUNCTION public.hash_user_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if password_hash is less than 60 characters (not a bcrypt hash)
  -- bcrypt hashes are always 60 characters long starting with $2a$ or $2b$
  IF NEW.password_hash IS NOT NULL AND (
    LENGTH(NEW.password_hash) < 60 OR 
    NOT (NEW.password_hash LIKE '$2a$%' OR NEW.password_hash LIKE '$2b$%')
  ) THEN
    -- Hash the password using crypt with blowfish algorithm (bcrypt)
    -- Using fully qualified function names from extensions schema
    NEW.password_hash := extensions.crypt(NEW.password_hash, extensions.gen_salt('bf'));
  END IF;
  
  RETURN NEW;
END;
$$;