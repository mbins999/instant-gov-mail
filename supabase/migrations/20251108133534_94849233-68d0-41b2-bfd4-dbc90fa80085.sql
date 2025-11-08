-- Create trigger function to auto-populate entity_name from entity_id
CREATE OR REPLACE FUNCTION public.sync_entity_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If entity_id is provided, get the entity name
  IF NEW.entity_id IS NOT NULL THEN
    SELECT name INTO NEW.entity_name
    FROM public.entities
    WHERE id = NEW.entity_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS sync_entity_name_on_insert ON public.users;
CREATE TRIGGER sync_entity_name_on_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_entity_name();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS sync_entity_name_on_update ON public.users;
CREATE TRIGGER sync_entity_name_on_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  WHEN (OLD.entity_id IS DISTINCT FROM NEW.entity_id)
  EXECUTE FUNCTION public.sync_entity_name();

-- Update existing users to sync entity_name
UPDATE public.users u
SET entity_name = e.name
FROM public.entities e
WHERE u.entity_id = e.id
  AND (u.entity_name IS NULL OR u.entity_name != e.name);