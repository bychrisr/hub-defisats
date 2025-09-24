import { FastifyInstance } from 'fastify';
import { LoadBalancerController } from '../../controllers/admin/load-balancer.controller';
import { dynamicRateLimiters } from '../../middleware/dynamic-rate-limit.middleware';

export async function loadBalancerRoutes(fastify: FastifyInstance) {
  const controller = new LoadBalancerController();

  // Get load balancer statistics
  fastify.get(
    '/stats',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get load balancer statistics',
        tags: ['Admin', 'Load Balancer'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  stats: { type: 'object' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.getStats.bind(controller)
  );

  // Get all workers
  fastify.get(
    '/workers',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get all workers',
        tags: ['Admin', 'Load Balancer'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  workers: { type: 'array' },
                  count: { type: 'number' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.getWorkers.bind(controller)
  );

  // Get specific worker
  fastify.get(
    '/workers/:workerId',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get specific worker',
        tags: ['Admin', 'Load Balancer'],
        params: {
          type: 'object',
          properties: {
            workerId: { type: 'string' },
          },
          required: ['workerId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  worker: { type: 'object' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.getWorker.bind(controller)
  );

  // Update worker status
  fastify.put(
    '/workers/:workerId/status',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Update worker status',
        tags: ['Admin', 'Load Balancer'],
        params: {
          type: 'object',
          properties: {
            workerId: { type: 'string' },
          },
          required: ['workerId'],
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'inactive', 'overloaded'] },
            cpuUsage: { type: 'number' },
            memoryUsage: { type: 'number' },
            activeJobs: { type: 'number' },
            maxJobs: { type: 'number' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    controller.updateWorkerStatus.bind(controller)
  );

  // Scale workers manually
  fastify.post(
    '/scale',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Scale workers manually',
        tags: ['Admin', 'Load Balancer'],
        body: {
          type: 'object',
          properties: {
            targetCount: { type: 'number' },
          },
          required: ['targetCount'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    controller.scaleWorkers.bind(controller)
  );

  // Get job distributions
  fastify.get(
    '/distributions',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get job distributions across workers',
        tags: ['Admin', 'Load Balancer'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  distributions: { type: 'array' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.getJobDistributions.bind(controller)
  );

  // Get optimal worker for a job
  fastify.get(
    '/optimal-worker',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get optimal worker for a job',
        tags: ['Admin', 'Load Balancer'],
        querystring: {
          type: 'object',
          properties: {
            queueName: { type: 'string' },
          },
          required: ['queueName'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  worker: { type: 'object' },
                  queueName: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.getOptimalWorker.bind(controller)
  );

  // Start load balancer
  fastify.post(
    '/start',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Start load balancer',
        tags: ['Admin', 'Load Balancer'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    controller.startLoadBalancer.bind(controller)
  );

  // Stop load balancer
  fastify.post(
    '/stop',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Stop load balancer',
        tags: ['Admin', 'Load Balancer'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    controller.stopLoadBalancer.bind(controller)
  );

  // Get load balancer health
  fastify.get(
    '/health',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get load balancer health',
        tags: ['Admin', 'Load Balancer'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  healthy: { type: 'boolean' },
                  running: { type: 'boolean' },
                  stats: { type: 'object' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.getHealth.bind(controller)
  );
}
