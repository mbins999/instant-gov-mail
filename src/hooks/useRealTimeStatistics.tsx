import { useEffect, useState } from 'react';
import { getAuthenticatedSupabaseClient } from '@/lib/supabaseAuth';

interface RealTimeStatistics {
  today_correspondences: number;
  today_received: number;
  today_comments: number;
  today_logins: number;
  week_correspondences: number;
  week_new_users: number;
  month_correspondences: number;
  total_correspondences: number;
  total_users: number;
  total_entities: number;
  active_templates: number;
  avg_response_hours: number | null;
  active_sessions: number;
  unread_notifications: number;
}

export function useRealTimeStatistics() {
  const [statistics, setStatistics] = useState<RealTimeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const supabase = getAuthenticatedSupabaseClient();
      
      const { data, error } = await supabase
        .from('real_time_statistics')
        .select('*')
        .single();

      if (error) throw error;

      setStatistics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();

    // تحديث الإحصائيات كل 30 ثانية
    const interval = setInterval(fetchStatistics, 30000);

    return () => clearInterval(interval);
  }, []);

  return { statistics, loading, error, refetch: fetchStatistics };
}