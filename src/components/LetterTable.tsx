import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Letter {
  id: number;
  ref_no: string;
  subject: string;
  status: string;
  created_at: string;
  received_at?: string;
  sender_org?: {
    name: string;
  };
}

interface LetterTableProps {
  letters: Letter[];
  onReceive?: () => void;
}

export const LetterTable = ({ letters, onReceive }: LetterTableProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<number | null>(null);

  const handleReceive = async (letter: Letter) => {
    try {
      setLoading(letter.id);
      
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        toast.error('المستخدم غير مصادق');
        return;
      }

      const currentUser = JSON.parse(userStr);
      const receivedAt = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('letters')
        .update({
          received_by: currentUser.id,
          received_at: receivedAt,
          status: 'received'
        })
        .eq('id', letter.id);

      if (updateError) throw updateError;

      await supabase
        .from('letter_status_history')
        .insert({
          letter_id: letter.id,
          old_status: letter.status,
          new_status: 'received',
          changed_by: currentUser.id
        });

      toast.success('تم استلام المراسلة بنجاح');
      if (onReceive) onReceive();
    } catch (error) {
      console.error('Error receiving letter:', error);
      toast.error('فشل في استلام المراسلة');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>رقم الإشارة</TableHead>
          <TableHead>الموضوع</TableHead>
          <TableHead>الجهة المرسلة</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>تاريخ الإنشاء</TableHead>
          <TableHead>الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {letters.map((letter) => (
          <TableRow key={letter.id}>
            <TableCell>
              <button
                onClick={() => navigate(`/letter/${letter.id}`)}
                className="text-primary hover:underline"
              >
                {letter.ref_no}
              </button>
            </TableCell>
            <TableCell>{letter.subject}</TableCell>
            <TableCell>{letter.sender_org?.name || 'غير محدد'}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded text-sm ${
                letter.status === 'received' ? 'bg-green-100 text-green-800' :
                letter.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                letter.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {letter.status === 'received' ? 'مستلم' :
                 letter.status === 'sent' ? 'مرسل' :
                 letter.status === 'archived' ? 'مؤرشف' :
                 'مسودة'}
              </span>
            </TableCell>
            <TableCell>
              {new Date(letter.created_at).toLocaleDateString('ar-SA')}
            </TableCell>
            <TableCell>
              {!letter.received_at && letter.status === 'sent' && (
                <Button
                  onClick={() => handleReceive(letter)}
                  disabled={loading === letter.id}
                  size="sm"
                >
                  {loading === letter.id ? 'جاري الاستلام...' : 'استلام'}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
        {letters.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              لا توجد مراسلات
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
