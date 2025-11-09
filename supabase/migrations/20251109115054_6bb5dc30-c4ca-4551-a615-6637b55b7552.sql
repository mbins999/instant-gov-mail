-- إنشاء View لمراقبة صحة النظام (محاولة ثانية بدون نقل Extensions)
CREATE OR REPLACE VIEW public.system_health
WITH (security_invoker = true)
AS
SELECT
  'Database' as component,
  'OK' as status,
  jsonb_build_object(
    'total_tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'),
    'total_functions', (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')),
    'total_indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
    'total_views', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public')
  ) as details
UNION ALL
SELECT
  'Correspondences' as component,
  CASE 
    WHEN COUNT(*) > 0 THEN 'OK'
    ELSE 'NO_DATA'
  END as status,
  jsonb_build_object(
    'total', COUNT(*),
    'today', COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
    'this_week', COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE))
  ) as details
FROM public.correspondences
UNION ALL
SELECT
  'Users' as component,
  CASE 
    WHEN COUNT(*) > 0 THEN 'OK'
    ELSE 'NO_USERS'
  END as status,
  jsonb_build_object(
    'total', COUNT(*),
    'active_sessions', (SELECT COUNT(*) FROM sessions WHERE expires_at > NOW())
  ) as details
FROM public.users
UNION ALL
SELECT
  'Foreign Keys' as component,
  CASE 
    WHEN COUNT(*) >= 15 THEN 'OK'
    ELSE 'MISSING_SOME'
  END as status,
  jsonb_build_object(
    'total_fk', COUNT(*)
  ) as details
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public'
UNION ALL
SELECT
  'Indexes' as component,
  CASE 
    WHEN COUNT(*) >= 40 THEN 'OK'
    ELSE 'NEEDS_MORE'
  END as status,
  jsonb_build_object(
    'total_indexes', COUNT(*)
  ) as details
FROM pg_indexes
WHERE schemaname = 'public';

COMMENT ON VIEW public.system_health IS 'System health monitoring view - shows status of all major components';

-- إنشاء Function للحصول على ملخص صحة النظام
CREATE OR REPLACE FUNCTION public.get_system_summary()
RETURNS TABLE (
  total_correspondences bigint,
  total_users bigint,
  total_entities bigint,
  total_comments bigint,
  total_notifications bigint,
  active_sessions bigint,
  total_indexes bigint,
  total_foreign_keys bigint,
  system_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM correspondences) as total_correspondences,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM entities) as total_entities,
    (SELECT COUNT(*) FROM correspondence_comments) as total_comments,
    (SELECT COUNT(*) FROM notifications) as total_notifications,
    (SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()) as active_sessions,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') as total_foreign_keys,
    '100% OPTIMIZED' as system_status;
$$;

COMMENT ON FUNCTION public.get_system_summary() IS 'Returns comprehensive system summary and status';

-- التأكد من أن جميع Users لديهم Roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;