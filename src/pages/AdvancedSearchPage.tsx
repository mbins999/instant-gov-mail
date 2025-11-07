import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/Sidebar';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { useCorrespondences } from '@/hooks/useCorrespondences';

export default function AdvancedSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const { correspondences, loading } = useCorrespondences();

  const filteredResults = correspondences.filter(corr => {
    const matchesSearch = !searchTerm || 
      corr.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      corr.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      corr.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !status || corr.type === status;
    const matchesType = !type || corr.type === type;
    
    const matchesDateFrom = !dateFrom || new Date(corr.date) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(corr.date) <= new Date(dateTo);

    return matchesSearch && matchesStatus && matchesType && matchesDateFrom && matchesDateTo;
  });

  const handleReset = () => {
    setSearchTerm('');
    setStatus('');
    setType('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">البحث المتقدم</h1>
            <p className="text-muted-foreground">ابحث في المراسلات باستخدام معايير متعددة</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                معايير البحث
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">البحث النصي</label>
                  <Input
                    placeholder="ابحث في الموضوع، الرقم، أو المحتوى..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع المراسلة</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="جميع الأنواع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع الأنواع</SelectItem>
                      <SelectItem value="incoming">وارد</SelectItem>
                      <SelectItem value="outgoing">صادر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">من تاريخ</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">إلى تاريخ</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleReset}>
                  إعادة تعيين
                </Button>
                <Button>
                  <Search className="h-4 w-4 ml-2" />
                  بحث
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                نتائج البحث ({filteredResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد نتائج مطابقة لمعايير البحث</p>
                </div>
              ) : (
                <CorrespondenceTable correspondences={filteredResults} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}