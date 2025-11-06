import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function NewCorrespondence() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'outgoing',
    number: '',
    date: new Date().toISOString().split('T')[0],
    to: '',
    subject: '',
    greeting: 'السيد/   المحترم\nالسلام عليكم ورحمة الله وبركاته ,,,',
    content: '\nوتفضلوا بقبول فائق الاحترام ,,,',
    responsiblePerson: '',
  });
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let signatureUrl = '';
      
      // Upload signature if provided
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

      const { error } = await supabase
        .from('correspondences')
        .insert([{
          number: formData.number,
          type: formData.type,
          date: formData.date,
          from_entity: formData.to,
          subject: formData.subject,
          greeting: formData.greeting,
          content: formData.content,
          responsible_person: formData.responsiblePerson,
          signature_url: signatureUrl,
        }]);

      if (error) throw error;

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ المراسلة الجديدة",
      });
      
      navigate('/');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">مراسلة جديدة</h1>
        <p className="text-muted-foreground mt-2">إنشاء مراسلة واردة أو صادرة جديدة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات المراسلة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="flex gap-4">
              <Button type="submit" className="gap-2" disabled={loading}>
                <Save className="h-4 w-4" />
                {loading ? 'جاري الحفظ...' : 'حفظ المراسلة'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/')} disabled={loading}>
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
