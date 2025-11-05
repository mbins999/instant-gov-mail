import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { mockCorrespondences } from '@/data/correspondenceData';

export default function ArchivePage() {
  const archivedCorrespondences = mockCorrespondences.filter(c => c.status === 'archived');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">الأرشيف</h1>
        <p className="text-muted-foreground mt-2">المراسلات المؤرشفة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المراسلات المؤرشفة ({archivedCorrespondences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {archivedCorrespondences.length > 0 ? (
            <CorrespondenceTable correspondences={archivedCorrespondences} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد مراسلات مؤرشفة حالياً
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
