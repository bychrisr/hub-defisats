// src/hooks/useEMA.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { EMAPoint, EMAConfig, EMAResult } from '@/types/emaIndicator';
import { EMACalculationService, BarData } from '@/services/emaCalculation.service';

export interface UseEMAProps {
  data: BarData[];
  initialConfig?: Partial<EMAConfig>;
  autoUpdate?: boolean;
  updateInterval?: number;
}

export interface UseEMAReturn {
  emaResult: EMAResult | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  config: EMAConfig;
  updateConfig: (newConfig: Partial<EMAConfig>) => void;
  calculateEMA: () => EMAResult | null;
  clearError: () => void;
  stats: {
    dataPoints: number;
    firstValue: number | null;
    lastValue: number | null;
    minValue: number | null;
    maxValue: number | null;
    averageValue: number | null;
  };
}

const defaultConfig: EMAConfig = {
  enabled: true,
  period: 20,
  color: '#f59e0b',
  lineWidth: 2,
  height: 100
};

export const useEMA = ({
  data,
  initialConfig = {},
  autoUpdate = true,
  updateInterval = 1000
}: UseEMAProps): UseEMAReturn => {
  
  const [config, setConfig] = useState<EMAConfig>({
    ...defaultConfig,
    ...initialConfig
  });
  
  const [emaResult, setEmaResult] = useState<EMAResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);

  /**
   * Calcula a EMA com a configuração atual
   */
  const calculateEMA = useCallback((): EMAResult | null => {
    console.log('📊 EMA HOOK - Starting EMA calculation');
    
    if (!config.enabled) {
      console.log('📊 EMA HOOK - EMA disabled');
      setEmaResult(null);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log('📊 EMA HOOK - No data available');
      setEmaResult(null);
      return null;
    }
    
    // Validar dados
    const validation = EMACalculationService.validateData(data, config.period);
    if (!validation.isValid) {
      const errorMsg = `EMA validation failed: ${validation.errors.join(', ')}`;
      console.error('❌ EMA HOOK -', errorMsg);
      setError(errorMsg);
      return null;
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ EMA HOOK - Validation warnings:', validation.warnings);
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Calcular EMA
      const emaData = EMACalculationService.calculateEMA(data, {
        period: config.period
      });
      
      if (emaData.length === 0) {
        console.warn('⚠️ EMA HOOK - No EMA data calculated');
        setEmaResult(null);
        return null;
      }
      
      // Calcular estatísticas
      const stats = EMACalculationService.calculateStats(emaData);
      
      // Criar resultado
      const result: EMAResult = {
        type: 'ema',
        data: emaData,
        config,
        timestamp: Date.now(),
        valid: true,
        stats
      };
      
      setEmaResult(result);
      setLastUpdate(Date.now());
      
      console.log(`✅ EMA HOOK - EMA calculated successfully: ${emaData.length} points`);
      console.log(`📊 EMA HOOK - Stats:`, stats);
      
      return result;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error calculating EMA';
      console.error('❌ EMA HOOK - Error calculating EMA:', errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [data, config]);

  /**
   * Atualiza a configuração da EMA
   */
  const updateConfig = useCallback((newConfig: Partial<EMAConfig>) => {
    console.log('📊 EMA HOOK - Updating config:', newConfig);
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Limpa erros
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Efeito para calcular EMA quando dados ou configuração mudam
   */
  useEffect(() => {
    if (!autoUpdate) return;

    console.log('📊 EMA HOOK - Data or config changed, recalculating EMA');
    calculateEMA();
  }, [calculateEMA, autoUpdate]);

  /**
   * Efeito para auto-update com intervalo
   */
  useEffect(() => {
    if (!autoUpdate || !updateInterval) return;

    console.log(`📊 EMA HOOK - Setting up auto-update every ${updateInterval}ms`);
    
    const interval = setInterval(() => {
      console.log('⏰ EMA HOOK - Auto-update triggered');
      calculateEMA();
    }, updateInterval);

    return () => {
      console.log('📊 EMA HOOK - Clearing auto-update interval');
      clearInterval(interval);
    };
  }, [calculateEMA, autoUpdate, updateInterval]);

  /**
   * Memoiza estatísticas da EMA
   */
  const stats = useMemo(() => {
    if (!emaResult || !emaResult.valid) {
      return {
        dataPoints: 0,
        firstValue: null,
        lastValue: null,
        minValue: null,
        maxValue: null,
        averageValue: null
      };
    }

    return emaResult.stats;
  }, [emaResult]);

  return {
    emaResult,
    isLoading,
    error,
    lastUpdate,
    config,
    updateConfig,
    calculateEMA,
    clearError,
    stats
  };
};

export default useEMA;
