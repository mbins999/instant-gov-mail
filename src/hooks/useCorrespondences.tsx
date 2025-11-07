import { useEffect, useState } from 'react';
import { getAuthenticatedSupabaseClient } from '@/lib/supabaseAuth';
import { Correspondence } from '@/types/correspondence';

export function useCorrespondences() {
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCorrespondences = async () => {
    try {
      setLoading(true);
      
      const supabase = getAuthenticatedSupabaseClient();
      
      // RLS policies will automatically filter results based on user permissions
      const { data, error } = await supabase
        .from('correspondences')
        .select(`
          *,
          received_by_user:users!received_by(
            id,
            full_name,
            username,
            entity_name
          )
        `)
        .order('date', { ascending: false });

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
