import { PrismaClient } from '@prisma/client';
import { Exchange, ExchangeCredentialType, UserExchangeCredentials } from '@prisma/client';

export interface ExchangeWithCredentials extends Exchange {
  credential_types: ExchangeCredentialType[];
}

export interface UserCredentialsWithExchange extends UserExchangeCredentials {
  exchange: Exchange;
}

export class ExchangeService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all active exchanges with their credential types
   */
  async getActiveExchanges(): Promise<ExchangeWithCredentials[]> {
    console.log('🔍 EXCHANGE SERVICE - Fetching active exchanges...');
    
    const exchanges = await this.prisma.exchange.findMany({
      where: {
        is_active: true
      },
      include: {
        credential_types: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('✅ EXCHANGE SERVICE - Found exchanges:', {
      count: exchanges.length,
      exchanges: exchanges.map(ex => ({ id: ex.id, name: ex.name, slug: ex.slug }))
    });

    return exchanges;
  }

  /**
   * Get exchange by ID with credential types
   */
  async getExchangeById(exchangeId: string): Promise<ExchangeWithCredentials | null> {
    console.log('🔍 EXCHANGE SERVICE - Fetching exchange by ID:', exchangeId);
    
    const exchange = await this.prisma.exchange.findUnique({
      where: {
        id: exchangeId
      },
      include: {
        credential_types: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (exchange) {
      console.log('✅ EXCHANGE SERVICE - Exchange found:', { id: exchange.id, name: exchange.name });
    } else {
      console.log('❌ EXCHANGE SERVICE - Exchange not found:', exchangeId);
    }

    return exchange;
  }

  /**
   * Get exchange by slug with credential types
   */
  async getExchangeBySlug(slug: string): Promise<ExchangeWithCredentials | null> {
    console.log('🔍 EXCHANGE SERVICE - Fetching exchange by slug:', slug);
    
    const exchange = await this.prisma.exchange.findUnique({
      where: {
        slug: slug
      },
      include: {
        credential_types: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (exchange) {
      console.log('✅ EXCHANGE SERVICE - Exchange found by slug:', { id: exchange.id, name: exchange.name });
    } else {
      console.log('❌ EXCHANGE SERVICE - Exchange not found by slug:', slug);
    }

    return exchange;
  }

  /**
   * Get user's credentials for all exchanges
   */
  async getUserCredentials(userId: string): Promise<UserCredentialsWithExchange[]> {
    console.log('🔍 EXCHANGE SERVICE - Fetching user credentials for user:', userId);
    
    const credentials = await this.prisma.userExchangeCredentials.findMany({
      where: {
        user_id: userId
      },
      include: {
        exchange: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('✅ EXCHANGE SERVICE - User credentials found:', {
      count: credentials.length,
      exchanges: credentials.map(cred => ({ 
        exchangeId: cred.exchange_id, 
        exchangeName: cred.exchange.name,
        isActive: cred.is_active 
      }))
    });

    return credentials;
  }

  /**
   * Get user's credentials for a specific exchange
   */
  async getUserCredentialsForExchange(userId: string, exchangeId: string): Promise<UserCredentialsWithExchange | null> {
    console.log('🔍 EXCHANGE SERVICE - Fetching user credentials for exchange:', { userId, exchangeId });
    
    const credentials = await this.prisma.userExchangeCredentials.findFirst({
      where: {
        user_id: userId,
        exchange_id: exchangeId
      },
      include: {
        exchange: true
      }
    });

    if (credentials) {
      console.log('✅ EXCHANGE SERVICE - User credentials found for exchange:', { 
        exchangeName: credentials.exchange.name,
        isActive: credentials.is_active 
      });
    } else {
      console.log('❌ EXCHANGE SERVICE - No credentials found for exchange:', exchangeId);
    }

    return credentials;
  }

  /**
   * Create or update user credentials for an exchange
   */
  async upsertUserCredentials(
    userId: string, 
    exchangeId: string, 
    credentials: Record<string, string>
  ): Promise<UserCredentialsWithExchange> {
    console.log('🔄 EXCHANGE SERVICE - Upserting user credentials:', { userId, exchangeId });
    
    const result = await this.prisma.userExchangeCredentials.upsert({
      where: {
        user_id_exchange_id: {
          user_id: userId,
          exchange_id: exchangeId
        }
      },
      update: {
        credentials: credentials,
        is_active: true,
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        exchange_id: exchangeId,
        credentials: credentials,
        is_active: true,
        is_verified: false
      },
      include: {
        exchange: true
      }
    });

    console.log('✅ EXCHANGE SERVICE - Credentials upserted successfully:', {
      exchangeName: result.exchange.name,
      isActive: result.is_active
    });

    return result;
  }

  /**
   * Delete user credentials for an exchange
   */
  async deleteUserCredentials(userId: string, exchangeId: string): Promise<void> {
    console.log('🗑️ EXCHANGE SERVICE - Deleting user credentials:', { userId, exchangeId });
    
    await this.prisma.userExchangeCredentials.deleteMany({
      where: {
        user_id: userId,
        exchange_id: exchangeId
      }
    });

    console.log('✅ EXCHANGE SERVICE - Credentials deleted successfully');
  }

  /**
   * Update credential verification status
   */
  async updateCredentialVerification(
    userId: string, 
    exchangeId: string, 
    isVerified: boolean,
    lastTest?: Date
  ): Promise<void> {
    console.log('🔄 EXCHANGE SERVICE - Updating credential verification:', { 
      userId, 
      exchangeId, 
      isVerified,
      lastTest 
    });
    
    await this.prisma.userExchangeCredentials.updateMany({
      where: {
        user_id: userId,
        exchange_id: exchangeId
      },
      data: {
        is_verified: isVerified,
        last_test: lastTest || new Date()
      }
    });

    console.log('✅ EXCHANGE SERVICE - Credential verification updated');
  }

  /**
   * Get exchange statistics
   */
  async getExchangeStats(): Promise<{
    totalExchanges: number;
    activeExchanges: number;
    totalUsersWithCredentials: number;
    exchangesWithUsers: Array<{
      exchangeId: string;
      exchangeName: string;
      userCount: number;
    }>;
  }> {
    console.log('📊 EXCHANGE SERVICE - Fetching exchange statistics...');
    
    const [totalExchanges, activeExchanges, credentialsCount, exchangesWithUsers] = await Promise.all([
      this.prisma.exchange.count(),
      this.prisma.exchange.count({ where: { is_active: true } }),
      this.prisma.userExchangeCredentials.count({ where: { is_active: true } }),
      this.prisma.userExchangeCredentials.groupBy({
        by: ['exchange_id'],
        where: { is_active: true },
        _count: { user_id: true },
        include: {
          exchange: {
            select: { name: true }
          }
        }
      })
    ]);

    const stats = {
      totalExchanges,
      activeExchanges,
      totalUsersWithCredentials: credentialsCount,
      exchangesWithUsers: exchangesWithUsers.map(item => ({
        exchangeId: item.exchange_id,
        exchangeName: item.exchange?.name || 'Unknown',
        userCount: item._count.user_id
      }))
    };

    console.log('✅ EXCHANGE SERVICE - Statistics calculated:', stats);
    return stats;
  }
}
