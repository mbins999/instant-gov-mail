-- إصلاح وظيفة get_user_id_from_session للعمل مع session tokens
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
  -- محاولة الحصول على session token من Authorization header
  BEGIN
    session_token_header := current_setting('request.headers', true)::json->>'authorization';
    
    -- إزالة "Bearer " prefix إذا وجد
    IF session_token_header LIKE 'Bearer %' THEN
      session_token_header := substring(session_token_header from 8);
    END IF;
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