import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealTimeStatistics } from '@/hooks/useRealTimeStatistics';
import { TrendingUp, Users, FileText, Activity, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function RealTimeStatsCard() {
  const { statistics, loading } = useRealTimeStatistics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>إحصائيات في الوقت الفعلي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) return null;

  const stats = [
    {
      title: 'مراسلات اليوم',
      value: statistics.today_correspondences,
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      title: 'تم الاستلام اليوم',
      value: statistics.today_received,
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: 'تعليقات اليوم',
      value: statistics.today_comments,
      icon: Activity,
      color: 'text-orange-500',
    },
    {
      title: 'جلسات نشطة',
      value: statistics.active_sessions,
      icon: Users,
      color: 'text-purple-500',
    },
    {
      title: 'متوسط الرد (ساعة)',
      value: statistics.avg_response_hours?.toFixed(1) || '-',
      icon: Clock,
      color: 'text-indigo-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          إحصائيات في الوقت الفعلي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <div className={`${stat.color}`}>
                <stat.icon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xl font-bold">{statistics.week_correspondences}</p>
            <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{statistics.month_correspondences}</p>
            <p className="text-xs text-muted-foreground">هذا الشهر</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{statistics.total_users}</p>
            <p className="text-xs text-muted-foreground">إجمالي المستخدمين</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{statistics.active_templates}</p>
            <p className="text-xs text-muted-foreground">قوالب نشطة</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}