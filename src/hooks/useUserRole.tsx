import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const sessionToken = localStorage.getItem('session_token');
        
        if (!sessionToken) {
          setRole(null);
          setLoading(false);
          return;
        }

        // التحقق من الجلسة من جانب الخادم
        const { data, error } = await supabase.functions.invoke('verify-session', {
          body: { sessionToken }
        });

        if (error || !data) {
          console.error('Error verifying session:', error);
          // إذا كانت الجلسة غير صالحة، نحذف البيانات المحلية
          localStorage.removeItem('session_token');
          localStorage.removeItem('user_session');
          setRole(null);
          setLoading(false);
          return;
        }

        // تحديث معلومات المستخدم في localStorage (للعرض فقط)
        localStorage.setItem('user_session', JSON.stringify({
          id: data.userId,
          username: data.username,
          full_name: data.fullName,
          entity_name: data.entityName,
          role: data.role
        }));

        setRole((data.role as UserRole) || 'user');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // التحقق من الجلسة عند تغيير التخزين
    const handleStorageChange = () => {
      fetchUserRole();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { role, loading, isAdmin: role === 'admin' };
}
