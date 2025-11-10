import { useEffect, useState } from 'react';
import { clickhouseApi } from '@/lib/clickhouseClient';

export type UserRole = 'admin' | 'moderator' | 'user' | null;

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
        const data = await clickhouseApi.verifySession(sessionToken);

        if (!data || !data.valid) {
          console.error('Invalid session');
          // إذا كانت الجلسة غير صالحة، نحذف البيانات المحلية
          localStorage.removeItem('session_token');
          localStorage.removeItem('user_session');
          setRole(null);
          setLoading(false);
          return;
        }

        // تحديث معلومات المستخدم في localStorage (للعرض فقط)
        localStorage.setItem('user_session', JSON.stringify({
          id: data.user.id,
          username: data.user.username,
          full_name: data.user.full_name,
          entity_name: data.user.entity_name,
          role: data.user.role
        }));

        setRole((data.user.role as UserRole) || 'user');
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

  return { 
    role, 
    loading, 
    isAdmin: role === 'admin',
    isManager: role === 'moderator'
  };
}
