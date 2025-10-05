// src/hooks/useIndicatorManager.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { LwcBar, LinePoint, HistogramPoint, MACDResult, BollingerResult } from '@/types/chart';
import { 
  IndicatorManagerService, 
  IndicatorType, 
  IndicatorConfig, 
  IndicatorResult 
} from '@/services/indicatorManager.service';
import { 
  indicatorPersistenceService, 
  PersistedIndicatorConfig 
} from '@/services/indicatorPersistence.service';
import { 
  userPreferencesService, 
  UserIndicatorPreferences 
} from '@/services/userPreferences.service';

export interface UseIndicatorManagerProps {
  bars: LwcBar[];
  enabledIndicators: IndicatorType[];
  configs: Record<IndicatorType, IndicatorConfig>;
  autoUpdate?: boolean;
  updateInterval?: number; // em milissegundos
}

export interface UseIndicatorManagerReturn {
  indicators: Record<IndicatorType, IndicatorResult | null>;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  cacheStats: {
    size: number;
    entries: Array<{
      key: string;
      type: IndicatorType;
      age: number;
      accessCount: number;
      ttl: number;
    }>;
  };
  calculateIndicator: (type: IndicatorType) => Promise<IndicatorResult | null>;
  calculateAllIndicators: () => Promise<void>;
  clearCache: () => void;
  refreshIndicator: (type: IndicatorType) => Promise<void>;
  // Persistência
  saveConfig: (type: IndicatorType, config: PersistedIndicatorConfig) => boolean;
  loadConfig: (type: IndicatorType) => PersistedIndicatorConfig | null;
  saveAllConfigs: (configs: Record<IndicatorType, PersistedIndicatorConfig>) => boolean;
  loadAllConfigs: () => Record<IndicatorType, PersistedIndicatorConfig>;
  exportConfigs: () => string | null;
  importConfigs: (jsonData: string) => boolean;
  clearAllConfigs: () => boolean;
  getStorageInfo: () => {
    available: boolean;
    used: number;
    total: number;
    percentage: number;
  };
  // Backend sync
  syncWithBackend: () => Promise<boolean>;
  saveToBackend: () => Promise<boolean>;
  loadFromBackend: () => Promise<boolean>;
  clearFromBackend: () => Promise<boolean>;
  exportFromBackend: () => Promise<string | null>;
  importToBackend: (jsonData: string) => Promise<boolean>;
  getBackendStats: () => Promise<any>;
}

export const useIndicatorManager = ({
  bars,
  enabledIndicators,
  configs,
  autoUpdate = true,
  updateInterval = 5000 // 5 segundos
}: UseIndicatorManagerProps): UseIndicatorManagerReturn => {
  const [indicators, setIndicators] = useState<Record<IndicatorType, IndicatorResult | null>>({} as any);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  
  const indicatorManagerRef = useRef<IndicatorManagerService | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCalculatingRef = useRef(false);
  const lastBarsRef = useRef<LwcBar[]>([]);
  const lastEnabledIndicatorsRef = useRef<IndicatorType[]>([]);

  // Inicializar IndicatorManager
  useEffect(() => {
    if (!indicatorManagerRef.current) {
      indicatorManagerRef.current = new IndicatorManagerService();
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Função para calcular um indicador específico
  const calculateIndicator = useCallback(async (type: IndicatorType): Promise<IndicatorResult | null> => {
    if (!indicatorManagerRef.current || !bars.length) {
      console.warn(`⚠️ USE INDICATOR MANAGER - Cannot calculate ${type}: no manager or bars`);
      return null;
    }

    try {
      const config = configs[type];
      if (!config) {
        console.warn(`⚠️ USE INDICATOR MANAGER - No config for ${type}`);
        return null;
      }

      console.log(`🔄 USE INDICATOR MANAGER - Calculating ${type}:`, {
        barsCount: bars.length,
        enabled: config.enabled,
        period: config.period
      });

      const result = await indicatorManagerRef.current.calculateIndicator(type, bars, config);
      
      if (result) {
        console.log(`✅ USE INDICATOR MANAGER - ${type} calculated successfully:`, {
          dataPoints: Array.isArray(result.data) ? result.data.length : 'complex',
          valid: result.valid
        });
      }

      return result;
    } catch (err: any) {
      console.error(`❌ USE INDICATOR MANAGER - Error calculating ${type}:`, err);
      setError(`Error calculating ${type}: ${err.message}`);
      return null;
    }
  }, [bars, configs]);

  // Função para calcular todos os indicadores habilitados
  const calculateAllIndicators = useCallback(async () => {
    if (!indicatorManagerRef.current || !bars.length || isCalculatingRef.current) {
      console.log('🔄 USE INDICATOR MANAGER - Skipping calculation:', {
        hasManager: !!indicatorManagerRef.current,
        barsCount: bars.length,
        isCalculating: isCalculatingRef.current
      });
      return;
    }

    // Verificar se já temos os mesmos dados
    const currentBarsKey = bars.map(b => `${b.time}-${b.close}`).join('|');
    const lastBarsKey = lastBarsRef.current.map(b => `${b.time}-${b.close}`).join('|');
    
    if (currentBarsKey === lastBarsKey && Object.keys(indicators).length > 0) {
      console.log('🔄 USE INDICATOR MANAGER - Same data, skipping calculation');
      return;
    }

    isCalculatingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 USE INDICATOR MANAGER - Calculating all indicators:', {
        enabledIndicators,
        barsCount: bars.length,
        configs: Object.keys(configs)
      });

      const results = await indicatorManagerRef.current.calculateMultipleIndicators(
        enabledIndicators,
        bars,
        configs
      );

      setIndicators(results);
      setLastUpdate(Date.now());
      
      console.log('✅ USE INDICATOR MANAGER - All indicators calculated:', {
        successful: Object.values(results).filter(r => r !== null).length,
        total: enabledIndicators.length,
        types: Object.keys(results).filter(k => results[k as IndicatorType] !== null),
        emaResult: results.ema ? 'calculated' : 'null',
        rsiResult: results.rsi ? 'calculated' : 'null'
      });

    } catch (err: any) {
      console.error('❌ USE INDICATOR MANAGER - Error calculating indicators:', err);
      setError(`Error calculating indicators: ${err.message}`);
    } finally {
      setIsLoading(false);
      isCalculatingRef.current = false;
    }
  }, [bars, enabledIndicators]);

  // Função para atualizar um indicador específico
  const refreshIndicator = useCallback(async (type: IndicatorType) => {
    console.log(`🔄 USE INDICATOR MANAGER - Refreshing ${type}`);
    
    const result = await calculateIndicator(type);
    if (result) {
      setIndicators(prev => ({
        ...prev,
        [type]: result
      }));
      setLastUpdate(Date.now());
    }
  }, [calculateIndicator]);

  // Função para limpar cache
  const clearCache = useCallback(() => {
    if (indicatorManagerRef.current) {
      indicatorManagerRef.current.destroy();
      indicatorManagerRef.current = new IndicatorManagerService();
      console.log('🧹 USE INDICATOR MANAGER - Cache cleared');
    }
  }, []);

  // Auto-update quando dados mudam
  useEffect(() => {
    if (!autoUpdate || !bars.length) return;

    // Verificar se os dados realmente mudaram
    const barsChanged = bars.length !== lastBarsRef.current.length || 
      bars.some((bar, index) => {
        const lastBar = lastBarsRef.current[index];
        return !lastBar || bar.time !== lastBar.time || bar.close !== lastBar.close;
      });
    
    const indicatorsChanged = enabledIndicators.length !== lastEnabledIndicatorsRef.current.length ||
      enabledIndicators.some((indicator, index) => indicator !== lastEnabledIndicatorsRef.current[index]);

    // CORREÇÃO: Forçar atualização se EMA estiver habilitada mas não calculada
    const emaEnabled = enabledIndicators.includes('ema');
    const emaNotCalculated = !indicators.ema || !indicators.ema.valid;
    const forceEmaUpdate = emaEnabled && emaNotCalculated;

    if (!barsChanged && !indicatorsChanged && !forceEmaUpdate) {
      console.log('🔄 USE INDICATOR MANAGER - No changes detected, skipping update');
      return;
    }

    console.log('🔄 USE INDICATOR MANAGER - Auto-update triggered:', {
      barsCount: bars.length,
      enabledIndicators,
      autoUpdate,
      barsChanged,
      indicatorsChanged,
      emaEnabled: enabledIndicators.includes('ema'),
      rsiEnabled: enabledIndicators.includes('rsi'),
      forceEmaUpdate,
      emaNotCalculated: !indicators.ema || !indicators.ema.valid
    });

    // Atualizar referências
    lastBarsRef.current = [...bars];
    lastEnabledIndicatorsRef.current = [...enabledIndicators];

    calculateAllIndicators();
  }, [bars, enabledIndicators, autoUpdate, indicators.ema]);

  // CORREÇÃO: Forçar cálculo da EMA quando habilitada
  useEffect(() => {
    const emaEnabled = enabledIndicators.includes('ema');
    const emaNotCalculated = !indicators.ema || !indicators.ema.valid;
    
    if (emaEnabled && emaNotCalculated && bars.length > 0) {
      console.log('🔄 USE INDICATOR MANAGER - Forçando cálculo da EMA (habilitada mas não calculada)');
      calculateIndicator('ema');
    }
  }, [enabledIndicators, indicators.ema, bars.length, calculateIndicator]);

  // Auto-update periódico
  useEffect(() => {
    if (!autoUpdate || updateInterval <= 0) return;

    const scheduleUpdate = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        if (bars.length > 0) {
          console.log('⏰ USE INDICATOR MANAGER - Periodic update triggered');
          calculateAllIndicators();
        }
        scheduleUpdate(); // Agendar próxima atualização
      }, updateInterval);
    };

    scheduleUpdate();

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [autoUpdate, updateInterval, bars.length]);

  // Obter estatísticas do cache
  const cacheStats = indicatorManagerRef.current?.getCacheStats() || {
    size: 0,
    entries: []
  };

  // Funções de persistência
  const saveConfig = useCallback((type: IndicatorType, config: PersistedIndicatorConfig): boolean => {
    console.log(`💾 PERSISTENCE - Saving ${type} config:`, config);
    return indicatorPersistenceService.saveIndicatorConfig(type, config);
  }, []);

  const loadConfig = useCallback((type: IndicatorType): PersistedIndicatorConfig | null => {
    console.log(`📦 PERSISTENCE - Loading ${type} config`);
    return indicatorPersistenceService.loadIndicatorConfig(type);
  }, []);

  const saveAllConfigs = useCallback((configs: Record<IndicatorType, PersistedIndicatorConfig>): boolean => {
    console.log('💾 PERSISTENCE - Saving all configs:', Object.keys(configs));
    return indicatorPersistenceService.saveAllConfigs(configs);
  }, []);

  const loadAllConfigs = useCallback((): Record<IndicatorType, PersistedIndicatorConfig> => {
    console.log('📦 PERSISTENCE - Loading all configs');
    const data = indicatorPersistenceService.loadAllConfigs();
    return data.state;
  }, []);

  const exportConfigs = useCallback((): string | null => {
    console.log('📤 PERSISTENCE - Exporting configs');
    return indicatorPersistenceService.exportConfigs();
  }, []);

  const importConfigs = useCallback((jsonData: string): boolean => {
    console.log('📥 PERSISTENCE - Importing configs');
    return indicatorPersistenceService.importConfigs(jsonData);
  }, []);

  const clearAllConfigs = useCallback((): boolean => {
    console.log('🧹 PERSISTENCE - Clearing all configs');
    return indicatorPersistenceService.clearAllConfigs();
  }, []);

  const getStorageInfo = useCallback(() => {
    return indicatorPersistenceService.getStorageInfo();
  }, []);

  // Backend sync functions
  const syncWithBackend = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 BACKEND SYNC - Syncing with backend');
      const deviceId = userPreferencesService.generateDeviceId();
      const preferences = await userPreferencesService.syncPreferences(deviceId);
      
      if (preferences) {
        console.log('✅ BACKEND SYNC - Preferences synced from backend:', preferences);
        return true;
      }
      
      console.log('📦 BACKEND SYNC - No preferences to sync from backend');
      return false;
    } catch (error) {
      console.error('❌ BACKEND SYNC - Error syncing with backend:', error);
      return false;
    }
  }, []);

  const saveToBackend = useCallback(async (): Promise<boolean> => {
    try {
      console.log('💾 BACKEND SYNC - Saving to backend');
      const localConfigs = loadAllConfigs();
      const success = await userPreferencesService.saveIndicatorPreferences(localConfigs);
      
      if (success) {
        console.log('✅ BACKEND SYNC - Preferences saved to backend successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ BACKEND SYNC - Error saving to backend:', error);
      return false;
    }
  }, []);

  const loadFromBackend = useCallback(async (): Promise<boolean> => {
    try {
      console.log('📦 BACKEND SYNC - Loading from backend');
      const preferences = await userPreferencesService.loadIndicatorPreferences();
      
      if (preferences) {
        console.log('✅ BACKEND SYNC - Preferences loaded from backend:', preferences);
        // Aplicar configurações carregadas
        saveAllConfigs(preferences.indicatorConfigs);
        return true;
      }
      
      console.log('📦 BACKEND SYNC - No preferences found in backend');
      return false;
    } catch (error) {
      console.error('❌ BACKEND SYNC - Error loading from backend:', error);
      return false;
    }
  }, []);

  const clearFromBackend = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🗑️ BACKEND SYNC - Clearing from backend');
      const success = await userPreferencesService.clearIndicatorPreferences();
      
      if (success) {
        console.log('✅ BACKEND SYNC - Preferences cleared from backend successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ BACKEND SYNC - Error clearing from backend:', error);
      return false;
    }
  }, []);

  const exportFromBackend = useCallback(async (): Promise<string | null> => {
    try {
      console.log('📤 BACKEND SYNC - Exporting from backend');
      const jsonData = await userPreferencesService.exportPreferences();
      
      if (jsonData) {
        console.log('✅ BACKEND SYNC - Preferences exported from backend successfully');
      }
      
      return jsonData;
    } catch (error) {
      console.error('❌ BACKEND SYNC - Error exporting from backend:', error);
      return null;
    }
  }, []);

  const importToBackend = useCallback(async (jsonData: string): Promise<boolean> => {
    try {
      console.log('📥 BACKEND SYNC - Importing to backend');
      const success = await userPreferencesService.importPreferences(jsonData);
      
      if (success) {
        console.log('✅ BACKEND SYNC - Preferences imported to backend successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ BACKEND SYNC - Error importing to backend:', error);
      return false;
    }
  }, []);

  const getBackendStats = useCallback(async () => {
    try {
      console.log('📊 BACKEND SYNC - Getting backend stats');
      const stats = await userPreferencesService.getPreferencesStats();
      
      if (stats) {
        console.log('✅ BACKEND SYNC - Backend stats retrieved:', stats);
      }
      
      return stats;
    } catch (error) {
      console.error('❌ BACKEND SYNC - Error getting backend stats:', error);
      return null;
    }
  }, []);

  return {
    indicators,
    isLoading,
    error,
    lastUpdate,
    cacheStats,
    calculateIndicator,
    calculateAllIndicators,
    clearCache,
    refreshIndicator,
    // CORREÇÃO: Adicionar enabledIndicators e indicatorConfigs ao retorno
    enabledIndicators,
    indicatorConfigs,
    // Persistência
    saveConfig,
    loadConfig,
    saveAllConfigs,
    loadAllConfigs,
    exportConfigs,
    importConfigs,
    clearAllConfigs,
    getStorageInfo,
    // Backend sync
    syncWithBackend,
    saveToBackend,
    loadFromBackend,
    clearFromBackend,
    exportFromBackend,
    importToBackend,
    getBackendStats
  };
};
