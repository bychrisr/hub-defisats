export interface CacheOptions {
    ttl?: number;
    prefix?: string;
}
export declare class CacheService {
    private redis;
    private defaultTTL;
    constructor();
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    getOrSet<T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions): Promise<T>;
    invalidatePattern(pattern: string): Promise<void>;
    getStats(): Promise<{
        used_memory: string;
        connected_clients: string;
        total_commands_processed: string;
        keyspace_hits: string;
        keyspace_misses: string;
    }>;
    clear(): Promise<void>;
    close(): Promise<void>;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cache.service.d.ts.map