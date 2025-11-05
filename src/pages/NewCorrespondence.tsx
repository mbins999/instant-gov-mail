import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function NewCorrespondence() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    from: '',
    to: '',
    priority: '',
    content: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم حفظ المراسلة الجديدة",
    });
    
    setFormData({
      type: '',
      subject: '',
      from: '',
      to: '',
      priority: '',
      content: '',
    });
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
                <Label htmlFor="type">نوع المراسلة *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المراسلة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">واردة</SelectItem>
                    <SelectItem value="outgoing">صادرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">الأولوية *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">عادي</SelectItem>
                    <SelectItem value="urgent">مستعجل</SelectItem>
                    <SelectItem value="very-urgent">عاجل جداً</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from">من *</Label>
                <Input
                  id="from"
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                  placeholder="الجهة المرسلة"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">إلى *</Label>
                <Input
                  id="to"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  placeholder="الجهة المستقبلة"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">الموضوع *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="موضوع المراسلة"
                required
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
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                حفظ المراسلة
              </Button>
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
