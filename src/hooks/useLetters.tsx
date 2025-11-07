import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Letter {
  id: number;
  ref_no: string;
  subject: string;
  body: string;
  greeting: string;
  sender_org_id: number;
  recipient_org_id?: number;
  status: string;
  created_by: number;
  received_by?: number;
  received_at?: string;
  signature_url?: string;
  pdf_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  sender_org?: {
    id: number;
    code: string;
    name: string;
  };
  recipient_org?: {
    id: number;
    code: string;
    name: string;
  };
  creator?: {
    id: number;
    username: string;
    full_name: string;
  };
  receiver?: {
    id: number;
    username: string;
    full_name: string;
  };
}

export const useLetters = () => {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      setError(null);

      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        throw new Error('User not authenticated');
      }

      const currentUser = JSON.parse(userStr);
      const isAdmin = currentUser.role === 'admin';

      let query = supabase
        .from('letters')
        .select(`
          *,
          sender_org:organizations!letters_sender_org_id_fkey(id, code, name),
          recipient_org:organizations!letters_recipient_org_id_fkey(id, code, name),
          creator:users!letters_created_by_fkey(id, username, full_name),
          receiver:users!letters_received_by_fkey(id, username, full_name)
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin && currentUser.organization_id) {
        query = query.or(`sender_org_id.eq.${currentUser.organization_id},recipient_org_id.eq.${currentUser.organization_id}`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setLetters((data as any) || []);
    } catch (err) {
      console.error('Error fetching letters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch letters');
      toast.error('فشل في تحميل المراسلات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  const refetch = () => {
    fetchLetters();
  };

  return { letters, loading, error, refetch };
};
