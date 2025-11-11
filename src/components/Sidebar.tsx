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
  BarChart3,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

const navigationItems = [
  { icon: Mail, label: 'البريد', path: '/incoming' },
  { icon: Send, label: 'المرسل', path: '/sent' },
  { icon: Download, label: 'الوارد الخارجي', path: '/outgoing' },
  { icon: Archive, label: 'الأرشيف', path: '/archive' },
  { icon: BarChart3, label: 'التقارير', path: '/reports' },
];

const adminNavigationItems = [
  { icon: Users, label: 'إدارة المستخدمين', path: '/users' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isModerator } = useUserRole();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const fetchUserProfile = () => {
      try {
        const userSession = localStorage.getItem('user_session');
        if (userSession) {
          const userData = JSON.parse(userSession);
          setUserName(userData.full_name || userData.username || 'مستخدم');
          setUserRole(userData.role || '');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserName('مستخدم');
        setUserRole('');
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
    localStorage.removeItem('user_session');
    localStorage.removeItem('session_token');
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
        <div className="text-right space-y-1">
          <h2 className="text-lg font-bold text-primary">{userName}</h2>
          {isAdmin && (
            <Badge variant="default" className="gap-1">
              <Shield className="h-3 w-3" />
              <span>مدير</span>
            </Badge>
          )}
          {isModerator && (
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              <span>مسؤول</span>
            </Badge>
          )}
        </div>
        <Button
          onClick={() => {
            console.log('كتاب جديد button clicked, navigating to /new');
            navigate('/new');
          }}
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
        
        {(isAdmin || isModerator) && (
          <>
            <div className="my-4 border-t border-border" />
            <Link
              to="/users"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                location.pathname === '/users'
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary text-foreground"
              )}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">
                {isAdmin ? 'إدارة المستخدمين' : 'إدارة الجهات'}
              </span>
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border flex justify-center">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </aside>
  );
}
