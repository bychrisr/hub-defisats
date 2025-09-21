export type NotificationType = 'automation' | 'user' | 'system' | 'trading' | 'security';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

export interface NotificationGroup {
  type: NotificationType;
  count: number;
  unreadCount: number;
  latestNotification?: Notification;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

// Tipos específicos de notificação para facilitar a criação
export interface AutomationNotification extends Omit<Notification, 'type'> {
  type: 'automation';
  automationId: string;
  automationName: string;
  status: 'started' | 'stopped' | 'completed' | 'error' | 'warning';
}

export interface UserNotification extends Omit<Notification, 'type'> {
  type: 'user';
  userId: string;
  action: 'login' | 'logout' | 'profile_updated' | 'password_changed';
}

export interface SystemNotification extends Omit<Notification, 'type'> {
  type: 'system';
  component: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

export interface TradingNotification extends Omit<Notification, 'type'> {
  type: 'trading';
  positionId?: string;
  action: 'position_opened' | 'position_closed' | 'margin_call' | 'liquidation' | 'profit' | 'loss';
  amount?: number;
  currency?: string;
}

export interface SecurityNotification extends Omit<Notification, 'type'> {
  type: 'security';
  event: 'suspicious_activity' | 'login_attempt' | 'api_key_used' | 'permission_changed';
  severity: 'low' | 'medium' | 'high' | 'critical';
}
