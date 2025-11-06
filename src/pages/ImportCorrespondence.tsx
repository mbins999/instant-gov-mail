import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { correspondenceApi } from '@/services/correspondenceApi';
import { supabase } from '@/integrations/supabase/client';
import { Download, Loader2 } from 'lucide-react';

export default function ImportCorrespondence() {
  const { toast } = useToast();
  const [docId, setDocId] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!docId.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم المراسلة",
        variant: "destructive",
      });
      return;
    }

    if (!correspondenceApi.isAuthenticated()) {
      toast({
        title: "غير متصل",
        description: "يرجى الاتصال بالنظام الخارجي أولاً من صفحة الربط مع النظام",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      // جلب بيانات المراسلة من النظام الخارجي
      const externalData = await correspondenceApi.getIncomingAttachment(docId);
      
      if (!externalData) {
        throw new Error('لم يتم العثور على المراسلة');
      }

      // جلب المرفقات إن وجدت
      let attachmentUrls: string[] = [];
      try {
        const attachmentData = await correspondenceApi.getAttachmentContent(docId);
        if (attachmentData && attachmentData.attachments) {
          attachmentUrls = attachmentData.attachments;
        }
      } catch (err) {
        console.log('No attachments found');
      }

      // حفظ المراسلة في قاعدة البيانات المحلية
      const { error } = await supabase
        .from('correspondences')
        .insert([{
          number: externalData.number || docId,
          type: 'incoming',
          date: externalData.date || new Date().toISOString(),
          from_entity: externalData.from || 'نظام خارجي',
          subject: externalData.subject || 'مراسلة مستوردة',
          greeting: externalData.greeting || '',
          content: externalData.content || '',
          attachments: attachmentUrls,
          display_type: 'content',
        }]);

      if (error) throw error;

      toast({
        title: "تم الاستيراد بنجاح",
        description: "تم استيراد المراسلة وحفظها في النظام",
      });

      setDocId('');
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "خطأ في الاستيراد",
        description: error instanceof Error ? error.message : "فشل استيراد المراسلة من النظام الخارجي",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">استيراد المراسلات</h1>
        <p className="text-muted-foreground mt-2">استيراد المراسلات من النظام الخارجي</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>استيراد مراسلة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="docId">رقم المراسلة (Document ID)</Label>
              <Input
                id="docId"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                placeholder="أدخل رقم المراسلة من النظام الخارجي"
                disabled={importing}
              />
            </div>

            <Button 
              onClick={handleImport} 
              className="w-full gap-2"
              disabled={importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  استيراد المراسلة
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إرشادات الاستيراد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium">خطوات الاستيراد:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>تأكد من الاتصال بالنظام الخارجي</li>
                <li>أدخل رقم المراسلة المراد استيرادها</li>
                <li>اضغط على زر الاستيراد</li>
                <li>سيتم حفظ المراسلة تلقائياً في قسم البريد</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">البيانات المستوردة:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• رقم المراسلة</li>
                <li>• الموضوع</li>
                <li>• المحتوى</li>
                <li>• التاريخ</li>
                <li>• المرفقات (إن وجدت)</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                ملاحظة: يجب أن تكون متصلاً بالنظام الخارجي من صفحة "الربط مع النظام" قبل استيراد المراسلات.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}