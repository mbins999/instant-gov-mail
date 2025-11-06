-- إضافة عمود لتخزين كلمة المرور المشفرة
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- إنشاء دالة للتحقق من كلمة المرور
CREATE OR REPLACE FUNCTION public.verify_password(username_input text, password_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  result json;
BEGIN
  -- البحث عن المستخدم
  SELECT p.id, p.username, p.full_name, p.entity_name, p.password_hash, ur.role
  INTO user_record
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.username = username_input;

  -- إذا لم يوجد المستخدم
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  -- التحقق من كلمة المرور (مشفرة باستخدام crypt)
  IF user_record.password_hash = crypt(password_input, user_record.password_hash) THEN
    result := json_build_object(
      'success', true,
      'user', json_build_object(
        'id', user_record.id,
        'username', user_record.username,
        'full_name', user_record.full_name,
        'entity_name', user_record.entity_name,
        'role', user_record.role
      )
    );
    RETURN result;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
END;
$$;

-- دالة لتحديث كلمة المرور
CREATE OR REPLACE FUNCTION public.update_user_password(user_id_input uuid, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET password_hash = crypt(new_password, gen_salt('bf'))
  WHERE id = user_id_input;
  
  RETURN FOUND;
END;
$$;