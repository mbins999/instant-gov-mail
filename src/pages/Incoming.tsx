import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { useCorrespondences } from '@/hooks/useCorrespondences';

export default function Incoming() {
  const { correspondences, loading, error, refetch } = useCorrespondences();
  const incomingCorrespondences = correspondences.filter(c => c.type === 'incoming');

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
        <p className="text-muted-foreground mt-2">جميع المراسلات الواردة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الكتب الواردة ({incomingCorrespondences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {incomingCorrespondences.length > 0 ? (
            <CorrespondenceTable correspondences={incomingCorrespondences} onReceive={refetch} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد مراسلات واردة حالياً
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
