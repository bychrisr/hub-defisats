import { PrismaClient } from '@prisma/client';
import { MarginGuardPlanService, PlanType } from './margin-guard-plan.service';

export interface NotificationData {
  userId: string;
  automationId: string;
  planType: string;
  actions: Array<{
    positionId: string;
    action: string;
    amount?: number;
    percentage?: number;
    newLiquidationDistance?: number;
  }>;
  positions: any[];
  executionTime: Date;
}

export interface NotificationResult {
  type: string;
  sent: boolean;
  message: string;
  error?: string;
}

export class MarginGuardNotificationService {
  private prisma: PrismaClient;
  private marginGuardPlanService: MarginGuardPlanService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.marginGuardPlanService = new MarginGuardPlanService(prisma);
  }

  /**
   * Send notifications based on user's plan and configuration
   */
  async sendNotifications(data: NotificationData): Promise<NotificationResult[]> {
    console.log('📱 MARGIN GUARD NOTIFICATION - Sending notifications:', {
      userId: data.userId,
      planType: data.planType,
      actionsCount: data.actions.length
    });

    const results: NotificationResult[] = [];
    const planFeatures = this.marginGuardPlanService.getPlanFeatures(data.planType as PlanType);
    const availableNotifications = planFeatures.notifications || {};

    // Send push notifications (always available)
    if (availableNotifications.push) {
      const pushResult = await this.sendPushNotification(data);
      results.push(pushResult);
    }

    // Send email notifications (Pro/Lifetime only)
    if (availableNotifications.email) {
      const emailResult = await this.sendEmailNotification(data);
      results.push(emailResult);
    }

    // Send Telegram notifications (Pro/Lifetime only)
    if (availableNotifications.telegram) {
      const telegramResult = await this.sendTelegramNotification(data);
      results.push(telegramResult);
    }

    // Send WhatsApp notifications (Pro/Lifetime only)
    if (availableNotifications.whatsapp) {
      const whatsappResult = await this.sendWhatsAppNotification(data);
      results.push(whatsappResult);
    }

    // Send webhook notifications (Pro/Lifetime only)
    if (availableNotifications.webhook) {
      const webhookResult = await this.sendWebhookNotification(data);
      results.push(webhookResult);
    }

    console.log('✅ MARGIN GUARD NOTIFICATION - Notifications sent:', {
      total: results.length,
      successful: results.filter(r => r.sent).length,
      failed: results.filter(r => !r.sent).length
    });

    return results;
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(data: NotificationData): Promise<NotificationResult> {
    try {
      const message = this.buildNotificationMessage(data, 'push');
      
      // TODO: Implement actual push notification service (Firebase, OneSignal, etc.)
      console.log('📱 MARGIN GUARD NOTIFICATION - Sending push notification:', message);
      
      // Mock implementation
      await this.simulateNotificationDelay('push');
      
      return {
        type: 'push',
        sent: true,
        message
      };
    } catch (error) {
      console.error('❌ MARGIN GUARD NOTIFICATION - Push notification failed:', error);
      return {
        type: 'push',
        sent: false,
        message: '',
        error: error.message
      };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(data: NotificationData): Promise<NotificationResult> {
    try {
      const message = this.buildNotificationMessage(data, 'email');
      
      // TODO: Implement actual email service (SendGrid, AWS SES, etc.)
      console.log('📧 MARGIN GUARD NOTIFICATION - Sending email notification:', message);
      
      // Mock implementation
      await this.simulateNotificationDelay('email');
      
      return {
        type: 'email',
        sent: true,
        message
      };
    } catch (error) {
      console.error('❌ MARGIN GUARD NOTIFICATION - Email notification failed:', error);
      return {
        type: 'email',
        sent: false,
        message: '',
        error: error.message
      };
    }
  }

  /**
   * Send Telegram notification
   */
  private async sendTelegramNotification(data: NotificationData): Promise<NotificationResult> {
    try {
      const message = this.buildNotificationMessage(data, 'telegram');
      
      // TODO: Implement actual Telegram Bot API
      console.log('📱 MARGIN GUARD NOTIFICATION - Sending Telegram notification:', message);
      
      // Mock implementation
      await this.simulateNotificationDelay('telegram');
      
      return {
        type: 'telegram',
        sent: true,
        message
      };
    } catch (error) {
      console.error('❌ MARGIN GUARD NOTIFICATION - Telegram notification failed:', error);
      return {
        type: 'telegram',
        sent: false,
        message: '',
        error: error.message
      };
    }
  }

  /**
   * Send WhatsApp notification
   */
  private async sendWhatsAppNotification(data: NotificationData): Promise<NotificationResult> {
    try {
      const message = this.buildNotificationMessage(data, 'whatsapp');
      
      // TODO: Implement actual WhatsApp Business API
      console.log('📱 MARGIN GUARD NOTIFICATION - Sending WhatsApp notification:', message);
      
      // Mock implementation
      await this.simulateNotificationDelay('whatsapp');
      
      return {
        type: 'whatsapp',
        sent: true,
        message
      };
    } catch (error) {
      console.error('❌ MARGIN GUARD NOTIFICATION - WhatsApp notification failed:', error);
      return {
        type: 'whatsapp',
        sent: false,
        message: '',
        error: error.message
      };
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(data: NotificationData): Promise<NotificationResult> {
    try {
      const message = this.buildNotificationMessage(data, 'webhook');
      
      // TODO: Implement actual webhook service
      console.log('🔗 MARGIN GUARD NOTIFICATION - Sending webhook notification:', message);
      
      // Mock implementation
      await this.simulateNotificationDelay('webhook');
      
      return {
        type: 'webhook',
        sent: true,
        message
      };
    } catch (error) {
      console.error('❌ MARGIN GUARD NOTIFICATION - Webhook notification failed:', error);
      return {
        type: 'webhook',
        sent: false,
        message: '',
        error: error.message
      };
    }
  }

  /**
   * Build notification message based on type and data
   */
  private buildNotificationMessage(data: NotificationData, type: string): string {
    const planName = this.getPlanDisplayName(data.planType);
    const actionsSummary = this.buildActionsSummary(data.actions);
    const timestamp = data.executionTime.toLocaleString();

    switch (type) {
      case 'push':
        return `🛡️ Margin Guard (${planName}): ${actionsSummary} at ${timestamp}`;
      
      case 'email':
        return this.buildEmailMessage(data, actionsSummary, timestamp);
      
      case 'telegram':
        return `🛡️ *Margin Guard (${planName})*\n\n${actionsSummary}\n\n⏰ ${timestamp}`;
      
      case 'whatsapp':
        return `🛡️ Margin Guard (${planName})\n\n${actionsSummary}\n\n⏰ ${timestamp}`;
      
      case 'webhook':
        return JSON.stringify({
          type: 'margin_guard_execution',
          plan: data.planType,
          actions: data.actions,
          timestamp: data.executionTime.toISOString(),
          summary: actionsSummary
        });
      
      default:
        return `Margin Guard executed ${data.actions.length} actions`;
    }
  }

  /**
   * Build email message
   */
  private buildEmailMessage(data: NotificationData, actionsSummary: string, timestamp: string): string {
    return `
      <h2>🛡️ Margin Guard Execution Report</h2>
      <p><strong>Plan:</strong> ${this.getPlanDisplayName(data.planType)}</p>
      <p><strong>Execution Time:</strong> ${timestamp}</p>
      <p><strong>Actions Executed:</strong></p>
      <ul>
        ${data.actions.map(action => `
          <li>Position ${action.positionId}: ${action.action}${action.amount ? ` (${action.amount})` : ''}</li>
        `).join('')}
      </ul>
      <p><strong>Summary:</strong> ${actionsSummary}</p>
      <hr>
      <p><em>This is an automated message from your Margin Guard automation.</em></p>
    `;
  }

  /**
   * Build actions summary
   */
  private buildActionsSummary(actions: any[]): string {
    if (actions.length === 0) {
      return 'No actions executed';
    }

    const actionCounts = actions.reduce((acc, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(actionCounts)
      .map(([action, count]) => `${count} ${action}${count > 1 ? 's' : ''}`)
      .join(', ');
  }

  /**
   * Get plan display name
   */
  private getPlanDisplayName(planType: string): string {
    switch (planType) {
      case 'free': return 'Free Plan';
      case 'basic': return 'Basic Plan';
      case 'advanced': return 'Advanced Plan';
      case 'pro': return 'Pro Plan';
      case 'lifetime': return 'Lifetime Plan';
      default: return 'Unknown Plan';
    }
  }

  /**
   * Simulate notification delay
   */
  private async simulateNotificationDelay(type: string): Promise<void> {
    const delays = {
      push: 100,
      email: 500,
      telegram: 200,
      whatsapp: 300,
      webhook: 150
    };

    const delay = delays[type] || 200;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          plan_type: true,
          preferences: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const planFeatures = this.marginGuardPlanService.getPlanFeatures(user.plan_type as PlanType);
      const defaultPreferences = planFeatures.notifications || {};

      // Merge with user preferences if available
      const userPreferences = user.preferences?.notifications || {};
      
      return {
        ...defaultPreferences,
        ...userPreferences
      };
    } catch (error) {
      console.error('❌ MARGIN GUARD NOTIFICATION - Failed to get user preferences:', error);
      return {};
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserNotificationPreferences(
    userId: string, 
    preferences: any
  ): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          preferences: {
            ...preferences,
            updated_at: new Date()
          }
        }
      });

      console.log('✅ MARGIN GUARD NOTIFICATION - User preferences updated:', {
        userId,
        preferences
      });

      return true;
    } catch (error) {
      console.error('❌ MARGIN GUARD NOTIFICATION - Failed to update preferences:', error);
      return false;
    }
  }
}
