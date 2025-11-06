-- إضافة حقل اسم الجهة إلى جدول profiles
ALTER TABLE public.profiles 
ADD COLUMN entity_name TEXT;

-- إنشاء فهرس للبحث السريع عن الجهات
CREATE INDEX idx_profiles_entity_name ON public.profiles(entity_name);

-- إضافة حقل للمراسلات لتحديد المستلم
ALTER TABLE public.correspondences
ADD COLUMN received_by_entity TEXT;