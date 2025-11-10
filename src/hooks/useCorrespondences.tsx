import { useEffect, useState } from 'react';
import { clickhouseApi } from '@/lib/clickhouseClient';
import { Correspondence } from '@/types/correspondence';

export function useCorrespondences() {
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCorrespondences = async () => {
    try {
      setLoading(true);
      
      const data = await clickhouseApi.listCorrespondences();

      setCorrespondences(data as any);
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
