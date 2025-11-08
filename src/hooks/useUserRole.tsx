import { useEffect, useState } from 'react';

export type UserRole = 'admin' | 'user' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = () => {
      try {
        const userSession = localStorage.getItem('user_session');
        
        if (!userSession) {
          setRole(null);
          setLoading(false);
          return;
        }

        const userData = JSON.parse(userSession);
        setRole((userData.role as UserRole) || 'user');
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
