-- إضافة حقل archived للمراسلات
ALTER TABLE public.correspondences 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;