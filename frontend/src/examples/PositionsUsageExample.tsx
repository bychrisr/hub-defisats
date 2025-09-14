// Exemplo de como usar o contexto global de posições em qualquer página
import React from 'react';
import { 
  usePositions, 
  usePositionsData, 
  usePositionsList, 
  usePositionsMetrics,
  useTotalPL,
  useTotalMargin,
  useTotalValue,
  usePositionCount,
  useLongPositions,
  useShortPositions,
  usePositionsBySymbol,
  usePositionById
} from '@/hooks/usePositions';

// Exemplo 1: Usando o hook principal
export const Example1 = () => {
  const { data, refreshPositions, getPositionById } = usePositions();
  
  return (
    <div>
      <h2>Dados Completos das Posições</h2>
      <p>Total P&L: {data.totalPL}</p>
      <p>Total Margin: {data.totalMargin}</p>
      <p>Total Value: {data.totalValue}</p>
      <p>Posições: {data.positions.length}</p>
      <button onClick={refreshPositions}>Atualizar</button>
    </div>
  );
};

// Exemplo 2: Usando hooks específicos para métricas
export const Example2 = () => {
  const totalPL = useTotalPL();
  const totalMargin = useTotalMargin();
  const totalValue = useTotalValue();
  const positionCount = usePositionCount();
  
  return (
    <div>
      <h2>Métricas das Posições</h2>
      <p>P&L Total: {totalPL}</p>
      <p>Margem Total: {totalMargin}</p>
      <p>Valor Total: {totalValue}</p>
      <p>Número de Posições: {positionCount}</p>
    </div>
  );
};

// Exemplo 3: Usando hooks para posições específicas
export const Example3 = () => {
  const longPositions = useLongPositions();
  const shortPositions = useShortPositions();
  const btcPositions = usePositionsBySymbol('BTC');
  
  return (
    <div>
      <h2>Posições Específicas</h2>
      <p>Posições Long: {longPositions.length}</p>
      <p>Posições Short: {shortPositions.length}</p>
      <p>Posições BTC: {btcPositions.length}</p>
    </div>
  );
};

// Exemplo 4: Usando hook para buscar posição específica
export const Example4 = () => {
  const position = usePositionById('position-123');
  
  if (!position) {
    return <div>Posição não encontrada</div>;
  }
  
  return (
    <div>
      <h2>Posição Específica</h2>
      <p>ID: {position.id}</p>
      <p>Símbolo: {position.asset}</p>
      <p>Lado: {position.side}</p>
      <p>P&L: {position.pnl}</p>
      <p>Margem: {position.margin}</p>
    </div>
  );
};

// Exemplo 5: Listando todas as posições
export const Example5 = () => {
  const { positions } = usePositionsList();
  
  return (
    <div>
      <h2>Todas as Posições</h2>
      {positions.map(position => (
        <div key={position.id} className="border p-4 mb-2">
          <p><strong>ID:</strong> {position.id}</p>
          <p><strong>Símbolo:</strong> {position.asset}</p>
          <p><strong>Lado:</strong> {position.side}</p>
          <p><strong>Quantidade:</strong> {position.quantity}</p>
          <p><strong>Preço:</strong> {position.price}</p>
          <p><strong>P&L:</strong> {position.pnl}</p>
          <p><strong>Margem:</strong> {position.margin}</p>
          <p><strong>Alavancagem:</strong> {position.leverage}</p>
        </div>
      ))}
    </div>
  );
};

// Exemplo 6: Dashboard com resumo
export const Example6 = () => {
  const { data } = usePositionsData();
  const longPositions = useLongPositions();
  const shortPositions = useShortPositions();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-blue-100 p-4 rounded">
        <h3>Resumo Geral</h3>
        <p>Total P&L: {data.totalPL.toFixed(2)}</p>
        <p>Total Margin: {data.totalMargin.toFixed(2)}</p>
        <p>Total Value: {data.totalValue.toFixed(2)}</p>
        <p>Posições: {data.positions.length}</p>
      </div>
      
      <div className="bg-green-100 p-4 rounded">
        <h3>Posições Long</h3>
        <p>Quantidade: {longPositions.length}</p>
        <p>P&L Total: {longPositions.reduce((sum, pos) => sum + pos.pnl, 0).toFixed(2)}</p>
      </div>
      
      <div className="bg-red-100 p-4 rounded">
        <h3>Posições Short</h3>
        <p>Quantidade: {shortPositions.length}</p>
        <p>P&L Total: {shortPositions.reduce((sum, pos) => sum + pos.pnl, 0).toFixed(2)}</p>
      </div>
    </div>
  );
};

