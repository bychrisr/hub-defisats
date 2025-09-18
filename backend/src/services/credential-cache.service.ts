import { Redis } from 'ioredis';
import { SecureCredentials } from './secure-storage.service';

export class CredentialCacheService {
  private redis: Redis;
  private ttl = 300; // 5 minutos

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Obter credenciais do cache
   */
  async get(userId: string): Promise<SecureCredentials | null> {
    try {
      const encrypted = await this.redis.get(`creds:${userId}`);
      if (!encrypted) return null;

      // Import secure storage service
      const { secureStorage } = await import('./secure-storage.service');
      return await secureStorage.decryptCredentials(encrypted);
    } catch (error) {
      console.error(`Failed to get credentials from cache for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Armazenar credenciais no cache
   */
  async set(userId: string, credentials: SecureCredentials): Promise<void> {
    try {
      // Import secure storage service
      const { secureStorage } = await import('./secure-storage.service');
      const encrypted = await secureStorage.encryptCredentials(credentials);
      await this.redis.setex(`creds:${userId}`, this.ttl, encrypted);
    } catch (error) {
      console.error(`Failed to cache credentials for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remover credenciais do cache
   */
  async remove(userId: string): Promise<void> {
    try {
      await this.redis.del(`creds:${userId}`);
    } catch (error) {
      console.error(`Failed to remove credentials from cache for user ${userId}:`, error);
    }
  }

  /**
   * Verificar se credenciais existem no cache
   */
  async exists(userId: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(`creds:${userId}`);
      return exists === 1;
    } catch (error) {
      console.error(`Failed to check credentials existence for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Limpar todas as credenciais do cache
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys('creds:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Failed to clear credentials cache:', error);
    }
  }

  /**
   * Obter estatísticas do cache
   */
  async getStats(): Promise<{ count: number; memory: string }> {
    try {
      const keys = await this.redis.keys('creds:*');
      const info = await this.redis.memory('usage', 'creds:*');
      return {
        count: keys.length,
        memory: info || '0'
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { count: 0, memory: '0' };
    }
  }
}

