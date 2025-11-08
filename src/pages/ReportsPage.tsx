import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ReportsPage() {
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [userPerformance, setUserPerformance] = useState<any[]>([]);
  const [entityStats, setEntityStats] = useState<any[]>([]);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // جلب الإحصائيات الشهرية
      const { data: monthly } = await supabase
        .from('correspondence_statistics')
        .select('*')
        .limit(12);
      setMonthlyStats(monthly || []);

      // جلب أداء المستخدمين
      const { data: users } = await supabase
        .from('user_performance')
        .select('*')
        .order('total_correspondences', { ascending: false })
        .limit(20);
      setUserPerformance(users || []);

      // جلب إحصائيات الجهات
      const { data: entities } = await supabase
        .from('entity_statistics')
        .select('*')
        .order('total_correspondences', { ascending: false });
      setEntityStats(entities || []);

      // جلب النشاط اليومي
      const { data: daily } = await supabase
        .from('daily_activity')
        .select('*')
        .limit(parseInt(selectedPeriod));
      setDailyActivity(daily || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-EG').format(num);
  };

  const calculateTotalCorrespondences = () => {
    return monthlyStats.reduce((sum, stat) => sum + (stat.total_count || 0), 0);
  };

  const calculateAverageResponseTime = () => {
    const validStats = monthlyStats.filter(s => s.avg_hours_to_receive);
    if (validStats.length === 0) return 0;
    const sum = validStats.reduce((s, stat) => s + parseFloat(stat.avg_hours_to_receive), 0);
    return (sum / validStats.length).toFixed(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
          <p className="text-muted-foreground">تحليل شامل لأداء النظام</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">آخر 7 أيام</SelectItem>
            <SelectItem value="30">آخر 30 يوم</SelectItem>
            <SelectItem value="90">آخر 3 أشهر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* بطاقات الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المراسلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(calculateTotalCorrespondences())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              متوسط وقت الرد (ساعة)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {calculateAverageResponseTime()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              عدد المستخدمين النشطين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(userPerformance.length)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              عدد الجهات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(entityStats.length)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly" className="gap-2">
            <LineChart className="h-4 w-4" />
            إحصائيات شهرية
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <BarChart className="h-4 w-4" />
            أداء المستخدمين
          </TabsTrigger>
          <TabsTrigger value="entities" className="gap-2">
            <PieChart className="h-4 w-4" />
            إحصائيات الجهات
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2">
            <BarChart className="h-4 w-4" />
            النشاط اليومي
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإحصائيات الشهرية</CardTitle>
              <CardDescription>توزيع المراسلات حسب الشهر والنوع</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : (
                  <div className="space-y-4">
                    {monthlyStats.map((stat, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">
                              {new Date(stat.month).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'long'
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {stat.type === 'incoming' ? 'واردة' : 'صادرة'}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-2xl font-bold">{formatNumber(stat.total_count)}</p>
                            <p className="text-xs text-muted-foreground">إجمالي</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">مستلمة</p>
                            <p className="text-sm font-semibold">{formatNumber(stat.received_count)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">مؤرشفة</p>
                            <p className="text-sm font-semibold">{formatNumber(stat.archived_count)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">مع محتوى</p>
                            <p className="text-sm font-semibold">{formatNumber(stat.with_content_count)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">متوسط الرد (س)</p>
                            <p className="text-sm font-semibold">
                              {stat.avg_hours_to_receive ? parseFloat(stat.avg_hours_to_receive).toFixed(1) : '-'}
                            </p>
                          </div>
                        </div>

                        {stat.from_entity && (
                          <div className="text-xs text-muted-foreground pt-2">
                            <span className="font-medium">من:</span> {stat.from_entity}
                            {stat.received_by_entity && (
                              <span> → <span className="font-medium">إلى:</span> {stat.received_by_entity}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أداء المستخدمين</CardTitle>
              <CardDescription>إحصائيات أداء المستخدمين في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : (
                  <div className="space-y-2">
                    {userPerformance.map((user, index) => (
                      <div key={user.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                @{user.username} • {user.entity_name || 'لا توجد جهة'}
                              </p>
                            </div>
                          </div>
                          <div className="text-left space-y-1">
                            <p className="text-lg font-bold">{formatNumber(user.total_correspondences)}</p>
                            <p className="text-xs text-muted-foreground">مراسلة</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">أنشأ</p>
                            <p className="font-semibold">{formatNumber(user.created_count || 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">استلم</p>
                            <p className="font-semibold">{formatNumber(user.received_count || 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">تعليقات</p>
                            <p className="font-semibold">{formatNumber(user.comments_count || 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">متوسط الرد (س)</p>
                            <p className="font-semibold">
                              {user.avg_response_hours ? parseFloat(user.avg_response_hours).toFixed(1) : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الجهات</CardTitle>
              <CardDescription>نشاط الجهات في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : (
                  <div className="space-y-2">
                    {entityStats.map((entity) => (
                      <div key={entity.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold">{entity.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {entity.type === 'sender' ? 'جهة مرسلة' : entity.type === 'receiver' ? 'جهة مستقبلة' : 'كلاهما'}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-2xl font-bold">{formatNumber(entity.total_correspondences)}</p>
                            <p className="text-xs text-muted-foreground">إجمالي</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">أرسلت</p>
                            <p className="font-semibold">{formatNumber(entity.sent_count)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">استلمت</p>
                            <p className="font-semibold">{formatNumber(entity.received_count)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">مستخدمين</p>
                            <p className="font-semibold">{formatNumber(entity.users_count)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>النشاط اليومي</CardTitle>
              <CardDescription>نشاط النظام خلال الفترة المحددة</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : (
                  <div className="space-y-2">
                    {dailyActivity.map((day, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold">
                            {new Date(day.date).toLocaleDateString('ar-EG', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(day.active_users)} مستخدم نشط
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">أُنشئت</p>
                            <p className="font-semibold">{formatNumber(day.correspondences_created)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">شوهدت</p>
                            <p className="font-semibold">{formatNumber(day.correspondences_viewed)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">عُدّلت</p>
                            <p className="font-semibold">{formatNumber(day.correspondences_updated)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">تسجيلات دخول</p>
                            <p className="font-semibold">{formatNumber(day.logins)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
