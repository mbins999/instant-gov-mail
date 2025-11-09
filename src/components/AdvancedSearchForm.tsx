import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAuthenticatedSupabaseClient } from '@/lib/supabaseAuth';

interface Entity {
  id: string;
  name: string;
  type: 'sender' | 'receiver' | 'both';
}

interface AdvancedSearchFormProps {
  onClose?: () => void;
}

export default function AdvancedSearchForm({ onClose }: AdvancedSearchFormProps) {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<Entity[]>([]);
  
  // جميع حقول البحث المتقدم
  const [searchData, setSearchData] = useState({
    type: 'all',
    number: '',
    dateFrom: '',
    dateTo: '',
    from: 'all',
    to: 'all',
    subject: '',
    greeting: '',
    content: '',
    responsiblePerson: '',
    displayType: 'all',
    hasSignature: 'all',
    hasAttachments: 'all',
  });

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
    
    // إضافة جميع المعايير غير الفارغة
    if (searchData.type !== 'all') params.append('type', searchData.type);
    if (searchData.number) params.append('number', searchData.number);
    if (searchData.dateFrom) params.append('dateFrom', searchData.dateFrom);
    if (searchData.dateTo) params.append('dateTo', searchData.dateTo);
    if (searchData.from !== 'all') params.append('from', searchData.from);
    if (searchData.to !== 'all') params.append('to', searchData.to);
    if (searchData.subject) params.append('subject', searchData.subject);
    if (searchData.greeting) params.append('greeting', searchData.greeting);
    if (searchData.content) params.append('content', searchData.content);
    if (searchData.responsiblePerson) params.append('responsiblePerson', searchData.responsiblePerson);
    if (searchData.displayType !== 'all') params.append('displayType', searchData.displayType);
    if (searchData.hasSignature !== 'all') params.append('hasSignature', searchData.hasSignature);
    if (searchData.hasAttachments !== 'all') params.append('hasAttachments', searchData.hasAttachments);
    
    navigate(`/search?${params.toString()}`);
    onClose?.();
  };

  const handleReset = () => {
    setSearchData({
      type: 'all',
      number: '',
      dateFrom: '',
      dateTo: '',
      from: 'all',
      to: 'all',
      subject: '',
      greeting: '',
      content: '',
      responsiblePerson: '',
      displayType: 'all',
      hasSignature: 'all',
      hasAttachments: 'all',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* نوع المراسلة */}
        <div className="space-y-2">
          <Label>نوع المراسلة</Label>
          <Select 
            value={searchData.type} 
            onValueChange={(value) => setSearchData({ ...searchData, type: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="incoming">واردة</SelectItem>
              <SelectItem value="outgoing">صادرة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* رقم الكتاب */}
        <div className="space-y-2">
          <Label>رقم الكتاب</Label>
          <Input
            value={searchData.number}
            onChange={(e) => setSearchData({ ...searchData, number: e.target.value })}
          />
        </div>

        {/* من تاريخ */}
        <div className="space-y-2">
          <Label>من تاريخ</Label>
          <Input
            type="date"
            value={searchData.dateFrom}
            onChange={(e) => setSearchData({ ...searchData, dateFrom: e.target.value })}
          />
        </div>

        {/* إلى تاريخ */}
        <div className="space-y-2">
          <Label>إلى تاريخ</Label>
          <Input
            type="date"
            value={searchData.dateTo}
            onChange={(e) => setSearchData({ ...searchData, dateTo: e.target.value })}
          />
        </div>

        {/* من (الجهة المرسلة) */}
        <div className="space-y-2">
          <Label>من (الجهة المرسلة)</Label>
          <Select 
            value={searchData.from} 
            onValueChange={(value) => setSearchData({ ...searchData, from: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">الكل</SelectItem>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.name}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* إلى (الجهة المستقبلة) */}
        <div className="space-y-2">
          <Label>إلى (الجهة المستقبلة)</Label>
          <Select 
            value={searchData.to} 
            onValueChange={(value) => setSearchData({ ...searchData, to: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">الكل</SelectItem>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.name}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* الموضوع */}
        <div className="space-y-2 md:col-span-2 lg:col-span-3">
          <Label>الموضوع</Label>
          <Input
            value={searchData.subject}
            onChange={(e) => setSearchData({ ...searchData, subject: e.target.value })}
          />
        </div>

        {/* التحية */}
        <div className="space-y-2 md:col-span-2 lg:col-span-3">
          <Label>التحية</Label>
          <Input
            value={searchData.greeting}
            onChange={(e) => setSearchData({ ...searchData, greeting: e.target.value })}
          />
        </div>

        {/* المحتوى */}
        <div className="space-y-2 md:col-span-2 lg:col-span-3">
          <Label>المحتوى</Label>
          <Textarea
            value={searchData.content}
            onChange={(e) => setSearchData({ ...searchData, content: e.target.value })}
            rows={3}
          />
        </div>

        {/* المسؤول */}
        <div className="space-y-2">
          <Label>اسم المسؤول</Label>
          <Input
            value={searchData.responsiblePerson}
            onChange={(e) => setSearchData({ ...searchData, responsiblePerson: e.target.value })}
          />
        </div>

        {/* نوع العرض */}
        <div className="space-y-2">
          <Label>نوع العرض</Label>
          <Select 
            value={searchData.displayType} 
            onValueChange={(value) => setSearchData({ ...searchData, displayType: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="content">محتوى نصي</SelectItem>
              <SelectItem value="attachment_only">مرفق فقط</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* وجود توقيع */}
        <div className="space-y-2">
          <Label>وجود توقيع</Label>
          <Select 
            value={searchData.hasSignature} 
            onValueChange={(value) => setSearchData({ ...searchData, hasSignature: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="yes">يحتوي على توقيع</SelectItem>
              <SelectItem value="no">بدون توقيع</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* وجود مرفقات */}
        <div className="space-y-2">
          <Label>وجود مرفقات</Label>
          <Select 
            value={searchData.hasAttachments} 
            onValueChange={(value) => setSearchData({ ...searchData, hasAttachments: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="yes">يحتوي على مرفقات</SelectItem>
              <SelectItem value="no">بدون مرفقات</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* أزرار البحث */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button onClick={handleReset} variant="outline" className="gap-2">
          <X className="h-4 w-4" />
          مسح الكل
        </Button>
        <Button onClick={handleSearch} className="gap-2">
          <Search className="h-4 w-4" />
          بحث
        </Button>
      </div>
    </div>
  );
}