import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { useCorrespondences } from '@/hooks/useCorrespondences';
import { useState, useEffect } from 'react';

export default function Incoming() {
  const { correspondences, loading, error, refetch } = useCorrespondences();
  const [userEntity, setUserEntity] = useState<string>('');
  
  useEffect(() => {
    const userSession = localStorage.getItem('user_session');
    if (userSession) {
      const userData = JSON.parse(userSession);
      setUserEntity(userData.entity_name || '');
    }
  }, []);
  
  // البريد: الكتب الموجهة لجهة المستخدم فقط (غير المؤرشفة وغير المسودات)
  const incomingCorrespondences = (correspondences as any[]).filter((c: any) => 
    c.type === 'outgoing' &&
    c.received_by_entity &&
    c.received_by_entity === userEntity &&
    c.archived !== true &&
    c.status !== 'draft'
  );

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
