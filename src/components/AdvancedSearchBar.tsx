import { useState, useEffect } from 'react';
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
import { getAuthenticatedSupabaseClient } from '@/lib/supabaseAuth';

interface Entity {
  id: string;
  name: string;
  type: 'sender' | 'receiver' | 'both';
}

export default function AdvancedSearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  
  // حقول البحث
  const [number, setNumber] = useState('');
  const [entity, setEntity] = useState('all');
  const [type, setType] = useState<string>('all');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const supabase = getAuthenticatedSupabaseClient();
        const { data, error } = await supabase
          .from('entities')
          .select('*')
          .order('name');

        if (error) throw error;
        setEntities((data || []) as Entity[]);
      } catch (error) {
        console.error('Error fetching entities:', error);
      }
    };

    fetchEntities();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (number) params.append('number', number);
    if (entity !== 'all') params.append('entity', entity);
    if (type !== 'all') params.append('type', type);
    if (subject) params.append('subject', subject);
    if (content) params.append('content', content);
    if (responsiblePerson) params.append('responsible', responsiblePerson);
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);
    
    navigate(`/search?${params.toString()}`);
  };

  const handleReset = () => {
    setNumber('');
    setEntity('all');
    setType('all');
    setSubject('');
    setContent('');
    setResponsiblePerson('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <Card className="sticky top-0 z-50 bg-card border-b shadow-sm">
      <div className="p-4 space-y-4">
        {/* شريط البحث السريع */}
        <div className="flex gap-3">
          <Button
            variant={isExpanded ? "secondary" : "default"}
            size="default"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            بحث متقدم
          </Button>
          {!isExpanded && (
            <Button onClick={handleSearch} variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              بحث
            </Button>
          )}
        </div>

        {/* خيارات البحث المتقدم */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">رقم الكتاب</label>
              <Input
                placeholder="أدخل رقم الكتاب"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الجهة</label>
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر الجهة" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">الكل</SelectItem>
                  {entities.map((ent) => (
                    <SelectItem key={ent.id} value={ent.name}>
                      {ent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">نوع المراسلة</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="incoming">واردة</SelectItem>
                  <SelectItem value="outgoing">صادرة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الموضوع</label>
              <Input
                placeholder="ابحث في الموضوع"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">المحتوى</label>
              <Input
                placeholder="ابحث في المحتوى"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">المسؤول</label>
              <Input
                placeholder="اسم المسؤول"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
              />
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

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="gap-2 flex-1">
                <Search className="h-4 w-4" />
                بحث
              </Button>
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                مسح
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
