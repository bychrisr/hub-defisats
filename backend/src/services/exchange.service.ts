import { PrismaClient } from '@prisma/client';

export interface ExchangeInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  api_version?: string;
  credential_types: ExchangeCredentialType[];
}

export interface ExchangeCredentialType {
  id: string;
  name: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  description?: string;
  order: number;
}

export interface UserAccountInfo {
  id: string;
  exchange_id: string;
  account_name: string;
  is_active: boolean;
  is_verified: boolean;
  last_test?: Date;
  created_at: Date;
  exchange: {
    name: string;
    slug: string;
    logo_url?: string;
  };
}

export interface PlanLimits {
  max_exchange_accounts: number;
  max_automations: number;
  max_indicators: number;
  max_simulations: number;
  max_backtests: number;
}

export class ExchangeService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get all available exchanges
   */
  async getAvailableExchanges(): Promise<ExchangeInfo[]> {
    const exchanges = await this.prisma.exchange.findMany({
      where: {
        is_active: true,
      },
      include: {
        credential_types: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return exchanges.map(exchange => ({
      id: exchange.id,
      name: exchange.name,
      slug: exchange.slug,
      description: exchange.description,
      website: exchange.website,
      logo_url: exchange.logo_url,
      is_active: exchange.is_active,
      api_version: exchange.api_version,
      credential_types: exchange.credential_types.map(ct => ({
        id: ct.id,
        name: ct.name,
        field_name: ct.field_name,
        field_type: ct.field_type,
        is_required: ct.is_required,
        description: ct.description,
        order: ct.order,
      })),
    }));
  }

  /**
   * Get user's exchange accounts
   */
  async getUserAccounts(userId: string): Promise<UserAccountInfo[]> {
    const accounts = await this.prisma.userExchangeAccounts.findMany({
      where: {
        user_id: userId,
      },
      include: {
        exchange: {
          select: {
            name: true,
            slug: true,
            logo_url: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return accounts.map(account => ({
      id: account.id,
      exchange_id: account.exchange_id,
      account_name: account.account_name,
      is_active: account.is_active,
      is_verified: account.is_verified,
      last_test: account.last_test,
      created_at: account.created_at,
      exchange: {
        name: account.exchange.name,
        slug: account.exchange.slug,
        logo_url: account.exchange.logo_url,
      },
    }));
  }

  /**
   * Get user's plan limits
   */
  async getUserPlanLimits(userId: string): Promise<PlanLimits> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan_type: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const planLimits = await this.prisma.planLimits.findFirst({
      where: {
        plan: {
          slug: user.plan_type,
        },
      },
    });

    if (!planLimits) {
      // Default limits for free plan
      return {
        max_exchange_accounts: 1,
        max_automations: 5,
        max_indicators: 10,
        max_simulations: 3,
        max_backtests: 5,
      };
    }

    return {
      max_exchange_accounts: planLimits.max_exchange_accounts,
      max_automations: planLimits.max_automations,
      max_indicators: planLimits.max_indicators,
      max_simulations: planLimits.max_simulations,
      max_backtests: planLimits.max_backtests,
    };
  }

  /**
   * Create a new exchange account for user
   */
  async createUserAccount(
    userId: string,
    exchangeId: string,
    accountName: string,
    credentials: Record<string, any>
  ): Promise<UserAccountInfo> {
    // Check if user can add more accounts
    const limits = await this.getUserPlanLimits(userId);
    const currentAccounts = await this.getUserAccounts(userId);

    if (currentAccounts.length >= limits.max_exchange_accounts) {
      throw new Error(`You have reached the maximum number of exchange accounts (${limits.max_exchange_accounts}) for your plan.`);
    }

    // Check if account name already exists for this user
    const existingAccount = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        user_id: userId,
        account_name: accountName,
      },
    });

    if (existingAccount) {
      throw new Error('An account with this name already exists. Please choose a different name.');
    }

    const account = await this.prisma.userExchangeAccounts.create({
      data: {
        user_id: userId,
        exchange_id: exchangeId,
        account_name: accountName,
        credentials: credentials,
        is_active: false, // Will be activated after verification
        is_verified: false,
      },
      include: {
        exchange: {
          select: {
            name: true,
            slug: true,
            logo_url: true,
          },
        },
      },
    });

    return {
      id: account.id,
      exchange_id: account.exchange_id,
      account_name: account.account_name,
      is_active: account.is_active,
      is_verified: account.is_verified,
      last_test: account.last_test,
      created_at: account.created_at,
      exchange: {
        name: account.exchange.name,
        slug: account.exchange.slug,
        logo_url: account.exchange.logo_url,
      },
    };
  }

  /**
   * Test exchange credentials
   */
  async testCredentials(
    userId: string,
    accountId: string,
    credentials: Record<string, any>
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const account = await this.prisma.userExchangeAccounts.findFirst({
        where: {
          id: accountId,
          user_id: userId,
        },
        include: {
          exchange: true,
        },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Here you would implement the actual credential testing logic
      // For now, we'll simulate a test
      const testResult = await this.simulateCredentialTest(account.exchange.slug, credentials);

      if (testResult.success) {
        // Update account as verified
        await this.prisma.userExchangeAccounts.update({
          where: { id: accountId },
          data: {
            is_verified: true,
            is_active: true,
            last_test: new Date(),
            credentials: credentials,
          },
        });
      }

      return testResult;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to test credentials',
      };
    }
  }

  /**
   * Simulate credential testing (replace with actual implementation)
   */
  private async simulateCredentialTest(
    exchangeSlug: string,
    credentials: Record<string, any>
  ): Promise<{ success: boolean; message: string; data?: any }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Basic validation
    const requiredFields = ['api_key', 'api_secret'];
    for (const field of requiredFields) {
      if (!credentials[field] || credentials[field].trim() === '') {
        return {
          success: false,
          message: `Missing required field: ${field}`,
        };
      }
    }

    // Simulate success for demo
    return {
      success: true,
      message: 'Credentials verified successfully',
      data: {
        exchange: exchangeSlug,
        verified_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        id: accountId,
        user_id: userId,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    await this.prisma.userExchangeAccounts.delete({
      where: { id: accountId },
    });
  }
}