import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export default function AdvancedSearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [type, setType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchText) params.append('q', searchText);
    if (type !== 'all') params.append('type', type);
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);
    
    navigate(`/search?${params.toString()}`);
  };

  const handleReset = () => {
    setSearchText('');
    setType('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <Card className="sticky top-0 z-50 bg-card border-b shadow-sm">
      <div className="p-4 space-y-4">
        {/* شريط البحث الأساسي */}
        <div className="flex gap-3">
          <div className="flex-1 flex gap-3">
            <Input
              placeholder="ابحث في المراسلات (الرقم، الموضوع، الجهة، المحتوى)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="default" className="gap-2">
              <Search className="h-4 w-4" />
              بحث
            </Button>
          </div>
          <Button
            variant={isExpanded ? "secondary" : "outline"}
            size="default"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            بحث متقدم
          </Button>
        </div>

        {/* خيارات البحث المتقدم */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع المراسلة</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="incoming">واردة</SelectItem>
                  <SelectItem value="outgoing">صادرة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">من تاريخ</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">إلى تاريخ</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2 md:col-span-3">
              <Button onClick={handleSearch} className="gap-2 flex-1">
                <Search className="h-4 w-4" />
                تطبيق الفلاتر
              </Button>
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                مسح الفلاتر
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
