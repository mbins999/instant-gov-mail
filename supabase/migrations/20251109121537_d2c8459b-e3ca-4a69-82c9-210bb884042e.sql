-- تعديل وظيفة get_user_id_from_session لاستخدام x-session-token بدلاً من Authorization
CREATE OR REPLACE FUNCTION public.get_user_id_from_session()
 RETURNS bigint
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  session_token_header text;
  user_id_result bigint;
BEGIN
  -- الحصول على session token من Custom Header آمن
  BEGIN
    session_token_header := current_setting('request.headers', true)::json->>'x-session-token';
  EXCEPTION
    WHEN OTHERS THEN
      session_token_header := NULL;
  END;
  
  -- البحث عن المستخدم من session token
  IF session_token_header IS NOT NULL AND session_token_header != '' THEN
    SELECT s.user_id INTO user_id_result
    FROM sessions s
    WHERE s.token = session_token_header
      AND s.expires_at > NOW()
    LIMIT 1;
    
    RETURN user_id_result;
  END IF;
  
  RETURN NULL;
END;
$function$;