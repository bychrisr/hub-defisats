import { FastifyInstance } from 'fastify';
import {
  getDashboardMetrics,
  getTradingAnalytics,
  getTradeLogs,
  getPaymentAnalytics,
  getBacktestReports,
  getSimulationAnalytics,
  getAutomationManagement,
  getNotificationManagement,
  getSystemReports,
  getAuditLogs
} from '../controllers/admin';
import { adminMiddleware } from '../middleware/admin.middleware';

export async function adminRoutes(fastify: FastifyInstance) {
  // Dashboard Metrics
  fastify.get('/dashboard/metrics', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get general dashboard metrics',
      tags: ['admin', 'dashboard'],
      response: {
        200: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number' },
            activeUsers: { type: 'number' },
            monthlyRevenue: { type: 'number' },
            totalTrades: { type: 'number' },
            systemUptime: { type: 'number' },
            uptimePercentage: { type: 'number' }
          }
        }
      }
    }
  }, getDashboardMetrics);

  // Trading Analytics
  fastify.get('/trading/analytics', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get trading analytics with filtering and pagination',
      tags: ['admin', 'trading'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          planType: { type: 'string' },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          sortBy: { type: 'string', enum: ['totalTrades', 'winRate', 'pnl', 'createdAt'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                  planType: { type: 'string' },
                  totalTrades: { type: 'number' },
                  winningTrades: { type: 'number' },
                  losingTrades: { type: 'number' },
                  winRate: { type: 'number' },
                  totalPnL: { type: 'number' },
                  avgPnL: { type: 'number' },
                  lastTradeAt: { type: 'string', format: 'date-time' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                totalUsers: { type: 'number' },
                activeUsers: { type: 'number' },
                totalTrades: { type: 'number' },
                totalPnL: { type: 'number' },
                avgWinRate: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getTradingAnalytics);

  // Trade Logs
  fastify.get('/trades/logs', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get trade logs with filtering and pagination',
      tags: ['admin', 'trades'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          status: { type: 'string' },
          action: { type: 'string' },
          planType: { type: 'string' },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          sortBy: { type: 'string', enum: ['executedAt', 'createdAt', 'pnl', 'amount'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  automationId: { type: 'string' },
                  tradeId: { type: 'string' },
                  status: { type: 'string' },
                  action: { type: 'string' },
                  planType: { type: 'string' },
                  pnl: { type: 'number' },
                  amount: { type: 'number' },
                  price: { type: 'number' },
                  errorMessage: { type: 'string' },
                  executedAt: { type: 'string', format: 'date-time' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                totalTrades: { type: 'number' },
                successfulTrades: { type: 'number' },
                failedTrades: { type: 'number' },
                totalPnL: { type: 'number' },
                avgPnL: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getTradeLogs);

  // Payment Analytics
  fastify.get('/payments/analytics', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get payment analytics with filtering and pagination',
      tags: ['admin', 'payments'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          status: { type: 'string' },
          paymentMethod: { type: 'string' },
          planType: { type: 'string' },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          sortBy: { type: 'string', enum: ['createdAt', 'paidAt', 'amount', 'amountSats'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                  amountSats: { type: 'number' },
                  amount: { type: 'number' },
                  status: { type: 'string' },
                  paymentMethod: { type: 'string' },
                  planType: { type: 'string' },
                  description: { type: 'string' },
                  paidAt: { type: 'string', format: 'date-time' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                totalRevenue: { type: 'number' },
                totalTransactions: { type: 'number' },
                conversionRate: { type: 'number' },
                avgTransactionValue: { type: 'number' },
                completedPayments: { type: 'number' },
                pendingPayments: { type: 'number' },
                failedPayments: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getPaymentAnalytics);

  // Backtest Reports
  fastify.get('/backtests/reports', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get backtest reports with filtering and pagination',
      tags: ['admin', 'backtests'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          status: { type: 'string' },
          strategy: { type: 'string' },
          planType: { type: 'string' },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          sortBy: { type: 'string', enum: ['createdAt', 'completedAt', 'executionTime'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  strategy: { type: 'string' },
                  status: { type: 'string' },
                  planType: { type: 'string' },
                  executionTime: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                  completedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                totalReports: { type: 'number' },
                completedReports: { type: 'number' },
                runningReports: { type: 'number' },
                failedReports: { type: 'number' },
                avgExecutionTime: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getBacktestReports);

  // Simulation Analytics
  fastify.get('/simulations/analytics', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get simulation analytics with filtering and pagination',
      tags: ['admin', 'simulations'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          simulationType: { type: 'string' },
          status: { type: 'string' },
          planType: { type: 'string' },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          sortBy: { type: 'string', enum: ['createdAt', 'startedAt', 'completedAt', 'progress'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  name: { type: 'string' },
                  simulationType: { type: 'string' },
                  status: { type: 'string' },
                  planType: { type: 'string' },
                  progress: { type: 'number' },
                  duration: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                  startedAt: { type: 'string', format: 'date-time' },
                  completedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                totalSimulations: { type: 'number' },
                completedSimulations: { type: 'number' },
                runningSimulations: { type: 'number' },
                failedSimulations: { type: 'number' },
                avgProgress: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getSimulationAnalytics);

  // Automation Management
  fastify.get('/automations/management', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get automation management data with filtering and pagination',
      tags: ['admin', 'automations'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' },
          riskLevel: { type: 'string' },
          planType: { type: 'string' },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'type', 'status'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  type: { type: 'string' },
                  status: { type: 'string' },
                  riskLevel: { type: 'string' },
                  planType: { type: 'string' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                totalAutomations: { type: 'number' },
                activeAutomations: { type: 'number' },
                pausedAutomations: { type: 'number' },
                stoppedAutomations: { type: 'number' },
                errorAutomations: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getAutomationManagement);

  // Notification Management
  fastify.get('/notifications/management', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get notification management data with filtering and pagination',
      tags: ['admin', 'notifications'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          channel: { type: 'string' },
          category: { type: 'string' },
          isActive: { type: 'boolean' },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'name', 'channel'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  channel: { type: 'string' },
                  category: { type: 'string' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                totalTemplates: { type: 'number' },
                activeTemplates: { type: 'number' },
                totalNotifications: { type: 'number' },
                sentNotifications: { type: 'number' },
                failedNotifications: { type: 'number' },
                successRate: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getNotificationManagement);

  // System Reports
  fastify.get('/reports/system', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get system reports with filtering and pagination',
      tags: ['admin', 'reports'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          sortBy: { type: 'string', enum: ['createdAt', 'generatedAt', 'title', 'fileSize'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  status: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  filePath: { type: 'string' },
                  fileSize: { type: 'number' },
                  generatedAt: { type: 'string', format: 'date-time' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                totalReports: { type: 'number' },
                completedReports: { type: 'number' },
                generatingReports: { type: 'number' },
                failedReports: { type: 'number' },
                scheduledReports: { type: 'number' },
                totalFileSize: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getSystemReports);

  // Audit Logs
  fastify.get('/audit/logs', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get audit logs with filtering and pagination',
      tags: ['admin', 'audit'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          action: { type: 'string' },
          resource: { type: 'string' },
          severity: { type: 'string' },
          userId: { type: 'string' },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          sortBy: { type: 'string', enum: ['createdAt', 'action', 'severity', 'userId'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  action: { type: 'string' },
                  resource: { type: 'string' },
                  resourceId: { type: 'string' },
                  severity: { type: 'string' },
                  ipAddress: { type: 'string' },
                  userAgent: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                totalLogs: { type: 'number' },
                criticalLogs: { type: 'number' },
                highLogs: { type: 'number' },
                mediumLogs: { type: 'number' },
                lowLogs: { type: 'number' },
                uniqueUsers: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getAuditLogs);
}