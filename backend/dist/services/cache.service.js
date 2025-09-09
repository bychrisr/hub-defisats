"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("@/config/env");
class CacheService {
    redis;
    defaultTTL = 3600;
    constructor() {
        this.redis = new ioredis_1.Redis(env_1.config.env.REDIS_URL);
        this.redis.on('error', err => console.error('Redis Cache Error:', err));
    }
    async get(key) {
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            const serialized = JSON.stringify(value);
            const expiration = ttl || this.defaultTTL;
            await this.redis.setex(key, expiration, serialized);
        }
        catch (error) {
            console.error('Cache set error:', error);
        }
    }
    async del(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            console.error('Cache delete error:', error);
        }
    }
    async exists(key) {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    }
    async getOrSet(key, fetcher, options) {
        try {
            const cached = await this.get(key);
            if (cached !== null) {
                return cached;
            }
            const result = await fetcher();
            await this.set(key, result, options?.ttl);
            return result;
        }
        catch (error) {
            console.error('Cache getOrSet error:', error);
            return await fetcher();
        }
    }
    async invalidatePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error('Cache invalidate pattern error:', error);
        }
    }
    async getStats() {
        try {
            const info = await this.redis.info('memory');
            const stats = await this.redis.info('stats');
            const parseInfo = (infoString) => {
                const lines = infoString.split('\r\n');
                const result = {};
                lines.forEach(line => {
                    if (line.includes(':')) {
                        const [key, value] = line.split(':');
                        result[key] = value;
                    }
                });
                return result;
            };
            const memoryInfo = parseInfo(info);
            const statsInfo = parseInfo(stats);
            return {
                used_memory: memoryInfo.used_memory_human || '0B',
                connected_clients: statsInfo.connected_clients || '0',
                total_commands_processed: statsInfo.total_commands_processed || '0',
                keyspace_hits: statsInfo.keyspace_hits || '0',
                keyspace_misses: statsInfo.keyspace_misses || '0',
            };
        }
        catch (error) {
            console.error('Cache stats error:', error);
            return {
                used_memory: '0B',
                connected_clients: '0',
                total_commands_processed: '0',
                keyspace_hits: '0',
                keyspace_misses: '0',
            };
        }
    }
    async clear() {
        try {
            await this.redis.flushdb();
        }
        catch (error) {
            console.error('Cache clear error:', error);
        }
    }
    async close() {
        await this.redis.quit();
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
//# sourceMappingURL=cache.service.js.map