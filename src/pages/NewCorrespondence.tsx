import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Send, Scan } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { correspondenceApi } from '@/services/correspondenceApi';

export default function NewCorrespondence() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [formData, setFormData] = useState({
    type: 'outgoing',
    number: '',
    date: new Date().toISOString().split('T')[0],
    to: '',
    subject: '',
    greeting: 'السيد/   المحترم\nالسلام عليكم ورحمة الله وبركاته ,,,',
    content: '\nوتفضلوا بقبول فائق الاحترام ,,,',
    responsiblePerson: '',
    displayType: 'content' as 'content' | 'attachment_only',
  });
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchCorrespondence = async () => {
        try {
          const { data, error } = await supabase
            .from('correspondences')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          if (data) {
            setFormData({
              type: data.type,
              number: data.number,
              date: data.date.split('T')[0],
              to: data.from_entity,
              subject: data.subject,
              greeting: data.greeting,
              content: data.content,
              responsiblePerson: data.responsible_person || '',
              displayType: (data.display_type || 'content') as 'content' | 'attachment_only',
            });
            
            if (data.signature_url) {
              setSignaturePreview(data.signature_url);
            }
            
            if (data.attachments && data.attachments.length > 0) {
              setExistingAttachments(data.attachments);
            }
          }
        } catch (err) {
          toast({
            title: "خطأ",
            description: "فشل تحميل بيانات المراسلة",
            variant: "destructive",
          });
          navigate('/');
        } finally {
          setFetchingData(false);
        }
      };

      fetchCorrespondence();
    }
  }, [id, isEditMode, navigate, toast]);

  const hijriDate = useMemo(() => {
    const date = new Date(formData.date);
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }, [formData.date]);

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/png') {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة بصيغة PNG فقط",
        variant: "destructive",
      });
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachmentFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (url: string) => {
    setExistingAttachments(prev => prev.filter(a => a !== url));
  };

  const handleScanDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newFiles = Array.from(files);
        setAttachmentFiles(prev => [...prev, ...newFiles]);
        toast({
          title: "تم المسح بنجاح",
          description: `تم إضافة ${newFiles.length} ملف`,
        });
      }
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent, shouldSendExternal = false) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let signatureUrl = signaturePreview;
      const uploadedAttachments: string[] = [...existingAttachments];
      
      // Upload new signature if provided
      if (signatureFile) {
        const fileExt = 'png';
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('signatures')
          .upload(filePath, signatureFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('signatures')
          .getPublicUrl(filePath);
        
        signatureUrl = publicUrl;
      }

      // Upload attachments
      for (const file of attachmentFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);
        
        uploadedAttachments.push(publicUrl);
      }

      const correspondenceData = {
        number: formData.number,
        type: formData.type,
        date: formData.date,
        from_entity: formData.to,
        subject: formData.displayType === 'content' ? formData.subject : 'مرفق',
        greeting: formData.displayType === 'content' ? formData.greeting : '',
        content: formData.displayType === 'content' ? formData.content : '',
        responsible_person: formData.displayType === 'content' ? formData.responsiblePerson : '',
        signature_url: formData.displayType === 'content' ? signatureUrl : '',
        display_type: formData.displayType,
        attachments: uploadedAttachments,
      };

      if (isEditMode && id) {
        const { error } = await supabase
          .from('correspondences')
          .update(correspondenceData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث المراسلة",
        });
        
        navigate(`/correspondence/${id}`);
      } else {
        const { error, data: insertedData } = await supabase
          .from('correspondences')
          .insert([correspondenceData])
          .select()
          .single();

        if (error) throw error;

        // إرسال خارجي إذا طُلب ذلك
        if (shouldSendExternal && insertedData) {
          if (!correspondenceApi.isAuthenticated()) {
            toast({
              title: "تحذير",
              description: "لم يتم الربط مع النظام الخارجي. تم حفظ المراسلة محلياً فقط.",
              variant: "default",
            });
          } else {
            try {
              const metadata = {
                docId: insertedData.number,
                subject: correspondenceData.subject,
                sender: correspondenceData.from_entity,
                date: correspondenceData.date,
              };

              await correspondenceApi.exportCorrespondence(metadata);
              
              // البحث عن المستخدم المستلم بناءً على اسم الجهة
              const { data: receiverProfile } = await supabase
                .from('profiles')
                .select('id, entity_name')
                .eq('entity_name', formData.to)
                .single();

              // إذا وُجدت الجهة المستلمة، إنشاء نسخة من المراسلة في حسابها
              if (receiverProfile) {
                await supabase
                  .from('correspondences')
                  .insert([{
                    ...correspondenceData,
                    type: 'incoming',
                    received_by_entity: receiverProfile.entity_name,
                  }]);
              }
              
              toast({
                title: "تم الإرسال بنجاح",
                description: "تم حفظ وإرسال المراسلة للنظام الخارجي",
              });
            } catch (error) {
              toast({
                title: "تحذير",
                description: "تم حفظ المراسلة ولكن فشل الإرسال للنظام الخارجي",
                variant: "default",
              });
            }
          }
        } else {
          toast({
            title: "تم الحفظ بنجاح",
            description: "تم حفظ المراسلة الجديدة",
          });
        }
        
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ في حفظ المراسلة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'تعديل المراسلة' : 'مراسلة جديدة'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditMode ? 'تعديل بيانات المراسلة' : 'إنشاء مراسلة واردة أو صادرة جديدة'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات المراسلة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayType">نوع عرض الكتاب *</Label>
              <Select
                value={formData.displayType}
                onValueChange={(value: 'content' | 'attachment_only') => 
                  setFormData({ ...formData, displayType: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="displayType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">كتابة المحتوى</SelectItem>
                  <SelectItem value="attachment_only">مرفق فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="number">رقم الكتاب *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">الجهة المستلمة *</Label>
                <Input
                  id="to"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">التاريخ *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  disabled={loading}
                />
                <div className="text-sm space-y-1 mt-2">
                  <div className="text-muted-foreground">التاريخ: {hijriDate}</div>
                  <div className="text-muted-foreground">الموافق: {new Date(formData.date).toLocaleDateString('en-GB')}</div>
                </div>
              </div>
            </div>

            {formData.displayType === 'content' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="greeting">التحية *</Label>
                  <Textarea
                    id="greeting"
                    value={formData.greeting}
                    onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                    rows={3}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">الموضوع *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">المحتوى *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsiblePerson">المسؤول</Label>
                  <Input
                    id="responsiblePerson"
                    value={formData.responsiblePerson}
                    onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signature">توقيع المسؤول (PNG فقط)</Label>
                  <Input
                    id="signature"
                    type="file"
                    accept="image/png"
                    onChange={handleSignatureChange}
                    disabled={loading}
                  />
                  {signaturePreview && (
                    <div className="mt-2">
                      <img src={signaturePreview} alt="معاينة التوقيع" className="max-h-32 border rounded" />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="attachments">المرفقات {formData.displayType === 'attachment_only' && '*'}</Label>
              <div className="flex gap-2">
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleAttachmentChange}
                  disabled={loading}
                  required={formData.displayType === 'attachment_only' && attachmentFiles.length === 0 && existingAttachments.length === 0}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleScanDocument}
                  disabled={loading}
                  title="مسح ضوئي من الكاميرا"
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
              {attachmentFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachmentFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        disabled={loading}
                      >
                        حذف
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {existingAttachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm font-semibold">المرفقات الحالية:</p>
                  {existingAttachments.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        مرفق {index + 1}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExistingAttachment(url)}
                        disabled={loading}
                      >
                        حذف
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                className="gap-2" 
                disabled={loading}
                onClick={(e) => handleSubmit(e, false)}
              >
                <Save className="h-4 w-4" />
                {loading ? (isEditMode ? 'جاري التحديث...' : 'جاري الحفظ...') : (isEditMode ? 'تحديث المراسلة' : 'حفظ المراسلة')}
              </Button>
              
              {!isEditMode && (
                <Button 
                  type="button" 
                  variant="default"
                  className="gap-2" 
                  disabled={loading}
                  onClick={(e) => handleSubmit(e as any, true)}
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'جاري الإرسال...' : 'إرسال خارجي'}
                </Button>
              )}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => isEditMode ? navigate(`/correspondence/${id}`) : navigate('/')} 
                disabled={loading}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
