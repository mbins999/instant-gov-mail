import { Correspondence, CorrespondencePriority, CorrespondenceStatus } from '@/types/correspondence';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CorrespondenceTableProps {
  correspondences: Correspondence[];
}

const priorityLabels: Record<CorrespondencePriority, string> = {
  'normal': 'عادي',
  'urgent': 'مستعجل',
  'very-urgent': 'عاجل جداً',
};

const priorityVariants: Record<CorrespondencePriority, 'default' | 'secondary' | 'destructive'> = {
  'normal': 'secondary',
  'urgent': 'default',
  'very-urgent': 'destructive',
};

const statusLabels: Record<CorrespondenceStatus, string> = {
  'pending': 'قيد الانتظار',
  'in-progress': 'قيد المعالجة',
  'completed': 'مكتمل',
  'archived': 'مؤرشف',
};

const statusVariants: Record<CorrespondenceStatus, 'default' | 'secondary' | 'outline'> = {
  'pending': 'outline',
  'in-progress': 'default',
  'completed': 'secondary',
  'archived': 'secondary',
};

export default function CorrespondenceTable({ correspondences }: CorrespondenceTableProps) {
  const navigate = useNavigate();

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-right p-4 font-semibold">الرقم</th>
            <th className="text-right p-4 font-semibold">الموضوع</th>
            <th className="text-right p-4 font-semibold">من</th>
            <th className="text-right p-4 font-semibold">إلى</th>
            <th className="text-right p-4 font-semibold">التاريخ</th>
            <th className="text-right p-4 font-semibold">الأولوية</th>
            <th className="text-right p-4 font-semibold">الحالة</th>
            <th className="text-right p-4 font-semibold">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {correspondences.map((item, index) => (
            <tr 
              key={item.id} 
              className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
            >
              <td className="p-4 font-mono text-sm">{item.number}</td>
              <td className="p-4 font-semibold">{item.subject}</td>
              <td className="p-4 text-sm">{item.from}</td>
              <td className="p-4 text-sm">{item.to}</td>
              <td className="p-4 text-sm">{item.date.toLocaleDateString('ar-SA')}</td>
              <td className="p-4">
                <Badge variant={priorityVariants[item.priority]}>
                  {priorityLabels[item.priority]}
                </Badge>
              </td>
              <td className="p-4">
                <Badge variant={statusVariants[item.status]}>
                  {statusLabels[item.status]}
                </Badge>
              </td>
              <td className="p-4">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => navigate(`/correspondence/${item.id}`)}
                >
                  <Eye className="h-4 w-4 ml-2" />
                  عرض
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
