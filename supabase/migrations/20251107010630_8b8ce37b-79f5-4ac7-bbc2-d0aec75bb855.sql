-- إضافة عمود created_by لجدول correspondences
ALTER TABLE public.correspondences
ADD COLUMN IF NOT EXISTS created_by bigint REFERENCES public.users(id);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_correspondences_created_by 
ON public.correspondences(created_by);