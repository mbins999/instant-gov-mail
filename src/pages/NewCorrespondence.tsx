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
    content: '',
  });

  const hijriDate = useMemo(() => {
    const date = new Date(formData.date);
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }, [formData.date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('correspondences')
        .insert([{
          number: formData.number,
          type: formData.type,
          date: formData.date,
          from_entity: formData.to,
          subject: formData.subject,
          content: formData.content,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="text-muted-foreground">الهجري: {hijriDate}</div>
                  <div className="text-muted-foreground">الميلادي: {new Date(formData.date).toLocaleDateString('ar-SA')}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">الجهة المستلمة *</Label>
              <Input
                id="to"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder="الجهة المستلمة"
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
                placeholder="موضوع المراسلة"
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
                placeholder="محتوى المراسلة"
                rows={8}
                required
                disabled={loading}
              />
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
