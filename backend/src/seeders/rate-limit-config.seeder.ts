/**
 * Rate Limit Configuration Seeder
 * 
 * Popula o banco com configurações padrão de rate limiting
 * para todos os ambientes e tipos de endpoint
 */

import { getPrisma } from '../lib/prisma';
import { Seeder, SeederResult } from './index';

interface RateLimitConfigData {
  environment: string;
  endpointType: string;
  maxRequests: number;
  windowMs: number;
  isActive: boolean;
  description: string;
}

const defaultConfigs: RateLimitConfigData[] = [
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

  // Global Environment (fallback)
  { environment: 'global', endpointType: 'auth', maxRequests: 30, windowMs: 60000, isActive: true, description: 'Auth endpoints - Global fallback' },
  { environment: 'global', endpointType: 'api', maxRequests: 75, windowMs: 60000, isActive: true, description: 'General API endpoints - Global fallback' },
  { environment: 'global', endpointType: 'trading', maxRequests: 15, windowMs: 60000, isActive: true, description: 'Trading endpoints - Global fallback' },
  { environment: 'global', endpointType: 'notifications', maxRequests: 10, windowMs: 60000, isActive: true, description: 'Notification endpoints - Global fallback' },
  { environment: 'global', endpointType: 'payments', maxRequests: 8, windowMs: 60000, isActive: true, description: 'Payment endpoints - Global fallback' },
  { environment: 'global', endpointType: 'admin', maxRequests: 30, windowMs: 60000, isActive: true, description: 'Admin endpoints - Global fallback' },
  { environment: 'global', endpointType: 'global', maxRequests: 150, windowMs: 60000, isActive: true, description: 'Global rate limit - Global fallback' },
];

export const rateLimitConfigSeeder: Seeder = {
  name: 'rate-limit-config',
  description: 'Populates rate limiting configurations for all environments and endpoint types',

  async run(): Promise<SeederResult> {
    try {
      const prisma = await getPrisma();
      
      // Verificar se já existem configurações
      const existingCount = await prisma.rateLimitConfig.count();
      
      if (existingCount > 0) {
        return {
          success: true,
          message: `Rate limit configurations already exist (${existingCount} records). Skipping seeding.`,
          count: existingCount
        };
      }

      // Inserir configurações padrão
      const createdConfigs = await prisma.rateLimitConfig.createMany({
        data: defaultConfigs.map(config => ({
          environment: config.environment,
          endpointType: config.endpointType,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          isActive: config.isActive,
          message: config.description,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        skipDuplicates: true
      });

      // Verificar quantas foram realmente criadas
      const finalCount = await prisma.rateLimitConfig.count();

      return {
        success: true,
        message: `Successfully created ${finalCount} rate limit configurations`,
        count: finalCount
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to seed rate limit configurations: ${error.message}`,
        errors: [error.message]
      };
    }
  }
};
