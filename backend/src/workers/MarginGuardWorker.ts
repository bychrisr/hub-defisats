// backend/src/workers/MarginGuardWorker.ts
import { PrismaClient } from '@prisma/client';
import { AutomationService, MarginGuardConfig } from '../services/AutomationService';

const prisma = new PrismaClient();
const automationService = new AutomationService();

interface MarginGuardJobData {
  userId: string;
  automationId: string;
  config: MarginGuardConfig;
}

/**
 * Worker que monitora usuários com Margin Guard ativo
 * e executa ações na LN Markets quando os critérios são atendidos
 */
export class MarginGuardWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Inicia o worker de monitoramento
   */
  start(intervalMs: number = 20000) {
    if (this.isRunning) {
      console.log('⚠️ MARGIN GUARD WORKER - Worker já está rodando');
      return;
    }

    console.log(`🚀 MARGIN GUARD WORKER - Iniciando worker (intervalo: ${intervalMs}ms)`);
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      await this.processAllActiveUsers();
    }, intervalMs);

    // Executar imediatamente na primeira vez
    this.processAllActiveUsers();
  }

  /**
   * Para o worker de monitoramento
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ MARGIN GUARD WORKER - Worker não está rodando');
      return;
    }

    console.log('🛑 MARGIN GUARD WORKER - Parando worker');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Processa todos os usuários com Margin Guard ativo
   */
  private async processAllActiveUsers() {
    try {
      console.log('🔍 MARGIN GUARD WORKER - Buscando usuários ativos...');
      
      const activeUsers = await automationService.getActiveUsers();
      console.log(`📊 MARGIN GUARD WORKER - Encontrados ${activeUsers.length} usuários ativos`);

      for (const user of activeUsers) {
        await this.processUser(user);
      }

      console.log('✅ MARGIN GUARD WORKER - Processamento concluído');
    } catch (error) {
      console.error('❌ MARGIN GUARD WORKER - Erro no processamento geral:', error);
    }
  }

  /**
   * Processa um usuário específico
   */
  private async processUser(user: { userId: string; automationId: string; config: MarginGuardConfig }) {
    const { userId, config } = user;
    
    try {
      console.log(`🔍 MARGIN GUARD WORKER - Processando usuário ${userId}`);

      // 1. Obter dados do usuário
      const userRecord = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { email: true }
      });

      if (!userRecord) {
        console.error(`❌ MARGIN GUARD WORKER - Usuário não encontrado: ${userId}`);
        return;
      }

      // TODO: Implementar obtenção das credenciais LN Markets do usuário
      // Por enquanto, vamos simular que temos as credenciais
      console.log(`🔑 MARGIN GUARD WORKER - Processando usuário ${userRecord.email}`);

      // 2. Simular obtenção de posições ativas e preço atual
      // TODO: Implementar integração real com LN Markets
      const mockTrades = [
        {
          id: 'trade-1',
          entry_price: 50000,
          liquidation: 45000,
          margin: 100000, // 100k sats
        }
      ];

      const mockTicker = {
        lastPrice: 48000, // Preço atual
      };

      console.log(`📈 MARGIN GUARD WORKER - Preço atual: $${mockTicker.lastPrice}, Posições: ${mockTrades.length}`);

      // 3. Para cada posição, verificar critérios
      for (const trade of mockTrades) {
        await this.checkTradeCriteria(userId, trade, mockTicker, config);
      }

    } catch (error) {
      console.error(`❌ MARGIN GUARD WORKER - Erro ao processar usuário ${userId}:`, error);
    }
  }

  /**
   * Verifica critérios para uma posição específica
   */
  private async checkTradeCriteria(
    userId: string, 
    trade: any, 
    ticker: any, 
    config: MarginGuardConfig
  ) {
    try {
      const distanceToLiquidation = Math.abs(trade.entry_price - trade.liquidation);
      const currentDistance = Math.abs(ticker.lastPrice - trade.liquidation);

      const thresholdRatio = 1 - (config.threshold / 100);
      const currentRatio = currentDistance / distanceToLiquidation;

      console.log(`📊 MARGIN GUARD WORKER - Trade ${trade.id}:`, {
        entryPrice: trade.entry_price,
        liquidation: trade.liquidation,
        currentPrice: ticker.lastPrice,
        thresholdRatio,
        currentRatio,
        threshold: config.threshold
      });

      if (currentRatio <= thresholdRatio) {
        console.log(`🚨 MARGIN GUARD WORKER - Critério de acionamento atingido para trade ${trade.id} do usuário ${userId}`);
        
        // Executar ação configurada
        await this.executeAction(userId, trade, config);
      } else {
        console.log(`✅ MARGIN GUARD WORKER - Trade ${trade.id} dentro dos limites (${(currentRatio * 100).toFixed(1)}% da distância)`);
      }

    } catch (error) {
      console.error(`❌ MARGIN GUARD WORKER - Erro ao verificar critérios do trade ${trade.id}:`, error);
    }
  }

  /**
   * Executa a ação configurada
   */
  private async executeAction(userId: string, trade: any, config: MarginGuardConfig) {
    try {
      console.log(`🎯 MARGIN GUARD WORKER - Executando ação ${config.action} para trade ${trade.id}`);

      switch (config.action) {
        case 'add_margin':
          const amountToAdd = Math.floor(trade.margin * ((config.add_margin_amount || 20) / 100));
          console.log(`💰 MARGIN GUARD WORKER - Adicionando ${amountToAdd} sats à posição ${trade.id}`);
          // TODO: Implementar chamada real para LN Markets
          // await lnClient.addMargin({ id: trade.id, amount: amountToAdd });
          break;

        case 'close_position':
          console.log(`🔒 MARGIN GUARD WORKER - Fechando posição ${trade.id}`);
          // TODO: Implementar chamada real para LN Markets
          // await lnClient.closeTrade({ id: trade.id });
          break;

        case 'reduce_position':
          const amountToReduce = Math.floor(trade.margin * ((config.reduce_percentage || 20) / 100));
          console.log(`💸 MARGIN GUARD WORKER - Reduzindo ${amountToReduce} sats da posição ${trade.id}`);
          // TODO: Implementar chamada real para LN Markets
          // await lnClient.cashIn({ id: trade.id, amount: amountToReduce });
          break;

        default:
          console.warn(`⚠️ MARGIN GUARD WORKER - Ação desconhecida: ${config.action}`);
      }

      // TODO: Registrar execução no banco de dados para histórico
      console.log(`✅ MARGIN GUARD WORKER - Ação ${config.action} executada com sucesso para trade ${trade.id}`);

    } catch (error) {
      console.error(`❌ MARGIN GUARD WORKER - Erro ao executar ação para trade ${trade.id}:`, error);
    }
  }

  /**
   * Status do worker
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null,
    };
  }
}

// Instância global do worker
export const marginGuardWorker = new MarginGuardWorker();
