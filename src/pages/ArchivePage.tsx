import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CorrespondenceTable from '@/components/CorrespondenceTable';
import { useCorrespondences } from '@/hooks/useCorrespondences';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Archive, ArchiveX } from 'lucide-react';
import { getAuthenticatedSupabaseClient } from '@/lib/supabaseAuth';
import { useToast } from '@/hooks/use-toast';

export default function ArchivePage() {
  const { correspondences, loading, error, refetch } = useCorrespondences();
  const [archiving, setArchiving] = useState(false);
  const { toast } = useToast();
  
  // في المستقبل سنضيف حقل archived في قاعدة البيانات
  // حالياً نعرض جميع المراسلات
  const archivedCorrespondences = correspondences;

  const handleArchive = async (id: string) => {
    setArchiving(true);
    try {
      const supabase = getAuthenticatedSupabaseClient();
      // سيتم تفعيل هذا لاحقاً عند إضافة حقل archived
      toast({
        title: "قريباً",
        description: "سيتم تفعيل الأرشفة قريباً",
      });
    } catch (err) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في الأرشفة",
        variant: "destructive",
      });
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>حدث خطأ: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>المراسلات المؤرشفة ({archivedCorrespondences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {archivedCorrespondences.length > 0 ? (
            <CorrespondenceTable correspondences={archivedCorrespondences} onReceive={refetch} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد مراسلات مؤرشفة حالياً
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
