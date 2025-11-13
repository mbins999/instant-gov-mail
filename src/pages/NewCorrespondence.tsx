import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Send, Scan } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const initialCorrespondence = (location.state as any) || null;
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
const [isLocked, setIsLocked] = useState(false);

  // Prefill edit form from navigation state to avoid empty screen if API is slow
  useEffect(() => {
    if (isEditMode && initialCorrespondence) {
      try {
        const computeDateOnly = (raw: any) => {
          try {
            if (!raw) return new Date().toISOString().split('T')[0];
            if (typeof raw === 'string') {
              const justDate = raw.match(/^\d{4}-\d{2}-\d{2}$/);
              if (justDate) return raw;
              let s = raw.trim();
              if (s.includes(' ') && !s.includes('T')) s = s.replace(' ', 'T');
              const d1 = new Date(s);
              if (!isNaN(d1.getTime())) return d1.toISOString().split('T')[0];
            } else if (typeof raw === 'number') {
              const dSec = new Date(raw * 1000);
              if (!isNaN(dSec.getTime())) return dSec.toISOString().split('T')[0];
              const dMs = new Date(raw);
              if (!isNaN(dMs.getTime())) return dMs.toISOString().split('T')[0];
            }
            const d = new Date(raw);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
          } catch {}
          return new Date().toISOString().split('T')[0];
        };
        const dateOnly = computeDateOnly(initialCorrespondence.date);
        setFormData({
          type: initialCorrespondence.type || 'outgoing',
          number: initialCorrespondence.number || '',
          date: dateOnly,
          from: initialCorrespondence.from_entity || initialCorrespondence.from || '',
          to: initialCorrespondence.received_by_entity || initialCorrespondence.to || '',
          subject: initialCorrespondence.subject || '',
          greeting: initialCorrespondence.greeting || 'السيد/',
          content: initialCorrespondence.content || '',
          responsiblePerson: initialCorrespondence.responsible_person || initialCorrespondence.responsiblePerson || '',
          displayType: (initialCorrespondence.display_type || 'content') as 'content' | 'attachment_only',
        });
        setIsDraft((initialCorrespondence as any).status === 'draft');
        setIsLocked(Boolean(initialCorrespondence.archived === true || ((initialCorrespondence as any).status && (initialCorrespondence as any).status !== 'draft')));
        setExistingAttachments(Array.isArray(initialCorrespondence.attachments) ? initialCorrespondence.attachments : []);
        if (initialCorrespondence.signature_url) setSignaturePreview(initialCorrespondence.signature_url);
        setFetchingData(false);
      } catch {}
    }
  }, [isEditMode, initialCorrespondence]);

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
    // Fetch entities for dropdown from ClickHouse
    const fetchEntities = async () => {
      try {
        const { clickhouseApi } = await import('@/lib/clickhouseClient');
        const data = await clickhouseApi.listEntities();
        console.log('Fetched entities:', data);
        console.log('Entities count:', data?.length);
        
        // Remove duplicates by id
        const byId: Record<string, Entity> = {} as any;
        (data || []).forEach((e: any) => {
          if (e?.id && !byId[e.id]) byId[e.id] = e;
        });
        const uniqueById = Object.values(byId) as Entity[];
        
        // Then remove duplicates by name (Radix Select uses value for keys internally)
        const seenNames = new Set<string>();
        const uniqueByName: Entity[] = [];
        uniqueById.forEach((e) => {
          const name = e?.name?.trim?.() || e?.name;
          if (name && !seenNames.has(name)) {
            seenNames.add(name);
            uniqueByName.push(e);
          }
        });
        
        console.log('Unique by id:', uniqueById.length, 'Unique by name:', uniqueByName.length);
        setEntities(uniqueByName);
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
          console.log('Fetching correspondence for edit mode, id:', id);
          // Try fetching from ClickHouse first (for drafts)
          const { clickhouseApi } = await import('@/lib/clickhouseClient');
          const data = await clickhouseApi.getCorrespondence(id);
          console.log('Fetched correspondence data:', data);
          console.log('Data type:', data?.type);
          console.log('Data number:', data?.number);
          console.log('Data date:', data?.date);
          console.log('Data from_entity:', data?.from_entity);
          console.log('Data attachments:', data?.attachments, 'is array?', Array.isArray(data?.attachments));

          if (data) {
            // Normalize date to YYYY-MM-DD safely across formats
            const computeDateOnly = (raw: any) => {
              try {
                if (!raw) return new Date().toISOString().split('T')[0];
                if (typeof raw === 'string') {
                  const justDate = raw.match(/^\d{4}-\d{2}-\d{2}$/);
                  if (justDate) return raw;
                  let s = raw.trim();
                  if (s.includes(' ') && !s.includes('T')) s = s.replace(' ', 'T');
                  const d1 = new Date(s);
                  if (!isNaN(d1.getTime())) return d1.toISOString().split('T')[0];
                } else if (typeof raw === 'number') {
                  const dSec = new Date(raw * 1000);
                  if (!isNaN(dSec.getTime())) return dSec.toISOString().split('T')[0];
                  const dMs = new Date(raw);
                  if (!isNaN(dMs.getTime())) return dMs.toISOString().split('T')[0];
                }
                const d = new Date(raw);
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
              } catch (e) {
                console.warn('Failed to parse date, defaulting to today. Raw:', raw);
              }
              return new Date().toISOString().split('T')[0];
            };
            const dateOnly = computeDateOnly((data as any).date);

            setFormData({
              type: data.type || 'outgoing',
              number: data.number || '',
              date: dateOnly,
              from: data.from_entity || '',
              to: data.received_by_entity || '',
              subject: data.subject || '',
              greeting: data.greeting || 'السيد/',
              content: data.content || '',
              responsiblePerson: data.responsible_person || '',
              displayType: (data.display_type || 'content') as 'content' | 'attachment_only',
            });
            
            // Check if it's a draft
            if ((data as any).status === 'draft') {
              setIsDraft(true);
              console.log('Draft detected, isDraft set to true');
            }
            
            // Lock display type after archive or external send
            const locked = (data.archived === true) || ((data as any).status && (data as any).status !== 'draft');
            setIsLocked(Boolean(locked));
            
            if (data.signature_url) {
              setSignaturePreview(data.signature_url);
            }
            
            // Ensure attachments is always an array
            if (data.attachments) {
              if (Array.isArray(data.attachments)) {
                setExistingAttachments(data.attachments);
              } else {
                console.warn('Attachments is not an array, resetting to empty:', data.attachments);
                setExistingAttachments([]);
              }
            } else {
              setExistingAttachments([]);
            }
          } else {
            console.error('No data returned from API');
          }
        } catch (err) {
          console.error('Error fetching correspondence:', err);
          toast({
            title: "خطأ",
            description: "فشل تحميل بيانات المراسلة",
            variant: "destructive",
          });
        } finally {
          console.log('Setting fetchingData to false');
          setFetchingData(false);
        }
      };

      fetchCorrespondence();
    } else if (!isEditMode) {
      // Not in edit mode, make sure fetchingData is false
      setFetchingData(false);
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
    
    console.log('Archiving with displayType:', formData.displayType);
    
    // التحقق من رقم الكتاب والجهة المستلمة والجهة المرسلة
    if (!formData.number || formData.number.trim() === '') {
      toast({
        title: "خطأ",
        description: "يجب إدخال رقم الكتاب",
        variant: "destructive",
      });
      return;
    }

    if (!formData.from || formData.from.trim() === '') {
      toast({
        title: "خطأ",
        description: "الجهة المرسلة غير محددة",
        variant: "destructive",
      });
      return;
    }

    if (!formData.to) {
      toast({
        title: "خطأ",
        description: "يجب اختيار الجهة المستلمة",
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

      console.log('Correspondence data being saved:', correspondenceData);
      console.log('Display type in data:', correspondenceData.display_type);

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
    
    console.log('Submitting with displayType:', formData.displayType);
    
    // التحقق من رقم الكتاب والجهة المستلمة والجهة المرسلة
    if (!formData.number || formData.number.trim() === '') {
      toast({
        title: "خطأ",
        description: "يجب إدخال رقم الكتاب",
        variant: "destructive",
      });
      return;
    }

    if (!formData.from || formData.from.trim() === '') {
      toast({
        title: "خطأ",
        description: "الجهة المرسلة غير محددة",
        variant: "destructive",
      });
      return;
    }

    if (!formData.to) {
      toast({
        title: "خطأ",
        description: "يجب اختيار الجهة المستلمة",
        variant: "destructive",
      });
      return;
    }

    // التحقق من الاتصال بالجهة الخارجية عند محاولة الإرسال الخارجي
    if (shouldSendExternal) {
      // TODO: Implement external connection check via ClickHouse API if needed
      console.log('External send requested, skipping connection check for now');
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

      console.log('Correspondence data being saved:', correspondenceData);
      console.log('Display type in data:', correspondenceData.display_type);

      const { clickhouseApi } = await import('@/lib/clickhouseClient');

      if (isEditMode && id) {
        // Update existing correspondence in ClickHouse
        await clickhouseApi.updateCorrespondence(id, {
          ...correspondenceData,
          status: isDraft ? 'sent' : 'sent',
          archived: isDraft ? false : false
        });
        
        toast({
          title: isDraft ? "تم الإرسال بنجاح" : "تم التحديث بنجاح",
          description: isDraft ? "تم تحديث المسودة وإرسال المراسلة" : "تم تحديث المراسلة",
        });
        
        navigate(isDraft ? '/sent' : `/correspondence/${id}`);
      } else {
        // Create new correspondence in ClickHouse
        const result = await clickhouseApi.createCorrespondence({
          ...correspondenceData,
          status: 'sent',
          archived: false
        });

        toast({
          title: "تم الحفظ بنجاح",
          description: "تم حفظ المراسلة الجديدة",
        });

        navigate('/sent');
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
              <Label htmlFor="displayType">نوع عرض الكتاب</Label>
              <Select
                value={formData.displayType}
                onValueChange={(value: 'content' | 'attachment_only') => 
                  setFormData({ ...formData, displayType: value })
                }
                disabled={loading || isLocked}
              >
                <SelectTrigger id="displayType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">كتابة المحتوى</SelectItem>
                  <SelectItem value="attachment_only">مرفق فقط</SelectItem>
                </SelectContent>
              </Select>
              {isLocked && (
                <p className="text-sm text-muted-foreground mt-1">لا يمكن تغيير نوع العرض بعد الأرشفة أو الإرسال الخارجي</p>
              )}
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
                placeholder="يجب إدخال رقم الكتاب"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from">الجهة المرسلة</Label>
              <Input
                id="from"
                value={formData.from}
                disabled={true}
                className="bg-muted cursor-not-allowed"
                placeholder="سيتم تعيين جهتك تلقائياً"
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
                    {entities.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">لا توجد جهات</div>
                    ) : (
                      entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.name}>
                          {entity.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                  <Label htmlFor="greeting">التحية</Label>
                  <Textarea
                    id="greeting"
                    value={formData.greeting}
                    onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">الموضوع</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">المحتوى</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
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
              <Label htmlFor="attachments">المرفقات</Label>
              <div className="flex gap-2">
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleAttachmentChange}
                  disabled={loading}
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
