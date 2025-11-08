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
    // البحث العام في جميع الحقول
    const generalQuery = searchParams.get('q') || '';
    
    // البحث المتقدم
    const type = searchParams.get('type') || '';
    const number = searchParams.get('number') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const subject = searchParams.get('subject') || '';
    const greeting = searchParams.get('greeting') || '';
    const content = searchParams.get('content') || '';
    const responsiblePerson = searchParams.get('responsiblePerson') || '';
    const displayType = searchParams.get('displayType') || '';
    const hasSignature = searchParams.get('hasSignature') || '';
    const hasAttachments = searchParams.get('hasAttachments') || '';

    let filtered = [...correspondences];

    // البحث العام - إذا كان هناك استعلام عام
    if (generalQuery) {
      const query = generalQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.number.toLowerCase().includes(query) ||
        c.subject.toLowerCase().includes(query) ||
        c.content.toLowerCase().includes(query) ||
        c.from.toLowerCase().includes(query) ||
        (c.responsible_person && c.responsible_person.toLowerCase().includes(query)) ||
        (c.greeting && c.greeting.toLowerCase().includes(query))
      );
    }

    // البحث المتقدم - تطبيق جميع الفلاتر
    if (type && type !== 'all') {
      filtered = filtered.filter(c => c.type === type);
    }

    if (number) {
      filtered = filtered.filter(c => 
        c.number.toLowerCase().includes(number.toLowerCase())
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(c => new Date(c.date) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(c => new Date(c.date) <= new Date(dateTo));
    }

    if (from) {
      filtered = filtered.filter(c => 
        c.from.toLowerCase().includes(from.toLowerCase())
      );
    }

    if (to) {
      filtered = filtered.filter(c => 
        c.received_by_entity && c.received_by_entity.toLowerCase().includes(to.toLowerCase())
      );
    }

    if (subject) {
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(subject.toLowerCase())
      );
    }

    if (greeting) {
      filtered = filtered.filter(c => 
        c.greeting && c.greeting.toLowerCase().includes(greeting.toLowerCase())
      );
    }

    if (content) {
      filtered = filtered.filter(c => 
        c.content.toLowerCase().includes(content.toLowerCase())
      );
    }

    if (responsiblePerson) {
      filtered = filtered.filter(c => 
        c.responsible_person && c.responsible_person.toLowerCase().includes(responsiblePerson.toLowerCase())
      );
    }

    if (displayType && displayType !== 'all') {
      filtered = filtered.filter(c => c.display_type === displayType);
    }

    if (hasSignature === 'yes') {
      filtered = filtered.filter(c => c.signature_url);
    } else if (hasSignature === 'no') {
      filtered = filtered.filter(c => !c.signature_url);
    }

    if (hasAttachments === 'yes') {
      filtered = filtered.filter(c => c.attachments && c.attachments.length > 0);
    } else if (hasAttachments === 'no') {
      filtered = filtered.filter(c => !c.attachments || c.attachments.length === 0);
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
    
    const generalQuery = searchParams.get('q');
    if (generalQuery) {
      criteria.push(`بحث عام: "${generalQuery}"`);
    }

    if (searchParams.get('type') && searchParams.get('type') !== 'all') {
      criteria.push(`نوع: ${searchParams.get('type') === 'incoming' ? 'واردة' : 'صادرة'}`);
    }
    if (searchParams.get('number')) criteria.push(`رقم: ${searchParams.get('number')}`);
    if (searchParams.get('dateFrom')) criteria.push(`من تاريخ: ${searchParams.get('dateFrom')}`);
    if (searchParams.get('dateTo')) criteria.push(`إلى تاريخ: ${searchParams.get('dateTo')}`);
    if (searchParams.get('from')) criteria.push(`من: ${searchParams.get('from')}`);
    if (searchParams.get('to')) criteria.push(`إلى: ${searchParams.get('to')}`);
    if (searchParams.get('subject')) criteria.push(`موضوع: ${searchParams.get('subject')}`);
    if (searchParams.get('greeting')) criteria.push(`تحية: ${searchParams.get('greeting')}`);
    if (searchParams.get('content')) criteria.push(`محتوى: ${searchParams.get('content')}`);
    if (searchParams.get('responsiblePerson')) criteria.push(`مسؤول: ${searchParams.get('responsiblePerson')}`);
    if (searchParams.get('displayType') && searchParams.get('displayType') !== 'all') {
      const displayType = searchParams.get('displayType') === 'content' ? 'محتوى نصي' : 'مرفق فقط';
      criteria.push(`نوع العرض: ${displayType}`);
    }
    if (searchParams.get('hasSignature') === 'yes') criteria.push('يحتوي على توقيع');
    if (searchParams.get('hasSignature') === 'no') criteria.push('بدون توقيع');
    if (searchParams.get('hasAttachments') === 'yes') criteria.push('يحتوي على مرفقات');
    if (searchParams.get('hasAttachments') === 'no') criteria.push('بدون مرفقات');
    
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
