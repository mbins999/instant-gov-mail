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
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

const navigationItems = [
  { icon: Mail, label: 'البريد', path: '/incoming' },
  { icon: Send, label: 'المرسل', path: '/sent' },
  { icon: Download, label: 'الوارد الخارجي', path: '/outgoing' },
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
      try {
        const customSession = localStorage.getItem('custom_session');
        if (customSession) {
          const sessionData = JSON.parse(customSession);
          setUserName(sessionData.user?.full_name || sessionData.user?.username || 'مستخدم');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserName('مستخدم');
      }
    };

    fetchUserProfile();

    const handleStorageChange = () => {
      fetchUserProfile();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('custom_session');
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل الخروج بنجاح",
    });
    navigate('/auth');
  };

  return (
    <aside className="w-64 bg-card border-l border-border h-screen sticky top-0 flex flex-col">
      {/* User name and new correspondence button section */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="text-right">
          <h2 className="text-lg font-bold text-primary">{userName}</h2>
        </div>
        <Button
          onClick={() => navigate('/new')}
          className="w-full justify-center gap-2"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          <span>كتاب جديد</span>
        </Button>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
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
