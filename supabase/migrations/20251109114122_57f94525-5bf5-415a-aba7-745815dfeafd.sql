-- ====================================
-- MIGRATION: إصلاح شامل للنظام
-- التاريخ: 2025-11-09
-- الهدف: إضافة Foreign Keys وإصلاح المشاكل الأمنية
-- ====================================

-- 1. إضافة Foreign Keys لجدول users
ALTER TABLE public.users
ADD CONSTRAINT fk_users_entity
FOREIGN KEY (entity_id) REFERENCES public.entities(id)
ON DELETE SET NULL;

ALTER TABLE public.users
ADD CONSTRAINT fk_users_created_by
FOREIGN KEY (created_by) REFERENCES public.users(id)
ON DELETE SET NULL;

-- 2. إضافة Foreign Keys لجدول correspondences
ALTER TABLE public.correspondences
ADD CONSTRAINT fk_correspondences_created_by
FOREIGN KEY (created_by) REFERENCES public.users(id)
ON DELETE SET NULL;

ALTER TABLE public.correspondences
ADD CONSTRAINT fk_correspondences_received_by
FOREIGN KEY (received_by) REFERENCES public.users(id)
ON DELETE SET NULL;

ALTER TABLE public.correspondences
ADD CONSTRAINT fk_correspondences_external_connection
FOREIGN KEY (external_connection_id) REFERENCES public.external_connections(id)
ON DELETE SET NULL;

-- 3. إضافة Foreign Keys لجدول correspondence_comments
ALTER TABLE public.correspondence_comments
ADD CONSTRAINT fk_comments_correspondence
FOREIGN KEY (correspondence_id) REFERENCES public.correspondences(id)
ON DELETE CASCADE;

ALTER TABLE public.correspondence_comments
ADD CONSTRAINT fk_comments_user
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE CASCADE;

ALTER TABLE public.correspondence_comments
ADD CONSTRAINT fk_comments_parent
FOREIGN KEY (parent_comment_id) REFERENCES public.correspondence_comments(id)
ON DELETE CASCADE;

-- 4. إضافة Foreign Keys لجدول notifications
ALTER TABLE public.notifications
ADD CONSTRAINT fk_notifications_user
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE CASCADE;

ALTER TABLE public.notifications
ADD CONSTRAINT fk_notifications_correspondence
FOREIGN KEY (correspondence_id) REFERENCES public.correspondences(id)
ON DELETE CASCADE;

-- 5. إضافة Foreign Keys لجدول correspondence_templates
ALTER TABLE public.correspondence_templates
ADD CONSTRAINT fk_templates_entity
FOREIGN KEY (entity_id) REFERENCES public.entities(id)
ON DELETE SET NULL;

ALTER TABLE public.correspondence_templates
ADD CONSTRAINT fk_templates_created_by
FOREIGN KEY (created_by) REFERENCES public.users(id)
ON DELETE SET NULL;

ALTER TABLE public.correspondence_templates
ADD CONSTRAINT fk_templates_updated_by
FOREIGN KEY (updated_by) REFERENCES public.users(id)
ON DELETE SET NULL;

-- 6. إضافة Foreign Keys لجدول external_connections
ALTER TABLE public.external_connections
ADD CONSTRAINT fk_connections_created_by
FOREIGN KEY (created_by) REFERENCES public.users(id)
ON DELETE SET NULL;

-- 7. إضافة Foreign Keys لجدول password_history
ALTER TABLE public.password_history
ADD CONSTRAINT fk_password_history_user
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE CASCADE;

-- 8. إضافة Foreign Keys لجدول sessions
ALTER TABLE public.sessions
ADD CONSTRAINT fk_sessions_user
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE CASCADE;

-- 9. إضافة Foreign Keys لجدول user_roles
ALTER TABLE public.user_roles
ADD CONSTRAINT fk_user_roles_user
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE CASCADE;

-- 10. إضافة Foreign Keys لجدول sync_log
ALTER TABLE public.sync_log
ADD CONSTRAINT fk_sync_log_connection
FOREIGN KEY (connection_id) REFERENCES public.external_connections(id)
ON DELETE SET NULL;

ALTER TABLE public.sync_log
ADD CONSTRAINT fk_sync_log_correspondence
FOREIGN KEY (correspondence_id) REFERENCES public.correspondences(id)
ON DELETE SET NULL;

-- 11. إضافة Foreign Keys لجدول audit_log
ALTER TABLE public.audit_log
ADD CONSTRAINT fk_audit_log_user
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE SET NULL;

-- ====================================
-- إصلاح Functions الأمنية
-- ====================================

-- 12. إصلاح save_password_history مع search_path
CREATE OR REPLACE FUNCTION public.save_password_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.password_hash != NEW.password_hash THEN
    INSERT INTO password_history (user_id, password_hash)
    VALUES (OLD.id, OLD.password_hash);
    
    -- حذف كلمات المرور القديمة (الاحتفاظ بآخر 5 فقط)
    DELETE FROM password_history
    WHERE user_id = OLD.id
    AND id NOT IN (
      SELECT id FROM password_history
      WHERE user_id = OLD.id
      ORDER BY created_at DESC
      LIMIT 5
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 13. إصلاح handle_comment_changes مع search_path
CREATE OR REPLACE FUNCTION public.handle_comment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = now();
    NEW.is_edited = true;
  ELSIF TG_OP = 'INSERT' THEN
    -- إنشاء إشعارات للمستخدمين المشار إليهم
    IF NEW.mentioned_users IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, correspondence_id, related_entity_type, related_entity_id)
      SELECT 
        unnest(NEW.mentioned_users),
        'mention',
        'تمت الإشارة إليك في تعليق',
        'تمت الإشارة إليك في تعليق على مراسلة',
        NEW.correspondence_id,
        'comment',
        NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 14. إصلاح sync_entity_name مع search_path
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
    FROM entities
    WHERE id = NEW.entity_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 15. إصلاح update_template_updated_at مع search_path
CREATE OR REPLACE FUNCTION public.update_template_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 16. إصلاح create_default_user_role مع search_path
CREATE OR REPLACE FUNCTION public.create_default_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default 'user' role if not exists
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- ====================================
-- إصلاح Views الأمنية
-- ====================================

-- 17. إعادة إنشاء correspondence_statistics بـ SECURITY INVOKER
DROP VIEW IF EXISTS public.correspondence_statistics;
CREATE VIEW public.correspondence_statistics
WITH (security_invoker = true)
AS
SELECT 
  DATE_TRUNC('month', c.date) AS month,
  c.type,
  c.from_entity,
  c.received_by_entity,
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE c.received_at IS NOT NULL) AS received_count,
  COUNT(*) FILTER (WHERE c.archived = true) AS archived_count,
  COUNT(*) FILTER (WHERE c.display_type = 'content') AS with_content_count,
  COUNT(*) FILTER (WHERE c.signature_url IS NOT NULL) AS with_signature_count,
  COUNT(*) FILTER (WHERE c.display_type = 'attachment_only') AS attachment_only_count,
  AVG(EXTRACT(EPOCH FROM (c.received_at - c.date))/3600) FILTER (WHERE c.received_at IS NOT NULL) AS avg_hours_to_receive
FROM public.correspondences c
GROUP BY DATE_TRUNC('month', c.date), c.type, c.from_entity, c.received_by_entity
ORDER BY month DESC;

-- 18. إعادة إنشاء user_performance بـ SECURITY INVOKER
DROP VIEW IF EXISTS public.user_performance;
CREATE VIEW public.user_performance
WITH (security_invoker = true)
AS
SELECT 
  u.id,
  u.username,
  u.full_name,
  u.entity_name,
  ur.role,
  COUNT(DISTINCT c.id) AS total_correspondences,
  COUNT(DISTINCT c.id) FILTER (WHERE c.created_by = u.id) AS created_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.received_by = u.id) AS received_count,
  COUNT(DISTINCT cc.id) AS comments_count,
  AVG(EXTRACT(EPOCH FROM (c.received_at - c.date))/3600) FILTER (WHERE c.received_by = u.id AND c.received_at IS NOT NULL) AS avg_response_hours,
  MAX(COALESCE(c.updated_at, c.created_at)) AS last_activity
FROM public.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.correspondences c ON c.created_by = u.id OR c.received_by = u.id
LEFT JOIN public.correspondence_comments cc ON cc.user_id = u.id
GROUP BY u.id, u.username, u.full_name, u.entity_name, ur.role;

-- 19. إعادة إنشاء entity_statistics بـ SECURITY INVOKER
DROP VIEW IF EXISTS public.entity_statistics;
CREATE VIEW public.entity_statistics
WITH (security_invoker = true)
AS
SELECT 
  e.id,
  e.name,
  e.type,
  COUNT(DISTINCT u.id) AS users_count,
  COUNT(DISTINCT ct.id) AS templates_count,
  COUNT(DISTINCT CASE WHEN c.from_entity = e.name THEN c.id END) AS sent_count,
  COUNT(DISTINCT CASE WHEN c.received_by_entity = e.name THEN c.id END) AS received_count,
  COUNT(DISTINCT c.id) AS total_correspondences
FROM public.entities e
LEFT JOIN public.users u ON u.entity_id = e.id
LEFT JOIN public.correspondence_templates ct ON ct.entity_id = e.id
LEFT JOIN public.correspondences c ON c.from_entity = e.name OR c.received_by_entity = e.name
GROUP BY e.id, e.name, e.type;

-- 20. إعادة إنشاء daily_activity بـ SECURITY INVOKER
DROP VIEW IF EXISTS public.daily_activity;
CREATE VIEW public.daily_activity
WITH (security_invoker = true)
AS
SELECT 
  DATE(c.created_at) AS date,
  COUNT(DISTINCT c.id) AS correspondences_created,
  COUNT(DISTINCT CASE WHEN c.received_at IS NOT NULL THEN c.id END) AS correspondences_viewed,
  COUNT(DISTINCT CASE WHEN c.updated_at > c.created_at THEN c.id END) AS correspondences_updated,
  COUNT(DISTINCT c.created_by) AS active_users,
  COUNT(DISTINCT s.user_id) AS logins
FROM public.correspondences c
LEFT JOIN public.sessions s ON DATE(s.created_at) = DATE(c.created_at)
GROUP BY DATE(c.created_at)
ORDER BY date DESC;