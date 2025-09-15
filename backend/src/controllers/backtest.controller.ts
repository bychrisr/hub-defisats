import { FastifyRequest, FastifyReply } from 'fastify';
import { backtestService, BacktestConfig } from '../services/backtest.service';

export class BacktestController {
  /**
   * Execute a new backtest
   */
  async executeBacktest(request: FastifyRequest<{ Body: BacktestConfig }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const config: BacktestConfig = {
        ...request.body,
        userId,
        startDate: new Date(request.body.startDate),
        endDate: new Date(request.body.endDate),
      };

      console.log(`📊 Starting backtest for user ${userId}`);

      const result = await backtestService.executePersonalBacktest(config);

      reply.send({
        success: true,
        data: {
          id: result.id || 'completed',
          result,
          executed_at: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error executing backtest:', error);
      reply.code(500).send({
        success: false,
        error: error.message || 'Failed to execute backtest',
      });
    }
  }

  /**
   * Get user's backtest history
   */
  async getUserBacktests(request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const limit = parseInt(request.query.limit || '10');

      const backtests = await backtestService.getUserBacktests(userId, limit);

      reply.send({
        success: true,
        data: backtests,
      });
    } catch (error: any) {
      console.error('Error fetching backtests:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch backtests',
      });
    }
  }

  /**
   * Get specific backtest result
   */
  async getBacktestResult(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params;

      const backtest = await backtestService.getBacktestResult(userId, id);

      reply.send({
        success: true,
        data: backtest,
      });
    } catch (error: any) {
      console.error('Error fetching backtest:', error);
      reply.code(error.message === 'Backtest not found' ? 404 : 500).send({
        success: false,
        error: error.message || 'Failed to fetch backtest',
      });
    }
  }

  /**
   * Delete backtest result
   */
  async deleteBacktest(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params;

      await backtestService.deleteBacktest(userId, id);

      reply.send({
        success: true,
        message: 'Backtest deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting backtest:', error);
      reply.code(error.message === 'Backtest not found' ? 404 : 500).send({
        success: false,
        error: error.message || 'Failed to delete backtest',
      });
    }
  }

  /**
   * Get backtest statistics for user
   */
  async getBacktestStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const backtests = await backtestService.getUserBacktests(userId, 100);

      const stats = {
        total_backtests: backtests.length,
        total_pnl: backtests.reduce((sum, b) => sum + (b.result as any)?.totalPnl || 0, 0),
        avg_win_rate: backtests.length > 0
          ? backtests.reduce((sum, b) => sum + ((b.result as any)?.winRate || 0), 0) / backtests.length
          : 0,
        best_backtest: backtests.reduce((best, current) => {
          const currentPnl = (current.result as any)?.totalPnl || 0;
          const bestPnl = (best.result as any)?.totalPnl || 0;
          return currentPnl > bestPnl ? current : best;
        }, backtests[0] || null),
        worst_backtest: backtests.reduce((worst, current) => {
          const currentPnl = (current.result as any)?.totalPnl || 0;
          const worstPnl = (worst.result as any)?.totalPnl || 0;
          return currentPnl < worstPnl ? current : worst;
        }, backtests[0] || null),
      };

      reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching backtest stats:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch backtest statistics',
      });
    }
  }

  /**
   * Get available automation types for backtesting
   */
  async getAutomationTypes(request: FastifyRequest, reply: FastifyReply) {
    reply.send({
      success: true,
      data: {
        automation_types: [
          {
            type: 'margin_guard',
            name: 'Margin Guard',
            description: 'Proteção contra liquidação baseada em nível de margem',
            config_schema: {
              margin_threshold: { type: 'number', min: 1, max: 50, default: 10 },
              action: {
                type: 'string',
                enum: ['close_position', 'reduce_position', 'add_margin'],
                default: 'close_position'
              },
              reduce_percentage: { type: 'number', min: 10, max: 90, default: 50 },
              add_margin_amount: { type: 'number', min: 100, default: 1000 },
            },
          },
          {
            type: 'tp_sl',
            name: 'Take Profit / Stop Loss',
            description: 'Gestão automática de lucro e perda',
            config_schema: {
              takeprofit: { type: 'number', min: 0.1, max: 100, description: 'Take profit percentage' },
              stoploss: { type: 'number', min: 0.1, max: 50, description: 'Stop loss percentage' },
              trailing_stop: { type: 'boolean', default: false },
              trailing_distance: { type: 'number', min: 0.1, max: 20 },
            },
          },
          {
            type: 'auto_entry',
            name: 'Auto Entry',
            description: 'Entrada automática baseada em condições de preço',
            config_schema: {
              trigger_price: { type: 'number', description: 'Preço de gatilho' },
              trigger_type: { type: 'string', enum: ['market', 'limit'], default: 'market' },
              side: { type: 'string', enum: ['b', 's'], description: 'b=buy, s=sell' },
              quantity: { type: 'number', min: 1 },
              leverage: { type: 'number', min: 1, max: 100, default: 10 },
              stoploss: { type: 'number', description: 'Stop loss price' },
              takeprofit: { type: 'number', description: 'Take profit price' },
            },
          },
        ],
      },
    });
  }
}

// Export singleton instance
export const backtestController = new BacktestController();

