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
    if (correspondence?.pdf_url) {
      // Open PDF in new window for printing
      window.open(correspondence.pdf_url, '_blank');
    } else {
      // Fallback to regular print
      window.print();
    }
  };

  useEffect(() => {
    // Add print styles
    const style = document.createElement('style');
    style.id = 'print-styles';
    style.textContent = `
      @media print {
        /* Hide everything by default */
        body * {
          visibility: hidden;
        }
        
        /* Show only the printable content */
        #printable-content,
        #printable-content * {
          visibility: visible;
        }
        
        /* Position printable content at top */
        #printable-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        
        /* Remove Card styling for print */
        #printable-content {
          border: none !important;
          box-shadow: none !important;
          background: white !important;
          padding: 0 !important;
        }
        
        /* Page margins */
        @page {
          margin: 1.5cm;
          size: A4;
        }
        
        /* Hide buttons and navigation */
        button,
        nav,
        .print\\:hidden {
          display: none !important;
        }
        
        /* Better text rendering for print */
        #printable-content {
          color: black !important;
          font-size: 13pt !important;
          line-height: 1.8 !important;
        }
        
        /* Official header styling for print */
        #printable-content h1,
        #printable-content h2 {
          color: #1e40af !important;
        }
        
        /* Page breaks for attachments */
        .attachment-page {
          page-break-before: always;
          page-break-after: always;
          page-break-inside: avoid;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .attachment-page img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        /* Hide attachment links in main content */
        .attachment-links {
          display: none !important;
        }
        
        /* Remove borders for print */
        #printable-content {
          border: none !important;
        }
        
        /* Better spacing for print */
        #printable-content > div {
          padding: 1cm !important;
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
      <div className="flex items-center justify-between print:hidden">
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

      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardContent className="p-0" id="printable-content">
          {correspondence.display_type === 'attachment_only' ? (
            <div className="p-12 space-y-6">
              {/* Document Info */}
              <div className="flex justify-between items-start pb-6">
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-foreground/70 font-semibold">الإشارة:</span>
                    <span className="font-bold text-foreground text-lg">{correspondence.number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground/70 font-semibold">من:</span>
                    <span className="font-semibold text-foreground">{correspondence.from}</span>
                  </div>
                </div>
                <div className="text-left space-y-2">
                  <div className="text-sm">
                    <div className="font-semibold text-foreground/70">التاريخ:</div>
                    <div className="font-bold text-foreground">
                      {new Date(correspondence.date).toLocaleDateString('ar-SA-u-ca-islamic', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-foreground/70">الموافق:</div>
                    <div className="font-bold text-foreground">
                      {new Date(correspondence.date).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
              </div>
              
              {correspondence.attachments && correspondence.attachments.length > 0 && (
                <div className="attachment-links">
                  <h3 className="font-bold text-xl mb-4 text-foreground">المرفقات:</h3>
                  <div className="space-y-3">
                    {correspondence.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-secondary hover:bg-secondary/80 rounded-lg transition-all border-r-4 border-foreground"
                      >
                        <span className="text-base font-semibold text-foreground">📎 مرفق رقم {index + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 space-y-6">
              {/* Document Info */}
              <div className="flex justify-between items-start pb-6">
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-foreground/70 font-semibold">الإشارة:</span>
                    <span className="font-bold text-foreground text-lg">{correspondence.number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground/70 font-semibold">من:</span>
                    <span className="font-semibold text-foreground">{correspondence.from}</span>
                  </div>
                </div>
                <div className="text-left space-y-2">
                  <div className="text-sm">
                    <div className="font-semibold text-foreground/70">التاريخ:</div>
                    <div className="font-bold text-foreground">
                      {new Date(correspondence.date).toLocaleDateString('ar-SA-u-ca-islamic', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-foreground/70">الموافق:</div>
                    <div className="font-bold text-foreground">
                      {new Date(correspondence.date).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
              </div>
            
              {/* Greeting */}
              <div className="text-right text-lg leading-loose text-foreground">
                {correspondence.greeting}
              </div>
            
              {/* Subject */}
              <div className="p-4 my-6">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground text-lg">الموضوع:</span>
                  <span className="font-bold text-lg text-foreground">{correspondence.subject}</span>
                </div>
              </div>
            
              {/* Content */}
              <div className="text-right text-lg leading-loose whitespace-pre-wrap min-h-[200px] py-4 text-foreground">
                {correspondence.content}
              </div>
            
              {/* Signature */}
              {correspondence.responsible_person && (
                <div className="mt-12 pt-8">
                  <div className="flex justify-between items-end">
                    <div className="text-right">
                      <div className="text-foreground/70 text-sm mb-2">وتقبلوا فائق التقدير والاحترام،،</div>
                    </div>
                    <div className="text-center">
                      {correspondence.signature_url && (
                        <div className="flex justify-center mb-3">
                          <img 
                            src={correspondence.signature_url} 
                            alt="توقيع المسؤول" 
                            className="max-h-24"
                          />
                        </div>
                      )}
                      <div className="font-bold text-lg text-foreground">{correspondence.responsible_person}</div>
                    </div>
                  </div>
                </div>
              )}
            
              {/* Attachments List */}
              {correspondence.attachments && correspondence.attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t-2 border-foreground/20 attachment-links">
                  <h3 className="font-bold text-xl mb-4 text-foreground">المرفقات:</h3>
                  <div className="space-y-3">
                    {correspondence.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-secondary hover:bg-secondary/80 rounded-lg transition-all border-r-4 border-foreground"
                      >
                        <span className="font-semibold text-foreground">📎 مرفق رقم {index + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        
          {/* Print attachments on separate pages */}
          {correspondence.attachments && correspondence.attachments.length > 0 && (
            <div className="hidden print:block">
              {correspondence.attachments.map((attachment, index) => (
                <div key={index} className="attachment-page">
                  <img 
                    src={attachment} 
                    alt={`مرفق ${index + 1}`}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const container = img.parentElement;
                      if (container) {
                        container.innerHTML = `<iframe src="${attachment}" width="100%" height="100%" style="border: none;"></iframe>`;
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
