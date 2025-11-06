import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Edit, Printer, Archive } from 'lucide-react';
import { mockCorrespondences } from '@/data/correspondenceData';

export default function CorrespondenceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const correspondence = mockCorrespondences.find(c => c.id === id);

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
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{correspondence.subject}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">المحتوى:</h3>
              <p className="text-foreground/80 leading-relaxed">{correspondence.content}</p>
            </div>
            
            {correspondence.attachments && correspondence.attachments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">المرفقات:</h3>
                <div className="space-y-2">
                  {correspondence.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="text-sm">{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات المراسلة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">النوع</p>
                <p className="font-semibold">
                  {correspondence.type === 'incoming' ? 'واردة' : 'صادرة'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">من</p>
                <p className="font-semibold">{correspondence.from}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">مستلم الكتاب</p>
                <p className="font-semibold">{correspondence.recipient}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">التاريخ</p>
                <p className="font-semibold">
                  {correspondence.date.toLocaleDateString('en-GB')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
