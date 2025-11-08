import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthenticatedSupabaseClient } from '@/lib/supabaseAuth';
import { useToast } from '@/hooks/use-toast';

interface Correspondence {
  id: string;
  number: string;
  date: string;
  subject: string;
  from_entity: string;
  received_by_entity: string;
  type: string;
  display_type: string;
}

export default function Sent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEntity, setUserEntity] = useState<string>('');

  useEffect(() => {
    const fetchSentCorrespondences = async () => {
      try {
        const supabase = getAuthenticatedSupabaseClient();
        
        // Get current user entity
        const customSession = localStorage.getItem('custom_session');
        if (!customSession) {
          navigate('/auth');
          return;
        }

        const sessionData = JSON.parse(customSession);
        const userId = sessionData.user?.id;

        if (!userId) {
          navigate('/auth');
          return;
        }

        // Fetch correspondences created by this user (sent by this user)
        const { data, error } = await supabase
          .from('correspondences')
          .select('*')
          .eq('created_by', userId)
          .eq('type', 'outgoing')
          .order('date', { ascending: false });

        if (error) throw error;

        setCorrespondences(data || []);
      } catch (error) {
        console.error('Error fetching sent correspondences:', error);
        toast({
          title: "خطأ",
          description: "فشل تحميل المراسلات المرسلة",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSentCorrespondences();
  }, [navigate, toast]);

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
        <h1 className="text-3xl font-bold">المرسل</h1>
      </div>

      {correspondences.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد مراسلات مرسلة</h3>
          <p className="text-muted-foreground">لم يتم إرسال أي كتب من هذا الحساب بعد</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {correspondences.map((correspondence) => (
            <Card
              key={correspondence.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/correspondence/${correspondence.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">
                      كتاب رقم: {correspondence.number}
                    </h3>
                    <Badge variant="secondary">
                      {correspondence.display_type === 'attachment_only' ? 'مرفق' : 'محتوى'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">التاريخ: </span>
                      <span className="font-medium">
                        {new Date(correspondence.date).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">من: </span>
                      <span className="font-medium">{correspondence.from_entity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">إلى: </span>
                      <span className="font-medium">{correspondence.received_by_entity || 'غير محدد'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الموضوع: </span>
                      <span className="font-medium">{correspondence.subject}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/correspondence/${correspondence.id}`);
                  }}
                >
                  <Eye className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
