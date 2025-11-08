import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AdvancedSearchForm from '@/components/AdvancedSearchForm';

export default function TopBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const navigate = useNavigate();

  const handleSimpleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // بحث عام في جميع الحقول
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="border-b border-border bg-card sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Theme Toggle - Right */}
          <ThemeToggle />
          
          {/* Search bar - Center */}
          <form onSubmit={handleSimpleSearch} className="flex-1 max-w-2xl">
            <div className="relative flex gap-2">
              <Input
                type="text"
                placeholder="بحث عام في المراسلات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-right"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute left-12 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <Search className="h-4 w-4" />
              </Button>
              
              {/* زر البحث المتقدم */}
              <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    title="بحث متقدم"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>البحث المتقدم</DialogTitle>
                  </DialogHeader>
                  <AdvancedSearchForm onClose={() => setIsAdvancedOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
