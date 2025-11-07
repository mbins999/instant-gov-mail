import { Correspondence } from '@/types/correspondence';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CorrespondenceTableProps {
  correspondences: Correspondence[];
  onReceive?: () => void;
}

export default function CorrespondenceTable({ correspondences, onReceive }: CorrespondenceTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReceive = async (correspondenceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get authenticated user from Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    // Get user ID from users table
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('id', parseInt(session.user.id))
      .maybeSingle();

    if (!userData) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على بيانات المستخدم",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('correspondences')
      .update({ 
        received_by: userData.id,
        received_at: new Date().toISOString()
      })
      .eq('id', correspondenceId);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل تسجيل الاستلام",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم الاستلام",
        description: "تم تسجيل استلام الكتاب بنجاح",
      });
      onReceive?.();
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-right p-4 font-semibold">الرقم</th>
            <th className="text-right p-4 font-semibold">الموضوع</th>
            <th className="text-right p-4 font-semibold">من</th>
            <th className="text-right p-4 font-semibold">استلام بواسطة</th>
            <th className="text-right p-4 font-semibold">التاريخ</th>
            <th className="text-right p-4 font-semibold">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {correspondences.map((item, index) => (
            <tr 
              key={item.id} 
              className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
            >
              <td 
                className="p-4 font-mono text-sm text-primary hover:underline cursor-pointer"
                onClick={() => navigate(`/correspondence/${item.id}`)}
              >
                {item.number}
              </td>
              <td className="p-4 font-semibold">{item.subject}</td>
              <td className="p-4 text-sm">{item.from}</td>
              <td className="p-4 text-sm">
                {item.received_by_profile ? item.received_by_profile.full_name : '-'}
              </td>
              <td className="p-4 text-sm">{new Date(item.date).toLocaleDateString('en-GB')}</td>
              <td className="p-4">
                {!item.received_by && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={(e) => handleReceive(item.id, e)}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    استلام
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
