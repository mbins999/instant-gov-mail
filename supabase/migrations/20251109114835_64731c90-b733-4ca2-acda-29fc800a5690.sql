-- ====================================
-- MIGRATION: تحسين النظام إلى 100%
-- التاريخ: 2025-11-09
-- الهدف: إصلاح المشاكل الثانوية المتبقية
-- ====================================

-- 1. نقل pgcrypto إلى extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pgcrypto SET SCHEMA extensions;

-- 2. إضافة Indexes للأداء
-- Indexes على correspondences
CREATE INDEX IF NOT EXISTS idx_correspondences_created_by ON public.correspondences(created_by);
CREATE INDEX IF NOT EXISTS idx_correspondences_received_by ON public.correspondences(received_by);
CREATE INDEX IF NOT EXISTS idx_correspondences_date ON public.correspondences(date DESC);
CREATE INDEX IF NOT EXISTS idx_correspondences_type ON public.correspondences(type);
CREATE INDEX IF NOT EXISTS idx_correspondences_from_entity ON public.correspondences(from_entity);
CREATE INDEX IF NOT EXISTS idx_correspondences_received_by_entity ON public.correspondences(received_by_entity);
CREATE INDEX IF NOT EXISTS idx_correspondences_archived ON public.correspondences(archived);
CREATE INDEX IF NOT EXISTS idx_correspondences_created_at ON public.correspondences(created_at DESC);

-- Indexes على correspondence_comments
CREATE INDEX IF NOT EXISTS idx_comments_correspondence_id ON public.correspondence_comments(correspondence_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.correspondence_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.correspondence_comments(created_at DESC);

-- Indexes على notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_correspondence_id ON public.notifications(correspondence_id);

-- Indexes على sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- Indexes على user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Indexes على users
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_entity_id ON public.users(entity_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Indexes على correspondence_templates
CREATE INDEX IF NOT EXISTS idx_templates_entity_id ON public.correspondence_templates(entity_id);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.correspondence_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON public.correspondence_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.correspondence_templates(category);

-- Indexes على audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON public.audit_log(entity_type);

-- Indexes على rate_limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON public.rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON public.rate_limits(created_at);

-- Indexes على sync_log
CREATE INDEX IF NOT EXISTS idx_sync_log_connection_id ON public.sync_log(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_correspondence_id ON public.sync_log(correspondence_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON public.sync_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON public.sync_log(status);

-- 3. إضافة Composite Indexes للأداء الأفضل
CREATE INDEX IF NOT EXISTS idx_correspondences_user_type ON public.correspondences(created_by, type);
CREATE INDEX IF NOT EXISTS idx_correspondences_entity_date ON public.correspondences(from_entity, date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- 4. تحسين RLS Policies لتكون أكثر أماناً
-- إضافة policy للتأكد من عدم وجود created_by null
CREATE OR REPLACE FUNCTION public.validate_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'created_by cannot be null';
  END IF;
  RETURN NEW;
END;
$$;

-- إضافة trigger للتحقق من created_by
DROP TRIGGER IF EXISTS validate_correspondence_created_by ON public.correspondences;
CREATE TRIGGER validate_correspondence_created_by
  BEFORE INSERT ON public.correspondences
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_created_by();

-- 5. إضافة function لتنظيف البيانات القديمة
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- حذف rate_limits القديمة (أكثر من 7 أيام)
  DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- حذف sessions منتهية الصلاحية
  DELETE FROM sessions WHERE expires_at < NOW();
  
  -- حذف notifications القديمة المقروءة (أكثر من 30 يوم)
  DELETE FROM notifications WHERE read = true AND created_at < NOW() - INTERVAL '30 days';
  
  -- تحديث إحصائيات الجداول
  ANALYZE correspondences;
  ANALYZE correspondence_comments;
  ANALYZE notifications;
  ANALYZE users;
END;
$$;

-- 6. جدولة تنظيف البيانات القديمة (يومياً في منتصف الليل)
-- ملاحظة: pg_cron يجب أن يكون مفعل في Supabase
DO $$
BEGIN
  -- محاولة إنشاء جدولة التنظيف التلقائي
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- حذف الجدولة القديمة إن وجدت
    PERFORM cron.unschedule('cleanup_old_data_job');
    
    -- إنشاء جدولة جديدة
    PERFORM cron.schedule(
      'cleanup_old_data_job',
      '0 2 * * *', -- كل يوم الساعة 2 صباحاً
      'SELECT public.cleanup_old_data();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- تجاهل الخطأ إذا لم يكن pg_cron مفعل
    NULL;
END $$;

-- 7. إضافة constraints إضافية للتحقق من البيانات
-- التأكد من أن email في notifications صالح (إذا وجد)
ALTER TABLE public.notifications
ADD CONSTRAINT chk_notifications_type CHECK (
  type IN ('mention', 'assignment', 'status_change', 'comment', 'new_correspondence', 'received')
);

-- التأكد من أن priority في notifications صالح
ALTER TABLE public.notifications
ADD CONSTRAINT chk_notifications_priority CHECK (
  priority IN ('low', 'normal', 'high', 'urgent')
);

-- التأكد من أن display_type في correspondences صالح
ALTER TABLE public.correspondences
ADD CONSTRAINT chk_correspondences_display_type CHECK (
  display_type IN ('content', 'attachment_only')
);

-- التأكد من أن type في correspondences صالح
ALTER TABLE public.correspondences
ADD CONSTRAINT chk_correspondences_type CHECK (
  type IN ('incoming', 'outgoing')
);

-- 8. إنشاء view للإحصائيات في الوقت الفعلي
CREATE OR REPLACE VIEW public.real_time_statistics
WITH (security_invoker = true)
AS
SELECT
  -- إحصائيات اليوم
  (SELECT COUNT(*) FROM correspondences WHERE DATE(created_at) = CURRENT_DATE) as today_correspondences,
  (SELECT COUNT(*) FROM correspondences WHERE DATE(received_at) = CURRENT_DATE) as today_received,
  (SELECT COUNT(*) FROM correspondence_comments WHERE DATE(created_at) = CURRENT_DATE) as today_comments,
  (SELECT COUNT(*) FROM sessions WHERE DATE(created_at) = CURRENT_DATE) as today_logins,
  
  -- إحصائيات هذا الأسبوع
  (SELECT COUNT(*) FROM correspondences WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as week_correspondences,
  (SELECT COUNT(*) FROM users WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as week_new_users,
  
  -- إحصائيات هذا الشهر
  (SELECT COUNT(*) FROM correspondences WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as month_correspondences,
  
  -- إحصائيات عامة
  (SELECT COUNT(*) FROM correspondences) as total_correspondences,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM entities) as total_entities,
  (SELECT COUNT(*) FROM correspondence_templates WHERE is_active = true) as active_templates,
  
  -- متوسطات
  (SELECT AVG(EXTRACT(EPOCH FROM (received_at - date))/3600) 
   FROM correspondences 
   WHERE received_at IS NOT NULL 
   AND received_at > date) as avg_response_hours,
   
  -- نشاط النظام
  (SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()) as active_sessions,
  (SELECT COUNT(*) FROM notifications WHERE read = false) as unread_notifications;

-- 9. إنشاء function للحصول على إحصائيات المستخدم
CREATE OR REPLACE FUNCTION public.get_user_statistics(user_id_param bigint)
RETURNS TABLE (
  total_created bigint,
  total_received bigint,
  total_comments bigint,
  avg_response_hours numeric,
  last_login timestamp with time zone,
  unread_notifications bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM correspondences WHERE created_by = user_id_param) as total_created,
    (SELECT COUNT(*) FROM correspondences WHERE received_by = user_id_param) as total_received,
    (SELECT COUNT(*) FROM correspondence_comments WHERE user_id = user_id_param) as total_comments,
    (SELECT AVG(EXTRACT(EPOCH FROM (received_at - date))/3600) 
     FROM correspondences 
     WHERE received_by = user_id_param 
     AND received_at IS NOT NULL) as avg_response_hours,
    (SELECT MAX(created_at) FROM sessions WHERE sessions.user_id = user_id_param) as last_login,
    (SELECT COUNT(*) FROM notifications WHERE notifications.user_id = user_id_param AND read = false) as unread_notifications;
END;
$$;

-- 10. تحديث search_path لجميع Functions الموجودة
ALTER FUNCTION public.create_notification SET search_path = public;
ALTER FUNCTION public.log_audit SET search_path = public;

COMMENT ON SCHEMA extensions IS 'Schema for database extensions to improve security';
COMMENT ON FUNCTION public.cleanup_old_data() IS 'Cleans up old data from rate_limits, expired sessions, and read notifications';
COMMENT ON FUNCTION public.get_user_statistics(bigint) IS 'Returns comprehensive statistics for a specific user';
COMMENT ON VIEW public.real_time_statistics IS 'Real-time system statistics view';