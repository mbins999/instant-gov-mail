import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Edit, Printer, Archive, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Correspondence } from '@/types/correspondence';

export default function CorrespondenceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [correspondence, setCorrespondence] = useState<Correspondence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCorrespondence = async () => {
      try {
        const { data, error } = await supabase
          .from('correspondences')
          .select(`
            *,
            received_by_profile:profiles!received_by(
              full_name,
              email
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setCorrespondence({
            ...data,
            from: data.from_entity,
            greeting: data.greeting,
            responsible_person: data.responsible_person,
            signature_url: data.signature_url,
          } as any);
        }
      } catch (err) {
        console.error('Error fetching correspondence:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCorrespondence();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!correspondence) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">المراسلة غير موجودة</h2>
        <Button onClick={() => navigate('/')} className="mt-4">
          العودة للرئيسية
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">تفاصيل المراسلة</h1>
            <p className="text-muted-foreground mt-1">{correspondence.number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="space-y-4 text-lg leading-relaxed whitespace-pre-wrap">
              <div>{correspondence.greeting}</div>
              
              <div className="font-semibold text-center my-4">
                الموضوع: {correspondence.subject}
              </div>
              
              <div>{correspondence.content}</div>
              
              {correspondence.responsible_person && (
                <div className="mt-8 text-center">
                  {correspondence.signature_url && (
                    <div className="flex justify-center mb-2">
                      <img 
                        src={correspondence.signature_url} 
                        alt="توقيع المسؤول" 
                        className="max-h-32"
                      />
                    </div>
                  )}
                  <div className="font-semibold">{correspondence.responsible_person}</div>
                </div>
              )}
            </div>
            
            {correspondence.attachments && correspondence.attachments.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold mb-3">المرفقات:</h3>
                <div className="space-y-2">
                  {correspondence.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="text-sm">{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات المراسلة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">الرقم</p>
                <p className="font-semibold">{correspondence.number}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">النوع</p>
                <p className="font-semibold">
                  {correspondence.type === 'incoming' ? 'واردة' : 'صادرة'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">من</p>
                <p className="font-semibold">{correspondence.from}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">استلام بواسطة</p>
                <p className="font-semibold">
                  {correspondence.received_by_profile?.full_name || '-'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">التاريخ</p>
                <p className="font-semibold">
                  {new Date(correspondence.date).toLocaleDateString('en-GB')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
