import { FastifyInstance } from 'fastify';
import { backtestController } from '../controllers/backtest.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function backtestRoutes(fastify: FastifyInstance) {
  // Apply authentication to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Execute a new backtest
  fastify.post('/api/backtests', {
    schema: {
      body: {
        type: 'object',
        required: ['startDate', 'endDate', 'initialBalance', 'automationType', 'automationConfig'],
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          initialBalance: { type: 'number', minimum: 100 },
          automationType: { type: 'string', enum: ['margin_guard', 'tp_sl', 'auto_entry'] },
          automationConfig: { type: 'object' },
        },
      },
    },
  }, backtestController.executeBacktest.bind(backtestController));

  // Get user's backtest history
  fastify.get('/api/backtests', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string', default: '10' },
        },
      },
    },
  }, backtestController.getUserBacktests.bind(backtestController));

  // Get specific backtest result
  fastify.get('/api/backtests/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, backtestController.getBacktestResult.bind(backtestController));

  // Delete backtest result
  fastify.delete('/api/backtests/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, backtestController.deleteBacktest.bind(backtestController));

  // Get backtest statistics
  fastify.get('/api/backtests/stats', backtestController.getBacktestStats.bind(backtestController));

  // Get available automation types for backtesting
  fastify.get('/api/backtests/automation-types', backtestController.getAutomationTypes.bind(backtestController));
}

