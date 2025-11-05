import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { mockCorrespondences } from '@/data/correspondenceData';

export default function Outgoing() {
  const outgoingCorrespondences = mockCorrespondences.filter(c => c.type === 'outgoing');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">المراسلات الصادرة</h1>
        <p className="text-muted-foreground mt-2">جميع المراسلات الصادرة من الجهة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المراسلات الصادرة ({outgoingCorrespondences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <CorrespondenceTable correspondences={outgoingCorrespondences} />
        </CardContent>
      </Card>
    </div>
  );
}
