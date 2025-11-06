import { Mail, Send, Archive, Clock } from 'lucide-react';
import { mockCorrespondences } from '@/data/correspondenceData';

export default function NotificationBar() {
  const incomingCount = mockCorrespondences.filter(c => c.type === 'incoming').length;
  const outgoingCount = mockCorrespondences.filter(c => c.type === 'outgoing').length;
  const totalCount = mockCorrespondences.length;

  const stats = [
    { label: 'الإجمالي', value: totalCount, icon: Archive, color: 'text-primary' },
    { label: 'الواردة', value: incomingCount, icon: Mail, color: 'text-success' },
    { label: 'الصادرة', value: outgoingCount, icon: Send, color: 'text-foreground' },
  ];

  return (
    <div className="bg-card border-b border-border px-8 py-3">
      <div className="flex items-center gap-8">
        <span className="text-sm font-medium text-muted-foreground">نظرة عامة:</span>
        <div className="flex items-center gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-sm font-medium">{stat.label}:</span>
                <span className="text-sm font-bold">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
