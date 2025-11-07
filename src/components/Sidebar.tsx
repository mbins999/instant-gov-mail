import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Archive, 
  Plus,
  LogOut,
  Download,
  Users,
  Activity,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import NotificationBell from './NotificationBell';

const navigationItems = [
  { icon: Mail, label: 'البريد', path: '/incoming' },
  { icon: Send, label: 'المرسل', path: '/outgoing' },
  { icon: Download, label: 'الوارد', path: '/import' },
  { icon: Search, label: 'بحث متقدم', path: '/advanced-search' },
  { icon: Archive, label: 'الأرشيف', path: '/archive' },
];

const adminNavigationItems = [
  { icon: Activity, label: 'المراقبة', path: '/monitoring' },
  { icon: Users, label: 'إدارة', path: '/users' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserProfile = () => {
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserName(user.full_name || user.username);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل الخروج بنجاح",
    });
    navigate('/auth');
  };

  return (
    <aside className="w-64 bg-card border-l border-border h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">{userName || 'مستخدم'}</h1>
        <NotificationBell />
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        <Link to="/new" className="flex justify-center mb-6">
          <Plus className="h-12 w-12 text-primary hover:opacity-80 transition-opacity cursor-pointer" />
        </Link>
        
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {isAdmin && (
          <>
            <div className="my-4 border-t border-border" />
            {adminNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </aside>
  );
}
