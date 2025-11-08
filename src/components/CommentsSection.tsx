import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MessageSquare, Send, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Comment {
  id: string;
  correspondence_id: string;
  user_id: number;
  comment: string;
  is_internal: boolean;
  parent_comment_id: string | null;
  mentioned_users: number[];
  attachments: string[];
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    username: string;
  };
}

interface CommentsSectionProps {
  correspondenceId: string;
  currentUserId: number;
}

export function CommentsSection({ correspondenceId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // جلب التعليقات
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('correspondence_comments')
        .select(`
          *,
          user:users(full_name, username)
        `)
        .eq('correspondence_id', correspondenceId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // الاشتراك في Realtime
    const channel = supabase
      .channel(`comments-${correspondenceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'correspondence_comments',
          filter: `correspondence_id=eq.${correspondenceId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [correspondenceId]);

  // إضافة تعليق جديد
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('correspondence_comments')
        .insert({
          correspondence_id: correspondenceId,
          user_id: currentUserId,
          comment: newComment.trim(),
          is_internal: true
        });

      if (error) throw error;

      setNewComment('');
      toast({
        title: 'تم إضافة التعليق',
        description: 'تم إضافة تعليقك بنجاح',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إضافة التعليق',
        variant: 'destructive',
      });
    }
  };

  // تحديث تعليق
  const handleUpdateComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('correspondence_comments')
        .update({ comment: editText.trim() })
        .eq('id', commentId);

      if (error) throw error;

      setEditingId(null);
      setEditText('');
      toast({
        title: 'تم تحديث التعليق',
        description: 'تم تحديث تعليقك بنجاح',
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث التعليق',
        variant: 'destructive',
      });
    }
  };

  // حذف تعليق
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;

    try {
      const { error } = await supabase
        .from('correspondence_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'تم حذف التعليق',
        description: 'تم حذف التعليق بنجاح',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف التعليق',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">التعليقات ({comments.length})</h3>
      </div>

      <ScrollArea className="h-[400px] border rounded-md p-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            جاري التحميل...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            لا توجد تعليقات بعد. كن أول من يعلق!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.user?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {comment.user?.full_name || 'مستخدم'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{comment.user?.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ar
                        })}
                      </span>
                      {comment.is_edited && (
                        <Badge variant="secondary" className="text-xs">
                          معدّل
                        </Badge>
                      )}
                    </div>

                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateComment(comment.id)}
                          >
                            حفظ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setEditText('');
                            }}
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    )}

                    {comment.user_id === currentUserId && editingId !== comment.id && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditText(comment.comment);
                          }}
                        >
                          <Edit2 className="h-3 w-3 ml-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-3 w-3 ml-1" />
                          حذف
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* إضافة تعليق جديد */}
      <div className="space-y-2">
        <Textarea
          placeholder="اكتب تعليقك هنا..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            اضغط Ctrl+Enter للإرسال
          </span>
          <Button onClick={handleAddComment} disabled={!newComment.trim()}>
            <Send className="h-4 w-4 ml-2" />
            إرسال
          </Button>
        </div>
      </div>
    </div>
  );
}
