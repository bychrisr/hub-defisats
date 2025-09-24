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
import { adminAuthMiddleware } from '../middleware/auth.middleware';

export async function adminRoutes(fastify: FastifyInstance) {
  // Test route for debugging - no auth first
  fastify.get('/test', async (request, reply) => {
    return reply.send({ 
      message: 'Admin test route working - no auth',
      timestamp: new Date().toISOString()
    });
  });

  // Test route with manual auth check
  fastify.get('/test-manual', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7);
    return reply.send({ 
      message: 'Admin test route working with manual auth',
      token: token.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    });
  });

  // Test route with basic auth check
  fastify.get('/test-basic', {
    preHandler: [adminAuthMiddleware],
    schema: {
      tags: ['admin', 'test']
    }
  }, async (request, reply) => {
    return reply.send({ 
      message: 'Admin test route working with basic auth',
      user: (request as any).user,
      timestamp: new Date().toISOString()
    });
  });

  // Test route with simple auth check
  fastify.get('/test-simple', {
    preHandler: [adminAuthMiddleware],
    schema: {
      tags: ['admin', 'test']
    }
  }, async (request, reply) => {
    return reply.send({ 
      message: 'Admin test route working with simple auth',
      user: (request as any).user,
      timestamp: new Date().toISOString()
    });
  });

  // Dashboard Metrics
  fastify.get('/dashboard/metrics', {
    preHandler: [adminAuthMiddleware],
    schema: {
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
    preHandler: [adminAuthMiddleware],
    schema: {
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
    preHandler: [adminAuthMiddleware],
    schema: {
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
    preHandler: [adminAuthMiddleware],
    schema: {
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
    preHandler: [adminAuthMiddleware],
    schema: {
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
    preHandler: [adminAuthMiddleware],
    schema: {
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
    preHandler: [adminAuthMiddleware],
    schema: {
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
    preHandler: [adminAuthMiddleware],
    schema: {
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
    preHandler: [adminAuthMiddleware],
    schema: {
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
    preHandler: [adminAuthMiddleware],
    schema: {
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