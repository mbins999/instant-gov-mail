import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { correspondenceApi } from '@/services/correspondenceApi';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // بيانات النظام الخارجي
  const [externalUsername, setExternalUsername] = useState('');
  const [externalPassword, setExternalPassword] = useState('');

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    
    if (token && user) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('simple-login', {
        body: { username, password }
      });

      if (error || data?.error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: data?.error || "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
        return;
      }

      if (data?.success && data?.user && data?.token) {
        // تخزين التوكن والمستخدم في localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        // الربط بالنظام الخارجي إذا تم إدخال البيانات
        if (externalUsername && externalPassword) {
          try {
            await correspondenceApi.login('', externalUsername, externalPassword);
          } catch (error) {
            console.error('External system connection failed:', error);
          }
        }
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${data.user.full_name}`,
        });
        
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم"
                required
                disabled={loading}
                className="text-center"
              />
            </div>

            <div className="space-y-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                required
                disabled={loading}
                className="text-center"
                minLength={6}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-3">
                الربط مع وزارة الصحة (اختياري)
              </p>

              <div className="space-y-2 mt-2">
                <Input
                  type="text"
                  value={externalUsername}
                  onChange={(e) => setExternalUsername(e.target.value)}
                  placeholder="اسم المستخدم في وزارة الصحة"
                  disabled={loading}
                  className="text-center text-sm"
                />
              </div>

              <div className="space-y-2 mt-2">
                <Input
                  type="password"
                  value={externalPassword}
                  onChange={(e) => setExternalPassword(e.target.value)}
                  placeholder="كلمة المرور في وزارة الصحة"
                  disabled={loading}
                  className="text-center text-sm"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
