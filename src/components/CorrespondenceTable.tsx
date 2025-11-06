import { Correspondence } from '@/types/correspondence';
import { useNavigate } from 'react-router-dom';

interface CorrespondenceTableProps {
  correspondences: Correspondence[];
}

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
            <th className="text-right p-4 font-semibold">مستلم الكتاب</th>
            <th className="text-right p-4 font-semibold">التاريخ</th>
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
              <td className="p-4 text-sm">{item.recipient}</td>
              <td className="p-4 text-sm">{item.date.toLocaleDateString('en-GB')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
