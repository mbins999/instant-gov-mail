import { Link, useLocation } from 'react-router-dom';
import { 
  Mail, 
  Send, 
  Archive, 
  Search,
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { icon: Mail, label: 'الواردة', path: '/incoming' },
  { icon: Send, label: 'الصادرة', path: '/outgoing' },
  { icon: Search, label: 'البحث', path: '/search' },
  { icon: Archive, label: 'الأرشيف', path: '/archive' },
  { icon: Settings, label: 'الربط مع النظام', path: '/api-settings' },
  { icon: Settings, label: 'الإعدادات', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-l border-border h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">نظام المراسلات</h1>
        <p className="text-sm text-muted-foreground mt-1">الحكومي الإلكتروني</p>
      </div>
      
      <nav className="p-4 space-y-2">
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
      </nav>
    </aside>
  );
}
