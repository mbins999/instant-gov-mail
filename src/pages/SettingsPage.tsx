import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';

export default function SettingsPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    entityName: 'وزارة الصحة',
    role: 'user' as 'admin' | 'user'
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'خطأ',
          description: 'يجب تسجيل الدخول أولاً',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          entityName: formData.entityName,
          role: formData.role
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء المستخدم بنجاح',
      });

      setFormData({
        username: '',
        password: '',
        fullName: '',
        entityName: 'وزارة الصحة',
        role: 'user'
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إنشاء المستخدم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">إنشاء حساب جديد</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            إضافة مستخدم جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="entityName">اسم الجهة</Label>
              <Input
                id="entityName"
                value={formData.entityName}
                onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="role">الصلاحية</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'user') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء المستخدم'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
