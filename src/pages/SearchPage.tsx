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
    const searchText = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const dateFrom = searchParams.get('from') || '';
    const dateTo = searchParams.get('to') || '';

    let filtered = [...correspondences];

    // فلتر النص
    if (searchText) {
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(searchText.toLowerCase()) ||
        c.from.toLowerCase().includes(searchText.toLowerCase()) ||
        c.number.toLowerCase().includes(searchText.toLowerCase()) ||
        c.content.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // فلتر النوع
    if (type !== 'all') {
      filtered = filtered.filter(c => c.type === type);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">نتائج البحث</h1>
        <p className="text-muted-foreground mt-2">
          {searchParams.get('q') && `نتائج البحث عن: "${searchParams.get('q')}"`}
        </p>
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
