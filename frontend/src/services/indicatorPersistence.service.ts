// frontend/src/services/indicatorPersistence.service.ts
import { IndicatorConfig, IndicatorType } from './indicatorManager.service';

export interface PersistedIndicatorConfig {
  enabled: boolean;
  period: number;
  color: string;
  lineWidth: number;
  height: number;
}

export interface PersistedIndicatorState {
  rsi: PersistedIndicatorConfig;
  ema: PersistedIndicatorConfig;
  macd: PersistedIndicatorConfig;
  bollinger: PersistedIndicatorConfig;
  volume: PersistedIndicatorConfig;
}

export interface PersistenceMetadata {
  version: string;
  lastUpdated: number;
  deviceId: string;
}

export interface UserPreferences {
  activeAccountId: string | null;
  dashboardPreferences: {
    layout: string;
    cards: string[];
    theme: string;
  };
  uiSettings: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
}

export interface UnifiedPersistenceData {
  indicators: PersistedIndicatorState;
  userPreferences: UserPreferences;
  metadata: PersistenceMetadata;
}

class IndicatorPersistenceService {
  private readonly STORAGE_KEY = 'hub-defisats-indicator-configs';
  private readonly VERSION = '1.0.0';
  private readonly DEFAULT_TTL = 30 * 24 * 60 * 60 * 1000; // 30 dias

  // Configurações padrão para RSI
  private readonly DEFAULT_RSI_CONFIG: PersistedIndicatorConfig = {
    enabled: false,
    period: 14,
    color: '#8b5cf6',
    lineWidth: 2,
    height: 100
  };

  // Configurações padrão para outros indicadores (futuro)
  private readonly DEFAULT_EMA_CONFIG: PersistedIndicatorConfig = {
    enabled: false,
    period: 20,
    color: '#f59e0b',
    lineWidth: 2,
    height: 100
  };

  private readonly DEFAULT_MACD_CONFIG: PersistedIndicatorConfig = {
    enabled: false,
    period: 12,
    color: '#10b981',
    lineWidth: 2,
    height: 100
  };

  private readonly DEFAULT_BOLLINGER_CONFIG: PersistedIndicatorConfig = {
    enabled: false,
    period: 20,
    color: '#ef4444',
    lineWidth: 2,
    height: 100
  };

  private readonly DEFAULT_VOLUME_CONFIG: PersistedIndicatorConfig = {
    enabled: true, // Volume sempre ativo por padrão
    period: 1,
    color: '#6b7280',
    lineWidth: 2,
    height: 100
  };

  private getDefaultState(): PersistedIndicatorState {
    return {
      rsi: { ...this.DEFAULT_RSI_CONFIG },
      ema: { ...this.DEFAULT_EMA_CONFIG },
      macd: { ...this.DEFAULT_MACD_CONFIG },
      bollinger: { ...this.DEFAULT_BOLLINGER_CONFIG },
      volume: { ...this.DEFAULT_VOLUME_CONFIG }
    };
  }

  private getDefaultUserPreferences(): UserPreferences {
    return {
      activeAccountId: null,
      dashboardPreferences: {
        layout: 'default',
        cards: ['balance', 'positions', 'automations'],
        theme: 'light'
      },
      uiSettings: {
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: true
      }
    };
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('⚠️ PERSISTENCE - localStorage not available:', e);
      return false;
    }
  }

  private validateStoredData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!data.state || !data.metadata) return false;
    if (!data.metadata.version || !data.metadata.lastUpdated) return false;
    
    // Verificar se não expirou
    const age = Date.now() - data.metadata.lastUpdated;
    if (age > this.DEFAULT_TTL) {
      console.log('🧹 PERSISTENCE - Stored data expired, cleaning up');
      return false;
    }
    
    return true;
  }

  public saveIndicatorConfig(type: IndicatorType, config: PersistedIndicatorConfig): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot save, localStorage not available');
      return false;
    }

    try {
      // Carregar estado atual ou criar novo
      const currentData = this.loadAllConfigs();
      
      // Atualizar configuração específica
      currentData.state[type] = { ...config };
      currentData.metadata.lastUpdated = Date.now();

      // Salvar no localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(currentData));
      
      console.log(`✅ PERSISTENCE - Saved ${type} config:`, {
        enabled: config.enabled,
        period: config.period,
        color: config.color,
        height: config.height
      });
      
      return true;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error saving config:', error);
      return false;
    }
  }

  public loadIndicatorConfig(type: IndicatorType): PersistedIndicatorConfig | null {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot load, localStorage not available');
      return null;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('📦 PERSISTENCE - No stored data found, using defaults');
        return this.getDefaultState()[type];
      }

      const data = JSON.parse(stored);
      if (!this.validateStoredData(data)) {
        console.log('🧹 PERSISTENCE - Invalid stored data, using defaults');
        return this.getDefaultState()[type];
      }

      const config = data.state[type];
      if (!config) {
        console.log(`📦 PERSISTENCE - No config found for ${type}, using default`);
        return this.getDefaultState()[type];
      }

      console.log(`✅ PERSISTENCE - Loaded ${type} config:`, {
        enabled: config.enabled,
        period: config.period,
        color: config.color,
        height: config.height,
        age: Math.floor((Date.now() - data.metadata.lastUpdated) / 1000) + 's'
      });

      return config;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error loading config:', error);
      return this.getDefaultState()[type];
    }
  }

  public loadAllConfigs(): { state: PersistedIndicatorState; metadata: PersistenceMetadata } {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot load, localStorage not available');
      return {
        state: this.getDefaultState(),
        metadata: {
          version: this.VERSION,
          lastUpdated: Date.now(),
          deviceId: this.generateDeviceId()
        }
      };
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('📦 PERSISTENCE - No stored data found, creating new');
        return {
          state: this.getDefaultState(),
          metadata: {
            version: this.VERSION,
            lastUpdated: Date.now(),
            deviceId: this.generateDeviceId()
          }
        };
      }

      const data = JSON.parse(stored);
      if (!this.validateStoredData(data)) {
        console.log('🧹 PERSISTENCE - Invalid stored data, creating new');
        return {
          state: this.getDefaultState(),
          metadata: {
            version: this.VERSION,
            lastUpdated: Date.now(),
            deviceId: this.generateDeviceId()
          }
        };
      }

      console.log('✅ PERSISTENCE - Loaded all configs:', {
        version: data.metadata.version,
        lastUpdated: new Date(data.metadata.lastUpdated).toISOString(),
        deviceId: data.metadata.deviceId,
        indicators: Object.keys(data.state)
      });

      return data;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error loading all configs:', error);
      return {
        state: this.getDefaultState(),
        metadata: {
          version: this.VERSION,
          lastUpdated: Date.now(),
          deviceId: this.generateDeviceId()
        }
      };
    }
  }

  public saveAllConfigs(state: PersistedIndicatorState): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot save, localStorage not available');
      return false;
    }

    try {
      const data = {
        state,
        metadata: {
          version: this.VERSION,
          lastUpdated: Date.now(),
          deviceId: this.generateDeviceId()
        }
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      
      console.log('✅ PERSISTENCE - Saved all configs:', {
        version: data.metadata.version,
        lastUpdated: new Date(data.metadata.lastUpdated).toISOString(),
        deviceId: data.metadata.deviceId,
        indicators: Object.keys(state)
      });
      
      return true;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error saving all configs:', error);
      return false;
    }
  }

  public clearAllConfigs(): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot clear, localStorage not available');
      return false;
    }

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🧹 PERSISTENCE - Cleared all configs');
      return true;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error clearing configs:', error);
      return false;
    }
  }

  public exportConfigs(): string | null {
    try {
      const data = this.loadAllConfigs();
      const exportData = {
        ...data,
        exportDate: new Date().toISOString(),
        exportVersion: this.VERSION
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ PERSISTENCE - Error exporting configs:', error);
      return null;
    }
  }

  public importConfigs(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (!data.state || !data.metadata) {
        console.error('❌ PERSISTENCE - Invalid import data structure');
        return false;
      }

      // Validar estrutura
      const requiredIndicators = ['rsi', 'ema', 'macd', 'bollinger', 'volume'];
      for (const indicator of requiredIndicators) {
        if (!data.state[indicator]) {
          console.error(`❌ PERSISTENCE - Missing ${indicator} in import data`);
          return false;
        }
      }

      // Salvar dados importados
      return this.saveAllConfigs(data.state);
    } catch (error) {
      console.error('❌ PERSISTENCE - Error importing configs:', error);
      return false;
    }
  }

  public getStorageInfo(): {
    available: boolean;
    used: number;
    total: number;
    percentage: number;
  } {
    const available = this.isStorageAvailable();
    
    if (!available) {
      return { available: false, used: 0, total: 0, percentage: 0 };
    }

    try {
      const used = JSON.stringify(localStorage).length;
      const total = 5 * 1024 * 1024; // 5MB típico
      const percentage = (used / total) * 100;
      
      return { available, used, total, percentage };
    } catch (error) {
      console.error('❌ PERSISTENCE - Error getting storage info:', error);
      return { available: true, used: 0, total: 0, percentage: 0 };
    }
  }

  // ===== MÉTODOS PARA CONTA ATIVA =====

  public setActiveAccount(accountId: string | null): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot save active account, localStorage not available');
      return false;
    }

    try {
      const currentData = this.loadUnifiedData();
      currentData.userPreferences.activeAccountId = accountId;
      currentData.metadata.lastUpdated = Date.now();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(currentData));
      
      console.log(`✅ PERSISTENCE - Set active account:`, accountId);
      return true;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error setting active account:', error);
      return false;
    }
  }

  public getActiveAccount(): string | null {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot load active account, localStorage not available');
      return null;
    }

    try {
      const data = this.loadUnifiedData();
      console.log(`✅ PERSISTENCE - Active account:`, data.userPreferences.activeAccountId);
      return data.userPreferences.activeAccountId;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error getting active account:', error);
      return null;
    }
  }

  public clearActiveAccount(): boolean {
    return this.setActiveAccount(null);
  }

  // ===== MÉTODOS PARA PREFERÊNCIAS DO USUÁRIO =====

  public updateUserPreferences(preferences: Partial<UserPreferences>): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot save user preferences, localStorage not available');
      return false;
    }

    try {
      const currentData = this.loadUnifiedData();
      currentData.userPreferences = { ...currentData.userPreferences, ...preferences };
      currentData.metadata.lastUpdated = Date.now();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(currentData));
      
      console.log(`✅ PERSISTENCE - Updated user preferences:`, preferences);
      return true;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error updating user preferences:', error);
      return false;
    }
  }

  public getUserPreferences(): UserPreferences {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot load user preferences, localStorage not available');
      return this.getDefaultUserPreferences();
    }

    try {
      const data = this.loadUnifiedData();
      console.log(`✅ PERSISTENCE - User preferences:`, data.userPreferences);
      return data.userPreferences;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error getting user preferences:', error);
      return this.getDefaultUserPreferences();
    }
  }

  // ===== MÉTODOS UNIFICADOS =====

  public loadUnifiedData(): UnifiedPersistenceData {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot load unified data, localStorage not available');
      return {
        indicators: this.getDefaultState(),
        userPreferences: this.getDefaultUserPreferences(),
        metadata: {
          version: this.VERSION,
          lastUpdated: Date.now(),
          deviceId: this.generateDeviceId()
        }
      };
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('📦 PERSISTENCE - No stored data found, creating new unified data');
        return {
          indicators: this.getDefaultState(),
          userPreferences: this.getDefaultUserPreferences(),
          metadata: {
            version: this.VERSION,
            lastUpdated: Date.now(),
            deviceId: this.generateDeviceId()
          }
        };
      }

      const data = JSON.parse(stored);
      
      // Migrar dados antigos para nova estrutura
      if (data.state && !data.indicators) {
        console.log('🔄 PERSISTENCE - Migrating old data structure to unified format');
        return {
          indicators: data.state,
          userPreferences: data.userPreferences || this.getDefaultUserPreferences(),
          metadata: {
            version: this.VERSION,
            lastUpdated: Date.now(),
            deviceId: this.generateDeviceId()
          }
        };
      }

      if (!this.validateStoredData(data)) {
        console.log('🧹 PERSISTENCE - Invalid stored data, creating new unified data');
        return {
          indicators: this.getDefaultState(),
          userPreferences: this.getDefaultUserPreferences(),
          metadata: {
            version: this.VERSION,
            lastUpdated: Date.now(),
            deviceId: this.generateDeviceId()
          }
        };
      }

      console.log('✅ PERSISTENCE - Loaded unified data:', {
        version: data.metadata.version,
        lastUpdated: new Date(data.metadata.lastUpdated).toISOString(),
        deviceId: data.metadata.deviceId,
        activeAccount: data.userPreferences?.activeAccountId,
        indicators: Object.keys(data.indicators || data.state || {})
      });

      return data;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error loading unified data:', error);
      return {
        indicators: this.getDefaultState(),
        userPreferences: this.getDefaultUserPreferences(),
        metadata: {
          version: this.VERSION,
          lastUpdated: Date.now(),
          deviceId: this.generateDeviceId()
        }
      };
    }
  }

  public saveUnifiedData(data: UnifiedPersistenceData): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('⚠️ PERSISTENCE - Cannot save unified data, localStorage not available');
      return false;
    }

    try {
      const dataToSave = {
        ...data,
        metadata: {
          ...data.metadata,
          lastUpdated: Date.now()
        }
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      
      console.log('✅ PERSISTENCE - Saved unified data:', {
        version: dataToSave.metadata.version,
        lastUpdated: new Date(dataToSave.metadata.lastUpdated).toISOString(),
        deviceId: dataToSave.metadata.deviceId,
        activeAccount: dataToSave.userPreferences.activeAccountId,
        indicators: Object.keys(dataToSave.indicators)
      });
      
      return true;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error saving unified data:', error);
      return false;
    }
  }
}

export const indicatorPersistenceService = new IndicatorPersistenceService();
