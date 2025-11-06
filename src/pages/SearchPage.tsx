import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { useCorrespondences } from '@/hooks/useCorrespondences';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const { correspondences, loading } = useCorrespondences();
  const [results, setResults] = useState(correspondences);

  useEffect(() => {
    const number = searchParams.get('number') || '';
    const entity = searchParams.get('entity') || '';
    const type = searchParams.get('type') || 'all';
    const subject = searchParams.get('subject') || '';
    const content = searchParams.get('content') || '';
    const responsible = searchParams.get('responsible') || '';
    const dateFrom = searchParams.get('from') || '';
    const dateTo = searchParams.get('to') || '';

    let filtered = [...correspondences];

    // فلتر رقم الكتاب
    if (number) {
      filtered = filtered.filter(c => 
        c.number.toLowerCase().includes(number.toLowerCase())
      );
    }

    // فلتر الجهة
    if (entity) {
      filtered = filtered.filter(c => 
        c.from.toLowerCase().includes(entity.toLowerCase())
      );
    }

    // فلتر النوع
    if (type !== 'all') {
      filtered = filtered.filter(c => c.type === type);
    }

    // فلتر الموضوع
    if (subject) {
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(subject.toLowerCase())
      );
    }

    // فلتر المحتوى
    if (content) {
      filtered = filtered.filter(c => 
        c.content.toLowerCase().includes(content.toLowerCase())
      );
    }

    // فلتر المسؤول
    if (responsible) {
      filtered = filtered.filter(c => 
        c.responsible_person && c.responsible_person.toLowerCase().includes(responsible.toLowerCase())
      );
    }

    // فلتر التاريخ
    if (dateFrom) {
      filtered = filtered.filter(c => new Date(c.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(c => new Date(c.date) <= new Date(dateTo));
    }

    setResults(filtered);
  }, [searchParams, correspondences]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getSearchCriteria = () => {
    const criteria = [];
    if (searchParams.get('number')) criteria.push(`رقم: ${searchParams.get('number')}`);
    if (searchParams.get('entity')) criteria.push(`جهة: ${searchParams.get('entity')}`);
    if (searchParams.get('type') && searchParams.get('type') !== 'all') {
      criteria.push(`نوع: ${searchParams.get('type') === 'incoming' ? 'واردة' : 'صادرة'}`);
    }
    if (searchParams.get('subject')) criteria.push(`موضوع: ${searchParams.get('subject')}`);
    if (searchParams.get('content')) criteria.push(`محتوى: ${searchParams.get('content')}`);
    if (searchParams.get('responsible')) criteria.push(`مسؤول: ${searchParams.get('responsible')}`);
    if (searchParams.get('from')) criteria.push(`من: ${searchParams.get('from')}`);
    if (searchParams.get('to')) criteria.push(`إلى: ${searchParams.get('to')}`);
    return criteria;
  };

  const searchCriteria = getSearchCriteria();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">نتائج البحث</h1>
        {searchCriteria.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-muted-foreground">معايير البحث:</span>
            {searchCriteria.map((criterion, index) => (
              <span key={index} className="px-2 py-1 bg-secondary rounded-md text-sm">
                {criterion}
              </span>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>النتائج ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <CorrespondenceTable correspondences={results} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد نتائج مطابقة لمعايير البحث
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
