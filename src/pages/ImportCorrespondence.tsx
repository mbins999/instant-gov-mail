import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CorrespondenceTable from '@/components/CorrespondenceTable';

export default function ImportCorrespondence() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [correspondences, setCorrespondences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEntityName, setUserEntityName] = useState<string>('');

  useEffect(() => {
    fetchUserEntityAndCorrespondences();
  }, []);

  const fetchUserEntityAndCorrespondences = async () => {
    try {
      // Get authenticated user from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      // Get user from users table
      const { data: user } = await supabase
        .from('users')
        .select('id, entity_name')
        .eq('id', parseInt(session.user.id))
        .maybeSingle();

      if (!user) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على بيانات المستخدم",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      if (user?.entity_name) {
        setUserEntityName(user.entity_name);

        // التحقق من دور المستخدم
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const isAdmin = roleData?.role === 'admin';

        // بناء الاستعلام
        let query = supabase
          .from('correspondences')
          .select('*')
          .eq('received_by_entity', user.entity_name);
        
        // إذا لم يكن مدير، اعرض فقط المراسلات الموجهة له
        if (!isAdmin) {
          query = query.eq('created_by', user.id);
        }
        
        const { data, error } = await query.order('date', { ascending: false });

        if (error) throw error;

        setCorrespondences(data || []);
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل المراسلات الواردة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">المراسلات الواردة</h1>
        <p className="text-muted-foreground mt-2">
          المراسلات الموجهة لـ {userEntityName || 'جهتك'}
        </p>
      </div>

      {correspondences.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            لا توجد مراسلات واردة
          </CardContent>
        </Card>
      ) : (
        <CorrespondenceTable correspondences={correspondences} />
      )}
    </div>
  );
}