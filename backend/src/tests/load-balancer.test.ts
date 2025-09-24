import { LoadBalancerService } from '../services/load-balancer.service';
import { WorkerManagerService } from '../services/worker-manager.service';

// Mock Redis
jest.mock('ioredis', () => {
  const mockRedis = {
    on: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    info: jest.fn(),
    memory: jest.fn(),
    ping: jest.fn(),
    quit: jest.fn(),
  };
  
  const Redis = jest.fn(() => mockRedis);
  Redis.prototype = mockRedis;
  
  return { default: Redis, Redis };
});

// Mock BullMQ
jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
  Queue: jest.fn().mockImplementation(() => ({
    getWaiting: jest.fn().mockResolvedValue([]),
    getActive: jest.fn().mockResolvedValue([]),
    add: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock strategic cache
jest.mock('../services/strategic-cache.service', () => ({
  strategicCache: {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(true),
  },
}));

describe('LoadBalancerService', () => {
  let loadBalancer: LoadBalancerService;

  beforeEach(() => {
    jest.clearAllMocks();
    loadBalancer = new LoadBalancerService();
  });

  afterEach(async () => {
    await loadBalancer.stop();
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = (loadBalancer as any).config;
      
      expect(config.maxWorkers).toBe(10);
      expect(config.minWorkers).toBe(2);
      expect(config.healthCheckInterval).toBe(30000);
      expect(config.overloadThreshold).toBe(80);
      expect(config.underloadThreshold).toBe(30);
      expect(config.scalingCooldown).toBe(60000);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        maxWorkers: 20,
        minWorkers: 5,
        overloadThreshold: 90,
      };
      
      const customLoadBalancer = new LoadBalancerService(customConfig);
      const config = (customLoadBalancer as any).config;
      
      expect(config.maxWorkers).toBe(20);
      expect(config.minWorkers).toBe(5);
      expect(config.overloadThreshold).toBe(90);
    });

    it('should have correct queue priorities', () => {
      const config = (loadBalancer as any).config;
      const priorities = config.queuePriorities;
      
      expect(priorities['margin-check']).toBe(10);
      expect(priorities['automation-executor']).toBe(8);
      expect(priorities['simulation']).toBe(6);
      expect(priorities['notification']).toBe(4);
      expect(priorities['payment-validator']).toBe(7);
    });
  });

  describe('Worker Management', () => {
    it('should register a worker', async () => {
      const workerNode = {
        id: 'worker-1',
        host: 'localhost',
        port: 3001,
        status: 'active' as const,
        cpuUsage: 50,
        memoryUsage: 60,
        activeJobs: 5,
        maxJobs: 10,
        capabilities: ['margin-check', 'automation-executor'],
      };

      await loadBalancer.registerWorker(workerNode);
      
      const registeredWorker = loadBalancer.getWorker('worker-1');
      expect(registeredWorker).toBeDefined();
      expect(registeredWorker?.id).toBe('worker-1');
      expect(registeredWorker?.host).toBe('localhost');
      expect(registeredWorker?.port).toBe(3001);
    });

    it('should unregister a worker', async () => {
      const workerNode = {
        id: 'worker-1',
        host: 'localhost',
        port: 3001,
        status: 'active' as const,
        cpuUsage: 50,
        memoryUsage: 60,
        activeJobs: 5,
        maxJobs: 10,
        capabilities: ['margin-check'],
      };

      await loadBalancer.registerWorker(workerNode);
      expect(loadBalancer.getWorker('worker-1')).toBeDefined();
      
      await loadBalancer.unregisterWorker('worker-1');
      expect(loadBalancer.getWorker('worker-1')).toBeUndefined();
    });

    it('should update worker status', async () => {
      const workerNode = {
        id: 'worker-1',
        host: 'localhost',
        port: 3001,
        status: 'active' as const,
        cpuUsage: 50,
        memoryUsage: 60,
        activeJobs: 5,
        maxJobs: 10,
        capabilities: ['margin-check'],
      };

      await loadBalancer.registerWorker(workerNode);
      
      await loadBalancer.updateWorkerStatus('worker-1', {
        cpuUsage: 75,
        memoryUsage: 80,
        activeJobs: 8,
      });
      
      const updatedWorker = loadBalancer.getWorker('worker-1');
      expect(updatedWorker?.cpuUsage).toBe(75);
      expect(updatedWorker?.memoryUsage).toBe(80);
      expect(updatedWorker?.activeJobs).toBe(8);
    });
  });

  describe('Worker Selection', () => {
    beforeEach(async () => {
      // Register multiple workers for testing
      const workers = [
        {
          id: 'worker-1',
          host: 'localhost',
          port: 3001,
          status: 'active' as const,
          cpuUsage: 30,
          memoryUsage: 40,
          activeJobs: 2,
          maxJobs: 10,
          capabilities: ['margin-check', 'automation-executor'],
        },
        {
          id: 'worker-2',
          host: 'localhost',
          port: 3002,
          status: 'active' as const,
          cpuUsage: 70,
          memoryUsage: 80,
          activeJobs: 8,
          maxJobs: 10,
          capabilities: ['margin-check', 'simulation'],
        },
        {
          id: 'worker-3',
          host: 'localhost',
          port: 3003,
          status: 'inactive' as const,
          cpuUsage: 0,
          memoryUsage: 0,
          activeJobs: 0,
          maxJobs: 10,
          capabilities: ['notification'],
        },
      ];

      for (const worker of workers) {
        await loadBalancer.registerWorker(worker);
      }
    });

    it('should select optimal worker based on load', async () => {
      const optimalWorker = await loadBalancer.getOptimalWorker('margin-check');
      
      expect(optimalWorker).toBeDefined();
      expect(optimalWorker?.id).toBe('worker-1'); // Lowest load
      expect(optimalWorker?.capabilities).toContain('margin-check');
    });

    it('should return null when no workers available', async () => {
      const optimalWorker = await loadBalancer.getOptimalWorker('nonexistent-queue');
      
      expect(optimalWorker).toBeNull();
    });

    it('should not select inactive workers', async () => {
      const optimalWorker = await loadBalancer.getOptimalWorker('notification');
      
      expect(optimalWorker).toBeNull(); // Only inactive worker available
    });

    it('should not select overloaded workers', async () => {
      // Update worker-2 to be overloaded
      await loadBalancer.updateWorkerStatus('worker-2', {
        activeJobs: 10, // At max capacity
      });
      
      const optimalWorker = await loadBalancer.getOptimalWorker('margin-check');
      
      expect(optimalWorker?.id).toBe('worker-1'); // Should select worker-1, not overloaded worker-2
    });
  });

  describe('Scaling', () => {
    it('should scale up workers', async () => {
      const initialCount = loadBalancer.getAllWorkers().length;
      
      await loadBalancer.scaleWorkers(5);
      
      const finalCount = loadBalancer.getAllWorkers().length;
      expect(finalCount).toBe(5);
    });

    it('should scale down workers', async () => {
      // First scale up
      await loadBalancer.scaleWorkers(5);
      const upCount = loadBalancer.getAllWorkers().length;
      expect(upCount).toBe(5);
      
      // Mock the cooldown by setting lastScalingTime to 0
      (loadBalancer as any).lastScalingTime = 0;
      
      // Then scale down
      await loadBalancer.scaleWorkers(2);
      const downCount = loadBalancer.getAllWorkers().length;
      expect(downCount).toBe(2);
    });

    it('should respect scaling cooldown', async () => {
      await loadBalancer.scaleWorkers(3);
      
      // Try to scale again immediately (should be ignored due to cooldown)
      await loadBalancer.scaleWorkers(5);
      
      const count = loadBalancer.getAllWorkers().length;
      expect(count).toBe(3); // Should still be 3 due to cooldown
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      // Register workers for testing
      const workers = [
        {
          id: 'worker-1',
          host: 'localhost',
          port: 3001,
          status: 'active' as const,
          cpuUsage: 30,
          memoryUsage: 40,
          activeJobs: 2,
          maxJobs: 10,
          capabilities: ['margin-check'],
        },
        {
          id: 'worker-2',
          host: 'localhost',
          port: 3002,
          status: 'inactive' as const,
          cpuUsage: 0,
          memoryUsage: 0,
          activeJobs: 0,
          maxJobs: 10,
          capabilities: ['simulation'],
        },
      ];

      for (const worker of workers) {
        await loadBalancer.registerWorker(worker);
      }
    });

    it('should return correct statistics', async () => {
      const stats = await loadBalancer.getStats();
      
      expect(stats.totalWorkers).toBe(2);
      expect(stats.activeWorkers).toBe(1);
      expect(stats.inactiveWorkers).toBe(1);
      expect(stats.avgCpuUsage).toBe(30); // Only active worker's CPU usage
      expect(stats.avgMemoryUsage).toBe(40); // Only active worker's memory usage
      expect(stats.workers).toHaveLength(2);
    });

    it('should return empty statistics when no workers', async () => {
      // Remove all workers
      await loadBalancer.scaleWorkers(0);
      
      const stats = await loadBalancer.getStats();
      
      expect(stats.totalWorkers).toBe(0);
      expect(stats.activeWorkers).toBe(0);
      expect(stats.inactiveWorkers).toBe(0);
      expect(stats.avgCpuUsage).toBe(0);
      expect(stats.avgMemoryUsage).toBe(0);
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop load balancer', async () => {
      expect(loadBalancer.isLoadBalancerRunning()).toBe(false);
      
      await loadBalancer.start();
      expect(loadBalancer.isLoadBalancerRunning()).toBe(true);
      
      await loadBalancer.stop();
      expect(loadBalancer.isLoadBalancerRunning()).toBe(false);
    });

    it('should not start if already running', async () => {
      await loadBalancer.start();
      expect(loadBalancer.isLoadBalancerRunning()).toBe(true);
      
      // Try to start again
      await loadBalancer.start();
      expect(loadBalancer.isLoadBalancerRunning()).toBe(true);
    });

    it('should not stop if not running', async () => {
      expect(loadBalancer.isLoadBalancerRunning()).toBe(false);
      
      // Try to stop when not running
      await loadBalancer.stop();
      expect(loadBalancer.isLoadBalancerRunning()).toBe(false);
    });
  });
});

describe('WorkerManagerService', () => {
  let workerManager: WorkerManagerService;

  beforeEach(() => {
    jest.clearAllMocks();
    workerManager = new WorkerManagerService();
  });

  afterEach(async () => {
    await workerManager.stop();
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = (workerManager as any).config;
      
      expect(config.maxJobs).toBe(10);
      expect(config.capabilities).toContain('margin-check');
      expect(config.capabilities).toContain('automation-executor');
      expect(config.capabilities).toContain('simulation');
      expect(config.capabilities).toContain('notification');
      expect(config.capabilities).toContain('payment-validator');
      expect(config.healthCheckInterval).toBe(30000);
      expect(config.heartbeatInterval).toBe(10000);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        maxJobs: 20,
        capabilities: ['custom-queue'],
        heartbeatInterval: 5000,
      };
      
      const customWorkerManager = new WorkerManagerService(customConfig);
      const config = (customWorkerManager as any).config;
      
      expect(config.maxJobs).toBe(20);
      expect(config.capabilities).toEqual(['custom-queue']);
      expect(config.heartbeatInterval).toBe(5000);
    });
  });

  describe('Worker Creation', () => {
    it('should create a worker', async () => {
      const workerProcess = await workerManager.createWorker('worker-1', 'margin-check');
      
      expect(workerProcess).toBeDefined();
      expect(workerProcess.id).toBe('worker-1');
      expect(workerProcess.status).toBe('running');
      expect(workerProcess.maxJobs).toBe(10);
      expect(workerProcess.capabilities).toContain('margin-check');
    });

    it('should remove a worker', async () => {
      await workerManager.createWorker('worker-1', 'margin-check');
      expect(workerManager.getWorker('worker-1')).toBeDefined();
      
      await workerManager.removeWorker('worker-1');
      expect(workerManager.getWorker('worker-1')).toBeUndefined();
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await workerManager.createWorker('worker-1', 'margin-check');
      await workerManager.createWorker('worker-2', 'simulation');
    });

    it('should return correct statistics', async () => {
      const stats = await workerManager.getStats();
      
      expect(stats.totalWorkers).toBe(2);
      expect(stats.activeWorkers).toBe(2);
      expect(stats.totalActiveJobs).toBe(0);
      expect(stats.workers).toHaveLength(2);
    });

    it('should return empty statistics when no workers', async () => {
      // Remove all workers
      await workerManager.removeWorker('worker-1');
      await workerManager.removeWorker('worker-2');
      
      const stats = await workerManager.getStats();
      
      expect(stats.totalWorkers).toBe(0);
      expect(stats.activeWorkers).toBe(0);
      expect(stats.totalActiveJobs).toBe(0);
      expect(stats.workers).toHaveLength(0);
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop worker manager', async () => {
      expect(workerManager.isWorkerManagerRunning()).toBe(false);
      
      await workerManager.start();
      expect(workerManager.isWorkerManagerRunning()).toBe(true);
      
      await workerManager.stop();
      expect(workerManager.isWorkerManagerRunning()).toBe(false);
    });

    it('should not start if already running', async () => {
      await workerManager.start();
      expect(workerManager.isWorkerManagerRunning()).toBe(true);
      
      // Try to start again
      await workerManager.start();
      expect(workerManager.isWorkerManagerRunning()).toBe(true);
    });

    it('should not stop if not running', async () => {
      expect(workerManager.isWorkerManagerRunning()).toBe(false);
      
      // Try to stop when not running
      await workerManager.stop();
      expect(workerManager.isWorkerManagerRunning()).toBe(false);
    });
  });
});
