// Re-export dos hooks do contexto de posições para facilitar o uso
export {
  usePositions,
  usePositionsData,
  usePositionsList,
  usePositionsMetrics,
} from '@/contexts/PositionsContext';

// Importar os hooks para uso interno
import { usePositionsMetrics, usePositionsList, usePositionsData } from '@/contexts/PositionsContext';

// Hook específico para P&L total
export const useTotalPL = () => {
  const { totalPL } = usePositionsMetrics();
  console.log('📊 useTotalPL - Current totalPL:', totalPL);
  console.log('🔍 useTotalPL - usePositionsMetrics result:', { totalPL });
  return totalPL || 0;
};

// Hook específico para margem total
export const useTotalMargin = () => {
  const { totalMargin } = usePositionsMetrics();
  return totalMargin;
};

// Hook específico para quantidade total
export const useTotalQuantity = () => {
  const { totalQuantity } = usePositionsMetrics();
  return totalQuantity;
};

// Hook específico para valor total
export const useTotalValue = () => {
  const { data } = usePositionsData();
  return data.totalValue;
};

// Hook específico para contagem de posições
export const usePositionCount = () => {
  const { positionCount } = usePositionsMetrics();
  return positionCount;
};

// Hook específico para posições long
export const useLongPositions = () => {
  const { getPositionsBySide } = usePositionsList();
  return getPositionsBySide('long');
};

// Hook específico para posições short
export const useShortPositions = () => {
  const { getPositionsBySide } = usePositionsList();
  return getPositionsBySide('short');
};

// Hook específico para posições de um símbolo
export const usePositionsBySymbol = (symbol: string) => {
  const { getPositionsBySymbol } = usePositionsList();
  return getPositionsBySymbol(symbol);
};

// Hook específico para uma posição por ID
export const usePositionById = (id: string) => {
  const { getPositionById } = usePositionsList();
  return getPositionById(id);
};
