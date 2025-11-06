import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Edit, Printer, Archive, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Correspondence } from '@/types/correspondence';
import { correspondenceApi } from '@/services/correspondenceApi';
import { useToast } from '@/hooks/use-toast';

export default function CorrespondenceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [correspondence, setCorrespondence] = useState<Correspondence | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingToExternal, setSendingToExternal] = useState(false);

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
            display_type: data.display_type,
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

  const handleSendToExternal = async () => {
    if (!correspondence) return;

    if (!correspondenceApi.isAuthenticated()) {
      toast({
        title: "غير متصل",
        description: "يرجى الاتصال بالنظام الخارجي أولاً من صفحة الربط مع النظام",
        variant: "destructive",
      });
      navigate('/api-settings');
      return;
    }

    setSendingToExternal(true);

    try {
      const metadata = {
        number: correspondence.number,
        subject: correspondence.subject,
        content: correspondence.content,
        date: correspondence.date,
      };

      await correspondenceApi.exportCorrespondence(metadata);
      
      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال المراسلة للنظام الخارجي",
      });
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "فشل إرسال المراسلة للنظام الخارجي",
        variant: "destructive",
      });
    } finally {
      setSendingToExternal(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    // Add print styles
    const style = document.createElement('style');
    style.id = 'print-styles';
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-content,
        #printable-content * {
          visibility: visible;
        }
        #printable-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          margin: 2cm;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('print-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

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
          <Button 
            variant="default" 
            size="icon"
            onClick={handleSendToExternal}
            disabled={sendingToExternal}
            title="إرسال للنظام الخارجي"
          >
            {sendingToExternal ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(`/edit/${id}`)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrint} title="طباعة">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6" id="printable-content">
          {correspondence.display_type === 'attachment_only' ? (
            <div className="space-y-4">
              <div className="text-right mb-6">
                <div className="font-semibold">{correspondence.number}</div>
                <div className="mt-2">{correspondence.from}</div>
                <div className="mt-2 text-muted-foreground">
                  {new Date(correspondence.date).toLocaleDateString('ar-SA-u-ca-islamic', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </div>
                <div className="text-muted-foreground">
                  الموافق: {new Date(correspondence.date).toLocaleDateString('en-GB')}
                </div>
              </div>
              
              {correspondence.attachments && correspondence.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-xl">المرفقات:</h3>
                  <div className="space-y-3">
                    {correspondence.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        <span className="text-base">📎 مرفق {index + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-lg leading-relaxed">
            <div className="text-right mb-6">
              <div className="font-semibold">{correspondence.number}</div>
              <div className="mt-2">{correspondence.from}</div>
              <div className="mt-2 text-muted-foreground">
                {new Date(correspondence.date).toLocaleDateString('ar-SA-u-ca-islamic', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </div>
              <div className="text-muted-foreground">
                الموافق: {new Date(correspondence.date).toLocaleDateString('en-GB')}
              </div>
            </div>
            
            <div className="whitespace-pre-wrap">{correspondence.greeting}</div>
            
            <div className="font-semibold text-center my-4">
              الموضوع: {correspondence.subject}
            </div>
            
            <div className="whitespace-pre-wrap">{correspondence.content}</div>
            
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
            
            {correspondence.attachments && correspondence.attachments.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold mb-3">المرفقات:</h3>
                <div className="space-y-2">
                  {correspondence.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                      <span className="text-sm">📎 مرفق {index + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
