import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getAuthenticatedSupabaseClient } from '@/lib/supabaseAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { UserPlus, Loader2, Building2, Trash2, Plus, Edit, Eye, EyeOff } from 'lucide-react';

interface User {
  id: number;
  username: string;
  full_name: string;
  entity_id: string | null;
  entity_name: string | null;
  role: string;
}

interface Entity {
  id: string;
  name: string;
  type: 'sender' | 'receiver' | 'both';
}

export default function UsersManagement() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<'sender' | 'receiver' | 'both'>('both');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    entityId: '',
    role: 'user' as 'admin' | 'user'
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    password: '',
    entityId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchEntities();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      console.log('[UsersManagement] Fetching users...');
      const sessionToken = localStorage.getItem('session_token');

      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        body: { sessionToken }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const usersList = (data?.users || []) as User[];
      console.log('[UsersManagement] Users fetch result:', { count: usersList.length });
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEntities = async () => {
    try {
      console.log('[UsersManagement] Fetching entities...');
      const authenticatedSupabase = getAuthenticatedSupabaseClient();
      const { data, error } = await authenticatedSupabase
        .from('entities')
        .select('*')
        .order('name');

      console.log('[UsersManagement] Entities fetch result:', { data, error });

      if (error) throw error;
      setEntities((data || []) as Entity[]);
      console.log('[UsersManagement] Entities state updated:', data?.length || 0);
    } catch (error) {
      console.error('[UsersManagement] Error fetching entities:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password strength (simplified - 8 characters minimum)
    if (formData.password.length < 8) {
      toast({
        title: 'كلمة المرور قصيرة',
        description: 'يجب أن تحتوي على 8 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);

    try {
      // Get authenticated user from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      let createdBy = null;
      
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', parseInt(session.user.id))
          .maybeSingle();
        createdBy = userData?.id || null;
      }

      const { data, error } = await supabase.functions.invoke('simple-signup', {
        body: {
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          entityId: formData.entityId,
          role: formData.role,
          createdBy,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'تم إنشاء المستخدم بنجاح',
        description: `تم إنشاء حساب ${formData.username}`,
      });

      setFormData({ username: '', password: '', fullName: '', entityId: '', role: 'user' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntity = async () => {
    if (!newEntityName.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم الجهة',
        variant: 'destructive',
      });
      return;
    }

    try {
      const authenticatedSupabase = getAuthenticatedSupabaseClient();
      const { error } = await authenticatedSupabase
        .from('entities')
        .insert({ name: newEntityName, type: newEntityType });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الجهة بنجاح',
      });

      setNewEntityName('');
      setNewEntityType('both');
      fetchEntities();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إضافة الجهة',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEntity = async (id: string) => {
    try {
      const authenticatedSupabase = getAuthenticatedSupabaseClient();
      const { error } = await authenticatedSupabase
        .from('entities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الجهة بنجاح',
      });

      fetchEntities();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حذف الجهة',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.full_name,
      password: '',
      entityId: user.entity_id || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    // Validate password strength if password is provided (simplified)
    if (editFormData.password && editFormData.password.length < 8) {
      toast({
        title: 'كلمة المرور قصيرة',
        description: 'يجب أن تحتوي على 8 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: {
          userId: editingUser.id,
          fullName: editFormData.fullName,
          password: editFormData.password || undefined,
          entityId: editFormData.entityId
        }
      });

      if (error) throw error;
      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث بيانات المستخدم بنجاح',
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      setEditFormData({
        fullName: '',
        password: '',
        entityId: ''
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل تحديث المستخدم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }

    setLoading(true);

    try {
      const authenticatedSupabase = getAuthenticatedSupabaseClient();
      
      // Delete user role first
      await authenticatedSupabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Delete user
      const { error } = await authenticatedSupabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المستخدم بنجاح',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حذف المستخدم',
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
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">إدارة</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
          <TabsTrigger value="entities">الجهات</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="grid md:grid-cols-2 gap-6">
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
                    <Label htmlFor="password">كلمة المرور (8 أحرف على الأقل)</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        minLength={8}
                        required
                        className="pl-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
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
                    <Label htmlFor="entityId">الجهة</Label>
                    <Select
                      value={formData.entityId}
                      onValueChange={(value) => setFormData({ ...formData, entityId: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="اختر الجهة" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {entities.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="role">الصلاحية</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'admin' | 'user') => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
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

            <Card>
              <CardHeader>
                <CardTitle>
                  المستخدمين ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مستخدمين بعد
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="p-3 border rounded-lg flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-semibold">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">@{user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.entity_name || 'لا توجد جهة'}</div>
                          <div className="text-xs mt-1">
                            <span className={`px-2 py-1 rounded ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary/10'}`}>
                              {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>تحرير المستخدم</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <Label htmlFor="edit-fullName">الاسم الكامل</Label>
                  <Input
                    id="edit-fullName"
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-password">كلمة المرور الجديدة (اتركها فارغة إذا لم ترد التغيير)</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showEditPassword ? "text" : "password"}
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      placeholder="اتركها فارغة للإبقاء على القديمة"
                      minLength={8}
                      className="pl-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                    >
                      {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-entityId">الجهة</Label>
                  <Select
                    value={editFormData.entityId}
                    onValueChange={(value) => setEditFormData({ ...editFormData, entityId: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="اختر الجهة" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ التغييرات'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="entities">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  إضافة جهة جديدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="entityName">اسم الجهة</Label>
                    <Input
                      id="entityName"
                      value={newEntityName}
                      onChange={(e) => setNewEntityName(e.target.value)}
                      placeholder="أدخل اسم الجهة"
                    />
                  </div>

                  <div>
                    <Label htmlFor="entityType">نوع الجهة</Label>
                    <Select
                      value={newEntityType}
                      onValueChange={(value: 'sender' | 'receiver' | 'both') => setNewEntityType(value)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="both">مرسل ومستقبل</SelectItem>
                        <SelectItem value="sender">مرسل فقط</SelectItem>
                        <SelectItem value="receiver">مستقبل فقط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAddEntity} className="w-full">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة الجهة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الجهات الموجودة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {entities.map((entity) => (
                    <div key={entity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{entity.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {entity.type === 'both' ? 'مرسل ومستقبل' : 
                           entity.type === 'sender' ? 'مرسل فقط' : 'مستقبل فقط'}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEntity(entity.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
