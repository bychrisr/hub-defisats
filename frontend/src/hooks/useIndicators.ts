import { useState, useCallback } from 'react';

export type IndicatorType = 'rsi' | 'macd' | 'bollinger';

export interface IndicatorData {
  id: IndicatorType;
  name: string;
  data: Array<{ time: number; value: number }>;
  color?: string;
  visible: boolean;
}

interface UseIndicatorsReturn {
  indicators: IndicatorData[];
  addIndicator: (type: IndicatorType) => void;
  removeIndicator: (id: IndicatorType) => void;
  toggleIndicator: (id: IndicatorType) => void;
  clearIndicators: () => void;
}

export const useIndicators = (): UseIndicatorsReturn => {
  const [indicators, setIndicators] = useState<IndicatorData[]>([]);

  const addIndicator = useCallback((type: IndicatorType) => {
    const indicatorConfig = {
      rsi: { name: 'RSI', color: '#ff6b6b' },
      macd: { name: 'MACD', color: '#4ecdc4' },
      bollinger: { name: 'Bollinger Bands', color: '#45b7d1' }
    };

    const config = indicatorConfig[type];
    
    // Gerar dados mockados para demonstração (em produção, viria da API)
    const mockData = Array.from({ length: 100 }, (_, i) => ({
      time: Date.now() / 1000 - (100 - i) * 3600, // 1 hora atrás
      value: Math.random() * 100 + (type === 'rsi' ? 0 : 50) // RSI 0-100, outros centrados
    }));

    const newIndicator: IndicatorData = {
      id: type,
      name: config.name,
      data: mockData,
      color: config.color,
      visible: true
    };

    setIndicators(prev => {
      // Se já existe, não adicionar novamente
      if (prev.some(ind => ind.id === type)) {
        return prev;
      }
      return [...prev, newIndicator];
    });

    console.log('📊 INDICATORS - Added:', type, config.name);
  }, []);

  const removeIndicator = useCallback((id: IndicatorType) => {
    setIndicators(prev => prev.filter(ind => ind.id !== id));
    console.log('📊 INDICATORS - Removed:', id);
  }, []);

  const toggleIndicator = useCallback((id: IndicatorType) => {
    setIndicators(prev => 
      prev.map(ind => 
        ind.id === id ? { ...ind, visible: !ind.visible } : ind
      )
    );
    console.log('📊 INDICATORS - Toggled:', id);
  }, []);

  const clearIndicators = useCallback(() => {
    setIndicators([]);
    console.log('📊 INDICATORS - Cleared all');
  }, []);

  return {
    indicators,
    addIndicator,
    removeIndicator,
    toggleIndicator,
    clearIndicators
  };
};
