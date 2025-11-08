import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NotificationsPopoverProps {
  userId: number | null;
}

export function NotificationsPopover({ userId }: NotificationsPopoverProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications(userId);
  const navigate = useNavigate();

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    
    if (notification.action_url) {
      navigate(notification.action_url);
    } else if (notification.correspondence_id) {
      navigate(`/correspondence/${notification.correspondence_id}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new_correspondence':
        return '📨';
      case 'pending_approval':
        return '⏳';
      case 'comment':
        return '💬';
      case 'mention':
        return '👤';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 ml-1" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              لا توجد إشعارات
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <div className={`h-2 w-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ar
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-xs"
              onClick={() => navigate('/notifications')}
            >
              عرض جميع الإشعارات
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
