import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Send, Scan } from 'lucide-react';
import { getAuthenticatedSupabaseClient } from '@/lib/supabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { correspondenceApi } from '@/services/correspondenceApi';
import { TemplateSelector } from '@/components/TemplateSelector';

interface Entity {
  id: string;
  name: string;
  type: 'sender' | 'receiver' | 'both';
}

export default function NewCorrespondence() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [formData, setFormData] = useState({
    type: 'outgoing',
    number: '',
    date: new Date().toISOString().split('T')[0],
    from: '',
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
  const [userSignature, setUserSignature] = useState<string>('');
  const [userJobTitle, setUserJobTitle] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string>('');
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    // تعيين جهة المستخدم تلقائياً كجهة مرسلة وتحميل التوقيع
    const userSession = localStorage.getItem('user_session');
    if (userSession && !isEditMode) {
      const userData = JSON.parse(userSession);
      setFormData(prev => ({
        ...prev,
        from: userData.entity_name || ''
      }));
      
      // Load user signature and info from ClickHouse
      const loadUserData = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.203.134:3001'}/api/users/${userData.id}`, {
            headers: {
              'x-session-token': localStorage.getItem('session_token') || '',
            }
          });
          
          if (response.ok) {
            const userDetails = await response.json();
            if (userDetails.signature_base64) {
              setUserSignature(userDetails.signature_base64);
              setSignaturePreview(userDetails.signature_base64);
            }
            if (userDetails.job_title) {
              setUserJobTitle(userDetails.job_title);
            }
            if (userDetails.full_name) {
              setUserFullName(userDetails.full_name);
              // Auto-fill responsible person field
              const responsibleText = `السيد/\n${userDetails.full_name}\n${userDetails.job_title || 'مدير مكتب المكاتب'}`;
              setFormData(prev => ({
                ...prev,
                responsiblePerson: responsibleText
              }));
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      };
      
      loadUserData();
    }
  }, [isEditMode]);

  useEffect(() => {
    // Fetch entities for dropdown
    const fetchEntities = async () => {
      try {
        const supabase = getAuthenticatedSupabaseClient();
        const { data, error } = await supabase
          .from('entities')
          .select('*')
          .order('name');

        if (error) throw error;
        setEntities((data || []) as Entity[]);
      } catch (error) {
        console.error('Error fetching entities:', error);
      }
    };

    fetchEntities();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchCorrespondence = async () => {
        try {
          // Try fetching from ClickHouse first (for drafts)
          const { clickhouseApi } = await import('@/lib/clickhouseClient');
          const data = await clickhouseApi.getCorrespondence(id);

          if (data) {
            setFormData({
              type: data.type,
              number: data.number,
              date: data.date.split('T')[0],
              from: data.from_entity,
              to: data.received_by_entity || '',
              subject: data.subject,
              greeting: data.greeting,
              content: data.content,
              responsiblePerson: data.responsible_person || '',
              displayType: (data.display_type || 'content') as 'content' | 'attachment_only',
            });
            
            // Check if it's a draft
            if ((data as any).status === 'draft') {
              setIsDraft(true);
            }
            
            if (data.signature_url) {
              setSignaturePreview(data.signature_url);
            }
            
            if (data.attachments && data.attachments.length > 0) {
              setExistingAttachments(data.attachments);
            }
          }
        } catch (err) {
          console.error('Error fetching correspondence:', err);
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

  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/png') {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setSignaturePreview(base64);
        
        // Save signature to user profile in ClickHouse
        try {
          const userSession = localStorage.getItem('user_session');
          if (userSession) {
            const userData = JSON.parse(userSession);
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.203.134:3001'}/api/users/${userData.id}/signature`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'x-session-token': localStorage.getItem('session_token') || '',
              },
              body: JSON.stringify({ signature_base64: base64 })
            });
            
            if (response.ok) {
              setUserSignature(base64);
              toast({
                title: "تم الحفظ",
                description: "تم حفظ التوقيع بنجاح",
              });
            }
          }
        } catch (error) {
          console.error('Error saving signature:', error);
        }
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

  const handleArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الحقول الإجبارية
    if (!formData.to) {
      toast({
        title: "خطأ",
        description: "يجب اختيار الجهة المستلمة",
        variant: "destructive",
      });
      return;
    }

    if (!formData.from) {
      toast({
        title: "خطأ",
        description: "يجب اختيار الجهة المرسلة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      let signatureUrl = signaturePreview;
      const uploadedAttachments: string[] = [...existingAttachments];
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.203.134:3001';
      
      // Upload attachments to local server with MD5 deduplication
      for (const file of attachmentFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch(`${apiUrl}/api/upload/attachment`, {
          method: 'POST',
          headers: {
            'x-session-token': localStorage.getItem('session_token') || '',
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload attachment');
        }
        
        const uploadData = await uploadResponse.json();
        uploadedAttachments.push(uploadData.url);
      }

      const correspondenceData = {
        number: formData.number,
        type: formData.type,
        date: formData.date,
        from_entity: formData.from,
        received_by_entity: formData.to,
        subject: formData.displayType === 'content' ? formData.subject : 'مرفق',
        greeting: formData.displayType === 'content' ? formData.greeting : '',
        content: formData.displayType === 'content' ? formData.content : '',
        responsible_person: formData.displayType === 'content' ? formData.responsiblePerson : '',
        signature_url: formData.displayType === 'content' ? signatureUrl : '',
        display_type: formData.displayType,
        attachments: uploadedAttachments,
        archived: true,
        status: 'draft',
        created_by: (() => {
          try {
            const userSession = localStorage.getItem('user_session');
            if (userSession) {
              const userData = JSON.parse(userSession);
              if (!userData.id) {
                throw new Error('معرف المستخدم غير موجود في الجلسة');
              }
              return userData.id;
            }
            throw new Error('لم يتم العثور على جلسة المستخدم');
          } catch (e) {
            console.error('Error getting user from session:', e);
            throw new Error('يجب تسجيل الدخول أولاً');
          }
        })()
      };

      // Save to ClickHouse instead of Supabase
      const { clickhouseApi } = await import('@/lib/clickhouseClient');
      await clickhouseApi.createCorrespondence(correspondenceData);

      toast({
        title: "تمت أرشفة المراسلة",
        description: "تم حفظ المراسلة كمسودة في الأرشيف بنجاح",
      });
      
      navigate('/archive');
    } catch (error) {
      console.error('Error archiving correspondence:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ في أرشفة المراسلة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, shouldSendExternal = false) => {
    e.preventDefault();
    
    // التحقق من الحقول الإجبارية
    if (!formData.to) {
      toast({
        title: "خطأ",
        description: "يجب اختيار الجهة المستلمة",
        variant: "destructive",
      });
      return;
    }

    if (!formData.from) {
      toast({
        title: "خطأ",
        description: "يجب اختيار الجهة المرسلة",
        variant: "destructive",
      });
      return;
    }

    // التحقق من الاتصال بالجهة الخارجية عند محاولة الإرسال الخارجي
    if (shouldSendExternal) {
      try {
        const supabase = getAuthenticatedSupabaseClient();
        const { data: connection, error } = await supabase
          .from('external_connections')
          .select('is_active')
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('Error checking connection:', error);
        }

        if (!connection) {
          toast({
            title: "خطأ",
            description: "يرجى الاتصال بالجهة الخارجية",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Error checking external connection:', error);
        toast({
          title: "خطأ",
          description: "يرجى الاتصال بالجهة الخارجية",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    
    try {
      let signatureUrl = signaturePreview;
      const uploadedAttachments: string[] = [...existingAttachments];
      
      const authed = getAuthenticatedSupabaseClient();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.203.134:3001';
      
      // Upload new signature if provided (already saved as base64 in handleSignatureChange)
      // signatureUrl is already set to base64 preview
      
      // Upload attachments to local server with MD5 deduplication
      for (const file of attachmentFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch(`${apiUrl}/api/upload/attachment`, {
          method: 'POST',
          headers: {
            'x-session-token': localStorage.getItem('session_token') || '',
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload attachment');
        }
        
        const uploadData = await uploadResponse.json();
        uploadedAttachments.push(uploadData.url);
      }

      const correspondenceData = {
        number: formData.number,
        type: formData.type,
        date: formData.date,
        from_entity: formData.from,
        received_by_entity: formData.to,
        subject: formData.displayType === 'content' ? formData.subject : 'مرفق',
        greeting: formData.displayType === 'content' ? formData.greeting : '',
        content: formData.displayType === 'content' ? formData.content : '',
        responsible_person: formData.displayType === 'content' ? formData.responsiblePerson : '',
        signature_url: formData.displayType === 'content' ? signatureUrl : '',
        display_type: formData.displayType,
        attachments: uploadedAttachments,
        created_by: (() => {
          try {
            const userSession = localStorage.getItem('user_session');
            if (userSession) {
              const userData = JSON.parse(userSession);
              if (!userData.id) {
                throw new Error('معرف المستخدم غير موجود في الجلسة');
              }
              return userData.id;
            }
            throw new Error('لم يتم العثور على جلسة المستخدم');
          } catch (e) {
            console.error('Error getting user from session:', e);
            throw new Error('يجب تسجيل الدخول أولاً');
          }
        })()
      };

      if (isEditMode && id) {
        // Check if it's a draft being edited
        if (isDraft) {
          // Update draft in ClickHouse
          const { clickhouseApi } = await import('@/lib/clickhouseClient');
          await clickhouseApi.updateCorrespondence(id, {
            ...correspondenceData,
            status: 'sent',
            archived: false
          });
          
          toast({
            title: "تم الإرسال بنجاح",
            description: "تم تحديث المسودة وإرسال المراسلة",
          });
          
          navigate('/sent');
        } else {
          // Regular update in Supabase
          const { error } = await authed
            .from('correspondences')
            .update(correspondenceData)
            .eq('id', id);

          if (error) throw error;

          toast({
            title: "تم التحديث بنجاح",
            description: "تم تحديث المراسلة",
          });
          
          navigate(`/correspondence/${id}`);
        }
      } else {
        const { error, data: insertedData } = await authed
          .from('correspondences')
          .insert([correspondenceData])
          .select()
          .single();

        if (error) throw error;

        // Generate PDF for the correspondence
        if (insertedData?.id) {
          try {
            await authed.functions.invoke('generate-correspondence-pdf', {
              body: { correspondenceId: insertedData.id }
            });
            console.log('PDF generation started for correspondence:', insertedData.id);
          } catch (pdfError) {
            console.error('Error generating PDF:', pdfError);
            // Don't block the user flow if PDF generation fails
          }
        }

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
              const { data: receiverUser } = await authed
                .from('users')
                .select('id, entity_name')
                .eq('entity_name', formData.to)
                .maybeSingle();

              // إذا وُجدت الجهة المستلمة، إنشاء نسخة من المراسلة في حسابها
                if (receiverUser) {
                  await authed
                    .from('correspondences')
                    .insert([{
                      ...correspondenceData,
                      type: 'incoming',
                      received_by_entity: receiverUser.entity_name,
                      created_by: receiverUser.id,
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
      console.error('Error saving correspondence:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
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
                <Label htmlFor="from">الجهة المرسلة *</Label>
                <Input
                  id="from"
                  value={formData.from}
                  disabled
                  className="bg-muted"
                  placeholder="جهتك"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">الجهة المستلمة *</Label>
                <Select
                  value={formData.to}
                  onValueChange={(value) => setFormData({ ...formData, to: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="اختر الجهة المستلمة" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {entities
                      .filter(e => e.type === 'receiver' || e.type === 'both')
                      .map((entity) => (
                        <SelectItem key={entity.id} value={entity.name}>
                          {entity.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
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

            {formData.displayType === 'content' && (
              <>
                {/* Template Selector */}
                <div className="flex justify-end">
                  <TemplateSelector 
                    type={formData.type as 'incoming' | 'outgoing'}
                    onApply={(templateData) => {
                      setFormData(prev => ({
                        ...prev,
                        greeting: templateData.greeting,
                        subject: templateData.subject,
                        content: templateData.content
                      }));
                      toast({
                        title: 'تم تطبيق القالب',
                        description: 'تم تطبيق القالب بنجاح على المراسلة',
                      });
                    }}
                  />
                </div>

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
                  <Label htmlFor="responsiblePerson">اعتماد بواسطة</Label>
                  <Textarea
                    id="responsiblePerson"
                    value={formData.responsiblePerson}
                    onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                    disabled={loading}
                    rows={3}
                    className="font-bold"
                    placeholder="السيد/&#10;عبدالله خالد المال&#10;مدير مكتب المكاتب"
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
                type="button" 
                className="gap-2" 
                disabled={loading}
                onClick={handleArchive}
              >
                <Save className="h-4 w-4" />
                {loading ? 'جاري الأرشفة...' : 'أرشفة'}
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
