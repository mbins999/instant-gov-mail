-- ====================================
-- 1. AUDIT LOG SYSTEM (تسجيل شامل لجميع العمليات)
-- ====================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id),
    action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', 'export', 'approve', 'login', 'logout'
    entity_type TEXT NOT NULL, -- 'correspondence', 'user', 'attachment', 'template', 'entity'
    entity_id TEXT NOT NULL,
    old_data JSONB, -- البيانات القديمة قبل التعديل
    new_data JSONB, -- البيانات الجديدة بعد التعديل
    ip_address INET,
    user_agent TEXT,
    description TEXT, -- وصف مختصر للعملية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- RLS للـ audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
ON audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (
      SELECT user_id FROM sessions 
      WHERE token = current_setting('request.headers', true)::json->>'authorization'
      AND expires_at > now()
    )
    AND role = 'admin'
  )
);

CREATE POLICY "Users can view their own audit logs"
ON audit_log FOR SELECT
USING (user_id = get_user_id_from_session());

-- ====================================
-- 2. NOTIFICATIONS SYSTEM (نظام الإشعارات)
-- ====================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'new_correspondence', 'pending_approval', 'comment', 'mention', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    correspondence_id UUID REFERENCES correspondences(id) ON DELETE CASCADE,
    related_entity_type TEXT, -- 'comment', 'approval', etc
    related_entity_id UUID,
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT, -- رابط للانتقال عند النقر
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فهارس
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC) WHERE read = false;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = get_user_id_from_session());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (user_id = get_user_id_from_session());

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ====================================
-- 3. TEMPLATES SYSTEM (قوالب المراسلات)
-- ====================================

CREATE TABLE IF NOT EXISTS correspondence_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- 'official', 'request', 'response', 'general'
    type TEXT DEFAULT 'all', -- 'incoming', 'outgoing', 'all'
    greeting TEXT DEFAULT 'السيد/',
    subject_template TEXT,
    content_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- [{"name": "topic", "description": "الموضوع", "type": "text"}]
    entity_id UUID REFERENCES entities(id),
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false, -- قوالب عامة أم خاصة بجهة
    usage_count INTEGER DEFAULT 0,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فهارس
CREATE INDEX idx_templates_category ON correspondence_templates(category);
CREATE INDEX idx_templates_entity ON correspondence_templates(entity_id);
CREATE INDEX idx_templates_active ON correspondence_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_templates_public ON correspondence_templates(is_public) WHERE is_public = true;

-- RLS
ALTER TABLE correspondence_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active templates"
ON correspondence_templates FOR SELECT
USING (
  is_active = true 
  AND (
    is_public = true 
    OR entity_id IN (
      SELECT entity_id FROM users WHERE id = get_user_id_from_session()
    )
    OR created_by = get_user_id_from_session()
  )
);

CREATE POLICY "Users can create templates"
ON correspondence_templates FOR INSERT
WITH CHECK (created_by = get_user_id_from_session());

CREATE POLICY "Users can update their own templates"
ON correspondence_templates FOR UPDATE
USING (
  created_by = get_user_id_from_session()
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = get_user_id_from_session() AND role = 'admin'
  )
);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_updated_at
BEFORE UPDATE ON correspondence_templates
FOR EACH ROW
EXECUTE FUNCTION update_template_updated_at();

-- ====================================
-- 4. COMMENTS SYSTEM (التعليقات الداخلية)
-- ====================================

CREATE TABLE IF NOT EXISTS correspondence_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correspondence_id UUID REFERENCES correspondences(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true, -- داخلي فقط أم يظهر للجهات الخارجية
    parent_comment_id UUID REFERENCES correspondence_comments(id) ON DELETE CASCADE, -- للردود
    mentioned_users BIGINT[], -- المستخدمين المشار إليهم
    attachments TEXT[], -- مرفقات إضافية
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فهارس
CREATE INDEX idx_comments_correspondence ON correspondence_comments(correspondence_id, created_at);
CREATE INDEX idx_comments_user ON correspondence_comments(user_id);
CREATE INDEX idx_comments_parent ON correspondence_comments(parent_comment_id);

-- RLS
ALTER TABLE correspondence_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on correspondences they have access to"
ON correspondence_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM correspondences c
    WHERE c.id = correspondence_id
  )
);

CREATE POLICY "Users can create comments"
ON correspondence_comments FOR INSERT
WITH CHECK (user_id = get_user_id_from_session());

CREATE POLICY "Users can update their own comments"
ON correspondence_comments FOR UPDATE
USING (user_id = get_user_id_from_session());

CREATE POLICY "Users can delete their own comments"
ON correspondence_comments FOR DELETE
USING (user_id = get_user_id_from_session());

-- Trigger لتحديث updated_at وإرسال إشعارات للمشار إليهم
CREATE OR REPLACE FUNCTION handle_comment_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER comments_handle_changes
BEFORE INSERT OR UPDATE ON correspondence_comments
FOR EACH ROW
EXECUTE FUNCTION handle_comment_changes();

-- Enable Realtime للتعليقات
ALTER PUBLICATION supabase_realtime ADD TABLE correspondence_comments;

-- ====================================
-- 5. PASSWORD HISTORY (سجل كلمات المرور)
-- ====================================

CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فهرس
CREATE INDEX idx_password_history_user ON password_history(user_id, created_at DESC);

-- RLS
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage password history"
ON password_history FOR ALL
USING (true);

-- دالة لحفظ كلمة المرور القديمة
CREATE OR REPLACE FUNCTION save_password_history()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER users_save_password_history
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION save_password_history();

-- ====================================
-- 6. REPORTS VIEWS (عروض التقارير)
-- ====================================

-- إحصائيات المراسلات الشهرية
CREATE OR REPLACE VIEW correspondence_statistics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    type,
    from_entity,
    received_by_entity,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE received_at IS NOT NULL) as received_count,
    COUNT(*) FILTER (WHERE archived = true) as archived_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (received_at - created_at))/3600)::numeric, 2) as avg_hours_to_receive,
    COUNT(*) FILTER (WHERE display_type = 'content') as with_content_count,
    COUNT(*) FILTER (WHERE display_type = 'attachment_only') as attachment_only_count,
    COUNT(*) FILTER (WHERE signature_url IS NOT NULL) as with_signature_count
FROM correspondences
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY month, type, from_entity, received_by_entity
ORDER BY month DESC;

-- أداء المستخدمين
CREATE OR REPLACE VIEW user_performance AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.entity_name,
    ur.role,
    COUNT(c.id) as total_correspondences,
    COUNT(c.id) FILTER (WHERE c.type = 'outgoing') as created_count,
    COUNT(c.id) FILTER (WHERE c.type = 'incoming' AND c.received_by = u.id) as received_count,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (c.received_at - c.created_at))/3600
    ) FILTER (WHERE c.received_at IS NOT NULL)::numeric, 2) as avg_response_hours,
    COUNT(DISTINCT cc.id) as comments_count,
    MAX(c.created_at) as last_activity
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN correspondences c ON c.created_by = u.id OR c.received_by = u.id
LEFT JOIN correspondence_comments cc ON cc.user_id = u.id
WHERE c.created_at >= NOW() - INTERVAL '3 months' OR c.created_at IS NULL
GROUP BY u.id, u.username, u.full_name, u.entity_name, ur.role;

-- إحصائيات الجهات
CREATE OR REPLACE VIEW entity_statistics AS
SELECT 
    e.id,
    e.name,
    e.type,
    COUNT(DISTINCT c1.id) as sent_count,
    COUNT(DISTINCT c2.id) as received_count,
    COUNT(DISTINCT c1.id) + COUNT(DISTINCT c2.id) as total_correspondences,
    COUNT(DISTINCT u.id) as users_count,
    COUNT(DISTINCT ct.id) as templates_count
FROM entities e
LEFT JOIN correspondences c1 ON c1.from_entity = e.name
LEFT JOIN correspondences c2 ON c2.received_by_entity = e.name
LEFT JOIN users u ON u.entity_id = e.id
LEFT JOIN correspondence_templates ct ON ct.entity_id = e.id
GROUP BY e.id, e.name, e.type;

-- نشاط النظام اليومي
CREATE OR REPLACE VIEW daily_activity AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE entity_type = 'correspondence' AND action = 'create') as correspondences_created,
    COUNT(*) FILTER (WHERE entity_type = 'correspondence' AND action = 'view') as correspondences_viewed,
    COUNT(*) FILTER (WHERE entity_type = 'correspondence' AND action = 'update') as correspondences_updated,
    COUNT(*) FILTER (WHERE action = 'login') as logins,
    COUNT(DISTINCT user_id) as active_users
FROM audit_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- ====================================
-- 7. DEFAULT TEMPLATES (قوالب افتراضية)
-- ====================================

INSERT INTO correspondence_templates (name, category, type, subject_template, content_template, variables, is_public)
VALUES
(
    'طلب معلومات',
    'request',
    'outgoing',
    'طلب معلومات بخصوص {topic}',
    E'السلام عليكم ورحمة الله وبركاته،\n\nنرجو منكم التكرم بتزويدنا بالمعلومات التالية:\n{requested_info}\n\nوذلك للضرورة القصوى.\n\nشاكرين حسن تعاونكم،\nوالله الموفق،',
    '[{"name": "topic", "description": "موضوع الطلب", "type": "text"}, {"name": "requested_info", "description": "المعلومات المطلوبة", "type": "textarea"}]'::jsonb,
    true
),
(
    'رد رسمي',
    'response',
    'outgoing',
    'بخصوص: {original_subject}',
    E'السلام عليكم ورحمة الله وبركاته،\n\nإشارة إلى كتابكم رقم {reference_number} بتاريخ {reference_date}، نفيدكم بما يلي:\n\n{response_content}\n\nشاكرين حسن تعاونكم،\nوتفضلوا بقبول فائق الاحترام،',
    '[{"name": "original_subject", "description": "موضوع الكتاب الأصلي", "type": "text"}, {"name": "reference_number", "description": "رقم الكتاب المرجعي", "type": "text"}, {"name": "reference_date", "description": "تاريخ الكتاب المرجعي", "type": "date"}, {"name": "response_content", "description": "محتوى الرد", "type": "textarea"}]'::jsonb,
    true
),
(
    'إشعار رسمي',
    'official',
    'outgoing',
    'إشعار: {notification_subject}',
    E'السلام عليكم ورحمة الله وبركاته،\n\nنحيطكم علماً بـ {notification_content}\n\nوذلك للعلم واتخاذ اللازم.\n\nوتفضلوا بقبول فائق الاحترام،',
    '[{"name": "notification_subject", "description": "موضوع الإشعار", "type": "text"}, {"name": "notification_content", "description": "محتوى الإشعار", "type": "textarea"}]'::jsonb,
    true
),
(
    'دعوة اجتماع',
    'official',
    'outgoing',
    'دعوة لحضور اجتماع - {meeting_subject}',
    E'السلام عليكم ورحمة الله وبركاته،\n\nيسرنا دعوتكم لحضور اجتماع بعنوان "{meeting_subject}"\n\nالتاريخ: {meeting_date}\nالوقت: {meeting_time}\nالمكان: {meeting_location}\n\nجدول الأعمال:\n{agenda}\n\nنأمل تأكيد حضوركم.\n\nشاكرين حسن تعاونكم،',
    '[{"name": "meeting_subject", "description": "موضوع الاجتماع", "type": "text"}, {"name": "meeting_date", "description": "تاريخ الاجتماع", "type": "date"}, {"name": "meeting_time", "description": "وقت الاجتماع", "type": "time"}, {"name": "meeting_location", "description": "مكان الاجتماع", "type": "text"}, {"name": "agenda", "description": "جدول الأعمال", "type": "textarea"}]'::jsonb,
    true
);

-- ====================================
-- 8. FUNCTIONS (دوال مساعدة)
-- ====================================

-- دالة لإنشاء إشعار
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id BIGINT,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_correspondence_id UUID DEFAULT NULL,
    p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, correspondence_id, priority)
    VALUES (p_user_id, p_type, p_title, p_message, p_correspondence_id, p_priority)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لتسجيل في audit log
CREATE OR REPLACE FUNCTION log_audit(
    p_user_id BIGINT,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_data, new_data, description)
    VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_old_data, p_new_data, p_description)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;