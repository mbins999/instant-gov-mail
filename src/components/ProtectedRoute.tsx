import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { clickhouseApi } from '@/lib/clickhouseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const sessionToken = localStorage.getItem('session_token');
      
      if (!sessionToken) {
        setIsAuthenticated(false);
        return;
      }

      // التحقق من صحة الجلسة من جانب الخادم
      try {
        const data = await clickhouseApi.verifySession(sessionToken);

        if (!data) {
          console.error('Invalid session');
          localStorage.removeItem('session_token');
          localStorage.removeItem('user_session');
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error verifying session:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
