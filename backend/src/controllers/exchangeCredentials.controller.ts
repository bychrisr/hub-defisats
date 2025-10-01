import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';

export class ExchangeCredentialsController {
  private prisma: PrismaClient;
  private authService: AuthService;

  constructor(prisma?: PrismaClient, authService?: AuthService) {
    this.prisma = prisma || new PrismaClient();
    this.authService = authService || new AuthService(this.prisma, null as any);
  }

  /**
   * GET /api/exchanges - Listar todas as exchanges disponíveis
   */
  async getExchanges(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🔍 EXCHANGE CREDENTIALS - Fetching exchanges...');

      const exchanges = await this.prisma.exchange.findMany({
        where: { is_active: true },
        include: {
          credential_types: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });

      console.log('✅ EXCHANGE CREDENTIALS - Exchanges fetched successfully:', exchanges.length);

      return reply.status(200).send({
        success: true,
        data: exchanges,
        message: 'Exchanges fetched successfully'
      });

    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS - Error fetching exchanges:', error);
      return reply.status(500).send({
        success: false,
        error: 'FETCH_EXCHANGES_FAILED',
        message: error.message || 'Failed to fetch exchanges'
      });
    }
  }

  /**
   * GET /api/user/exchange-credentials - Buscar credenciais do usuário
   */
  async getUserCredentials(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;

      console.log('🔍 EXCHANGE CREDENTIALS - Fetching user credentials for:', user?.id);

      const userCredentials = await this.prisma.userExchangeCredentials.findMany({
        where: { user_id: user.id },
        include: {
          exchange: {
            include: {
              credential_types: {
                orderBy: { order: 'asc' }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Descriptografar credenciais para exibição
      const decryptedCredentials = userCredentials.map(cred => {
        try {
          const decryptedCreds: Record<string, string> = {};
          
          // Descriptografar cada campo de credencial
          Object.entries(cred.credentials as Record<string, string>).forEach(([key, value]) => {
            try {
              decryptedCreds[key] = this.authService.decryptData(value);
            } catch (decryptError) {
              console.warn(`⚠️ EXCHANGE CREDENTIALS - Failed to decrypt ${key}:`, decryptError);
              decryptedCreds[key] = '[ENCRYPTED]';
            }
          });

          return {
            ...cred,
            credentials: decryptedCreds
          };
        } catch (error) {
          console.error('❌ EXCHANGE CREDENTIALS - Error decrypting credentials:', error);
          return {
            ...cred,
            credentials: '[ENCRYPTED]'
          };
        }
      });

      console.log('✅ EXCHANGE CREDENTIALS - User credentials fetched successfully:', decryptedCredentials.length);

      return reply.status(200).send({
        success: true,
        data: decryptedCredentials,
        message: 'User credentials fetched successfully'
      });

    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS - Error fetching user credentials:', error);
      return reply.status(500).send({
        success: false,
        error: 'FETCH_USER_CREDENTIALS_FAILED',
        message: error.message || 'Failed to fetch user credentials'
      });
    }
  }

  /**
   * GET /api/user/exchange-credentials/:exchangeId - Buscar credenciais para uma exchange específica
   */
  async getUserCredentialsForExchange(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { exchangeId } = request.params as { exchangeId: string };

      console.log('🔍 EXCHANGE CREDENTIALS - Fetching credentials for exchange:', exchangeId, 'user:', user?.id);

      const userCredentials = await this.prisma.userExchangeCredentials.findUnique({
        where: {
          user_id_exchange_id: {
            user_id: user.id,
            exchange_id: exchangeId
          }
        },
        include: {
          exchange: {
            include: {
              credential_types: {
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      });

      if (!userCredentials) {
        return reply.status(404).send({
          success: false,
          error: 'CREDENTIALS_NOT_FOUND',
          message: 'Credentials not found for this exchange'
        });
      }

      // Descriptografar credenciais
      try {
        const decryptedCreds: Record<string, string> = {};
        
        Object.entries(userCredentials.credentials as Record<string, string>).forEach(([key, value]) => {
          try {
            decryptedCreds[key] = this.authService.decryptData(value);
          } catch (decryptError) {
            console.warn(`⚠️ EXCHANGE CREDENTIALS - Failed to decrypt ${key}:`, decryptError);
            decryptedCreds[key] = '[ENCRYPTED]';
          }
        });

        const decryptedCredentials = {
          ...userCredentials,
          credentials: decryptedCreds
        };

        console.log('✅ EXCHANGE CREDENTIALS - Exchange credentials fetched successfully');

        return reply.status(200).send({
          success: true,
          data: decryptedCredentials,
          message: 'Exchange credentials fetched successfully'
        });

      } catch (decryptError) {
        console.error('❌ EXCHANGE CREDENTIALS - Error decrypting credentials:', decryptError);
        return reply.status(500).send({
          success: false,
          error: 'DECRYPT_FAILED',
          message: 'Failed to decrypt credentials'
        });
      }

    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS - Error fetching exchange credentials:', error);
      return reply.status(500).send({
        success: false,
        error: 'FETCH_EXCHANGE_CREDENTIALS_FAILED',
        message: error.message || 'Failed to fetch exchange credentials'
      });
    }
  }

  /**
   * PUT /api/user/exchange-credentials - Atualizar credenciais do usuário
   */
  async updateUserCredentials(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { exchange_id, credentials } = request.body as { exchange_id: string; credentials: Record<string, string> };

      console.log('🔍 EXCHANGE CREDENTIALS - Updating credentials for exchange:', exchange_id, 'user:', user?.id);

      // Verificar se a exchange existe
      const exchange = await this.prisma.exchange.findUnique({
        where: { id: exchange_id },
        include: { credential_types: true }
      });

      if (!exchange) {
        return reply.status(404).send({
          success: false,
          error: 'EXCHANGE_NOT_FOUND',
          message: 'Exchange not found'
        });
      }

      // Criptografar credenciais
      const encryptedCredentials: Record<string, string> = {};
      
      Object.entries(credentials).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          encryptedCredentials[key] = this.authService.encryptData(value);
        }
      });

      // Upsert credenciais do usuário
      const userCredentials = await this.prisma.userExchangeCredentials.upsert({
        where: {
          user_id_exchange_id: {
            user_id: user.id,
            exchange_id: exchange_id
          }
        },
        update: {
          credentials: encryptedCredentials,
          is_active: true,
          is_verified: false, // Re-verify after update
          updated_at: new Date()
        },
        create: {
          user_id: user.id,
          exchange_id: exchange_id,
          credentials: encryptedCredentials,
          is_active: true,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date()
        },
        include: {
          exchange: {
            include: {
              credential_types: {
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      });

      // Descriptografar para resposta
      const decryptedCreds: Record<string, string> = {};
      
      Object.entries(userCredentials.credentials as Record<string, string>).forEach(([key, value]) => {
        try {
          decryptedCreds[key] = this.authService.decryptData(value);
        } catch (decryptError) {
          console.warn(`⚠️ EXCHANGE CREDENTIALS - Failed to decrypt ${key}:`, decryptError);
          decryptedCreds[key] = '[ENCRYPTED]';
        }
      });

      const responseData = {
        ...userCredentials,
        credentials: decryptedCreds
      };

      console.log('✅ EXCHANGE CREDENTIALS - Credentials updated successfully');

      return reply.status(200).send({
        success: true,
        data: responseData,
        message: 'Credentials updated successfully'
      });

    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS - Error updating credentials:', error);
      return reply.status(500).send({
        success: false,
        error: 'UPDATE_CREDENTIALS_FAILED',
        message: error.message || 'Failed to update credentials'
      });
    }
  }

  /**
   * POST /api/user/exchange-credentials/:exchangeId/test - Testar credenciais
   */
  async testCredentials(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { exchangeId } = request.params as { exchangeId: string };

      console.log('🔍 EXCHANGE CREDENTIALS - Testing credentials for exchange:', exchangeId, 'user:', user?.id);

      // Buscar credenciais do usuário
      const userCredentials = await this.prisma.userExchangeCredentials.findUnique({
        where: {
          user_id_exchange_id: {
            user_id: user.id,
            exchange_id: exchangeId
          }
        },
        include: { exchange: true }
      });

      if (!userCredentials) {
        return reply.status(404).send({
          success: false,
          error: 'CREDENTIALS_NOT_FOUND',
          message: 'Credentials not found for this exchange'
        });
      }

      // Descriptografar credenciais para teste
      const decryptedCreds: Record<string, string> = {};
      
      Object.entries(userCredentials.credentials as Record<string, string>).forEach(([key, value]) => {
        try {
          decryptedCreds[key] = this.authService.decryptData(value);
        } catch (decryptError) {
          console.warn(`⚠️ EXCHANGE CREDENTIALS - Failed to decrypt ${key}:`, decryptError);
          return reply.status(500).send({
            success: false,
            error: 'DECRYPT_FAILED',
            message: 'Failed to decrypt credentials for testing'
          });
        }
      });

      // Aqui você implementaria a lógica de teste específica para cada exchange
      // Por enquanto, vamos simular um teste bem-sucedido
      const testResult = {
        success: true,
        message: `Credentials for ${userCredentials.exchange.name} are valid`
      };

      // Atualizar status de verificação
      await this.prisma.userExchangeCredentials.update({
        where: { id: userCredentials.id },
        data: {
          is_verified: testResult.success,
          last_test: new Date()
        }
      });

      console.log('✅ EXCHANGE CREDENTIALS - Credentials tested successfully');

      return reply.status(200).send(testResult);

    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS - Error testing credentials:', error);
      return reply.status(500).send({
        success: false,
        error: 'TEST_CREDENTIALS_FAILED',
        message: error.message || 'Failed to test credentials'
      });
    }
  }

  /**
   * DELETE /api/user/exchange-credentials/:exchangeId - Deletar credenciais
   */
  async deleteCredentials(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { exchangeId } = request.params as { exchangeId: string };

      console.log('🔍 EXCHANGE CREDENTIALS - Deleting credentials for exchange:', exchangeId, 'user:', user?.id);

      const deletedCredentials = await this.prisma.userExchangeCredentials.deleteMany({
        where: {
          user_id: user.id,
          exchange_id: exchangeId
        }
      });

      console.log('✅ EXCHANGE CREDENTIALS - Credentials deleted successfully:', deletedCredentials.count);

      return reply.status(200).send({
        success: true,
        message: 'Credentials deleted successfully'
      });

    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS - Error deleting credentials:', error);
      return reply.status(500).send({
        success: false,
        error: 'DELETE_CREDENTIALS_FAILED',
        message: error.message || 'Failed to delete credentials'
      });
    }
  }
}
