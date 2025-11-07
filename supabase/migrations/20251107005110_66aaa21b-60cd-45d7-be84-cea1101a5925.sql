-- تحديث policies لجدول entities لتسمح بالوصول بدون Supabase Auth
DROP POLICY IF EXISTS "Admins can delete entities" ON public.entities;
DROP POLICY IF EXISTS "Admins can insert entities" ON public.entities;
DROP POLICY IF EXISTS "Admins can update entities" ON public.entities;
DROP POLICY IF EXISTS "Authenticated users can view entities" ON public.entities;

-- السماح للجميع بجميع العمليات على entities (لأن التحقق من الصلاحيات يتم في التطبيق)
CREATE POLICY "Allow all operations on entities"
ON public.entities
FOR ALL
USING (true)
WITH CHECK (true);

-- تحديث policies لجدول correspondences لتسمح بالوصول بدون Supabase Auth
DROP POLICY IF EXISTS "Authenticated users can create correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Authenticated users can update correspondences" ON public.correspondences;
DROP POLICY IF EXISTS "Authenticated users can view correspondences" ON public.correspondences;

-- السماح للجميع بجميع العمليات على correspondences
CREATE POLICY "Allow all operations on correspondences"
ON public.correspondences
FOR ALL
USING (true)
WITH CHECK (true);