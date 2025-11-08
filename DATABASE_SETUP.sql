-- ========================================
-- نظام إدارة المراسلات - قاعدة البيانات الكاملة
-- Database Setup for Correspondence Management System
-- ========================================

-- تنظيف قاعدة البيانات (اختياري - احذف هذا القسم إذا كنت تريد الحفاظ على البيانات)
-- DROP TABLE IF EXISTS public.sync_log CASCADE;
-- DROP TABLE IF EXISTS public.external_connections CASCADE;
-- DROP TABLE IF EXISTS public.correspondences CASCADE;
-- DROP TABLE IF EXISTS public.user_roles CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP TABLE IF EXISTS public.entities CASCADE;
-- DROP TABLE IF EXISTS public.sessions CASCADE;
-- DROP TABLE IF EXISTS public.rate_limits CASCADE;
-- DROP TYPE IF EXISTS public.app_role;

-- ========================================
-- 1. إنشاء الأنواع المخصصة (Types)
-- ========================================

-- نوع الأدوار
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ========================================
-- 2. إنشاء الجداول الأساسية
-- ========================================

-- جدول الجهات
CREATE TABLE public.entities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'sender', 'receiver', 'both'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول المستخدمين
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by BIGINT REFERENCES users(id)
);

-- جدول أدوار المستخدمين
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- جدول الجلسات
CREATE TABLE public.sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + '30 days'::interval),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول تحديد المعدل (Rate Limiting)
CREATE TABLE public.rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول المراسلات
CREATE TABLE public.correspondences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    number TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    type TEXT NOT NULL, -- 'incoming' or 'outgoing'
    from_entity TEXT NOT NULL,
    received_by_entity TEXT,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    greeting TEXT NOT NULL DEFAULT 'السيد/',
    responsible_person TEXT,
    signature_url TEXT,
    display_type TEXT NOT NULL DEFAULT 'content', -- 'content' or 'attachment_only'
    attachments TEXT[],
    notes TEXT,
    archived BOOLEAN DEFAULT false,
    pdf_url TEXT,
    external_doc_id TEXT,
    external_connection_id UUID,
    created_by BIGINT REFERENCES users(id),
    received_by BIGINT REFERENCES users(id),
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول الاتصالات الخارجية
CREATE TABLE public.external_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    api_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by BIGINT REFERENCES users(id)
);

-- جدول سجل المزامنة
CREATE TABLE public.sync_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    connection_id UUID REFERENCES external_connections(id) ON DELETE CASCADE,
    correspondence_id UUID REFERENCES correspondences(id) ON DELETE CASCADE,
    operation TEXT NOT NULL, -- 'export', 'receive', 'return', 'resend'
    status TEXT NOT NULL, -- 'pending', 'success', 'failed'
    external_doc_id TEXT,
    request_payload JSONB,
    response_payload JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========================================
-- 3. إنشاء الفهارس (Indexes)
-- ========================================

CREATE INDEX idx_correspondences_external_doc_id ON public.correspondences(external_doc_id);
CREATE INDEX idx_correspondences_external_connection_id ON public.correspondences(external_connection_id);
CREATE INDEX idx_sync_log_correspondence_id ON public.sync_log(correspondence_id);
CREATE INDEX idx_sync_log_created_at ON public.sync_log(created_at DESC);
CREATE INDEX idx_correspondences_created_by ON public.correspondences(created_by);
CREATE INDEX idx_correspondences_received_by ON public.correspondences(received_by);
CREATE INDEX idx_correspondences_archived ON public.correspondences(archived);

-- ========================================
-- 4. تفعيل Row Level Security (RLS)
-- ========================================

ALTER TABLE public.correspondences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. إنشاء سياسات الأمان (RLS Policies)
-- ========================================

-- سياسات المراسلات
CREATE POLICY "Users can view all correspondences"
ON public.correspondences FOR SELECT USING (true);

CREATE POLICY "Users can create correspondences"
ON public.correspondences FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their correspondences"
ON public.correspondences FOR UPDATE USING (true);

-- سياسات المستخدمين
CREATE POLICY "Users can view all users"
ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE USING (true);

CREATE POLICY "Users can insert users"
ON public.users FOR INSERT WITH CHECK (true);

-- سياسات أدوار المستخدمين
CREATE POLICY "Users can view all roles"
ON public.user_roles FOR SELECT USING (true);

CREATE POLICY "Users can manage roles"
ON public.user_roles FOR ALL USING (true);

-- سياسات الجهات
CREATE POLICY "Allow all operations on entities"
ON public.entities FOR ALL USING (true);

-- سياسات الجلسات
CREATE POLICY "Service role can manage sessions"
ON public.sessions FOR ALL USING (true);

-- سياسات Rate Limits
CREATE POLICY "Service role can manage rate_limits"
ON public.rate_limits FOR ALL USING (true);

-- سياسات الاتصالات الخارجية
CREATE POLICY "Users can view external connections"
ON public.external_connections FOR SELECT USING (true);

CREATE POLICY "Users can manage external connections"
ON public.external_connections FOR ALL USING (true);

-- سياسات سجل المزامنة
CREATE POLICY "Users can view sync logs"
ON public.sync_log FOR SELECT USING (true);

-- ========================================
-- 6. إنشاء الدوال (Functions)
-- ========================================

-- دالة تحديث الوقت
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- دالة جلب المستخدم باستخدام اسم المستخدم
CREATE OR REPLACE FUNCTION public.get_user_by_username(username_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT u.id, u.username, u.full_name, u.entity_name, u.password_hash, ur.role
  INTO user_record
  FROM users u
  LEFT JOIN user_roles ur ON ur.user_id = u.id
  WHERE u.username = username_input;

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

-- دالة تنظيف Rate Limits القديمة
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- دالة التحقق من الدور
CREATE OR REPLACE FUNCTION public.has_role(_user_id bigint, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ========================================
-- 7. إنشاء المشغلات (Triggers)
-- ========================================

-- مشغل تحديث الوقت للمراسلات
CREATE TRIGGER update_correspondences_updated_at
BEFORE UPDATE ON public.correspondences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- مشغل تحديث الوقت للاتصالات الخارجية
CREATE TRIGGER update_external_connections_updated_at
BEFORE UPDATE ON public.external_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 8. إدراج بيانات أولية (Optional)
-- ========================================

-- إدراج جهات افتراضية
INSERT INTO public.entities (name, type) VALUES
    ('وزارة الداخلية', 'both'),
    ('وزارة الخارجية', 'both'),
    ('وزارة العدل', 'both'),
    ('وزارة المالية', 'both'),
    ('وزارة التعليم', 'both'),
    ('وزارة الصحة', 'both'),
    ('وزارة التجارة', 'both')
ON CONFLICT DO NOTHING;

-- ========================================
-- 9. إعدادات التخزين (Storage Buckets)
-- ========================================

-- ملاحظة: يجب إنشاء هذه البالعات من لوحة تحكم Supabase Storage
-- أو باستخدام أدوات CLI

-- Bucket: signatures (public)
-- Bucket: attachments (public)
-- Bucket: correspondence-pdfs (public)

-- ========================================
-- تم الانتهاء من إعداد قاعدة البيانات
-- ========================================