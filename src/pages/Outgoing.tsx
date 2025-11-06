import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { useCorrespondences } from '@/hooks/useCorrespondences';

export default function Outgoing() {
  const { correspondences, loading, error, refetch } = useCorrespondences();
  const outgoingCorrespondences = correspondences.filter(c => c.type === 'outgoing');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>حدث خطأ: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">المرسل</h1>
        <p className="text-muted-foreground mt-2">جميع المراسلات الصادرة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الكتب الصادرة ({outgoingCorrespondences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {outgoingCorrespondences.length > 0 ? (
            <CorrespondenceTable correspondences={outgoingCorrespondences} onReceive={refetch} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد مراسلات صادرة حالياً
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
