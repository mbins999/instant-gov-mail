import { Mail, Send, Archive } from 'lucide-react';
import StatCard from '@/components/StatCard';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCorrespondences } from '@/hooks/useCorrespondences';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { correspondences, loading, error } = useCorrespondences();
  const [userEntity, setUserEntity] = useState<string>('');
  
  useEffect(() => {
    const userSession = localStorage.getItem('user_session');
    if (userSession) {
      const userData = JSON.parse(userSession);
      setUserEntity(userData.entity_name || '');
    }
  }, []);
  
  const recentCorrespondences = correspondences.slice(0, 5);
  const incomingCount = correspondences.filter(c => 
    c.type === 'outgoing' && 
    c.received_by_entity === userEntity
  ).length;
  const outgoingCount = correspondences.filter(c => 
    c.type === 'outgoing' && 
    c.from_entity === userEntity
  ).length;
  const totalCount = correspondences.length;

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
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-2">نظرة عامة على المراسلات</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="إجمالي المراسلات"
          value={totalCount}
          icon={Archive}
          variant="primary"
        />
        <StatCard
          title="الواردة"
          value={incomingCount}
          icon={Mail}
          variant="success"
        />
        <StatCard
          title="الصادرة"
          value={outgoingCount}
          icon={Send}
          variant="default"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>أحدث المراسلات</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCorrespondences.length > 0 ? (
            <CorrespondenceTable correspondences={recentCorrespondences} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد مراسلات بعد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
