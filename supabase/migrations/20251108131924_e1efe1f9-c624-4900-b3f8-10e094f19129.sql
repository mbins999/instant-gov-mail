-- Add entity_id column to users table
ALTER TABLE public.users 
ADD COLUMN entity_id UUID REFERENCES public.entities(id);

-- Try to migrate existing data by matching entity_name to entities.name
UPDATE public.users u
SET entity_id = e.id
FROM public.entities e
WHERE u.entity_name = e.name;

-- Make entity_name nullable (keep it for backward compatibility but not required)
ALTER TABLE public.users 
ALTER COLUMN entity_name DROP NOT NULL;

-- Create index for better performance
CREATE INDEX idx_users_entity_id ON public.users(entity_id);