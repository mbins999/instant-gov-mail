import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { useCorrespondences } from '@/hooks/useCorrespondences';
import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

export default function ArchivePage() {
  const { correspondences, loading, error, refetch } = useCorrespondences();
  const [userEntity, setUserEntity] = useState<string>('');
  
  useEffect(() => {
    const userSession = localStorage.getItem('user_session');
    if (userSession) {
      const userData = JSON.parse(userSession);
      setUserEntity(userData.entity_name || '');
    }
  }, []);
  
  // في المستقبل سنضيف حقل archived في قاعدة البيانات
  // حالياً نعرض فقط رسالة أن الأرشيف فارغ
  const archivedCorrespondences: any[] = [];

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
          <CardTitle>المراسلات المؤرشفة ({archivedCorrespondences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مراسلات مؤرشفة</h3>
            <p className="text-muted-foreground">
              سيتم إضافة ميزة الأرشفة قريباً
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
