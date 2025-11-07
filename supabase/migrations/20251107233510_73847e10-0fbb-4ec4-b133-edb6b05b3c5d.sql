-- تحديث دالة get_user_id_from_session لقراءة من custom headers
CREATE OR REPLACE FUNCTION public.get_user_id_from_session()
RETURNS bigint
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_id_header text;
  user_id_result bigint;
BEGIN
  -- محاولة الحصول على user_id من HTTP headers المخصصة
  BEGIN
    user_id_header := current_setting('request.headers', true)::json->>'x-user-id';
  EXCEPTION
    WHEN OTHERS THEN
      user_id_header := NULL;
  END;
  
  IF user_id_header IS NOT NULL AND user_id_header != '' THEN
    user_id_result := user_id_header::bigint;
    RETURN user_id_result;
  END IF;
  
  RETURN NULL;
END;
$$;