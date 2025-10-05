import { prisma } from '../lib/prisma';
import { StrategicCacheService } from './strategic-cache.service';

export interface IndicatorConfig {
  enabled: boolean;
  period: number;
  color: string;
  lineWidth: number;
  height?: number;
}

export interface UserIndicatorPreferences {
  userId: string;
  indicatorConfigs: Record<string, IndicatorConfig>;
  lastUpdated: Date;
  version: string;
}

export class UserPreferencesService {
  private cacheService: StrategicCacheService;
  private readonly CACHE_TTL = 5 * 60; // 5 minutos
  private readonly CACHE_PREFIX = 'user_preferences:';

  constructor() {
    this.cacheService = new StrategicCacheService();
  }

  /**
   * Salva as preferências de indicadores do usuário
   */
  async saveIndicatorPreferences(
    userId: string,
    indicatorConfigs: Record<string, IndicatorConfig>
  ): Promise<boolean> {
    try {
      console.log(`💾 USER PREFERENCES - Saving preferences for user: ${userId}`);

      // Preparar dados para salvar
      const preferencesData = {
        userId,
        indicatorConfigs: JSON.stringify(indicatorConfigs),
        lastUpdated: new Date(),
        version: '1.0.0'
      };

      // Salvar no banco de dados
      await prisma.userPreferences.upsert({
        where: { userId },
        update: {
          indicatorConfigs: preferencesData.indicatorConfigs,
          lastUpdated: preferencesData.lastUpdated,
          version: preferencesData.version
        },
        create: {
          userId,
          indicatorConfigs: preferencesData.indicatorConfigs,
          lastUpdated: preferencesData.lastUpdated,
          version: preferencesData.version
        }
      });

      // Atualizar cache
      const cacheKey = `${this.CACHE_PREFIX}${userId}`;
      await this.cacheService.set(cacheKey, preferencesData, this.CACHE_TTL);

      console.log(`✅ USER PREFERENCES - Preferences saved successfully for user: ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error saving preferences:', error);
      return false;
    }
  }

  /**
   * Carrega as preferências de indicadores do usuário
   */
  async loadIndicatorPreferences(userId: string): Promise<UserIndicatorPreferences | null> {
    try {
      console.log(`📦 USER PREFERENCES - Loading preferences for user: ${userId}`);

      // Verificar cache primeiro
      const cacheKey = `${this.CACHE_PREFIX}${userId}`;
      const cachedData = await this.cacheService.get(cacheKey);
      
      if (cachedData) {
        console.log(`📦 USER PREFERENCES - Cache hit for user: ${userId}`);
        return {
          userId: cachedData.userId,
          indicatorConfigs: JSON.parse(cachedData.indicatorConfigs),
          lastUpdated: new Date(cachedData.lastUpdated),
          version: cachedData.version
        };
      }

      // Buscar no banco de dados
      const preferences = await prisma.userPreferences.findUnique({
        where: { userId }
      });

      if (!preferences) {
        console.log(`📦 USER PREFERENCES - No preferences found for user: ${userId}`);
        return null;
      }

      // Atualizar cache
      await this.cacheService.set(cacheKey, {
        userId: preferences.userId,
        indicatorConfigs: preferences.indicatorConfigs,
        lastUpdated: preferences.lastUpdated,
        version: preferences.version
      }, this.CACHE_TTL);

      const result = {
        userId: preferences.userId,
        indicatorConfigs: JSON.parse(preferences.indicatorConfigs),
        lastUpdated: preferences.lastUpdated,
        version: preferences.version
      };

      console.log(`✅ USER PREFERENCES - Preferences loaded successfully for user: ${userId}`);
      return result;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error loading preferences:', error);
      return null;
    }
  }

  /**
   * Remove as preferências de indicadores do usuário
   */
  async clearIndicatorPreferences(userId: string): Promise<boolean> {
    try {
      console.log(`🗑️ USER PREFERENCES - Clearing preferences for user: ${userId}`);

      // Remover do banco de dados
      await prisma.userPreferences.delete({
        where: { userId }
      });

      // Remover do cache
      const cacheKey = `${this.CACHE_PREFIX}${userId}`;
      await this.cacheService.delete(cacheKey);

      console.log(`✅ USER PREFERENCES - Preferences cleared successfully for user: ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error clearing preferences:', error);
      return false;
    }
  }

  /**
   * Sincroniza preferências entre dispositivos
   */
  async syncPreferences(userId: string, deviceId: string): Promise<UserIndicatorPreferences | null> {
    try {
      console.log(`🔄 USER PREFERENCES - Syncing preferences for user: ${userId}, device: ${deviceId}`);

      // Carregar preferências do usuário
      const preferences = await this.loadIndicatorPreferences(userId);
      
      if (!preferences) {
        console.log(`📦 USER PREFERENCES - No preferences to sync for user: ${userId}`);
        return null;
      }

      // Log de sincronização
      console.log(`✅ USER PREFERENCES - Preferences synced for user: ${userId}, device: ${deviceId}`);
      return preferences;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error syncing preferences:', error);
      return null;
    }
  }

  /**
   * Exporta preferências para backup
   */
  async exportPreferences(userId: string): Promise<string | null> {
    try {
      console.log(`📤 USER PREFERENCES - Exporting preferences for user: ${userId}`);

      const preferences = await this.loadIndicatorPreferences(userId);
      
      if (!preferences) {
        return null;
      }

      const exportData = {
        userId: preferences.userId,
        indicatorConfigs: preferences.indicatorConfigs,
        lastUpdated: preferences.lastUpdated,
        version: preferences.version,
        exportDate: new Date().toISOString()
      };

      const jsonData = JSON.stringify(exportData, null, 2);
      console.log(`✅ USER PREFERENCES - Preferences exported successfully for user: ${userId}`);
      return jsonData;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error exporting preferences:', error);
      return null;
    }
  }

  /**
   * Importa preferências de backup
   */
  async importPreferences(userId: string, jsonData: string): Promise<boolean> {
    try {
      console.log(`📥 USER PREFERENCES - Importing preferences for user: ${userId}`);

      const importData = JSON.parse(jsonData);
      
      // Validar estrutura dos dados
      if (!importData.indicatorConfigs || typeof importData.indicatorConfigs !== 'object') {
        throw new Error('Invalid preferences format');
      }

      // Salvar preferências importadas
      const success = await this.saveIndicatorPreferences(userId, importData.indicatorConfigs);
      
      if (success) {
        console.log(`✅ USER PREFERENCES - Preferences imported successfully for user: ${userId}`);
      }
      
      return success;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error importing preferences:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de uso das preferências
   */
  async getPreferencesStats(userId: string): Promise<{
    totalConfigs: number;
    lastUpdated: Date | null;
    version: string | null;
    cacheStatus: 'hit' | 'miss' | 'error';
  }> {
    try {
      const preferences = await this.loadIndicatorPreferences(userId);
      
      if (!preferences) {
        return {
          totalConfigs: 0,
          lastUpdated: null,
          version: null,
          cacheStatus: 'miss'
        };
      }

      return {
        totalConfigs: Object.keys(preferences.indicatorConfigs).length,
        lastUpdated: preferences.lastUpdated,
        version: preferences.version,
        cacheStatus: 'hit'
      };

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error getting stats:', error);
      return {
        totalConfigs: 0,
        lastUpdated: null,
        version: null,
        cacheStatus: 'error'
      };
    }
  }
}

export const userPreferencesService = new UserPreferencesService();
