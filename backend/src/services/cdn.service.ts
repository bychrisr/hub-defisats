import { Logger } from 'winston';
import { createHash } from 'crypto';

export interface CDNConfig {
  provider: 'cloudflare' | 'aws-cloudfront' | 'azure-cdn' | 'custom';
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  zoneId?: string;
  region?: string;
  enableCompression: boolean;
  enableCaching: boolean;
  cacheTTL: number; // seconds
  enablePurge: boolean;
  enableAnalytics: boolean;
  customHeaders?: Record<string, string>;
}

export interface CDNAsset {
  id: string;
  url: string;
  originalUrl: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  cacheStatus: 'hit' | 'miss' | 'expired';
  compressionRatio: number;
  metadata?: Record<string, any>;
}

export interface CDNPurgeResult {
  success: boolean;
  purgedUrls: string[];
  failedUrls: string[];
  message?: string;
}

export interface CDNAnalytics {
  totalRequests: number;
  cacheHitRate: number;
  averageResponseTime: number;
  bandwidth: number;
  topAssets: Array<{
    url: string;
    requests: number;
    bandwidth: number;
  }>;
  geographicDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
}

export class CDNService {
  private logger: Logger;
  private config: CDNConfig;
  private assets: Map<string, CDNAsset> = new Map();
  private analytics: CDNAnalytics = {
    totalRequests: 0,
    cacheHitRate: 0,
    averageResponseTime: 0,
    bandwidth: 0,
    topAssets: [],
    geographicDistribution: {},
    deviceDistribution: {}
  };

  constructor(logger: Logger, config: Partial<CDNConfig> = {}) {
    this.logger = logger;
    this.config = {
      provider: 'cloudflare',
      baseUrl: 'https://cdn.example.com',
      enableCompression: true,
      enableCaching: true,
      cacheTTL: 3600, // 1 hour
      enablePurge: true,
      enableAnalytics: true,
      ...config
    };
  }

  /**
   * Upload asset to CDN
   */
  async uploadAsset(
    filePath: string,
    content: Buffer,
    options: {
      contentType?: string;
      cacheTTL?: number;
      compress?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<CDNAsset> {
    try {
      const assetId = this.generateAssetId(filePath);
      const contentType = options.contentType || this.getContentType(filePath);
      const cacheTTL = options.cacheTTL || this.config.cacheTTL;
      
      // Compress content if enabled
      let processedContent = content;
      let compressionRatio = 1;
      
      if (options.compress !== false && this.config.enableCompression) {
        const compressed = await this.compressContent(content, contentType);
        processedContent = compressed.content;
        compressionRatio = compressed.ratio;
      }

      // Upload to CDN
      const cdnUrl = await this.uploadToCDN(assetId, processedContent, {
        contentType,
        cacheTTL,
        metadata: options.metadata
      });

      // Create asset record
      const asset: CDNAsset = {
        id: assetId,
        url: cdnUrl,
        originalUrl: filePath,
        size: processedContent.length,
        contentType,
        lastModified: new Date(),
        etag: this.generateETag(processedContent),
        cacheStatus: 'miss',
        compressionRatio,
        metadata: options.metadata
      };

      this.assets.set(assetId, asset);
      this.updateAnalytics('upload', asset);

      this.logger.info('Asset uploaded to CDN', {
        assetId,
        url: cdnUrl,
        size: asset.size,
        compressionRatio: compressionRatio.toFixed(2)
      });

      return asset;

    } catch (error) {
      this.logger.error('Asset upload failed', {
        filePath,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get asset from CDN
   */
  async getAsset(assetId: string): Promise<CDNAsset | null> {
    try {
      const asset = this.assets.get(assetId);
      if (!asset) {
        return null;
      }

      // Check if asset exists on CDN
      const exists = await this.checkAssetExists(asset.url);
      if (!exists) {
        this.logger.warn('Asset not found on CDN', { assetId, url: asset.url });
        return null;
      }

      // Update cache status
      asset.cacheStatus = 'hit';
      this.updateAnalytics('request', asset);

      this.logger.debug('Asset retrieved from CDN', { assetId, url: asset.url });
      return asset;

    } catch (error) {
      this.logger.error('Asset retrieval failed', {
        assetId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Purge asset from CDN
   */
  async purgeAsset(assetId: string): Promise<CDNPurgeResult> {
    try {
      const asset = this.assets.get(assetId);
      if (!asset) {
        return {
          success: false,
          purgedUrls: [],
          failedUrls: [assetId],
          message: 'Asset not found'
        };
      }

      const result = await this.purgeFromCDN([asset.url]);
      
      if (result.success) {
        this.assets.delete(assetId);
        this.logger.info('Asset purged from CDN', { assetId, url: asset.url });
      }

      return result;

    } catch (error) {
      this.logger.error('Asset purge failed', {
        assetId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Purge multiple assets
   */
  async purgeAssets(assetIds: string[]): Promise<CDNPurgeResult> {
    try {
      const urls: string[] = [];
      const validAssetIds: string[] = [];

      for (const assetId of assetIds) {
        const asset = this.assets.get(assetId);
        if (asset) {
          urls.push(asset.url);
          validAssetIds.push(assetId);
        }
      }

      if (urls.length === 0) {
        return {
          success: false,
          purgedUrls: [],
          failedUrls: assetIds,
          message: 'No valid assets found'
        };
      }

      const result = await this.purgeFromCDN(urls);
      
      if (result.success) {
        // Remove purged assets from local cache
        for (const assetId of validAssetIds) {
          this.assets.delete(assetId);
        }
        this.logger.info('Assets purged from CDN', { 
          count: urls.length,
          urls: urls.slice(0, 5) // Log first 5 URLs
        });
      }

      return result;

    } catch (error) {
      this.logger.error('Assets purge failed', {
        assetIds,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get CDN analytics
   */
  getAnalytics(): CDNAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get asset statistics
   */
  getAssetStats(): {
    totalAssets: number;
    totalSize: number;
    averageSize: number;
    compressionRatio: number;
    cacheHitRate: number;
  } {
    const assets = Array.from(this.assets.values());
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    const averageSize = assets.length > 0 ? totalSize / assets.length : 0;
    const compressionRatio = assets.length > 0 
      ? assets.reduce((sum, asset) => sum + asset.compressionRatio, 0) / assets.length 
      : 1;
    const cacheHits = assets.filter(asset => asset.cacheStatus === 'hit').length;
    const cacheHitRate = assets.length > 0 ? cacheHits / assets.length : 0;

    return {
      totalAssets: assets.length,
      totalSize,
      averageSize,
      compressionRatio,
      cacheHitRate
    };
  }

  /**
   * Generate asset ID
   */
  private generateAssetId(filePath: string): string {
    const hash = createHash('md5').update(filePath).digest('hex');
    const timestamp = Date.now();
    return `${hash}_${timestamp}`;
  }

  /**
   * Get content type from file path
   */
  private getContentType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'js': 'application/javascript',
      'css': 'text/css',
      'html': 'text/html',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'eot': 'application/vnd.ms-fontobject'
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Generate ETag
   */
  private generateETag(content: Buffer): string {
    return createHash('md5').update(content).digest('hex');
  }

  /**
   * Compress content
   */
  private async compressContent(content: Buffer, contentType: string): Promise<{
    content: Buffer;
    ratio: number;
  }> {
    // Simplified compression
    // In a real implementation, this would use proper compression algorithms
    const originalSize = content.length;
    const compressed = content; // Placeholder
    const ratio = compressed.length / originalSize;

    return {
      content: compressed,
      ratio
    };
  }

  /**
   * Upload to CDN
   */
  private async uploadToCDN(
    assetId: string,
    content: Buffer,
    options: {
      contentType: string;
      cacheTTL: number;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    // Simplified CDN upload
    // In a real implementation, this would use the actual CDN API
    const cdnUrl = `${this.config.baseUrl}/assets/${assetId}`;
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return cdnUrl;
  }

  /**
   * Check if asset exists on CDN
   */
  private async checkAssetExists(url: string): Promise<boolean> {
    // Simplified existence check
    // In a real implementation, this would make an HTTP HEAD request
    return true;
  }

  /**
   * Purge from CDN
   */
  private async purgeFromCDN(urls: string[]): Promise<CDNPurgeResult> {
    // Simplified purge
    // In a real implementation, this would use the actual CDN API
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      purgedUrls: urls,
      failedUrls: [],
      message: 'Purge completed successfully'
    };
  }

  /**
   * Update analytics
   */
  private updateAnalytics(action: 'upload' | 'request', asset: CDNAsset): void {
    if (!this.config.enableAnalytics) return;

    if (action === 'request') {
      this.analytics.totalRequests++;
      
      // Update cache hit rate
      const totalAssets = this.assets.size;
      if (totalAssets > 0) {
        const cacheHits = Array.from(this.assets.values())
          .filter(a => a.cacheStatus === 'hit').length;
        this.analytics.cacheHitRate = cacheHits / totalAssets;
      }

      // Update bandwidth
      this.analytics.bandwidth += asset.size;

      // Update top assets
      const existingAsset = this.analytics.topAssets.find(a => a.url === asset.url);
      if (existingAsset) {
        existingAsset.requests++;
        existingAsset.bandwidth += asset.size;
      } else {
        this.analytics.topAssets.push({
          url: asset.url,
          requests: 1,
          bandwidth: asset.size
        });
      }

      // Sort by requests
      this.analytics.topAssets.sort((a, b) => b.requests - a.requests);
      this.analytics.topAssets = this.analytics.topAssets.slice(0, 10); // Keep top 10
    }
  }

  /**
   * Clear analytics
   */
  clearAnalytics(): void {
    this.analytics = {
      totalRequests: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      bandwidth: 0,
      topAssets: [],
      geographicDistribution: {},
      deviceDistribution: {}
    };
    this.logger.info('CDN analytics cleared');
  }

  /**
   * Get configuration
   */
  getConfig(): CDNConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('CDN configuration updated', { newConfig });
  }
}