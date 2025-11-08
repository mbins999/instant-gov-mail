import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getAuthenticatedSupabaseClient } from '@/lib/supabaseAuth';
import { Plus, Trash2, Edit, Power, PowerOff, RefreshCw, Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ExternalConnection {
  id: string;
  name: string;
  base_url: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  session_token: string | null;
  session_expires_at: string | null;
  last_sync_at: string | null;
  sync_status: string;
  sync_error: string | null;
}

export default function ExternalConnections() {
  const [connections, setConnections] = useState<ExternalConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ExternalConnection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    base_url: '',
    username: '',
    password: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const supabase = getAuthenticatedSupabaseClient();
      const { data, error } = await supabase
        .from('external_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الاتصالات الخارجية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supabase = getAuthenticatedSupabaseClient();
      const userSession = localStorage.getItem('user_session');
      const userData = userSession ? JSON.parse(userSession) : null;

      if (editingConnection) {
        // Update existing connection
        const updateData: any = {
          name: formData.name,
          base_url: formData.base_url,
          username: formData.username,
        };

        if (formData.password) {
          updateData.password_encrypted = formData.password;
          updateData.api_token = null; // Reset token when password changes
        }

        const { error } = await supabase
          .from('external_connections')
          .update(updateData)
          .eq('id', editingConnection.id);

        if (error) throw error;

        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الاتصال بنجاح',
        });
      } else {
        // Create new connection
        const { error } = await supabase
          .from('external_connections')
          .insert({
            name: formData.name,
            base_url: formData.base_url,
            username: formData.username,
            password_encrypted: formData.password,
            created_by: userData?.id,
          });

        if (error) throw error;

        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة الاتصال بنجاح',
        });
      }

      setIsDialogOpen(false);
      setFormData({ name: '', base_url: '', username: '', password: '' });
      setEditingConnection(null);
      fetchConnections();
    } catch (error) {
      console.error('Error saving connection:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ الاتصال',
        variant: 'destructive',
      });
    }
  };

  const toggleConnectionStatus = async (connection: ExternalConnection) => {
    try {
      const supabase = getAuthenticatedSupabaseClient();
      const { error } = await supabase
        .from('external_connections')
        .update({ is_active: !connection.is_active })
        .eq('id', connection.id);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: `تم ${!connection.is_active ? 'تفعيل' : 'إيقاف'} الاتصال`,
      });

      fetchConnections();
    } catch (error) {
      console.error('Error toggling connection:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث حالة الاتصال',
        variant: 'destructive',
      });
    }
  };

  const authenticateConnection = async (id: string) => {
    try {
      const supabase = getAuthenticatedSupabaseClient();
      toast({
        title: 'جاري المصادقة...',
        description: 'يتم الآن المصادقة مع النظام الخارجي',
      });

      const { data, error } = await supabase.functions.invoke('wsdl-session-manager', {
        body: { action: 'authenticate', connectionId: id },
      });

      if (error) throw error;

      toast({
        title: 'تمت المصادقة',
        description: data.message || 'تم الاتصال بنجاح',
      });

      fetchConnections();
    } catch (error: any) {
      console.error('Error authenticating:', error);
      toast({
        title: 'خطأ في المصادقة',
        description: error.message || 'فشل الاتصال بالنظام الخارجي',
        variant: 'destructive',
      });
    }
  };

  const syncConnection = async (id: string) => {
    try {
      const supabase = getAuthenticatedSupabaseClient();
      toast({
        title: 'جاري المزامنة...',
        description: 'يتم الآن مزامنة البيانات',
      });

      const { data, error } = await supabase.functions.invoke('wsdl-session-manager', {
        body: { action: 'sync', connectionId: id },
      });

      if (error) throw error;

      toast({
        title: 'تمت المزامنة',
        description: data.message || 'تمت المزامنة بنجاح',
      });

      fetchConnections();
    } catch (error: any) {
      console.error('Error syncing:', error);
      toast({
        title: 'خطأ في المزامنة',
        description: error.message || 'فشل مزامنة البيانات',
        variant: 'destructive',
      });
    }
  };

  const deleteConnection = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاتصال؟')) return;

    try {
      const supabase = getAuthenticatedSupabaseClient();
      const { error } = await supabase
        .from('external_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الاتصال بنجاح',
      });

      fetchConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف الاتصال',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (connection: ExternalConnection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      base_url: connection.base_url,
      username: connection.username,
      password: '',
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">الاتصالات الخارجية</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingConnection(null);
              setFormData({ name: '', base_url: '', username: '', password: '' });
            }}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة اتصال جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConnection ? 'تعديل الاتصال' : 'إضافة اتصال جديد'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">اسم الاتصال</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="مثال: وزارة الداخلية"
                />
              </div>
              <div>
                <Label htmlFor="base_url">رابط الـ API</Label>
                <Input
                  id="base_url"
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  required
                  placeholder="https://api.example.com/v1"
                  dir="ltr"
                />
              </div>
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
                <Label htmlFor="password">
                  كلمة المرور {editingConnection && '(اتركها فارغة للإبقاء على الحالية)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingConnection}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingConnection(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingConnection ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {connections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">لا توجد اتصالات خارجية مُضافة بعد</p>
            </CardContent>
          </Card>
        ) : (
          connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {connection.is_active ? (
                      <Power className="h-5 w-5 text-green-500" />
                    ) : (
                      <PowerOff className="h-5 w-5 text-red-500" />
                    )}
                    {connection.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => authenticateConnection(connection.id)}
                      title="المصادقة الآن"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => syncConnection(connection.id)}
                      title="مزامنة الآن"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleConnectionStatus(connection)}
                    >
                      {connection.is_active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(connection)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteConnection(connection.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">رابط الـ API: </span>
                    <span className="font-mono" dir="ltr">{connection.base_url}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">اسم المستخدم: </span>
                    <span>{connection.username}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الحالة: </span>
                    <span className={connection.is_active ? 'text-green-600' : 'text-red-600'}>
                      {connection.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">حالة المزامنة: </span>
                    <span className={
                      connection.sync_status === 'connected' ? 'text-green-600' :
                      connection.sync_status === 'synced' ? 'text-blue-600' :
                      connection.sync_status === 'error' ? 'text-red-600' :
                      'text-gray-600'
                    }>
                      {connection.sync_status === 'connected' ? 'متصل' :
                       connection.sync_status === 'synced' ? 'تمت المزامنة' :
                       connection.sync_status === 'error' ? 'خطأ' :
                       'في الانتظار'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">آخر مزامنة: </span>
                    <span>
                      {connection.last_sync_at 
                        ? new Date(connection.last_sync_at).toLocaleString('ar-SA')
                        : 'لم تتم بعد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">انتهاء الجلسة: </span>
                    <span>
                      {connection.session_expires_at 
                        ? new Date(connection.session_expires_at).toLocaleString('ar-SA')
                        : 'غير متصل'}
                    </span>
                  </div>
                  {connection.sync_error && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">الخطأ: </span>
                      <span className="text-red-600 text-xs">{connection.sync_error}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}