import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // إذا كان مسجل دخول، انتقل للصفحة الرئيسية
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginUsername || !loginPassword) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // استدعاء edge function للتحقق من المستخدم باستخدام bcrypt
      const { data, error } = await supabase.functions.invoke('simple-login', {
        body: {
          username: loginUsername,
          password: loginPassword
        }
      });

      if (error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message || "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.session) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
        return;
      }

      // حفظ session token فقط (بدون بيانات المستخدم)
      localStorage.setItem('session_token', data.session.access_token);
      
      // تخزين معلومات أساسية للعرض (سيتم التحقق منها من الخادم)
      localStorage.setItem('user_session', JSON.stringify({
        username: data.session.user.username,
        full_name: data.session.user.full_name,
        entity_name: data.session.user.entity_name,
      }));
      
      toast({
        title: "تم تسجيل الدخول",
        description: `أهلاً بك ${data.session.user.full_name}`,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">نظام إدارة المراسلات</h1>
          <p className="text-muted-foreground">تسجيل الدخول إلى حسابك</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>تسجيل الدخول</CardTitle>
            <CardDescription>
              أدخل اسم المستخدم وكلمة المرور للدخول
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">اسم المستخدم</Label>
                <Input
                  id="login-username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">كلمة المرور</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="text-right"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
