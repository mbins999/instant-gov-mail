import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق من التوكن في localStorage
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // إنشاء كائن user متوافق مع النوع المتوقع
        setUser({
          id: parsedUser.id,
          email: parsedUser.username + '@correspondence.local',
          user_metadata: parsedUser
        } as User);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
