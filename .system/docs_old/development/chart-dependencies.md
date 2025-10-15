# Instalação da Dependência do Gráfico BTC

## Dependência Necessária

Para o gráfico de candlesticks do BTC funcionar, é necessário instalar a biblioteca `lightweight-charts`:

```bash
cd frontend
npm install lightweight-charts
```

## Sobre a Biblioteca

A [Lightweight Charts](https://tradingview.github.io/lightweight-charts/docs) é uma biblioteca oficial da TradingView para criar gráficos financeiros interativos.

### Características:
- **Performance**: Otimizada para renderização rápida
- **Tipos de Gráfico**: Candlesticks, linha, área, barras, histograma
- **Interatividade**: Zoom, pan, crosshair, tooltips
- **Tema**: Suporte a temas claro/escuro
- **Responsivo**: Adapta-se ao tamanho do container

### Funcionalidades Implementadas:
- ✅ Gráfico de candlesticks do BTCUSD
- ✅ Timeframe de 1 hora
- ✅ Tema escuro (compatível com o design)
- ✅ Dados OHLC (Open, High, Low, Close)
- ✅ Cores: Verde para alta, vermelho para baixa
- ✅ Interface similar à LN Markets
- ✅ Informações de preço em tempo real
- ✅ Botões de timeframe (5y, 1y, 6m, 3m, 1m, 5d, 1d)
- ✅ Volume e timestamp

## Próximos Passos

1. **Instalar a dependência**:
   ```bash
   cd frontend
   npm install lightweight-charts
   ```

2. **Integrar com API real**:
   - Substituir dados de exemplo por dados reais da LN Markets
   - Implementar atualizações em tempo real
   - Adicionar mais timeframes

3. **Melhorias futuras**:
   - Indicadores técnicos (MA, RSI, MACD)
   - Ferramentas de desenho
   - Zoom e pan otimizados
   - Dados históricos mais extensos

## Estrutura do Componente

O componente `BTCChart` está localizado em:
```
frontend/src/components/charts/BTCChart.tsx
```

### Props:
- `className?: string` - Classes CSS adicionais
- `height?: number` - Altura do gráfico (padrão: 400px)

### Uso:
```tsx
import BTCChart from '@/components/charts/BTCChart';

<BTCChart height={500} />
```
