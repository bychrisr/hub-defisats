import { FastifyRequest, FastifyReply } from 'fastify';
import { LNMarketsWebSocketService } from '../services/lnmarkets-websocket.service';
import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

export class WebSocketController {
  private prisma: PrismaClient;
  private authService: AuthService;
  private logger: Logger;
  private websocketService: LNMarketsWebSocketService | null = null;

  constructor(prisma: PrismaClient, authService: AuthService, logger: Logger) {
    this.prisma = prisma;
    this.authService = authService;
    this.logger = logger;
  }

  async getWebSocketService(userId: string): Promise<LNMarketsWebSocketService> {
    if (this.websocketService && this.websocketService.getConnectionStatus()) {
      return this.websocketService;
    }

    // Buscar credenciais do usuário usando o novo sistema de contas
    const { AccountCredentialsService } = await import('../services/account-credentials.service');
    const accountCredentialsService = new AccountCredentialsService(this.prisma);
    
    const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(userId);
    
    if (!activeCredentials) {
      throw new Error('Nenhuma conta de exchange ativa encontrada');
    }

    // Criar serviço WebSocket
    this.websocketService = new LNMarketsWebSocketService({
      apiKey: activeCredentials.credentials.apiKey,
      apiSecret: activeCredentials.credentials.apiSecret,
      passphrase: activeCredentials.credentials.passphrase,
      isTestnet: activeCredentials.credentials.isTestnet === 'true' || activeCredentials.credentials.testnet === 'true'
    });

    // Configurar event listeners
    this.websocketService.on('price_update', (data) => {
      this.logger.info('📊 LN MARKETS WS - Price update received:', data);
    });

    this.websocketService.on('marginUpdate', (data) => {
      this.logger.info('💰 LN MARKETS WS - Margin update received:', data);
    });

    this.websocketService.on('error', (error) => {
      this.logger.error('❌ LN MARKETS WS - Error:', error);
    });

    return this.websocketService;
  }

  async connectWebSocket(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Usuário não autenticado' });
      }

      const websocketService = await this.getWebSocketService(userId);
      await websocketService.connect();

      return reply.send({ 
        success: true, 
        message: 'WebSocket conectado com sucesso',
        isConnected: websocketService.getConnectionStatus()
      });
    } catch (error) {
      this.logger.error('❌ Erro ao conectar WebSocket:', error);
      return reply.status(500).send({ 
        error: 'Falha ao conectar WebSocket',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async subscribeChannel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Usuário não autenticado' });
      }

      const { channel, symbol } = request.body as { channel: string; symbol?: string };
      
      if (!channel) {
        return reply.status(400).send({ error: 'Canal é obrigatório' });
      }

      const websocketService = await this.getWebSocketService(userId);
      
      switch (channel) {
        case 'market':
          if (symbol) {
            websocketService.subscribeToMarket(symbol);
          }
          break;
        case 'positions':
          websocketService.subscribeToPositions();
          break;
        case 'margin':
          websocketService.subscribeToMargin();
          break;
        default:
          return reply.status(400).send({ error: 'Canal não suportado' });
      }

      return reply.send({ 
        success: true, 
        message: `Subscrito ao canal ${channel}`,
        channel
      });
    } catch (error) {
      this.logger.error('❌ Erro ao subscrever canal:', error);
      return reply.status(500).send({ 
        error: 'Falha ao subscrever canal',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async disconnectWebSocket(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (this.websocketService) {
        this.websocketService.disconnect();
        this.websocketService = null;
      }

      return reply.send({ 
        success: true, 
        message: 'WebSocket desconectado com sucesso'
      });
    } catch (error) {
      this.logger.error('❌ Erro ao desconectar WebSocket:', error);
      return reply.status(500).send({ 
        error: 'Falha ao desconectar WebSocket',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}
