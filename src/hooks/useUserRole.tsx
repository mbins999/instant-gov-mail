import { useEffect, useState } from 'react';

export type UserRole = 'admin' | 'user' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = () => {
      try {
        const userData = localStorage.getItem('auth_user');
        
        if (!userData) {
          setRole(null);
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        setRole(user.role || 'user');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { role, loading, isAdmin: role === 'admin' };
}