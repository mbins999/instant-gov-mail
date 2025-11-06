import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { mockCorrespondences } from '@/data/correspondenceData';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(mockCorrespondences);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setResults(mockCorrespondences);
      return;
    }

    const filtered = mockCorrespondences.filter(c => 
      c.subject.includes(searchTerm) ||
      c.from.includes(searchTerm) ||
      c.recipient.includes(searchTerm) ||
      c.number.includes(searchTerm) ||
      c.content.includes(searchTerm)
    );
    
    setResults(filtered);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">البحث في المراسلات</h1>
        <p className="text-muted-foreground mt-2">ابحث عن المراسلات بالرقم أو الموضوع أو الجهة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البحث</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="ابحث بالرقم، الموضوع، الجهة المرسلة أو المستقبلة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>نتائج البحث ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <CorrespondenceTable correspondences={results} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد نتائج مطابقة للبحث
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
