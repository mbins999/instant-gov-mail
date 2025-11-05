import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground mt-2">إعدادات النظام والحساب</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>معلومات الجهة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">اسم الجهة</Label>
              <Input id="org-name" placeholder="اسم الجهة الحكومية" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="org-code">رمز الجهة</Label>
              <Input id="org-code" placeholder="رمز الجهة" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="org-address">العنوان</Label>
              <Input id="org-address" placeholder="عنوان الجهة" />
            </div>
            
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إعدادات المراسلات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="incoming-prefix">بادئة الوارد</Label>
              <Input id="incoming-prefix" placeholder="IN" defaultValue="IN" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="outgoing-prefix">بادئة الصادر</Label>
              <Input id="outgoing-prefix" placeholder="OUT" defaultValue="OUT" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current-year">السنة الحالية</Label>
              <Input id="current-year" placeholder="2024" defaultValue="2024" />
            </div>
            
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
