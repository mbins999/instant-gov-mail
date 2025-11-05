import { Mail, Send, Archive, Clock } from 'lucide-react';
import StatCard from '@/components/StatCard';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { mockCorrespondences } from '@/data/correspondenceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const recentCorrespondences = mockCorrespondences.slice(0, 5);
  const incomingCount = mockCorrespondences.filter(c => c.type === 'incoming').length;
  const outgoingCount = mockCorrespondences.filter(c => c.type === 'outgoing').length;
  const pendingCount = mockCorrespondences.filter(c => c.status === 'pending').length;
  const totalCount = mockCorrespondences.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-2">نظرة عامة على المراسلات</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <StatCard
          title="قيد الانتظار"
          value={pendingCount}
          icon={Clock}
          variant="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>أحدث المراسلات</CardTitle>
        </CardHeader>
        <CardContent>
          <CorrespondenceTable correspondences={recentCorrespondences} />
        </CardContent>
      </Card>
    </div>
  );
}
