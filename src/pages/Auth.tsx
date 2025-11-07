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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup states
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEntityName, setSignupEntityName] = useState('');
  const [signupRole, setSignupRole] = useState<'user' | 'admin'>('user');
  
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          navigate('/');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message === 'Invalid login credentials'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.session) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك",
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
    
    if (!signupEmail || !signupPassword || !signupUsername || !signupFullName || !signupEntityName) {
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
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: signupUsername,
            full_name: signupFullName,
            entity_name: signupEntityName,
            role: signupRole
          }
        }
      });

      if (error) {
        toast({
          title: "خطأ في التسجيل",
          description: error.message === 'User already registered'
            ? 'هذا البريد مسجل مسبقاً'
            : error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.session) {
        toast({
          title: "تم التسجيل بنجاح",
          description: "مرحباً بك في النظام",
        });
        navigate('/');
      } else {
        toast({
          title: "تم إنشاء الحساب",
          description: "يمكنك الآن تسجيل الدخول",
        });
      }
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
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                    required
                    disabled={loading}
                    className="text-right"
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
                    placeholder="اسم المستخدم"
                    required
                    disabled={loading}
                    className="text-right"
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
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
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
                    placeholder="كلمة المرور (6 أحرف على الأقل)"
                    required
                    disabled={loading}
                    className="text-right"
                    minLength={6}
                  />
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

                <div className="space-y-2">
                  <Select
                    value={signupRole}
                    onValueChange={(value: 'user' | 'admin') => setSignupRole(value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر الصلاحية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">مستخدم</SelectItem>
                      <SelectItem value="admin">مسؤول</SelectItem>
                    </SelectContent>
                  </Select>
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
