import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/advanced-search?q=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/advanced-search');
    }
  };

  return (
    <div className="border-b border-border bg-card sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* User name - Left side */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary">{userName}</h1>
          </div>

          {/* Search bar - Center */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث في المراسلات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-right"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Empty right side for balance */}
          <div className="flex-1"></div>
        </div>
      </div>
    </div>
  );
}
