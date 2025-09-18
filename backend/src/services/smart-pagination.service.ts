import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
  include?: string[];
  cursor?: string;
  direction?: 'next' | 'prev';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
  meta: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    filters: Record<string, any>;
    search?: string;
    executionTime: number;
  };
}

export interface SmartPaginationConfig {
  maxLimit: number;
  defaultLimit: number;
  maxPage: number;
  enableCursorPagination: boolean;
  enableSearch: boolean;
  enableSorting: boolean;
  enableFiltering: boolean;
  cacheResults: boolean;
  cacheTTL: number; // milliseconds
}

export class SmartPaginationService {
  private prisma: PrismaClient;
  private logger: Logger;
  private config: SmartPaginationConfig;
  private cache: Map<string, { result: any; expires: number }> = new Map();

  constructor(
    prisma: PrismaClient,
    logger: Logger,
    config: Partial<SmartPaginationConfig> = {}
  ) {
    this.prisma = prisma;
    this.logger = logger;
    this.config = {
      maxLimit: 100,
      defaultLimit: 20,
      maxPage: 1000,
      enableCursorPagination: true,
      enableSearch: true,
      enableSorting: true,
      enableFiltering: true,
      cacheResults: true,
      cacheTTL: 300000, // 5 minutes
      ...config
    };
  }

  /**
   * Paginate data with smart optimizations
   */
  async paginate<T>(
    model: string,
    options: PaginationOptions
  ): Promise<PaginationResult<T>> {
    const startTime = Date.now();
    
    try {
      // Validate and normalize options
      const normalizedOptions = this.normalizeOptions(options);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(model, normalizedOptions);
      if (this.config.cacheResults) {
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
          this.logger.debug('Pagination cache hit', { model, cacheKey });
          return cached.result;
        }
      }

      // Build query
      const query = this.buildQuery(model, normalizedOptions);
      
      // Execute query
      const [data, total] = await Promise.all([
        this.executeQuery<T>(model, query),
        this.getTotalCount(model, normalizedOptions)
      ]);

      // Build result
      const result = this.buildResult(data, total, normalizedOptions, Date.now() - startTime);

      // Cache result
      if (this.config.cacheResults) {
        this.cache.set(cacheKey, {
          result,
          expires: Date.now() + this.config.cacheTTL
        });
      }

      this.logger.debug('Pagination completed', {
        model,
        page: normalizedOptions.page,
        limit: normalizedOptions.limit,
        total,
        executionTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      this.logger.error('Pagination failed', {
        model,
        options,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Paginate with cursor-based pagination
   */
  async paginateWithCursor<T>(
    model: string,
    options: PaginationOptions & { cursorField: string }
  ): Promise<PaginationResult<T>> {
    const startTime = Date.now();
    
    try {
      const normalizedOptions = this.normalizeOptions(options);
      
      // Build cursor query
      const query = this.buildCursorQuery(model, normalizedOptions, options.cursorField);
      
      // Execute query
      const data = await this.executeQuery<T>(model, query);
      
      // Build result with cursor info
      const result = this.buildCursorResult(data, normalizedOptions, options.cursorField, Date.now() - startTime);

      this.logger.debug('Cursor pagination completed', {
        model,
        cursor: options.cursor,
        limit: normalizedOptions.limit,
        dataLength: data.length,
        executionTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      this.logger.error('Cursor pagination failed', {
        model,
        options,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get pagination suggestions based on data analysis
   */
  async getPaginationSuggestions(
    model: string,
    options: Partial<PaginationOptions> = {}
  ): Promise<{
    suggestedLimit: number;
    suggestedSortBy: string;
    suggestedSortOrder: 'asc' | 'desc';
    estimatedTotal: number;
    performanceScore: number;
  }> {
    try {
      // Analyze data distribution
      const analysis = await this.analyzeDataDistribution(model, options);
      
      // Calculate suggestions
      const suggestions = this.calculateSuggestions(analysis);
      
      this.logger.debug('Pagination suggestions generated', {
        model,
        suggestions
      });

      return suggestions;

    } catch (error) {
      this.logger.error('Failed to generate pagination suggestions', {
        model,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Normalize pagination options
   */
  private normalizeOptions(options: PaginationOptions): PaginationOptions {
    const normalized = { ...options };
    
    // Validate and normalize page
    normalized.page = Math.max(1, Math.min(normalized.page || 1, this.config.maxPage));
    
    // Validate and normalize limit
    normalized.limit = Math.max(1, Math.min(normalized.limit || this.config.defaultLimit, this.config.maxLimit));
    
    // Validate sort order
    if (normalized.sortOrder && !['asc', 'desc'].includes(normalized.sortOrder)) {
      normalized.sortOrder = 'asc';
    }
    
    // Set default sort
    if (!normalized.sortBy) {
      normalized.sortBy = 'created_at';
    }
    
    return normalized;
  }

  /**
   * Build query based on options
   */
  private buildQuery(model: string, options: PaginationOptions): any {
    const query: any = {
      skip: (options.page - 1) * options.limit,
      take: options.limit
    };

    // Add sorting
    if (this.config.enableSorting && options.sortBy) {
      query.orderBy = {
        [options.sortBy]: options.sortOrder || 'asc'
      };
    }

    // Add filtering
    if (this.config.enableFiltering && options.filters) {
      query.where = this.buildWhereClause(options.filters);
    }

    // Add search
    if (this.config.enableSearch && options.search) {
      query.where = {
        ...query.where,
        ...this.buildSearchClause(options.search)
      };
    }

    // Add includes
    if (options.include && options.include.length > 0) {
      query.include = this.buildIncludeClause(options.include);
    }

    return query;
  }

  /**
   * Build cursor-based query
   */
  private buildCursorQuery(model: string, options: PaginationOptions, cursorField: string): any {
    const query: any = {
      take: options.limit + 1 // Take one extra to check if there's a next page
    };

    // Add cursor condition
    if (options.cursor) {
      const cursorValue = this.decodeCursor(options.cursor);
      query.where = {
        [cursorField]: options.direction === 'prev' 
          ? { lt: cursorValue }
          : { gt: cursorValue }
      };
    }

    // Add sorting
    if (options.sortBy) {
      query.orderBy = {
        [options.sortBy]: options.sortOrder || 'asc'
      };
    }

    // Add filtering
    if (options.filters) {
      query.where = {
        ...query.where,
        ...this.buildWhereClause(options.filters)
      };
    }

    return query;
  }

  /**
   * Build where clause from filters
   */
  private buildWhereClause(filters: Record<string, any>): any {
    const where: any = {};

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && value.operator) {
        // Handle operators like { operator: 'gt', value: 100 }
        where[key] = {
          [value.operator]: value.value
        };
      } else if (Array.isArray(value)) {
        // Handle array values (IN clause)
        where[key] = {
          in: value
        };
      } else {
        // Handle simple equality
        where[key] = value;
      }
    }

    return where;
  }

  /**
   * Build search clause
   */
  private buildSearchClause(search: string): any {
    // This would need to be customized based on the model
    // For now, return a generic search clause
    return {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ]
    };
  }

  /**
   * Build include clause
   */
  private buildIncludeClause(includes: string[]): any {
    const include: any = {};
    
    for (const field of includes) {
      include[field] = true;
    }
    
    return include;
  }

  /**
   * Execute query
   */
  private async executeQuery<T>(model: string, query: any): Promise<T[]> {
    const modelClient = (this.prisma as any)[model];
    if (!modelClient) {
      throw new Error(`Model ${model} not found`);
    }

    return await modelClient.findMany(query);
  }

  /**
   * Get total count
   */
  private async getTotalCount(model: string, options: PaginationOptions): Promise<number> {
    const modelClient = (this.prisma as any)[model];
    if (!modelClient) {
      throw new Error(`Model ${model} not found`);
    }

    const where: any = {};

    // Add filtering
    if (options.filters) {
      Object.assign(where, this.buildWhereClause(options.filters));
    }

    // Add search
    if (options.search) {
      Object.assign(where, this.buildSearchClause(options.search));
    }

    return await modelClient.count({ where });
  }

  /**
   * Build pagination result
   */
  private buildResult<T>(
    data: T[],
    total: number,
    options: PaginationOptions,
    executionTime: number
  ): PaginationResult<T> {
    const totalPages = Math.ceil(total / options.limit);
    const hasNext = options.page < totalPages;
    const hasPrev = options.page > 1;

    return {
      data,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      meta: {
        sortBy: options.sortBy || 'created_at',
        sortOrder: options.sortOrder || 'asc',
        filters: options.filters || {},
        search: options.search,
        executionTime
      }
    };
  }

  /**
   * Build cursor-based result
   */
  private buildCursorResult<T>(
    data: T[],
    options: PaginationOptions,
    cursorField: string,
    executionTime: number
  ): PaginationResult<T> {
    const hasNext = data.length > options.limit;
    const hasPrev = !!options.cursor;
    
    if (hasNext) {
      data = data.slice(0, -1); // Remove the extra item
    }

    const nextCursor = hasNext ? this.encodeCursor((data[data.length - 1] as any)[cursorField]) : undefined;
    const prevCursor = hasPrev ? options.cursor : undefined;

    return {
      data,
      pagination: {
        page: 1, // Cursor pagination doesn't use page numbers
        limit: options.limit,
        total: 0, // Total count is not available in cursor pagination
        totalPages: 0,
        hasNext,
        hasPrev,
        nextCursor,
        prevCursor
      },
      meta: {
        sortBy: options.sortBy || cursorField,
        sortOrder: options.sortOrder || 'asc',
        filters: options.filters || {},
        search: options.search,
        executionTime
      }
    };
  }

  /**
   * Analyze data distribution
   */
  private async analyzeDataDistribution(model: string, options: Partial<PaginationOptions>): Promise<any> {
    // This would analyze the data to provide better pagination suggestions
    // For now, return basic analysis
    return {
      totalCount: 1000,
      averageRecordSize: 1024,
      indexCoverage: 0.8,
      queryComplexity: 'medium'
    };
  }

  /**
   * Calculate pagination suggestions
   */
  private calculateSuggestions(analysis: any): any {
    return {
      suggestedLimit: Math.min(20, Math.max(10, Math.floor(analysis.totalCount / 50))),
      suggestedSortBy: 'created_at',
      suggestedSortOrder: 'desc' as const,
      estimatedTotal: analysis.totalCount,
      performanceScore: 0.8
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(model: string, options: PaginationOptions): string {
    const key = `${model}:${JSON.stringify(options)}`;
    return Buffer.from(key).toString('base64');
  }

  /**
   * Encode cursor
   */
  private encodeCursor(value: any): string {
    return Buffer.from(JSON.stringify(value)).toString('base64');
  }

  /**
   * Decode cursor
   */
  private decodeCursor(cursor: string): any {
    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info('Pagination cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    missRate: number;
  } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits
      missRate: 0 // Would need to track misses
    };
  }
}