-- إنشاء جدول profiles للمستخدمين
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان: الجميع يمكنهم قراءة الملفات الشخصية
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- المستخدمون يمكنهم تحديث ملفاتهم الشخصية فقط
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- إنشاء جدول correspondences
CREATE TABLE public.correspondences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('incoming', 'outgoing')),
  subject TEXT NOT NULL,
  from_entity TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  content TEXT NOT NULL,
  attachments TEXT[],
  notes TEXT,
  received_by UUID REFERENCES public.profiles(id),
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل RLS
ALTER TABLE public.correspondences ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان: المستخدمون المصادق عليهم يمكنهم قراءة جميع المراسلات
CREATE POLICY "Authenticated users can view correspondences"
  ON public.correspondences
  FOR SELECT
  TO authenticated
  USING (true);

-- المستخدمون المصادق عليهم يمكنهم إنشاء مراسلات
CREATE POLICY "Authenticated users can create correspondences"
  ON public.correspondences
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- المستخدمون المصادق عليهم يمكنهم تحديث المراسلات
CREATE POLICY "Authenticated users can update correspondences"
  ON public.correspondences
  FOR UPDATE
  TO authenticated
  USING (true);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_correspondences_updated_at
  BEFORE UPDATE ON public.correspondences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();