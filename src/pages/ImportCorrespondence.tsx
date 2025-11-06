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
      // الحصول على معلومات المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // الحصول على اسم جهة المستخدم
      const { data: profile } = await supabase
        .from('profiles')
        .select('entity_name')
        .eq('id', user.id)
        .single();

      if (profile?.entity_name) {
        setUserEntityName(profile.entity_name);

        // جلب المراسلات الموجهة لهذه الجهة
        const { data, error } = await supabase
          .from('correspondences')
          .select('*')
          .eq('received_by_entity', profile.entity_name)
          .order('date', { ascending: false });

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