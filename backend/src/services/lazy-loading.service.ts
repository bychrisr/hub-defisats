import { Logger } from 'winston';

export interface LazyLoadConfig {
  maxConcurrent: number;
  timeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  cacheTTL: number; // milliseconds
}

export interface LazyLoadItem<T = any> {
  id: string;
  data?: T;
  loading: boolean;
  error?: Error;
  loadedAt?: Date;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface LazyLoadOptions {
  priority?: number;
  timeout?: number;
  retryAttempts?: number;
  cacheKey?: string;
  metadata?: Record<string, any>;
}

export class LazyLoadingService<T = any> {
  private logger: Logger;
  private config: LazyLoadConfig;
  private items: Map<string, LazyLoadItem<T>> = new Map();
  private loadingQueue: string[] = [];
  private activeLoaders: Set<string> = new Set();
  private cache: Map<string, { data: T; expires: number }> = new Map();
  private loaders: Map<string, (id: string) => Promise<T>> = new Map();

  constructor(logger: Logger, config: Partial<LazyLoadConfig> = {}) {
    this.logger = logger;
    this.config = {
      maxConcurrent: 5,
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      cacheTTL: 300000, // 5 minutes
      ...config
    };
  }

  /**
   * Register a loader function for a specific type
   */
  registerLoader(type: string, loader: (id: string) => Promise<T>): void {
    this.loaders.set(type, loader);
    this.logger.info('Loader registered', { type });
  }

  /**
   * Load an item lazily
   */
  async load(
    id: string,
    type: string,
    options: LazyLoadOptions = {}
  ): Promise<T> {
    const cacheKey = options.cacheKey || `${type}:${id}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      this.logger.debug('Cache hit', { id, type, cacheKey });
      return cached.data;
    }

    // Check if item is already loaded
    const existingItem = this.items.get(id);
    if (existingItem && existingItem.data) {
      this.logger.debug('Item already loaded', { id, type });
      return existingItem.data;
    }

    // Check if item is currently loading
    if (existingItem && existingItem.loading) {
      this.logger.debug('Item currently loading', { id, type });
      return this.waitForLoad(id);
    }

    // Create new item
    const item: LazyLoadItem<T> = {
      id,
      loading: true,
      retryCount: 0,
      metadata: options.metadata
    };

    this.items.set(id, item);

    // Add to loading queue
    this.loadingQueue.push(id);
    this.loadingQueue.sort((a, b) => {
      const itemA = this.items.get(a);
      const itemB = this.items.get(b);
      return (itemB?.metadata?.priority || 0) - (itemA?.metadata?.priority || 0);
    });

    // Start loading process
    this.processLoadingQueue();

    return this.waitForLoad(id);
  }

  /**
   * Preload multiple items
   */
  async preload(
    items: Array<{ id: string; type: string; options?: LazyLoadOptions }>
  ): Promise<void> {
    const promises = items.map(({ id, type, options }) =>
      this.load(id, type, options).catch(error => {
        this.logger.warn('Preload failed', { id, type, error: error.message });
        return null;
      })
    );

    await Promise.all(promises);
  }

  /**
   * Get item data if loaded
   */
  get(id: string): T | undefined {
    const item = this.items.get(id);
    return item?.data;
  }

  /**
   * Check if item is loaded
   */
  isLoaded(id: string): boolean {
    const item = this.items.get(id);
    return !!(item?.data && !item.loading);
  }

  /**
   * Check if item is loading
   */
  isLoading(id: string): boolean {
    const item = this.items.get(id);
    return !!(item?.loading);
  }

  /**
   * Get item error if any
   */
  getError(id: string): Error | undefined {
    const item = this.items.get(id);
    return item?.error;
  }

  /**
   * Clear item from cache
   */
  clear(id: string): void {
    this.items.delete(id);
    this.cache.delete(id);
    this.logger.debug('Item cleared', { id });
  }

  /**
   * Clear all items
   */
  clearAll(): void {
    this.items.clear();
    this.cache.clear();
    this.loadingQueue = [];
    this.activeLoaders.clear();
    this.logger.info('All items cleared');
  }

  /**
   * Get loading statistics
   */
  getStats(): {
    totalItems: number;
    loadedItems: number;
    loadingItems: number;
    errorItems: number;
    queuedItems: number;
    activeLoaders: number;
    cacheSize: number;
  } {
    const items = Array.from(this.items.values());
    const loadedItems = items.filter(item => item.data && !item.loading).length;
    const loadingItems = items.filter(item => item.loading).length;
    const errorItems = items.filter(item => item.error).length;

    return {
      totalItems: this.items.size,
      loadedItems,
      loadingItems,
      errorItems,
      queuedItems: this.loadingQueue.length,
      activeLoaders: this.activeLoaders.size,
      cacheSize: this.cache.size
    };
  }

  /**
   * Process the loading queue
   */
  private async processLoadingQueue(): Promise<void> {
    while (this.loadingQueue.length > 0 && this.activeLoaders.size < this.config.maxConcurrent) {
      const id = this.loadingQueue.shift()!;
      this.activeLoaders.add(id);
      
      this.loadItem(id).finally(() => {
        this.activeLoaders.delete(id);
        this.processLoadingQueue();
      });
    }
  }

  /**
   * Load a specific item
   */
  private async loadItem(id: string): Promise<void> {
    const item = this.items.get(id);
    if (!item) return;

    try {
      const loader = this.loaders.get(item.metadata?.type || 'default');
      if (!loader) {
        throw new Error(`No loader found for type: ${item.metadata?.type || 'default'}`);
      }

      const startTime = Date.now();
      const data = await this.executeWithTimeout(
        loader(id),
        item.metadata?.timeout || this.config.timeout
      );
      const duration = Date.now() - startTime;

      // Update item
      item.data = data;
      item.loading = false;
      item.loadedAt = new Date();
      item.error = undefined;

      // Cache the result
      const cacheKey = `${item.metadata?.type || 'default'}:${id}`;
      this.cache.set(cacheKey, {
        data,
        expires: Date.now() + this.config.cacheTTL
      });

      this.logger.debug('Item loaded successfully', { 
        id, 
        duration,
        type: item.metadata?.type || 'default'
      });

    } catch (error) {
      this.handleLoadError(id, error as Error);
    }
  }

  /**
   * Handle load error
   */
  private handleLoadError(id: string, error: Error): void {
    const item = this.items.get(id);
    if (!item) return;

    item.retryCount++;
    item.error = error;

    if (item.retryCount < (item.metadata?.retryAttempts || this.config.retryAttempts)) {
      // Retry after delay
      setTimeout(() => {
        item.loading = true;
        item.error = undefined;
        this.loadingQueue.push(id);
        this.processLoadingQueue();
      }, item.metadata?.retryDelay || this.config.retryDelay);

      this.logger.warn('Item load failed, retrying', { 
        id, 
        retryCount: item.retryCount,
        error: error.message
      });
    } else {
      // Max retries exceeded
      item.loading = false;
      this.logger.error('Item load failed after max retries', { 
        id, 
        retryCount: item.retryCount,
        error: error.message
      });
    }
  }

  /**
   * Wait for item to load
   */
  private async waitForLoad(id: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const checkItem = () => {
        const item = this.items.get(id);
        if (!item) {
          reject(new Error(`Item not found: ${id}`));
          return;
        }

        if (item.data && !item.loading) {
          resolve(item.data);
          return;
        }

        if (item.error && !item.loading) {
          reject(item.error);
          return;
        }

        // Still loading, check again
        setTimeout(checkItem, 100);
      };

      checkItem();
    });
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Load timeout')), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug('Cache cleaned up', { cleaned });
    }
  }

  /**
   * Start cache cleanup interval
   */
  startCacheCleanup(intervalMs: number = 60000): void {
    setInterval(() => {
      this.cleanupCache();
    }, intervalMs);

    this.logger.info('Cache cleanup started', { intervalMs });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    missRate: number;
  } {
    // This would require tracking cache hits/misses
    // For now, return basic stats
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits
      missRate: 0 // Would need to track misses
    };
  }
}