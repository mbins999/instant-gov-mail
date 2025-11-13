import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Incoming() {
  const [correspondences, setCorrespondences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchIncomingCorrespondences = async () => {
    try {
      setLoading(true);
      
      // Get current user entity
      const userSession = localStorage.getItem('user_session');
      if (!userSession) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على بيانات المستخدم",
          variant: "destructive",
        });
        return;
      }

      const userData = JSON.parse(userSession);
      const userEntity = userData.entity_name || '';

      // Fetch correspondences from ClickHouse
      const { clickhouseApi } = await import('@/lib/clickhouseClient');
      const allData = await clickhouseApi.listCorrespondences();
      
      // Filter for incoming: type=outgoing, received_by_entity=userEntity, not archived, not draft
      const incomingCorrespondences = allData.filter((c: any) => 
        c.type === 'outgoing' &&
        c.received_by_entity &&
        c.received_by_entity === userEntity &&
        c.archived !== true &&
        c.status !== 'draft'
      );

      setCorrespondences(incomingCorrespondences || []);
    } catch (error) {
      console.error('Error fetching incoming correspondences:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المراسلات الواردة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchIncomingCorrespondences();
  }, []);
  
  const incomingCorrespondences = correspondences;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <CorrespondenceTable correspondences={incomingCorrespondences} onReceive={fetchIncomingCorrespondences} />
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
