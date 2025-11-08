-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to auto-hash passwords
CREATE OR REPLACE FUNCTION public.hash_user_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if password_hash is less than 60 characters (not a bcrypt hash)
  -- bcrypt hashes are always 60 characters long starting with $2a$ or $2b$
  IF NEW.password_hash IS NOT NULL AND (
    LENGTH(NEW.password_hash) < 60 OR 
    NOT (NEW.password_hash LIKE '$2a$%' OR NEW.password_hash LIKE '$2b$%')
  ) THEN
    -- Hash the password using crypt with blowfish algorithm (bcrypt)
    -- gen_salt('bf', 12) generates a bcrypt salt with cost factor 12
    NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf', 12));
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-hash passwords on INSERT
CREATE TRIGGER hash_password_on_insert
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.hash_user_password();

-- Create trigger to auto-hash passwords on UPDATE
CREATE TRIGGER hash_password_on_update
BEFORE UPDATE ON public.users
FOR EACH ROW
WHEN (OLD.password_hash IS DISTINCT FROM NEW.password_hash)
EXECUTE FUNCTION public.hash_user_password();

-- Comment on function
COMMENT ON FUNCTION public.hash_user_password() IS 'Automatically hashes passwords that are not already bcrypt hashed (length < 60 chars)';
