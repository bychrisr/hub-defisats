// Teste simples para verificar a API da versão 5.0.9
import { createChart, LineSeries, CandlestickSeries } from 'lightweight-charts';

console.log('✅ LineSeries:', LineSeries);
console.log('✅ CandlestickSeries:', CandlestickSeries);

// Teste básico
const container = document.createElement('div');
const chart = createChart(container, { width: 400, height: 300 });

console.log('✅ Chart criado:', chart);
console.log('✅ addSeries method:', typeof chart.addSeries);

// Teste de criação de série
try {
  const lineSeries = chart.addSeries(LineSeries, { color: 'red' });
  console.log('✅ LineSeries criada:', lineSeries);
} catch (error) {
  console.error('❌ Erro ao criar LineSeries:', error);
}

try {
  const candlestickSeries = chart.addSeries(CandlestickSeries, { 
    upColor: 'green', 
    downColor: 'red' 
  });
  console.log('✅ CandlestickSeries criada:', candlestickSeries);
} catch (error) {
  console.error('❌ Erro ao criar CandlestickSeries:', error);
}

