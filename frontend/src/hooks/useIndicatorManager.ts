// src/hooks/useIndicatorManager.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { LwcBar, LinePoint, HistogramPoint, MACDResult, BollingerResult } from '@/types/chart';
import { 
  IndicatorManagerService, 
  IndicatorType, 
  IndicatorConfig, 
  IndicatorResult 
} from '@/services/indicatorManager.service';

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
        types: Object.keys(results).filter(k => results[k as IndicatorType] !== null)
      });

    } catch (err: any) {
      console.error('❌ USE INDICATOR MANAGER - Error calculating indicators:', err);
      setError(`Error calculating indicators: ${err.message}`);
    } finally {
      setIsLoading(false);
      isCalculatingRef.current = false;
    }
  }, [bars, enabledIndicators, configs]);

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

    console.log('🔄 USE INDICATOR MANAGER - Auto-update triggered:', {
      barsCount: bars.length,
      enabledIndicators,
      autoUpdate
    });

    calculateAllIndicators();
  }, [bars, enabledIndicators, autoUpdate, calculateAllIndicators]);

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
  }, [autoUpdate, updateInterval, bars.length, calculateAllIndicators]);

  // Obter estatísticas do cache
  const cacheStats = indicatorManagerRef.current?.getCacheStats() || {
    size: 0,
    entries: []
  };

  return {
    indicators,
    isLoading,
    error,
    lastUpdate,
    cacheStats,
    calculateIndicator,
    calculateAllIndicators,
    clearCache,
    refreshIndicator
  };
};
