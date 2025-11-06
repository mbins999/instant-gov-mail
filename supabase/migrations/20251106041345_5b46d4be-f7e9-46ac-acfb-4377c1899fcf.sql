-- إضافة حقل username إلى جدول profiles
ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;

-- إنشاء index على username لتسريع البحث
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- تحديث السياسات
CREATE POLICY "Public can view usernames"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);