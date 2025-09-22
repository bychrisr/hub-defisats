import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationType, NotificationPriority } from '@/types/notification';

export function useNotificationActions() {
  const { addNotification } = useNotifications();

  // Funções helper para criar notificações específicas
  const createAutomationNotification = (
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    metadata?: Record<string, any>
  ) => {
    addNotification({
      type: 'automation',
      priority,
      title,
      message,
      read: false,
      metadata,
    });
  };

  const createUserNotification = (
    title: string,
    message: string,
    priority: NotificationPriority = 'low',
    actionUrl?: string,
    actionText?: string
  ) => {
    addNotification({
      type: 'user',
      priority,
      title,
      message,
      read: false,
      actionUrl,
      actionText,
    });
  };

  const createSystemNotification = (
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    component?: string,
    level?: 'info' | 'warning' | 'error' | 'success'
  ) => {
    addNotification({
      type: 'system',
      priority,
      title,
      message,
      read: false,
      metadata: { component, level },
    });
  };

  const createTradingNotification = (
    title: string,
    message: string,
    priority: NotificationPriority = 'high',
    positionId?: string,
    amount?: number,
    currency?: string,
    actionUrl?: string
  ) => {
    addNotification({
      type: 'trading',
      priority,
      title,
      message,
      read: false,
      actionUrl,
      actionText: 'Ver Detalhes',
      metadata: { positionId, amount, currency },
    });
  };

  const createSecurityNotification = (
    title: string,
    message: string,
    priority: NotificationPriority = 'high',
    event?: string,
    severity?: 'low' | 'medium' | 'high' | 'critical',
    actionUrl?: string
  ) => {
    addNotification({
      type: 'security',
      priority,
      title,
      message,
      read: false,
      actionUrl,
      actionText: 'Ver Detalhes',
      metadata: { event, severity },
    });
  };

  // Notificações específicas do sistema
  const notifyAutomationStarted = (automationName: string, automationId: string) => {
    createAutomationNotification(
      'Automação Iniciada',
      `${automationName} foi iniciada com sucesso`,
      'medium',
      { automationId, automationName, status: 'started' }
    );
  };

  const notifyAutomationStopped = (automationName: string, automationId: string) => {
    createAutomationNotification(
      'Automação Parada',
      `${automationName} foi parada`,
      'medium',
      { automationId, automationName, status: 'stopped' }
    );
  };

  const notifyAutomationError = (automationName: string, error: string, automationId: string) => {
    createAutomationNotification(
      'Erro na Automação',
      `${automationName}: ${error}`,
      'critical',
      { automationId, automationName, status: 'error', error }
    );
  };

  const notifyPositionOpened = (symbol: string, positionId: string, amount?: number) => {
    createTradingNotification(
      'Posição Aberta',
      `Nova posição ${symbol}${amount ? ` (${amount} SATS)` : ''}`,
      'high',
      positionId,
      amount,
      'SATS',
      '/positions'
    );
  };

  const notifyPositionClosed = (symbol: string, profit: number, positionId: string) => {
    const isProfit = profit > 0;
    createTradingNotification(
      'Posição Fechada',
      `Posição ${symbol} fechada com ${isProfit ? 'lucro' : 'prejuízo'} de ${Math.abs(profit).toFixed(2)}%`,
      'high',
      positionId,
      profit,
      'SATS',
      '/positions'
    );
  };

  const notifyMarginCall = (symbol: string, positionId: string) => {
    createTradingNotification(
      'Margin Call',
      `Atenção: Margin call na posição ${symbol}`,
      'critical',
      positionId,
      undefined,
      'SATS',
      '/positions'
    );
  };

  const notifyLiquidation = (symbol: string, positionId: string) => {
    createTradingNotification(
      'Liquidação',
      `Posição ${symbol} foi liquidada`,
      'critical',
      positionId,
      undefined,
      'SATS',
      '/positions'
    );
  };

  const notifySystemMaintenance = (message: string, priority: NotificationPriority = 'medium') => {
    createSystemNotification(
      'Manutenção do Sistema',
      message,
      priority,
      'system',
      'info'
    );
  };

  const notifySecurityAlert = (event: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    createSecurityNotification(
      'Alerta de Segurança',
      message,
      severity === 'critical' ? 'critical' : 'high',
      event,
      severity,
      '/security'
    );
  };

  const notifyUserAction = (action: string, message: string) => {
    createUserNotification(
      'Ação do Usuário',
      message,
      'low',
      '/profile'
    );
  };

  return {
    // Funções genéricas
    createAutomationNotification,
    createUserNotification,
    createSystemNotification,
    createTradingNotification,
    createSecurityNotification,
    
    // Funções específicas
    notifyAutomationStarted,
    notifyAutomationStopped,
    notifyAutomationError,
    notifyPositionOpened,
    notifyPositionClosed,
    notifyMarginCall,
    notifyLiquidation,
    notifySystemMaintenance,
    notifySecurityAlert,
    notifyUserAction,
  };
}
