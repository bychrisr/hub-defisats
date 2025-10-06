/**
 * Plan Limits Management Seeder
 * 
 * Populates comprehensive plan limits management data
 * including plan limits, rate limits, and management configurations
 */

import { getPrisma } from '../lib/prisma';
import { Seeder, SeederResult } from './index';

interface PlanLimitsData {
  planSlug: string;
  maxExchangeAccounts: number;
  maxAutomations: number;
  maxIndicators: number;
  maxSimulations: number;
  maxBacktests: number;
  isUnlimited: boolean;
}

interface RateLimitData {
  environment: string;
  endpointType: string;
  maxRequests: number;
  windowMs: number;
  isActive: boolean;
  description: string;
}

const planLimitsData: PlanLimitsData[] = [
  {
    planSlug: 'free',
    maxExchangeAccounts: 1,
    maxAutomations: 1,
    maxIndicators: 3,
    maxSimulations: 5,
    maxBacktests: 2,
    isUnlimited: false
  },
  {
    planSlug: 'basic',
    maxExchangeAccounts: 2,
    maxAutomations: 3,
    maxIndicators: 10,
    maxSimulations: 20,
    maxBacktests: 10,
    isUnlimited: false
  },
  {
    planSlug: 'advanced',
    maxExchangeAccounts: 5,
    maxAutomations: 8,
    maxIndicators: 25,
    maxSimulations: 50,
    maxBacktests: 25,
    isUnlimited: false
  },
  {
    planSlug: 'pro',
    maxExchangeAccounts: 10,
    maxAutomations: 15,
    maxIndicators: 50,
    maxSimulations: 100,
    maxBacktests: 50,
    isUnlimited: false
  },
  {
    planSlug: 'lifetime',
    maxExchangeAccounts: -1,
    maxAutomations: -1,
    maxIndicators: -1,
    maxSimulations: -1,
    maxBacktests: -1,
    isUnlimited: true
  }
];

const rateLimitData: RateLimitData[] = [
  // Development Environment
  { environment: 'development', endpointType: 'auth', maxRequests: 100, windowMs: 60000, isActive: true, description: 'Auth endpoints - Development' },
  { environment: 'development', endpointType: 'api', maxRequests: 200, windowMs: 60000, isActive: true, description: 'General API endpoints - Development' },
  { environment: 'development', endpointType: 'trading', maxRequests: 50, windowMs: 60000, isActive: true, description: 'Trading endpoints - Development' },
  { environment: 'development', endpointType: 'notifications', maxRequests: 30, windowMs: 60000, isActive: true, description: 'Notification endpoints - Development' },
  { environment: 'development', endpointType: 'payments', maxRequests: 20, windowMs: 60000, isActive: true, description: 'Payment endpoints - Development' },
  { environment: 'development', endpointType: 'admin', maxRequests: 100, windowMs: 60000, isActive: true, description: 'Admin endpoints - Development' },
  { environment: 'development', endpointType: 'global', maxRequests: 500, windowMs: 60000, isActive: true, description: 'Global rate limit - Development' },

  // Staging Environment
  { environment: 'staging', endpointType: 'auth', maxRequests: 50, windowMs: 60000, isActive: true, description: 'Auth endpoints - Staging' },
  { environment: 'staging', endpointType: 'api', maxRequests: 100, windowMs: 60000, isActive: true, description: 'General API endpoints - Staging' },
  { environment: 'staging', endpointType: 'trading', maxRequests: 25, windowMs: 60000, isActive: true, description: 'Trading endpoints - Staging' },
  { environment: 'staging', endpointType: 'notifications', maxRequests: 15, windowMs: 60000, isActive: true, description: 'Notification endpoints - Staging' },
  { environment: 'staging', endpointType: 'payments', maxRequests: 10, windowMs: 60000, isActive: true, description: 'Payment endpoints - Staging' },
  { environment: 'staging', endpointType: 'admin', maxRequests: 50, windowMs: 60000, isActive: true, description: 'Admin endpoints - Staging' },
  { environment: 'staging', endpointType: 'global', maxRequests: 200, windowMs: 60000, isActive: true, description: 'Global rate limit - Staging' },

  // Production Environment
  { environment: 'production', endpointType: 'auth', maxRequests: 20, windowMs: 60000, isActive: true, description: 'Auth endpoints - Production' },
  { environment: 'production', endpointType: 'api', maxRequests: 50, windowMs: 60000, isActive: true, description: 'General API endpoints - Production' },
  { environment: 'production', endpointType: 'trading', maxRequests: 10, windowMs: 60000, isActive: true, description: 'Trading endpoints - Production' },
  { environment: 'production', endpointType: 'notifications', maxRequests: 5, windowMs: 60000, isActive: true, description: 'Notification endpoints - Production' },
  { environment: 'production', endpointType: 'payments', maxRequests: 5, windowMs: 60000, isActive: true, description: 'Payment endpoints - Production' },
  { environment: 'production', endpointType: 'admin', maxRequests: 20, windowMs: 60000, isActive: true, description: 'Admin endpoints - Production' },
  { environment: 'production', endpointType: 'global', maxRequests: 100, windowMs: 60000, isActive: true, description: 'Global rate limit - Production' },

  // Global Fallback
  { environment: 'global', endpointType: 'auth', maxRequests: 30, windowMs: 60000, isActive: true, description: 'Auth endpoints - Global fallback' },
  { environment: 'global', endpointType: 'api', maxRequests: 75, windowMs: 60000, isActive: true, description: 'General API endpoints - Global fallback' },
  { environment: 'global', endpointType: 'trading', maxRequests: 15, windowMs: 60000, isActive: true, description: 'Trading endpoints - Global fallback' },
  { environment: 'global', endpointType: 'notifications', maxRequests: 10, windowMs: 60000, isActive: true, description: 'Notification endpoints - Global fallback' },
  { environment: 'global', endpointType: 'payments', maxRequests: 8, windowMs: 60000, isActive: true, description: 'Payment endpoints - Global fallback' },
  { environment: 'global', endpointType: 'admin', maxRequests: 30, windowMs: 60000, isActive: true, description: 'Admin endpoints - Global fallback' },
  { environment: 'global', endpointType: 'global', maxRequests: 150, windowMs: 60000, isActive: true, description: 'Global rate limit - Global fallback' }
];

export const planLimitsManagementSeeder: Seeder = {
  name: 'plan-limits-management',
  description: 'Populates comprehensive plan limits management data including plan limits and rate limits',
  
  async run(): Promise<SeederResult> {
    const prisma = await getPrisma();
    
    try {
      console.log('🚀 PLAN LIMITS MANAGEMENT - Starting comprehensive seeding...');

      // 1. Verificar se planos existem
      const existingPlans = await prisma.plan.findMany({
        select: { id: true, slug: true, name: true }
      });

      if (existingPlans.length === 0) {
        throw new Error('No plans found. Please run plans seeder first.');
      }

      console.log(`📋 PLAN LIMITS MANAGEMENT - Found ${existingPlans.length} existing plans`);

      // 2. Limpar dados existentes (opcional - comentado para preservar dados)
      // await prisma.planLimits.deleteMany({});
      // await prisma.rateLimitConfig.deleteMany({});

      // 3. Popular Plan Limits
      let planLimitsCreated = 0;
      for (const limitData of planLimitsData) {
        const plan = existingPlans.find(p => p.slug === limitData.planSlug);
        if (!plan) {
          console.warn(`⚠️ PLAN LIMITS MANAGEMENT - Plan not found: ${limitData.planSlug}`);
          continue;
        }

        // Verificar se já existe
        const existingLimit = await prisma.planLimits.findFirst({
          where: { plan_id: plan.id }
        });

        if (existingLimit) {
          console.log(`📋 PLAN LIMITS MANAGEMENT - Plan limits already exist for ${plan.name}, updating...`);
          
          await prisma.planLimits.update({
            where: { id: existingLimit.id },
            data: {
              max_exchange_accounts: limitData.maxExchangeAccounts,
              max_automations: limitData.maxAutomations,
              max_indicators: limitData.maxIndicators,
              max_simulations: limitData.maxSimulations,
              max_backtests: limitData.maxBacktests,
              updated_at: new Date()
            }
          });
        } else {
          await prisma.planLimits.create({
            data: {
              plan_id: plan.id,
              max_exchange_accounts: limitData.maxExchangeAccounts,
              max_automations: limitData.maxAutomations,
              max_indicators: limitData.maxIndicators,
              max_simulations: limitData.maxSimulations,
              max_backtests: limitData.maxBacktests,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
        }

        planLimitsCreated++;
        console.log(`✅ PLAN LIMITS MANAGEMENT - Created/Updated limits for plan: ${plan.name}`);
      }

      // 4. Popular Rate Limits
      let rateLimitsCreated = 0;
      for (const rateData of rateLimitData) {
        // Verificar se já existe
        const existingRateLimit = await prisma.rateLimitConfig.findFirst({
          where: {
            environment: rateData.environment,
            endpointType: rateData.endpointType
          }
        });

        if (existingRateLimit) {
          console.log(`📋 PLAN LIMITS MANAGEMENT - Rate limit already exists for ${rateData.environment}/${rateData.endpointType}, updating...`);
          
          await prisma.rateLimitConfig.update({
            where: { id: existingRateLimit.id },
            data: {
              maxRequests: rateData.maxRequests,
              windowMs: rateData.windowMs,
              isActive: rateData.isActive,
              message: rateData.description,
              updatedAt: new Date()
            }
          });
        } else {
          await prisma.rateLimitConfig.create({
            data: {
              environment: rateData.environment,
              endpointType: rateData.endpointType,
              maxRequests: rateData.maxRequests,
              windowMs: rateData.windowMs,
              isActive: rateData.isActive,
              message: rateData.description,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }

        rateLimitsCreated++;
      }

      console.log(`✅ PLAN LIMITS MANAGEMENT - Created/Updated ${rateLimitsCreated} rate limit configurations`);

      // 5. Verificar dados finais
      const finalPlanLimits = await prisma.planLimits.count();
      const finalRateLimits = await prisma.rateLimitConfig.count();

      console.log('📊 PLAN LIMITS MANAGEMENT - Final counts:', {
        planLimits: finalPlanLimits,
        rateLimits: finalRateLimits
      });

      return {
        success: true,
        message: `Plan Limits Management seeding completed successfully. Created/Updated ${planLimitsCreated} plan limits and ${rateLimitsCreated} rate limits.`,
        count: planLimitsCreated + rateLimitsCreated
      };

    } catch (error: any) {
      console.error('❌ PLAN LIMITS MANAGEMENT - Error during seeding:', error);
      return {
        success: false,
        message: `Failed to seed plan limits management: ${error.message}`,
        count: 0
      };
    }
  }
};
