import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { UserExchangeAccountService, CreateUserExchangeAccountData, UpdateUserExchangeAccountData } from '../services/userExchangeAccount.service';
import { AccountCredentialsService } from '../services/account-credentials.service';
import { broadcastToUser } from '../routes/websocket.routes';

export class UserExchangeAccountController {
  private prisma: PrismaClient;
  private userExchangeAccountService: UserExchangeAccountService;
  private accountCredentialsService: AccountCredentialsService;

  constructor() {
    this.prisma = new PrismaClient();
    this.userExchangeAccountService = new UserExchangeAccountService(this.prisma);
    this.accountCredentialsService = new AccountCredentialsService(this.prisma);
  }

  /**
   * GET /api/user/exchange-accounts - Listar contas de exchange do usuário
   */
  async getUserExchangeAccounts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      console.log('🔍 USER EXCHANGE ACCOUNT CONTROLLER - Getting accounts for user:', user?.id);

      const accounts = await this.userExchangeAccountService.getUserExchangeAccounts(user.id);

      console.log('✅ USER EXCHANGE ACCOUNT CONTROLLER - Accounts retrieved:', {
        count: accounts.length,
        accounts: accounts.map(acc => ({
          id: acc.id,
          exchangeName: acc.exchange.name,
          accountName: acc.account_name,
          isActive: acc.is_active,
          isVerified: acc.is_verified
        }))
      });

      return reply.status(200).send({
        success: true,
        data: accounts.map(account => ({
          id: account.id,
          exchange_id: account.exchange_id,
          exchange: {
            id: account.exchange.id,
            name: account.exchange.name,
            slug: account.exchange.slug,
            logo_url: account.exchange.logo_url
          },
          account_name: account.account_name,
          credentials: account.credentials,
          is_active: account.is_active,
          is_verified: account.is_verified,
          last_test: account.last_test,
          created_at: account.created_at,
          updated_at: account.updated_at
        }))
      });

    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT CONTROLLER - Error getting accounts:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to get exchange accounts'
      });
    }
  }

  /**
   * GET /api/user/exchange-accounts/:id - Obter conta específica
   */
  async getUserExchangeAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      console.log('🔍 USER EXCHANGE ACCOUNT CONTROLLER - Getting account:', { userId: user?.id, accountId: id });

      const account = await this.userExchangeAccountService.getUserExchangeAccount(user.id, id);

      if (!account) {
        return reply.status(404).send({
          success: false,
          error: 'ACCOUNT_NOT_FOUND',
          message: 'Exchange account not found'
        });
      }

      console.log('✅ USER EXCHANGE ACCOUNT CONTROLLER - Account retrieved:', {
        id: account.id,
        exchangeName: account.exchange.name,
        accountName: account.account_name,
        isActive: account.is_active
      });

      return reply.status(200).send({
        success: true,
        data: {
          id: account.id,
          exchange_id: account.exchange_id,
          exchange: {
            id: account.exchange.id,
            name: account.exchange.name,
            slug: account.exchange.slug,
            logo_url: account.exchange.logo_url
          },
          account_name: account.account_name,
          credentials: account.credentials,
          is_active: account.is_active,
          is_verified: account.is_verified,
          last_test: account.last_test,
          created_at: account.created_at,
          updated_at: account.updated_at
        }
      });

    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT CONTROLLER - Error getting account:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to get exchange account'
      });
    }
  }

  /**
   * POST /api/user/exchange-accounts - Criar nova conta de exchange
   */
  async createUserExchangeAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { exchange_id, account_name, credentials } = request.body as CreateUserExchangeAccountData;

      console.log('🔄 USER EXCHANGE ACCOUNT CONTROLLER - Creating account:', {
        userId: user?.id,
        exchangeId: exchange_id,
        accountName: account_name
      });

      // Validar dados
      if (!exchange_id || !account_name || !credentials) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'exchange_id, account_name, and credentials are required'
        });
      }

      const account = await this.userExchangeAccountService.createUserExchangeAccount(user.id, {
        exchange_id,
        account_name,
        credentials
      });

      console.log('✅ USER EXCHANGE ACCOUNT CONTROLLER - Account created:', {
        id: account.id,
        exchangeName: account.exchange.name,
        accountName: account.account_name,
        isActive: account.is_active
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: account.id,
          exchange_id: account.exchange_id,
          exchange: {
            id: account.exchange.id,
            name: account.exchange.name,
            slug: account.exchange.slug,
            logo_url: account.exchange.logo_url
          },
          account_name: account.account_name,
          credentials: account.credentials,
          is_active: account.is_active,
          is_verified: account.is_verified,
          last_test: account.last_test,
          created_at: account.created_at,
          updated_at: account.updated_at
        }
      });

    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT CONTROLLER - Error creating account:', error);
      
      if (error.message === 'Exchange not found') {
        return reply.status(404).send({
          success: false,
          error: 'EXCHANGE_NOT_FOUND',
          message: 'Exchange not found'
        });
      }

      if (error.message === 'User already has an account with this name for this exchange') {
        return reply.status(409).send({
          success: false,
          error: 'ACCOUNT_NAME_EXISTS',
          message: 'User already has an account with this name for this exchange'
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to create exchange account'
      });
    }
  }

  /**
   * PUT /api/user/exchange-accounts/:id - Atualizar conta de exchange
   */
  async updateUserExchangeAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const updateData = request.body as UpdateUserExchangeAccountData;

      console.log('🔄 USER EXCHANGE ACCOUNT CONTROLLER - Updating account:', {
        userId: user?.id,
        accountId: id,
        updateData
      });

      const account = await this.userExchangeAccountService.updateUserExchangeAccount(user.id, id, updateData);

      console.log('✅ USER EXCHANGE ACCOUNT CONTROLLER - Account updated:', {
        id: account.id,
        exchangeName: account.exchange.name,
        accountName: account.account_name,
        isActive: account.is_active
      });

      // ========================================================================
      // LIMPAR CACHE DE CREDENCIAIS QUANDO CREDENCIAIS SÃO ATUALIZADAS
      // ========================================================================

      if (updateData.credentials) {
        try {
          console.log('🧹 USER EXCHANGE ACCOUNT CONTROLLER - Clearing credentials cache after update');
          
          // Limpar cache da conta específica que foi atualizada
          await this.accountCredentialsService.clearAccountCredentialsCache(user.id, id);
          
          console.log('✅ USER EXCHANGE ACCOUNT CONTROLLER - Credentials cache cleared successfully');
        } catch (cacheError) {
          console.error('❌ USER EXCHANGE ACCOUNT CONTROLLER - Error clearing credentials cache:', cacheError);
          // Não falhar a requisição por erro no cache
        }
      }

      return reply.status(200).send({
        success: true,
        data: {
          id: account.id,
          exchange_id: account.exchange_id,
          exchange: {
            id: account.exchange.id,
            name: account.exchange.name,
            slug: account.exchange.slug,
            logo_url: account.exchange.logo_url
          },
          account_name: account.account_name,
          credentials: account.credentials,
          is_active: account.is_active,
          is_verified: account.is_verified,
          last_test: account.last_test,
          created_at: account.created_at,
          updated_at: account.updated_at
        }
      });

    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT CONTROLLER - Error updating account:', error);
      
      if (error.message === 'Account not found') {
        return reply.status(404).send({
          success: false,
          error: 'ACCOUNT_NOT_FOUND',
          message: 'Exchange account not found'
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to update exchange account'
      });
    }
  }

  /**
   * DELETE /api/user/exchange-accounts/:id - Deletar conta de exchange
   */
  async deleteUserExchangeAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      console.log('🗑️ USER EXCHANGE ACCOUNT CONTROLLER - Deleting account:', {
        userId: user?.id,
        accountId: id
      });

      await this.userExchangeAccountService.deleteUserExchangeAccount(user.id, id);

      console.log('✅ USER EXCHANGE ACCOUNT CONTROLLER - Account deleted');

      return reply.status(200).send({
        success: true,
        message: 'Exchange account deleted successfully'
      });

    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT CONTROLLER - Error deleting account:', error);
      
      if (error.message === 'Account not found') {
        return reply.status(404).send({
          success: false,
          error: 'ACCOUNT_NOT_FOUND',
          message: 'Exchange account not found'
        });
      }

      if (error.message === 'Cannot delete account with active automations') {
        return reply.status(409).send({
          success: false,
          error: 'ACCOUNT_HAS_AUTOMATIONS',
          message: 'Cannot delete account with active automations'
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to delete exchange account'
      });
    }
  }

  /**
   * POST /api/user/exchange-accounts/:id/set-active - Definir conta ativa
   */
  async setActiveAccount(request: FastifyRequest, reply: FastifyReply) {
    console.log('🚀 USER EXCHANGE ACCOUNT CONTROLLER - setActiveAccount called:', {
      userId: (request as any).user?.id,
      accountId: (request.params as any).id,
      timestamp: new Date().toISOString()
    });
    
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      console.log('🔄 USER EXCHANGE ACCOUNT CONTROLLER - Setting active account:', {
        userId: user?.id,
        accountId: id
      });

      const account = await this.userExchangeAccountService.setActiveAccount(user.id, id);

      console.log('✅ USER EXCHANGE ACCOUNT CONTROLLER - Active account set:', {
        id: account.id,
        exchangeName: account.exchange.name,
        accountName: account.account_name
      });

      // ========================================================================
      // LIMPAR CACHE DE CREDENCIAIS PARA FORÇAR ATUALIZAÇÃO
      // ========================================================================
      
      try {
        console.log('🧹 USER EXCHANGE ACCOUNT CONTROLLER - Clearing credentials cache for user');
        
        // Limpar todo o cache de credenciais do usuário para garantir que a nova conta ativa seja usada
        await this.accountCredentialsService.clearUserCredentialsCache(user.id);
        
        console.log('✅ USER EXCHANGE ACCOUNT CONTROLLER - Credentials cache cleared successfully');
      } catch (cacheError) {
        console.error('❌ USER EXCHANGE ACCOUNT CONTROLLER - Error clearing credentials cache:', cacheError);
        // Não falhar a requisição por erro no cache
      }

      // ========================================================================
      // EMITIR EVENTO WEBSOCKET PARA MUDANÇA DE CONTA ATIVA
      // ========================================================================
      
      try {
        console.log('🔌 USER EXCHANGE ACCOUNT CONTROLLER - Broadcasting active account change via WebSocket');
        
        const websocketMessage = {
          type: 'active_account_changed',
          accountId: account.id,
          accountName: account.account_name,
          exchangeName: account.exchange.name,
          exchangeId: account.exchange.id,
          timestamp: Date.now()
        };
        
        const success = broadcastToUser(user.id, websocketMessage);
        
        if (success) {
          console.log('✅ USER EXCHANGE ACCOUNT CONTROLLER - WebSocket event broadcasted successfully');
        } else {
          console.warn('⚠️ USER EXCHANGE ACCOUNT CONTROLLER - No active WebSocket connection found for user');
        }
      } catch (websocketError) {
        console.error('❌ USER EXCHANGE ACCOUNT CONTROLLER - Error broadcasting WebSocket event:', websocketError);
        // Não falhar a requisição por erro no WebSocket
      }

      return reply.status(200).send({
        success: true,
        data: {
          id: account.id,
          exchange_id: account.exchange_id,
          exchange: {
            id: account.exchange.id,
            name: account.exchange.name,
            slug: account.exchange.slug,
            logo_url: account.exchange.logo_url
          },
          account_name: account.account_name,
          credentials: account.credentials,
          is_active: account.is_active,
          is_verified: account.is_verified,
          last_test: account.last_test,
          created_at: account.created_at,
          updated_at: account.updated_at
        }
      });

    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT CONTROLLER - Error setting active account:', error);
      
      if (error.message === 'Account not found') {
        return reply.status(404).send({
          success: false,
          error: 'ACCOUNT_NOT_FOUND',
          message: 'Exchange account not found'
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to set active account'
      });
    }
  }

  /**
   * POST /api/user/exchange-accounts/:id/test - Testar credenciais da conta
   */
  async testAccountCredentials(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      console.log('🧪 USER EXCHANGE ACCOUNT CONTROLLER - Testing credentials:', {
        userId: user?.id,
        accountId: id
      });

      const result = await this.userExchangeAccountService.testAccountCredentials(user.id, id);

      console.log('✅ USER EXCHANGE ACCOUNT CONTROLLER - Credentials test result:', result);

      return reply.status(200).send({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT CONTROLLER - Error testing credentials:', error);
      
      if (error.message === 'Account not found') {
        return reply.status(404).send({
          success: false,
          error: 'ACCOUNT_NOT_FOUND',
          message: 'Exchange account not found'
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to test credentials'
      });
    }
  }
}
