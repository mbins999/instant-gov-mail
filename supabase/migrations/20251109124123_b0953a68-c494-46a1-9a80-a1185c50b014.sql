-- توحيد get_user_id_from_session: دعم x-user-id أولاً ثم x-session-token
CREATE OR REPLACE FUNCTION public.get_user_id_from_session()
 RETURNS bigint
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  headers json;
  user_id_header text;
  session_token_header text;
  user_id_result bigint;
BEGIN
  BEGIN
    headers := current_setting('request.headers', true)::json;
  EXCEPTION WHEN OTHERS THEN
    headers := '{}'::json;
  END;

  -- 1) إذا وُجد x-user-id نستخدمه مباشرة
  user_id_header := headers->>'x-user-id';
  IF user_id_header IS NOT NULL AND user_id_header <> '' THEN
    BEGIN
      user_id_result := user_id_header::bigint;
      RETURN user_id_result;
    EXCEPTION WHEN others THEN
      -- تجاهل التحويل الفاشل
      NULL;
    END;
  END IF;

  -- 2) خلاف ذلك استخدم x-session-token للبحث في جدول الجلسات
  session_token_header := headers->>'x-session-token';
  IF session_token_header IS NOT NULL AND session_token_header <> '' THEN
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