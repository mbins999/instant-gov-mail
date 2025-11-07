import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup states
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEntityName, setSignupEntityName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check for existing custom session in localStorage
    const existingSession = localStorage.getItem('custom_session');
    if (existingSession) {
      try {
        const sessionData = JSON.parse(existingSession);
        setSession(sessionData);
        navigate('/');
      } catch (e) {
        localStorage.removeItem('custom_session');
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginUsername || !loginPassword) {
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
        body: { username: loginUsername, password: loginPassword }
      });

      if (error || data?.error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: data?.error || "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
        return;
      }

      if (data?.session) {
        // Store custom session
        const sessionData = {
          access_token: data.session.access_token,
          user: data.session.user
        };
        localStorage.setItem('custom_session', JSON.stringify(sessionData));
        setSession(sessionData as any);
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${data.session.user.full_name}`,
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupPassword || !signupUsername || !signupFullName || !signupEntityName) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const passwordErrors: string[] = [];
    if (signupPassword.length < 8) passwordErrors.push('8 أحرف على الأقل');
    if (!/[A-Z]/.test(signupPassword)) passwordErrors.push('حرف كبير');
    if (!/[a-z]/.test(signupPassword)) passwordErrors.push('حرف صغير');
    if (!/[0-9]/.test(signupPassword)) passwordErrors.push('رقم');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(signupPassword)) passwordErrors.push('رمز خاص');

    if (passwordErrors.length > 0) {
      toast({
        title: "كلمة المرور ضعيفة",
        description: `يجب أن تحتوي على: ${passwordErrors.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('simple-signup', {
        body: {
          username: signupUsername,
          password: signupPassword,
          fullName: signupFullName,
          entityName: signupEntityName,
          role: 'user'
        }
      });

      if (error || data?.error) {
        toast({
          title: "خطأ في التسجيل",
          description: data?.error || "حدث خطأ أثناء إنشاء الحساب",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن تسجيل الدخول",
      });
      
      // Switch to login tab
      const loginTab = document.querySelector('[value="login"]') as HTMLElement;
      loginTab?.click();
    } catch (error) {
      console.error('Signup error:', error);
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
          <div className="flex justify-center mb-2">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle>نظام إدارة المراسلات</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="اسم المستخدم"
                    required
                    disabled={loading}
                    className="text-right"
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    required
                    disabled={loading}
                    className="text-right"
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="اسم المستخدم (أحرف وأرقام فقط)"
                    required
                    disabled={loading}
                    className="text-right"
                    autoComplete="username"
                    pattern="[a-zA-Z0-9_]+"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    type="text"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    placeholder="الاسم الكامل"
                    required
                    disabled={loading}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    required
                    disabled={loading}
                    className="text-right"
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    يجب أن تحتوي على: 8 أحرف، حرف كبير، حرف صغير، رقم، ورمز خاص
                  </p>
                </div>

                <div className="space-y-2">
                  <Input
                    type="text"
                    value={signupEntityName}
                    onChange={(e) => setSignupEntityName(e.target.value)}
                    placeholder="اسم الجهة"
                    required
                    disabled={loading}
                    className="text-right"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
