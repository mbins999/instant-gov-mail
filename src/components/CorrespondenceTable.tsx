import { Correspondence } from '@/types/correspondence';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CorrespondenceTableProps {
  correspondences: Correspondence[];
  onReceive?: () => void;
  showEditDraft?: boolean;
}

export default function CorrespondenceTable({ correspondences, onReceive, showEditDraft = false }: CorrespondenceTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReceive = async (correspondenceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get user from localStorage
    try {
      const userSession = localStorage.getItem('user_session');
      if (!userSession) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive",
        });
        return;
      }

      const userData = JSON.parse(userSession);
      const userId = userData.id;

      if (!userId) {
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
          received_by: userId,
          received_at: new Date().toISOString()
        })
        .eq('id', correspondenceId);

      if (error) {
        console.error('Receive error:', error);
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
    } catch (err) {
      console.error('Error in handleReceive:', err);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
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
            <th className="text-right p-4 font-semibold">الحالة</th>
            <th className="text-right p-4 font-semibold">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {correspondences.map((item, index) => {
            const isDraft = (item as any).status === 'draft';
            return (
              <tr 
                key={item.id} 
                className={`${isDraft ? 'bg-red-50 dark:bg-red-950/20' : index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
              >
                <td 
                  className="p-4 font-mono text-sm text-primary hover:underline cursor-pointer"
                  onClick={() => {
                    const isDraft = (item as any).status === 'draft';
                    if (showEditDraft && isDraft) {
                      navigate(`/edit/${item.id}`, { state: item });
                    } else {
                      navigate(`/correspondence/${item.id}`, { state: item });
                    }
                  }}
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
                  {isDraft && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      مسودة
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {!item.received_by && !isDraft && (
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
