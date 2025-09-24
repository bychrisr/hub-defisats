import { FastifyRequest, FastifyReply } from 'fastify';
import { loadBalancer } from '../../services/load-balancer.service';

export class LoadBalancerController {
  /**
   * Get load balancer statistics
   */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await loadBalancer.getStats();
      
      return reply.status(200).send({
        success: true,
        data: {
          stats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'LOAD_BALANCER_STATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get load balancer stats',
      });
    }
  }

  /**
   * Get all workers
   */
  async getWorkers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const workers = loadBalancer.getAllWorkers();
      
      return reply.status(200).send({
        success: true,
        data: {
          workers,
          count: workers.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'LOAD_BALANCER_WORKERS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workers',
      });
    }
  }

  /**
   * Get specific worker
   */
  async getWorker(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workerId } = request.params as { workerId: string };
      
      if (!workerId) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Worker ID is required',
        });
      }

      const worker = loadBalancer.getWorker(workerId);
      
      if (!worker) {
        return reply.status(404).send({
          success: false,
          error: 'WORKER_NOT_FOUND',
          message: `Worker ${workerId} not found`,
        });
      }
      
      return reply.status(200).send({
        success: true,
        data: {
          worker,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'LOAD_BALANCER_WORKER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get worker',
      });
    }
  }

  /**
   * Update worker status
   */
  async updateWorkerStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workerId } = request.params as { workerId: string };
      const { status, cpuUsage, memoryUsage, activeJobs, maxJobs } = request.body as {
        status?: 'active' | 'inactive' | 'overloaded';
        cpuUsage?: number;
        memoryUsage?: number;
        activeJobs?: number;
        maxJobs?: number;
      };
      
      if (!workerId) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Worker ID is required',
        });
      }

      const worker = loadBalancer.getWorker(workerId);
      if (!worker) {
        return reply.status(404).send({
          success: false,
          error: 'WORKER_NOT_FOUND',
          message: `Worker ${workerId} not found`,
        });
      }

      await loadBalancer.updateWorkerStatus(workerId, {
        status,
        cpuUsage,
        memoryUsage,
        activeJobs,
        maxJobs,
      });
      
      return reply.status(200).send({
        success: true,
        message: `Worker ${workerId} status updated successfully`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'LOAD_BALANCER_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update worker status',
      });
    }
  }

  /**
   * Scale workers manually
   */
  async scaleWorkers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { targetCount } = request.body as { targetCount: number };
      
      if (typeof targetCount !== 'number' || targetCount < 0) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Target count must be a non-negative number',
        });
      }

      await loadBalancer.scaleWorkers(targetCount);
      
      return reply.status(200).send({
        success: true,
        message: `Workers scaled to ${targetCount}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'LOAD_BALANCER_SCALE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to scale workers',
      });
    }
  }

  /**
   * Get job distributions
   */
  async getJobDistributions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const distributions = await loadBalancer.distributeJobs();
      
      return reply.status(200).send({
        success: true,
        data: {
          distributions,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'LOAD_BALANCER_DISTRIBUTIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get job distributions',
      });
    }
  }

  /**
   * Get optimal worker for a job
   */
  async getOptimalWorker(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { queueName } = request.query as { queueName: string };
      
      if (!queueName) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Queue name is required',
        });
      }

      const worker = await loadBalancer.getOptimalWorker(queueName);
      
      return reply.status(200).send({
        success: true,
        data: {
          worker,
          queueName,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'LOAD_BALANCER_OPTIMAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get optimal worker',
      });
    }
  }

  /**
   * Start load balancer
   */
  async startLoadBalancer(request: FastifyRequest, reply: FastifyReply) {
    try {
      await loadBalancer.start();
      
      return reply.status(200).send({
        success: true,
        message: 'Load balancer started successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'LOAD_BALANCER_START_ERROR',
        message: error instanceof Error ? error.message : 'Failed to start load balancer',
      });
    }
  }

  /**
   * Stop load balancer
   */
  async stopLoadBalancer(request: FastifyRequest, reply: FastifyReply) {
    try {
      await loadBalancer.stop();
      
      return reply.status(200).send({
        success: true,
        message: 'Load balancer stopped successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'LOAD_BALANCER_STOP_ERROR',
        message: error instanceof Error ? error.message : 'Failed to stop load balancer',
      });
    }
  }

  /**
   * Get load balancer health
   */
  async getHealth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const isRunning = loadBalancer.isLoadBalancerRunning();
      const stats = await loadBalancer.getStats();
      
      return reply.status(200).send({
        success: true,
        data: {
          healthy: isRunning,
          running: isRunning,
          stats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'LOAD_BALANCER_HEALTH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get load balancer health',
      });
    }
  }
}
