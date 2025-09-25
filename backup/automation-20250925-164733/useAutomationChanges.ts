import { useMemo, useRef, useState } from 'react';

interface MarginGuardSettings {
  enabled: boolean;
  threshold: number;
  reduction: number;
}

interface TakeProfitStopLossSettings {
  enabled: boolean;
  takeProfitPercent: number;
  stopLossPercent: number;
  trailingEnabled: boolean;
  trailingDistance: number;
}

export const useAutomationChanges = (
  marginGuard: MarginGuardSettings,
  tpsl: TakeProfitStopLossSettings,
  isDataLoaded: boolean
) => {
  // Armazena valores originais (não causa re-render)
  const originalValuesRef = useRef<{
    marginGuard: MarginGuardSettings | null;
    tpsl: TakeProfitStopLossSettings | null;
  }>({
    marginGuard: null,
    tpsl: null,
  });

  // Função para definir valores originais (chamada após carregar dados)
  const setOriginalValues = (
    mg: MarginGuardSettings,
    tp: TakeProfitStopLossSettings
  ) => {
    originalValuesRef.current = {
      marginGuard: { ...mg },
      tpsl: { ...tp },
    };
    console.log('🔍 AUTOMATION - Original values set:', originalValuesRef.current);
  };

  // Detecção de mudanças usando useMemo (só recalcula quando inputs mudam)
  const hasChanges = useMemo(() => {
    console.log('🔍 AUTOMATION - Change detection triggered:', {
      isDataLoaded,
      hasOriginalValues: !!(originalValuesRef.current.marginGuard && originalValuesRef.current.tpsl),
      marginGuard,
      tpsl,
      originalValues: originalValuesRef.current
    });

    if (!isDataLoaded || !originalValuesRef.current.marginGuard || !originalValuesRef.current.tpsl) {
      console.log('🔍 AUTOMATION - No changes detected (not loaded or no original values)');
      return false;
    }

    const mgChanged =
      marginGuard.enabled !== originalValuesRef.current.marginGuard.enabled ||
      marginGuard.threshold !== originalValuesRef.current.marginGuard.threshold ||
      marginGuard.reduction !== originalValuesRef.current.marginGuard.reduction;

    const tpslChanged =
      tpsl.enabled !== originalValuesRef.current.tpsl.enabled ||
      tpsl.takeProfitPercent !== originalValuesRef.current.tpsl.takeProfitPercent ||
      tpsl.stopLossPercent !== originalValuesRef.current.tpsl.stopLossPercent ||
      tpsl.trailingEnabled !== originalValuesRef.current.tpsl.trailingEnabled ||
      tpsl.trailingDistance !== originalValuesRef.current.tpsl.trailingDistance;

    const result = mgChanged || tpslChanged;
    console.log('🔍 AUTOMATION - Change detection result:', {
      marginGuard: { 
        current: marginGuard, 
        original: originalValuesRef.current.marginGuard,
        changed: mgChanged
      },
      tpsl: { 
        current: tpsl, 
        original: originalValuesRef.current.tpsl,
        changed: tpslChanged
      },
      hasChanges: result,
      isDataLoaded,
    });

    return result;
  }, [marginGuard, tpsl, isDataLoaded]);

  // Forçar re-execução do useMemo após setOriginalValues
  const [, forceUpdate] = useState({});
  const forceRerender = () => forceUpdate({});

  // Wrapper para setOriginalValues que força re-execução
  const setOriginalValuesWithRerender = (mg: MarginGuardSettings, tp: TakeProfitStopLossSettings) => {
    setOriginalValues(mg, tp);
    forceRerender();
  };

  return {
    hasChanges,
    setOriginalValues: setOriginalValuesWithRerender,
  };
};
