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
      const { data, error } = await supabase
        .from('correspondences')
        .select(`
          *,
          received_by_profile:profiles!received_by(
            full_name,
            email
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      // تحويل from_entity إلى from
      const transformedData = (data || []).map(item => ({
        ...item,
        from: item.from_entity,
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
