import { useEffect, useState } from 'react';

export type UserRole = 'admin' | 'user' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = () => {
      try {
        const customSession = localStorage.getItem('custom_session');
        
        if (!customSession) {
          setRole(null);
          setLoading(false);
          return;
        }

        const sessionData = JSON.parse(customSession);
        setRole((sessionData.user?.role as UserRole) || 'user');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Listen for storage changes
    const handleStorageChange = () => {
      fetchUserRole();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { role, loading, isAdmin: role === 'admin' };
}
