-- إزالة الدوال القديمة واستخدام نهج أبسط
DROP FUNCTION IF EXISTS public.update_user_password(uuid, text);
DROP FUNCTION IF EXISTS public.verify_password(text, text);

-- دالة بسيطة لتحديث كلمة المرور (سنستخدم edge functions للتشفير)
CREATE OR REPLACE FUNCTION public.set_password_hash(user_id_input uuid, password_hash_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET password_hash = password_hash_input
  WHERE id = user_id_input;
  
  RETURN FOUND;
END;
$$;

-- دالة للحصول على المستخدم وكلمة المرور المشفرة
CREATE OR REPLACE FUNCTION public.get_user_by_username(username_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT p.id, p.username, p.full_name, p.entity_name, p.password_hash, ur.role
  INTO user_record
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.username = username_input;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id', user_record.id,
    'username', user_record.username,
    'full_name', user_record.full_name,
    'entity_name', user_record.entity_name,
    'password_hash', user_record.password_hash,
    'role', user_record.role
  );
END;
$$;