import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Archive, 
  Settings,
  Plus,
  LogOut,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { Users } from 'lucide-react';

const navigationItems = [
  { icon: Mail, label: 'البريد', path: '/incoming' },
  { icon: Send, label: 'المرسل', path: '/outgoing' },
  { icon: Download, label: 'الوارد', path: '/import' },
  { icon: Archive, label: 'الأرشيف', path: '/archive' },
];

const adminNavigationItems = [
  { icon: Settings, label: 'إنشاء حساب', path: '/settings' },
  { icon: Users, label: 'إدارة المستخدمين', path: '/users' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserName(data.full_name);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "خطأ",
        description: "فشل تسجيل الخروج",
        variant: "destructive",
      });
    } else {
      navigate('/auth');
    }
  };

  return (
    <aside className="w-64 bg-card border-l border-border h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">{userName || 'مستخدم'}</h1>
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
