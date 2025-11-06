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
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // بيانات النظام الخارجي
  const [externalBaseUrl, setExternalBaseUrl] = useState('');
  const [externalUsername, setExternalUsername] = useState('');
  const [externalPassword, setExternalPassword] = useState('');

  useEffect(() => {
    // التحقق من تسجيل الدخول
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
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
      const { data, error } = await supabase.functions.invoke('login-with-username', {
        body: { username, password }
      });

      if (error || data.error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
        return;
      }

      if (data.session) {
        await supabase.auth.setSession(data.session);
        
        // الربط بالنظام الخارجي إذا تم إدخال البيانات
        if (externalBaseUrl && externalUsername && externalPassword) {
          try {
            await correspondenceApi.login(externalBaseUrl, externalUsername, externalPassword);
          } catch (error) {
            console.error('External system connection failed:', error);
          }
        }
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في نظام المراسلات",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !fullName) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال جميع البيانات",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('signup-with-username', {
        body: { username, password, fullName }
      });

      if (error || data.error) {
        toast({
          title: "خطأ في إنشاء الحساب",
          description: data.error || "اسم المستخدم موجود بالفعل",
          variant: "destructive",
        });
        return;
      }

      if (data.session) {
        await supabase.auth.setSession(data.session);
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "مرحباً بك في نظام المراسلات",
        });
      }
    } catch (error) {
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
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isSignUp ? "اسم المستخدم (بالإنجليزية)" : "اسم المستخدم"}
                required
                disabled={loading}
                className="text-center"
                pattern={isSignUp ? "[a-zA-Z0-9_]+" : undefined}
                title={isSignUp ? "يجب استخدام أحرف إنجليزية وأرقام فقط" : undefined}
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم الكامل (بالعربي)"
                  required
                  disabled={loading}
                  className="text-center"
                />
              </div>
            )}

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
                الربط مع النظام الخارجي (اختياري)
              </p>
              
              <div className="space-y-2">
                <Input
                  type="url"
                  value={externalBaseUrl}
                  onChange={(e) => setExternalBaseUrl(e.target.value)}
                  placeholder="رابط النظام الخارجي"
                  disabled={loading}
                  className="text-center text-sm"
                />
              </div>

              <div className="space-y-2 mt-2">
                <Input
                  type="text"
                  value={externalUsername}
                  onChange={(e) => setExternalUsername(e.target.value)}
                  placeholder="اسم المستخدم للنظام الخارجي"
                  disabled={loading}
                  className="text-center text-sm"
                />
              </div>

              <div className="space-y-2 mt-2">
                <Input
                  type="password"
                  value={externalPassword}
                  onChange={(e) => setExternalPassword(e.target.value)}
                  placeholder="كلمة المرور للنظام الخارجي"
                  disabled={loading}
                  className="text-center text-sm"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? (isSignUp ? "جاري إنشاء الحساب..." : "جاري تسجيل الدخول...") 
                : (isSignUp ? "إنشاء حساب" : "تسجيل الدخول")
              }
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp ? "لديك حساب؟ تسجيل الدخول" : "إنشاء حساب جديد"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
