/**
 * Testnet Faucet Service
 * 
 * Service for managing testnet Lightning faucet functionality including
 * rate limiting, invoice generation, and distribution tracking.
 */

import { PrismaClient } from '@prisma/client';
import { LNDService } from './lnd/LNDService';
import { getLNDService } from './lnd/LNDService';

export interface TestnetFaucetConfig {
  maxAmount: number;
  minAmount: number;
  rateLimitHours: number;
  userRateLimit: number;
  ipRateLimit: number;
}

export interface FaucetRequest {
  amount: number;
  ipAddress: string;
  userId?: string;
  memo?: string;
}

export interface FaucetDistribution {
  id: string;
  ip_address: string;
  user_id?: string;
  amount_sats: number;
  invoice_bolt11: string;
  payment_hash: string;
  payment_preimage?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expires_at: Date;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface FaucetStats {
  total_distributions: number;
  total_amount_sats: number;
  pending_distributions: number;
  paid_distributions: number;
  expired_distributions: number;
  unique_users: number;
  unique_ips: number;
  average_amount: number;
}

export class TestnetFaucetService {
  private prisma: PrismaClient;
  private lndService: LNDService;
  private config: TestnetFaucetConfig;
  private logger: any;

  constructor(
    prisma: PrismaClient,
    lndService?: LNDService,
    logger: any = console
  ) {
    this.prisma = prisma;
    this.lndService = lndService || getLNDService(logger);
    this.logger = logger;
    
    this.config = {
      maxAmount: parseInt(process.env.TESTNET_FAUCET_MAX_AMOUNT || '10000'),
      minAmount: parseInt(process.env.TESTNET_FAUCET_MIN_AMOUNT || '500'),
      rateLimitHours: parseInt(process.env.TESTNET_FAUCET_RATE_LIMIT_HOURS || '24'),
      userRateLimit: parseInt(process.env.TESTNET_FAUCET_USER_RATE_LIMIT || '5'),
      ipRateLimit: parseInt(process.env.TESTNET_FAUCET_IP_RATE_LIMIT || '1')
    };

    this.logger.info('🚀 Testnet Faucet Service initialized', {
      maxAmount: this.config.maxAmount,
      minAmount: this.config.minAmount,
      rateLimitHours: this.config.rateLimitHours,
      userRateLimit: this.config.userRateLimit,
      ipRateLimit: this.config.ipRateLimit
    });
  }

  /**
   * Validate faucet request
   */
  private validateRequest(request: FaucetRequest): { valid: boolean; error?: string } {
    // Validate amount
    if (request.amount < this.config.minAmount) {
      return { valid: false, error: `Amount too small. Minimum: ${this.config.minAmount} sats` };
    }
    
    if (request.amount > this.config.maxAmount) {
      return { valid: false, error: `Amount too large. Maximum: ${this.config.maxAmount} sats` };
    }

    // Validate IP address
    if (!request.ipAddress || typeof request.ipAddress !== 'string') {
      return { valid: false, error: 'Invalid IP address' };
    }

    return { valid: true };
  }

  /**
   * Check rate limits
   */
  private async checkRateLimits(ipAddress: string, userId?: string): Promise<{ allowed: boolean; error?: string }> {
    const now = new Date();
    const rateLimitStart = new Date(now.getTime() - (this.config.rateLimitHours * 60 * 60 * 1000));

    try {
      // Check IP rate limit
      const ipCount = await this.prisma.testnetFaucetDistribution.count({
        where: {
          ip_address: ipAddress,
          created_at: {
            gte: rateLimitStart
          }
        }
      });

      if (ipCount >= this.config.ipRateLimit) {
        return {
          allowed: false,
          error: `IP rate limit exceeded. Maximum ${this.config.ipRateLimit} requests per ${this.config.rateLimitHours} hours`
        };
      }

      // Check user rate limit (if userId provided)
      if (userId) {
        const userCount = await this.prisma.testnetFaucetDistribution.count({
          where: {
            user_id: userId,
            created_at: {
              gte: rateLimitStart
            }
          }
        });

        if (userCount >= this.config.userRateLimit) {
          return {
            allowed: false,
            error: `User rate limit exceeded. Maximum ${this.config.userRateLimit} requests per ${this.config.rateLimitHours} hours`
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      this.logger.error('❌ Error checking rate limits:', error);
      return { allowed: false, error: 'Rate limit check failed' };
    }
  }

  /**
   * Create faucet distribution request
   */
  async createDistribution(request: FaucetRequest): Promise<FaucetDistribution> {
    this.logger.info('🚰 Creating faucet distribution request', {
      amount: request.amount,
      ipAddress: request.ipAddress,
      userId: request.userId
    });

    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check rate limits
    const rateLimitCheck = await this.checkRateLimits(request.ipAddress, request.userId);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.error);
    }

    try {
      // Create invoice via LND
      const invoiceResponse = await this.lndService.invoice!.createInvoiceForAmount(
        request.amount,
        request.memo || `Testnet faucet distribution - ${request.amount} sats`
      );

      // Calculate expiration time (1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Save distribution to database
      const distribution = await this.prisma.testnetFaucetDistribution.create({
        data: {
          ip_address: request.ipAddress,
          user_id: request.userId,
          amount_sats: request.amount,
          invoice_bolt11: invoiceResponse.payment_request,
          payment_hash: invoiceResponse.r_hash,
          status: 'pending',
          expires_at: expiresAt
        }
      });

      this.logger.info('✅ Faucet distribution created', {
        id: distribution.id,
        amount: distribution.amount_sats,
        paymentHash: distribution.payment_hash,
        expiresAt: distribution.expires_at
      });

      return distribution;
    } catch (error) {
      this.logger.error('❌ Failed to create faucet distribution:', error);
      throw new Error(`Failed to create faucet distribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get distribution by ID
   */
  async getDistribution(id: string): Promise<FaucetDistribution | null> {
    try {
      const distribution = await this.prisma.testnetFaucetDistribution.findUnique({
        where: { id }
      });

      return distribution;
    } catch (error) {
      this.logger.error('❌ Failed to get distribution:', error);
      return null;
    }
  }

  /**
   * Get distribution by payment hash
   */
  async getDistributionByPaymentHash(paymentHash: string): Promise<FaucetDistribution | null> {
    try {
      const distribution = await this.prisma.testnetFaucetDistribution.findUnique({
        where: { payment_hash: paymentHash }
      });

      return distribution;
    } catch (error) {
      this.logger.error('❌ Failed to get distribution by payment hash:', error);
      return null;
    }
  }

  /**
   * Update distribution status
   */
  async updateDistributionStatus(
    id: string,
    status: 'pending' | 'paid' | 'expired' | 'cancelled',
    paymentPreimage?: string
  ): Promise<FaucetDistribution | null> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date()
      };

      if (status === 'paid' && paymentPreimage) {
        updateData.payment_preimage = paymentPreimage;
        updateData.paid_at = new Date();
      }

      const distribution = await this.prisma.testnetFaucetDistribution.update({
        where: { id },
        data: updateData
      });

      this.logger.info('✅ Distribution status updated', {
        id: distribution.id,
        status: distribution.status,
        paymentPreimage: paymentPreimage ? 'provided' : 'not provided'
      });

      return distribution;
    } catch (error) {
      this.logger.error('❌ Failed to update distribution status:', error);
      return null;
    }
  }

  /**
   * Get distribution history
   */
  async getDistributionHistory(
    limit: number = 50,
    offset: number = 0,
    ipAddress?: string,
    userId?: string
  ): Promise<FaucetDistribution[]> {
    try {
      const where: any = {};

      if (ipAddress) {
        where.ip_address = ipAddress;
      }

      if (userId) {
        where.user_id = userId;
      }

      const distributions = await this.prisma.testnetFaucetDistribution.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset
      });

      return distributions;
    } catch (error) {
      this.logger.error('❌ Failed to get distribution history:', error);
      return [];
    }
  }

  /**
   * Get faucet statistics
   */
  async getFaucetStats(): Promise<FaucetStats> {
    try {
      const [
        totalDistributions,
        totalAmount,
        pendingDistributions,
        paidDistributions,
        expiredDistributions,
        uniqueUsers,
        uniqueIps
      ] = await Promise.all([
        this.prisma.testnetFaucetDistribution.count(),
        this.prisma.testnetFaucetDistribution.aggregate({
          _sum: { amount_sats: true }
        }),
        this.prisma.testnetFaucetDistribution.count({
          where: { status: 'pending' }
        }),
        this.prisma.testnetFaucetDistribution.count({
          where: { status: 'paid' }
        }),
        this.prisma.testnetFaucetDistribution.count({
          where: { status: 'expired' }
        }),
        this.prisma.testnetFaucetDistribution.groupBy({
          by: ['user_id'],
          where: { user_id: { not: null } }
        }),
        this.prisma.testnetFaucetDistribution.groupBy({
          by: ['ip_address']
        })
      ]);

      const totalAmountSats = totalAmount._sum.amount_sats || 0;
      const averageAmount = totalDistributions > 0 ? totalAmountSats / totalDistributions : 0;

      return {
        total_distributions: totalDistributions,
        total_amount_sats: totalAmountSats,
        pending_distributions: pendingDistributions,
        paid_distributions: paidDistributions,
        expired_distributions: expiredDistributions,
        unique_users: uniqueUsers.length,
        unique_ips: uniqueIps.length,
        average_amount: Math.round(averageAmount)
      };
    } catch (error) {
      this.logger.error('❌ Failed to get faucet stats:', error);
      throw new Error(`Failed to get faucet stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired distributions
   */
  async cleanupExpiredDistributions(): Promise<number> {
    try {
      const now = new Date();
      
      const result = await this.prisma.testnetFaucetDistribution.updateMany({
        where: {
          status: 'pending',
          expires_at: {
            lt: now
          }
        },
        data: {
          status: 'expired',
          updated_at: now
        }
      });

      this.logger.info('🧹 Cleaned up expired distributions', {
        count: result.count
      });

      return result.count;
    } catch (error) {
      this.logger.error('❌ Failed to cleanup expired distributions:', error);
      return 0;
    }
  }

  /**
   * Check if faucet is available
   */
  async isFaucetAvailable(): Promise<{ available: boolean; reason?: string }> {
    try {
      // Check if LND service is healthy
      const isHealthy = await this.lndService.isHealthy();
      if (!isHealthy) {
        return { available: false, reason: 'LND service is not available' };
      }

      // Check if we're on testnet
      const network = this.lndService.getNetwork();
      if (network !== 'testnet') {
        return { available: false, reason: 'Faucet is only available on testnet' };
      }

      return { available: true };
    } catch (error) {
      this.logger.error('❌ Error checking faucet availability:', error);
      return { available: false, reason: 'Service error' };
    }
  }

  /**
   * Get faucet configuration
   */
  getConfig(): TestnetFaucetConfig {
    return { ...this.config };
  }

  /**
   * Update faucet configuration
   */
  updateConfig(newConfig: Partial<TestnetFaucetConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('🔄 Faucet configuration updated', this.config);
  }
}
