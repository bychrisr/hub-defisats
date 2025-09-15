import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// Initialize Prisma
const prisma = new PrismaClient();

// Notification interfaces
interface NotificationJob {
  userId: string;
  type: 'margin_alert' | 'trade_executed' | 'system_alert';
  channel: 'telegram' | 'email' | 'whatsapp';
  message: string;
  metadata?: any;
}

// EvolutionAPI client for WhatsApp/Telegram
class EvolutionAPIClient {
  private client: AxiosInstance;

  constructor(private apiUrl: string, private apiKey: string) {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      timeout: 10000, // 10s timeout
    });
  }

  async sendTelegramMessage(chatId: string, message: string) {
    try {
      const response = await this.client.post('/message/sendText', {
        number: chatId,
        text: message,
        delay: 1200, // 1.2s delay to avoid spam
      });

      return {
        success: true,
        messageId: response.data?.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('EvolutionAPI Telegram error:', error.response?.data || error.message);
      throw new Error(`Telegram send failed: ${error.message}`);
    }
  }

  async sendWhatsAppMessage(phone: string, message: string) {
    try {
      const response = await this.client.post('/message/sendText', {
        number: phone,
        text: message,
        delay: 1200,
      });

      return {
        success: true,
        messageId: response.data?.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('EvolutionAPI WhatsApp error:', error.response?.data || error.message);
      throw new Error(`WhatsApp send failed: ${error.message}`);
    }
  }
}

// Email service (using nodemailer or similar)
class EmailService {
  async sendEmail(to: string, subject: string, html: string) {
    // For now, we'll use a simple console log
    // In production, integrate with SendGrid, Mailgun, or similar
    console.log(`📧 Email would be sent to ${to}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${html}`);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `email_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }
}

// Initialize services
const evolutionApi = new EvolutionAPIClient(
  process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  process.env.EVOLUTION_API_KEY || 'your-api-key'
);

const emailService = new EmailService();

// Main notification worker
const worker = new Worker(
  'notification',
  async (job) => {
    const { userId, type, channel, message, metadata }: NotificationJob = job.data;

    console.log(`📧 Processing ${type} notification for user ${userId} via ${channel}`);

    try {
      // Get user notification preferences
      const userNotifications = await prisma.notification.findMany({
        where: {
          user_id: userId,
          type: channel,
          is_enabled: true,
        },
      });

      if (userNotifications.length === 0) {
        console.log(`⚠️ No ${channel} notifications enabled for user ${userId}`);
        return {
          status: 'skipped',
          reason: 'notifications_disabled',
          timestamp: new Date().toISOString(),
          userId
        };
      }

      const notification = userNotifications[0];
      const channelConfig = notification.channel_config as any;

      let result;

      switch (channel) {
        case 'telegram':
          if (!channelConfig.chatId) {
            throw new Error('Telegram chat ID not configured');
          }

          result = await evolutionApi.sendTelegramMessage(
            channelConfig.chatId,
            formatMessage(message, type, metadata)
          );
          break;

        case 'whatsapp':
          if (!channelConfig.phone) {
            throw new Error('WhatsApp phone number not configured');
          }

          result = await evolutionApi.sendWhatsAppMessage(
            channelConfig.phone,
            formatMessage(message, type, metadata)
          );
          break;

        case 'email':
          if (!channelConfig.email) {
            throw new Error('Email address not configured');
          }

          const subject = getEmailSubject(type);
          const htmlContent = formatEmailMessage(message, type, metadata);

          result = await emailService.sendEmail(
            channelConfig.email,
            subject,
            htmlContent
          );
          break;

        default:
          throw new Error(`Unsupported notification channel: ${channel}`);
      }

      // Log successful notification
      await prisma.notificationLog.create({
        data: {
          user_id: userId,
          notification_id: notification.id,
          channel,
          message,
          status: 'sent',
          sent_at: new Date(),
          metadata: result,
        },
      });

      console.log(`✅ Notification sent successfully via ${channel} to user ${userId}`);

      return {
        status: 'completed',
        channel,
        result,
        timestamp: new Date().toISOString(),
        userId
      };

    } catch (error: any) {
      console.error(`❌ Notification failed for user ${userId}:`, error.message);

      // Log failed notification
      try {
        await prisma.notificationLog.create({
          data: {
            user_id: userId,
            channel,
            message,
            status: 'failed',
            error_message: error.message,
            metadata: { originalError: error.message },
          },
        });
      } catch (logError) {
        console.error('Failed to log notification error:', logError);
      }

      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        userId
      };
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process up to 5 notifications simultaneously
    limiter: {
      max: 10, // Max 10 jobs per duration
      duration: 1000, // Per second
    },
  }
);

// Helper functions
function formatMessage(message: string, type: string, metadata?: any): string {
  const timestamp = new Date().toLocaleString('pt-BR');

  let formattedMessage = `🚨 *Hub DefiSats* 🚨\n\n`;
  formattedMessage += `${message}\n\n`;
  formattedMessage += `⏰ ${timestamp}\n`;

  if (metadata) {
    if (metadata.marginRatio) {
      formattedMessage += `📊 Margin Ratio: ${metadata.marginRatio.toFixed(2)}%\n`;
    }
    if (metadata.pnl) {
      formattedMessage += `💰 P&L: ${metadata.pnl > 0 ? '+' : ''}${metadata.pnl.toFixed(2)} sats\n`;
    }
    if (metadata.price) {
      formattedMessage += `💵 BTC Price: $${metadata.price.toLocaleString()}\n`;
    }
  }

  formattedMessage += `\n⚡ Powered by Hub DefiSats`;

  return formattedMessage;
}

function getEmailSubject(type: string): string {
  switch (type) {
    case 'margin_alert':
      return '🚨 Alerta Crítico de Margem - Hub DefiSats';
    case 'trade_executed':
      return '✅ Trade Executado - Hub DefiSats';
    case 'system_alert':
      return '🔧 Alerta do Sistema - Hub DefiSats';
    default:
      return '📧 Notificação Hub DefiSats';
  }
}

function formatEmailMessage(message: string, type: string, metadata?: any): string {
  const timestamp = new Date().toLocaleString('pt-BR');

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3773f5, #f5ac37); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Hub DefiSats</h1>
      </div>

      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          ${message.replace(/\n/g, '<br>')}
        </p>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #666;">
            <strong>⏰ Timestamp:</strong> ${timestamp}
          </p>
  `;

  if (metadata) {
    if (metadata.marginRatio) {
      html += `<p style="margin: 5px 0; color: #666;"><strong>📊 Margin Ratio:</strong> ${metadata.marginRatio.toFixed(2)}%</p>`;
    }
    if (metadata.pnl) {
      const color = metadata.pnl >= 0 ? '#0ecb81' : '#f6465d';
      html += `<p style="margin: 5px 0; color: ${color};"><strong>💰 P&L:</strong> ${metadata.pnl > 0 ? '+' : ''}${metadata.pnl.toFixed(2)} sats</p>`;
    }
    if (metadata.price) {
      html += `<p style="margin: 5px 0; color: #666;"><strong>💵 BTC Price:</strong> $${metadata.price.toLocaleString()}</p>`;
    }
  }

  html += `
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 14px;">
            ⚡ Powered by <strong>Hub DefiSats</strong><br>
            <a href="#" style="color: #3773f5; text-decoration: none;">Acesse seu dashboard</a>
          </p>
        </div>
      </div>
    </div>
  `;

  return html;
}

worker.on('completed', job => {
  console.log(`Notification job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err);
});

console.log('Notification worker started');

process.on('SIGTERM', async () => {
  console.log('Shutting down notification worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down notification worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});
