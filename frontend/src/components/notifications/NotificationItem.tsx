import React from 'react';
import { 
  Bot, 
  User, 
  Settings, 
  TrendingUp, 
  Shield, 
  Clock, 
  ExternalLink,
  Check,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Notification, NotificationPriority } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const getTypeIcon = (type: string) => {
    const icons = {
      automation: Bot,
      user: User,
      system: Settings,
      trading: TrendingUp,
      security: Shield,
    };
    const Icon = icons[type as keyof typeof icons] || Info;
    return <Icon className="h-4 w-4" />;
  };

  const getPriorityIcon = (priority: NotificationPriority) => {
    const icons = {
      low: Info,
      medium: AlertCircle,
      high: AlertTriangle,
      critical: AlertCircle,
    };
    const Icon = icons[priority];
    return <Icon className="h-3 w-3" />;
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      critical: 'text-red-500',
    };
    return colors[priority];
  };

  const getPriorityBgColor = (priority: NotificationPriority) => {
    const colors = {
      low: 'bg-gray-100 dark:bg-gray-800',
      medium: 'bg-blue-100 dark:bg-blue-900/20',
      high: 'bg-orange-100 dark:bg-orange-900/20',
      critical: 'bg-red-100 dark:bg-red-900/20',
    };
    return colors[priority];
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return timestamp.toLocaleDateString('pt-BR');
  };

  const handleActionClick = () => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    if (!notification.read) {
      onMarkAsRead();
    }
  };

  return (
    <div
      className={cn(
        'group relative p-3 rounded-lg transition-all duration-200 hover:bg-accent/50 cursor-pointer dropdown-item-glassmorphism',
        !notification.read && 'bg-primary/5 border-l-2 border-l-primary'
      )}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 p-2 rounded-full',
          getPriorityBgColor(notification.priority)
        )}>
          {getTypeIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={cn(
                  'text-sm font-medium truncate',
                  !notification.read ? 'text-text-primary' : 'text-text-secondary'
                )}>
                  {notification.title}
                </h4>
                <div className="flex items-center space-x-1">
                  <div className={cn(
                    'flex items-center space-x-1',
                    getPriorityColor(notification.priority)
                  )}>
                    {getPriorityIcon(notification.priority)}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'text-xs px-1.5 py-0.5',
                      getPriorityBgColor(notification.priority),
                      getPriorityColor(notification.priority)
                    )}
                  >
                    {notification.priority}
                  </Badge>
                </div>
              </div>
              
              <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-text-secondary">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(notification.timestamp)}</span>
                </div>
                
                {notification.actionUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleActionClick}
                    className="text-xs h-6 px-2 text-primary hover:text-primary/80"
                  >
                    {notification.actionText || 'Ver detalhes'}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center space-x-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead();
                }}
                className="h-6 w-6 p-0 text-text-secondary hover:text-primary"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-6 w-6 p-0 text-text-secondary hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full" />
      )}
    </div>
  );
}
