import React, { useState } from 'react';
import { Bell, X, Check, Trash2, Settings, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification, NotificationType, NotificationPriority } from '@/types/notification';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  isScrolled?: boolean;
}

export function NotificationDropdown({ isScrolled = false }: NotificationDropdownProps) {
  const { theme } = useTheme();
  const { state, markAsRead, markAllAsRead, deleteNotification, addSampleNotification } = useNotifications();
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all');

  // Filtrar notificações
  const filteredNotifications = state.notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;
    return true;
  });

  // Agrupar notificações por tipo
  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const type = notification.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(notification);
    return acc;
  }, {} as Record<NotificationType, Notification[]>);

  const getTypeLabel = (type: NotificationType) => {
    const labels = {
      automation: 'Automações',
      user: 'Usuário',
      system: 'Sistema',
      trading: 'Trading',
      security: 'Segurança',
    };
    return labels[type];
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    const colors = {
      low: 'bg-gray-500',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    };
    return colors[priority];
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleAddSample = (type: NotificationType) => {
    addSampleNotification(type);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'transition-all duration-300 text-text-secondary hover:text-primary hover:bg-accent/50 relative group subtle-hover',
            isScrolled ? 'h-7 w-7' : 'h-9 w-9'
          )}
        >
          <Bell className={cn(
            'transition-all duration-300',
            isScrolled ? 'h-3 w-3' : 'h-4 w-4'
          )} />
          {/* Notification Badge */}
          {state.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold px-1 notification-badge">
              {state.unreadCount > 99 ? '99+' : state.unreadCount}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className={cn(
          "w-96 transition-all duration-300 relative",
          theme === 'dark' 
            ? 'dropdown-glassmorphism text-text-primary' 
            : 'dropdown-glassmorphism-light text-text-primary'
        )}
        align="end"
        forceMount
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className={cn(
              "text-lg font-semibold",
              theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
            )}>
              Notificações
            </h3>
            <div className="flex items-center space-x-2">
              {state.unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-text-secondary hover:text-primary"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex space-x-2">
            <Select value={filterType} onValueChange={(value) => setFilterType(value as NotificationType | 'all')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="automation">Automações</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="trading">Trading</SelectItem>
                <SelectItem value="security">Segurança</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as NotificationPriority | 'all')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-96">
          {state.isLoading ? (
            <div className="p-4 text-center text-text-secondary">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
              Carregando notificações...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-4 text-center text-text-secondary">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação encontrada</p>
              <p className="text-xs text-text-secondary mt-1">
                {filterType !== 'all' || filterPriority !== 'all' 
                  ? 'Tente ajustar os filtros' 
                  : 'Você está em dia!'
                }
              </p>
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedNotifications).map(([type, notifications]) => (
                <div key={type} className="mb-4">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h4 className="text-sm font-medium text-text-primary">
                      {getTypeLabel(type as NotificationType)}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {notifications.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => markAsRead(notification.id)}
                        onDelete={() => deleteNotification(notification.id)}
                      />
                    ))}
                  </div>
                  
                  {Object.keys(groupedNotifications).indexOf(type) < Object.keys(groupedNotifications).length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer - Apenas para desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3 bg-muted/50">
              <p className="text-xs text-text-secondary mb-2">Desenvolvimento - Adicionar amostras:</p>
              <div className="flex flex-wrap gap-1">
                {(['automation', 'user', 'system', 'trading', 'security'] as NotificationType[]).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSample(type)}
                    className="text-xs h-6 px-2"
                  >
                    {getTypeLabel(type)}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
