import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Notification, NotificationState, NotificationFilters, NotificationType, NotificationPriority } from '@/types/notification';

// Ações do reducer
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<Notification> } }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_LAST_FETCHED'; payload: Date };

// Estado inicial
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetched: null,
};

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_NOTIFICATIONS':
      const notifications = action.payload;
      const unreadCount = notifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications,
        unreadCount,
        isLoading: false,
        error: null,
        lastFetched: new Date(),
      };
    
    case 'ADD_NOTIFICATION':
      const newNotification = action.payload;
      const updatedNotifications = [newNotification, ...state.notifications];
      const newUnreadCount = updatedNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: newUnreadCount,
      };
    
    case 'UPDATE_NOTIFICATION':
      const { id, updates } = action.payload;
      const modifiedNotifications = state.notifications.map(n =>
        n.id === id ? { ...n, ...updates } : n
      );
      const modifiedUnreadCount = modifiedNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: modifiedNotifications,
        unreadCount: modifiedUnreadCount,
      };
    
    case 'MARK_AS_READ':
      const markedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      const markedUnreadCount = markedNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: markedNotifications,
        unreadCount: markedUnreadCount,
      };
    
    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(n => ({ ...n, read: true }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0,
      };
    
    case 'DELETE_NOTIFICATION':
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
      const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredUnreadCount,
      };
    
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
        error: null,
      };
    
    case 'SET_LAST_FETCHED':
      return { ...state, lastFetched: action.payload };
    
    default:
      return state;
  }
}

// Contexto
interface NotificationContextType {
  state: NotificationState;
  // Ações
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  // Utilitários
  getNotificationsByType: (type: NotificationType) => Notification[];
  getUnreadCount: () => number;
  getNotificationsByPriority: (priority: NotificationPriority) => Notification[];
  // Simulação para desenvolvimento
  addSampleNotification: (type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Simular notificações para desenvolvimento
  const addSampleNotification = (type: NotificationType) => {
    const sampleNotifications: Record<NotificationType, Omit<Notification, 'id' | 'timestamp'>> = {
      automation: {
        type: 'automation',
        priority: 'medium',
        title: 'Automação Executada',
        message: 'Margin Guard ativado para posição BTCUSD',
        read: false,
        actionUrl: '/positions',
        actionText: 'Ver Posições',
        metadata: { automationId: 'mg-001', positionId: 'pos-123' },
      },
      user: {
        type: 'user',
        priority: 'low',
        title: 'Perfil Atualizado',
        message: 'Suas configurações foram salvas com sucesso',
        read: false,
        actionUrl: '/profile',
        actionText: 'Ver Perfil',
      },
      system: {
        type: 'system',
        priority: 'high',
        title: 'Manutenção Programada',
        message: 'Sistema será atualizado em 30 minutos',
        read: false,
        metadata: { component: 'api', level: 'info' },
      },
      trading: {
        type: 'trading',
        priority: 'critical',
        title: 'Posição Fechada',
        message: 'Posição BTCUSD fechada com lucro de +2.5%',
        read: false,
        actionUrl: '/positions',
        actionText: 'Ver Detalhes',
        metadata: { positionId: 'pos-123', amount: 250, currency: 'SATS' },
      },
      security: {
        type: 'security',
        priority: 'high',
        title: 'Atividade Suspeita',
        message: 'Múltiplas tentativas de login detectadas',
        read: false,
        actionUrl: '/security',
        actionText: 'Ver Detalhes',
        metadata: { event: 'suspicious_activity', severity: 'high' },
      },
    };

    const notification = {
      ...sampleNotifications[type],
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  // Funções principais
  const fetchNotifications = async (filters?: NotificationFilters) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // TODO: Implementar chamada real para o backend
      // const response = await api.get('/notifications', { params: filters });
      // dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data });
      
      // Simulação para desenvolvimento
      setTimeout(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 1000);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar notificações' });
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const deleteNotification = (id: string) => {
    dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  // Utilitários
  const getNotificationsByType = (type: NotificationType) => {
    return state.notifications.filter(n => n.type === type);
  };

  const getUnreadCount = () => {
    return state.unreadCount;
  };

  const getNotificationsByPriority = (priority: NotificationPriority) => {
    return state.notifications.filter(n => n.priority === priority);
  };

  // Carregar notificações ao montar o componente
  useEffect(() => {
    fetchNotifications();
  }, []);

  const value: NotificationContextType = {
    state,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getNotificationsByType,
    getUnreadCount,
    getNotificationsByPriority,
    addSampleNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook para usar o contexto
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
