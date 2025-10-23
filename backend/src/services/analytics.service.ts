import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
}

export class AnalyticsService {
  private prisma: PrismaClient;
  private fastify: FastifyInstance;

  constructor(prisma: PrismaClient, fastify: FastifyInstance) {
    this.prisma = prisma;
    this.fastify = fastify;
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Store event in database
      await this.prisma.analyticsEvent.create({
        data: {
          event: event.event,
          properties: event.properties || {},
          user_id: event.userId,
          session_id: event.sessionId,
          timestamp: event.timestamp || new Date()
        }
      });

      // Log event for monitoring
      this.fastify.log.info(`Analytics event: ${event.event}`, {
        userId: event.userId,
        properties: event.properties
      });

      // TODO: Send to external analytics service (Mixpanel, Amplitude, etc.)
      // await this.sendToExternalService(event);

    } catch (error) {
      this.fastify.log.error('Error tracking analytics event:', error);
      // Don't throw error to avoid breaking user flow
    }
  }

  async trackRegistrationFlow(userId: string, step: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      event: 'registration_flow',
      properties: {
        step,
        ...properties
      },
      userId
    });
  }

  async trackEmailVerification(userId: string, method: 'magic_link' | 'otp', success: boolean): Promise<void> {
    await this.trackEvent({
      event: 'email_verification',
      properties: {
        method,
        success
      },
      userId
    });
  }

  async trackDemoEngagement(userId: string, action: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      event: 'demo_engagement',
      properties: {
        action,
        ...properties
      },
      userId
    });
  }

  async trackPlanGate(userId: string, trigger: string, action: 'shown' | 'dismissed' | 'upgraded', plan?: string): Promise<void> {
    await this.trackEvent({
      event: 'plan_gate',
      properties: {
        trigger,
        action,
        plan
      },
      userId
    });
  }

  async trackPlanUpgrade(userId: string, fromPlan: string, toPlan: string): Promise<void> {
    await this.trackEvent({
      event: 'plan_upgrade',
      properties: {
        from_plan: fromPlan,
        to_plan: toPlan
      },
      userId
    });
  }

  async trackFeatureUsage(userId: string, feature: string, action: 'accessed' | 'blocked'): Promise<void> {
    await this.trackEvent({
      event: 'feature_usage',
      properties: {
        feature,
        action
      },
      userId
    });
  }

  async getAnalytics(userId?: string, event?: string, days: number = 30): Promise<any[]> {
    const where: any = {};
    
    if (userId) where.user_id = userId;
    if (event) where.event = event;
    
    if (days > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      where.timestamp = { gte: startDate };
    }

    return await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000
    });
  }
}
