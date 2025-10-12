import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

export interface NotificationData {
  userId: string;
  type: 'margin_guard' | 'tp_sl' | 'auto_entry' | 'system' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: any;
}

export interface UserNotificationPreferences {
  userId: string;
  enabledChannels: NotificationChannel[];
  preferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
}

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export interface InAppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: any;
  read: boolean;
  created_at: Date;
}

export class NotificationCentralService extends EventEmitter {
  private prisma: PrismaClient;
  private preferencesCache: Map<string, UserNotificationPreferences> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  /**
   * Método principal para enviar notificações
   */
  async notify(data: NotificationData): Promise<void> {
    try {
      console.log('📢 NOTIFICATION CENTRAL - Sending notification:', {
        userId: data.userId,
        type: data.type,
        priority: data.priority,
        title: data.title
      });

      // 1. Buscar preferências do usuário
      const preferences = await this.getUserNotificationPreferences(data.userId);

      // 2. Enviar para canais ativados
      for (const channel of preferences.enabledChannels) {
        try {
          await this.sendToChannel(channel, data);
        } catch (error) {
          console.error(`❌ NOTIFICATION CENTRAL - Failed to send to ${channel}:`, error);
          // Continue com outros canais mesmo se um falhar
        }
      }

      // 3. Registrar notificação in-app (sempre)
      await this.createInAppNotification(data);

      // 4. Emitir evento para outros serviços
      this.emit('notificationSent', data);

      console.log('✅ NOTIFICATION CENTRAL - Notification sent successfully');

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Buscar preferências de notificação do usuário
   */
  private async getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences> {
    // Verificar cache primeiro
    const cached = this.preferencesCache.get(userId);
    const cacheTime = this.cacheExpiry.get(userId);
    
    if (cached && cacheTime && Date.now() - cacheTime < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Buscar do banco de dados
      const userPreferences = await this.prisma.userNotificationPreferences.findUnique({
        where: { user_id: userId }
      });

      if (!userPreferences) {
        // Criar preferências padrão se não existirem
        const defaultPreferences = await this.createDefaultPreferences(userId);
        return defaultPreferences;
      }

      const preferences: UserNotificationPreferences = {
        userId,
        enabledChannels: this.parseEnabledChannels(userPreferences.enabled_channels),
        preferences: {
          push: userPreferences.push_enabled,
          email: userPreferences.email_enabled,
          sms: userPreferences.sms_enabled,
          inApp: userPreferences.in_app_enabled
        }
      };

      // Atualizar cache
      this.preferencesCache.set(userId, preferences);
      this.cacheExpiry.set(userId, Date.now());

      return preferences;

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to get user preferences:', error);
      
      // Retornar preferências padrão em caso de erro
      return {
        userId,
        enabledChannels: ['in_app', 'push'],
        preferences: {
          push: true,
          email: false,
          sms: false,
          inApp: true
        }
      };
    }
  }

  /**
   * Criar preferências padrão para novo usuário
   */
  private async createDefaultPreferences(userId: string): Promise<UserNotificationPreferences> {
    try {
      const defaultPreferences = {
        user_id: userId,
        enabled_channels: ['in_app', 'push'],
        push_enabled: true,
        email_enabled: false,
        sms_enabled: false,
        in_app_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.prisma.userNotificationPreferences.create({
        data: defaultPreferences
      });

      const preferences: UserNotificationPreferences = {
        userId,
        enabledChannels: ['in_app', 'push'],
        preferences: {
          push: true,
          email: false,
          sms: false,
          inApp: true
        }
      };

      // Atualizar cache
      this.preferencesCache.set(userId, preferences);
      this.cacheExpiry.set(userId, Date.now());

      return preferences;

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to create default preferences:', error);
      throw error;
    }
  }

  /**
   * Parsear canais habilitados do banco
   */
  private parseEnabledChannels(channelsJson: any): NotificationChannel[] {
    try {
      if (Array.isArray(channelsJson)) {
        return channelsJson;
      }
      
      if (typeof channelsJson === 'string') {
        return JSON.parse(channelsJson);
      }
      
      return ['in_app']; // Fallback
    } catch (error) {
      console.warn('⚠️ NOTIFICATION CENTRAL - Failed to parse enabled channels:', error);
      return ['in_app'];
    }
  }

  /**
   * Enviar notificação para canal específico
   */
  private async sendToChannel(channel: NotificationChannel, data: NotificationData): Promise<void> {
    switch (channel) {
      case 'push':
        await this.sendPushNotification(data);
        break;
      case 'email':
        await this.sendEmailNotification(data);
        break;
      case 'sms':
        await this.sendSMSNotification(data);
        break;
      case 'in_app':
        // In-app é sempre enviado no método principal
        break;
      default:
        console.warn(`⚠️ NOTIFICATION CENTRAL - Unknown channel: ${channel}`);
    }
  }

  /**
   * Enviar notificação push
   */
  private async sendPushNotification(data: NotificationData): Promise<void> {
    try {
      // Buscar tokens de push do usuário
      const pushTokens = await this.prisma.userPushTokens.findMany({
        where: { 
          user_id: data.userId,
          is_active: true 
        }
      });

      if (pushTokens.length === 0) {
        console.log('📱 NOTIFICATION CENTRAL - No push tokens found for user:', data.userId);
        return;
      }

      // Enviar push para cada token
      for (const token of pushTokens) {
        try {
          await this.sendPushToToken(token.token, data);
        } catch (error) {
          console.error(`❌ NOTIFICATION CENTRAL - Failed to send push to token ${token.id}:`, error);
        }
      }

      console.log(`📱 NOTIFICATION CENTRAL - Push notification sent to ${pushTokens.length} devices`);

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to send push notification:', error);
      throw error;
    }
  }

  /**
   * Enviar push para token específico
   */
  private async sendPushToToken(token: string, data: NotificationData): Promise<void> {
    // Implementar integração com serviço de push (FCM, APNS, etc.)
    // Por enquanto, apenas log
    console.log('📱 NOTIFICATION CENTRAL - Push sent to token:', {
      token: token.substring(0, 10) + '...',
      title: data.title,
      message: data.message
    });
  }

  /**
   * Enviar notificação por email
   */
  private async sendEmailNotification(data: NotificationData): Promise<void> {
    try {
      // Buscar email do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true }
      });

      if (!user?.email) {
        console.warn('📧 NOTIFICATION CENTRAL - No email found for user:', data.userId);
        return;
      }

      // Implementar envio de email (SendGrid, SES, etc.)
      console.log('📧 NOTIFICATION CENTRAL - Email sent:', {
        to: user.email,
        title: data.title,
        message: data.message
      });

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Enviar notificação por SMS
   */
  private async sendSMSNotification(data: NotificationData): Promise<void> {
    try {
      // Buscar telefone do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { phone: true }
      });

      if (!user?.phone) {
        console.warn('📱 NOTIFICATION CENTRAL - No phone found for user:', data.userId);
        return;
      }

      // Implementar envio de SMS (Twilio, AWS SNS, etc.)
      console.log('📱 NOTIFICATION CENTRAL - SMS sent:', {
        to: user.phone,
        message: data.message
      });

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Criar notificação in-app
   */
  private async createInAppNotification(data: NotificationData): Promise<void> {
    try {
      const notification = await this.prisma.inAppNotification.create({
        data: {
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata || {},
          read: false,
          created_at: new Date()
        }
      });

      console.log('📱 NOTIFICATION CENTRAL - In-app notification created:', {
        id: notification.id,
        userId: data.userId,
        type: data.type
      });

      // Emitir evento para WebSocket (se implementado)
      this.emit('inAppNotificationCreated', notification);

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to create in-app notification:', error);
      throw error;
    }
  }

  /**
   * Buscar notificações in-app do usuário
   */
  async getInAppNotifications(
    userId: string, 
    limit: number = 50, 
    unreadOnly: boolean = false
  ): Promise<InAppNotification[]> {
    try {
      const whereClause: any = { user_id: userId };
      
      if (unreadOnly) {
        whereClause.read = false;
      }

      const notifications = await this.prisma.inAppNotification.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        take: limit
      });

      return notifications.map(notif => ({
        id: notif.id,
        user_id: notif.user_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        metadata: notif.metadata,
        read: notif.read,
        created_at: notif.created_at
      }));

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to get in-app notifications:', error);
      throw error;
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await this.prisma.inAppNotification.update({
        where: { 
          id: notificationId,
          user_id: userId // Segurança: só pode marcar próprias notificações
        },
        data: { read: true }
      });

      console.log('✅ NOTIFICATION CENTRAL - Notification marked as read:', notificationId);

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.prisma.inAppNotification.updateMany({
        where: { 
          user_id: userId,
          read: false
        },
        data: { read: true }
      });

      console.log('✅ NOTIFICATION CENTRAL - All notifications marked as read for user:', userId);

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Contar notificações não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.inAppNotification.count({
        where: { 
          user_id: userId,
          read: false
        }
      });

      return count;

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Atualizar preferências do usuário
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (preferences.enabledChannels) {
        updateData.enabled_channels = preferences.enabledChannels;
      }

      if (preferences.preferences) {
        updateData.push_enabled = preferences.preferences.push;
        updateData.email_enabled = preferences.preferences.email;
        updateData.sms_enabled = preferences.preferences.sms;
        updateData.in_app_enabled = preferences.preferences.inApp;
      }

      updateData.updated_at = new Date();

      await this.prisma.userNotificationPreferences.upsert({
        where: { user_id: userId },
        update: updateData,
        create: {
          user_id: userId,
          enabled_channels: preferences.enabledChannels || ['in_app', 'push'],
          push_enabled: preferences.preferences?.push ?? true,
          email_enabled: preferences.preferences?.email ?? false,
          sms_enabled: preferences.preferences?.sms ?? false,
          in_app_enabled: preferences.preferences?.inApp ?? true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Invalidar cache
      this.preferencesCache.delete(userId);
      this.cacheExpiry.delete(userId);

      console.log('✅ NOTIFICATION CENTRAL - User preferences updated:', userId);

    } catch (error) {
      console.error('❌ NOTIFICATION CENTRAL - Failed to update user preferences:', error);
      throw error;
    }
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.preferencesCache.clear();
    this.cacheExpiry.clear();
    console.log('🧹 NOTIFICATION CENTRAL - Cache cleared');
  }
}
