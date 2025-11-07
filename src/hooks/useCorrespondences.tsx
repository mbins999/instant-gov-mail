import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Correspondence } from '@/types/correspondence';

export function useCorrespondences() {
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCorrespondences = async () => {
    try {
      setLoading(true);
      
      // الحصول على بيانات المستخدم الحالي
      const currentUserStr = localStorage.getItem('auth_user');
      if (!currentUserStr) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      
      const currentUser = JSON.parse(currentUserStr);
      const userId = parseInt(currentUser.id);
      
      // التحقق من دور المستخدم
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const isAdmin = roleData?.role === 'admin';
      
      // بناء الاستعلام
      let query = supabase
        .from('correspondences')
        .select(`
          *,
          received_by_user:users!received_by(
            id,
            full_name,
            username,
            entity_name
          )
        `);
      
      // إذا لم يكن مدير، اعرض فقط المراسلات الخاصة به
      if (!isAdmin) {
        query = query.eq('created_by', userId);
      }
      
      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      // تحويل from_entity إلى from
      const transformedData = (data || []).map(item => ({
        ...item,
        from: item.from_entity,
        greeting: item.greeting,
        responsible_person: item.responsible_person,
        signature_url: item.signature_url,
        display_type: item.display_type,
      }));

      setCorrespondences(transformedData as any);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrespondences();
  }, []);

  return { correspondences, loading, error, refetch: fetchCorrespondences };
}
