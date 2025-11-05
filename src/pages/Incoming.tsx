import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { mockCorrespondences } from '@/data/correspondenceData';

export default function Incoming() {
  const incomingCorrespondences = mockCorrespondences.filter(c => c.type === 'incoming');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">المراسلات الواردة</h1>
        <p className="text-muted-foreground mt-2">جميع المراسلات الواردة للجهة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المراسلات الواردة ({incomingCorrespondences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <CorrespondenceTable correspondences={incomingCorrespondences} />
        </CardContent>
      </Card>
    </div>
  );
}
