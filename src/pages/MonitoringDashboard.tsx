import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Shield, 
  Clock, 
  AlertTriangle, 
  Users,
  FileText,
  TrendingUp,
  Database
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useUserRole } from '@/hooks/useUserRole';

export default function MonitoringDashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCorrespondences: 0,
    failedLogins: 0,
    blockedIPs: 0,
    avgResponseTime: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    // Simulated stats - will be replaced with real data
    setStats({
      totalUsers: 12,
      totalCorrespondences: 156,
      failedLogins: 3,
      blockedIPs: 1,
      avgResponseTime: 245,
      activeUsers: 8,
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">لوحة المراقبة</h1>
            <p className="text-muted-foreground mt-2">مراقبة أداء وأمان النظام</p>
          </div>

          {/* System Health */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">المستخدمين النشطين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  من إجمالي {stats.totalUsers} مستخدم
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المراسلات</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCorrespondences}</div>
                <p className="text-xs text-success">
                  <TrendingUp className="inline h-3 w-3" /> +12% هذا الشهر
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">متوسط الاستجابة</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  أداء ممتاز
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">حالة النظام</CardTitle>
                <Activity className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">تشغيل</div>
                <p className="text-xs text-muted-foreground">
                  جميع الخدمات نشطة
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security Metrics */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  مقاييس الأمان
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">محاولات تسجيل دخول فاشلة</span>
                  <span className="text-lg font-bold text-warning">{stats.failedLogins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">عناوين IP محظورة</span>
                  <span className="text-lg font-bold">{stats.blockedIPs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">جلسات نشطة</span>
                  <span className="text-lg font-bold text-success">{stats.activeUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  قاعدة البيانات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">الاتصالات النشطة</span>
                  <span className="text-lg font-bold">15/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">الاستعلامات البطيئة</span>
                  <span className="text-lg font-bold">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">آخر نسخة احتياطية</span>
                  <span className="text-sm text-muted-foreground">منذ ساعتين</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                التنبيهات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">محاولات تسجيل دخول متعددة فاشلة</p>
                    <p className="text-sm text-muted-foreground">
                      تم اكتشاف 3 محاولات فاشلة من نفس العنوان IP
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">منذ 15 دقيقة</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">نسخ احتياطي تلقائي مكتمل</p>
                    <p className="text-sm text-muted-foreground">
                      تم إنشاء نسخة احتياطية بنجاح
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">منذ ساعتين</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}