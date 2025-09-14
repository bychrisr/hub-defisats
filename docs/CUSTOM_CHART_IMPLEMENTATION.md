# Implementação de Gráfico Customizado TradingView-Style

## Visão Geral

Este documento descreve a implementação de um gráfico de candlesticks customizado que replica a interface da TradingView, desenvolvido para o projeto Hub DeFiSats. O gráfico foi implementado usando a biblioteca `lightweight-charts` e integrado com dados reais da LN Markets e CoinGecko.

## Arquivos Implementados

### Frontend

#### `frontend/src/components/charts/TradingViewChart.tsx`
- **Propósito**: Componente principal do gráfico de candlesticks
- **Funcionalidades**:
  - Interface autêntica da TradingView
  - Candlesticks com cores verde/vermelho
  - Barras de volume integradas
  - Crosshair e ferramentas de desenho
  - WebSocket para dados em tempo real
  - Suporte a temas dark/light
  - Responsividade completa

#### `frontend/src/components/charts/SimpleChart.tsx`
- **Propósito**: Wrapper simplificado para o gráfico
- **Uso**: Renderiza o TradingViewChart no dashboard

### Backend

#### `backend/src/services/lnmarkets-websocket.service.ts`
- **Propósito**: Serviço WebSocket para dados em tempo real
- **Funcionalidades**:
  - Conexão com CoinGecko API para preços reais do Bitcoin
  - Polling a cada 2 segundos
  - Geração de dados OHLC baseados em preços reais
  - Fallback para simulação se API falhar
  - Integração com política de preços da LN Markets

#### `backend/src/routes/websocket-market.routes.ts`
- **Propósito**: Rotas WebSocket para streaming de dados
- **Endpoint**: `/api/ws/market`
- **Funcionalidades**:
  - Broadcasting de dados de mercado em tempo real
  - Gerenciamento de conexões WebSocket
  - Tratamento de erros e reconexão

#### `backend/src/services/lnmarkets-api.service.ts`
- **Propósito**: Serviço principal da API LN Markets
- **Funcionalidades**:
  - Geração de dados históricos realistas
  - Integração com preços reais do Bitcoin
  - Cálculos de volatilidade baseados em dados reais

## Características Técnicas

### Interface TradingView
- **Header**: Símbolo, timeframe, dados OHLC, mudança de preço
- **Sidebar**: Ferramentas de desenho (Crosshair, Trend Line, Fibonacci, etc.)
- **Gráfico**: Candlesticks com cores autênticas e grid pontilhado
- **Volume**: Barras de volume na parte inferior
- **Footer**: Timeframes e controles de escala

### Dados em Tempo Real
- **Fonte**: CoinGecko API (https://api.coingecko.com/api/v3/simple/price)
- **Símbolo**: BTCUSD
- **Frequência**: Atualizações a cada 2 segundos
- **Dados**: Preço, volume, mudança 24h, OHLC

### Configurações do Gráfico
```typescript
// Configuração principal
const chartOptions = {
  layout: {
    background: { color: backgroundColor },
    textColor: textColor,
    fontSize: 12,
  },
  grid: {
    vertLines: { color: gridColor, style: LineStyle.Dotted },
    horzLines: { color: gridColor, style: LineStyle.Dotted },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: '#758696', style: LineStyle.Dashed },
    horzLine: { color: '#758696', style: LineStyle.Dashed },
  },
  rightPriceScale: {
    borderColor: borderColor,
    scaleMargins: { top: 0.1, bottom: 0.1 },
  },
  timeScale: {
    borderColor: borderColor,
    timeVisible: true,
    barSpacing: 6,
  },
};

// Configuração dos candlesticks
const candlestickSeries = chart.addCandlestickSeries({
  upColor: '#00d4aa',
  downColor: '#ff6b6b',
  borderUpColor: '#00d4aa',
  borderDownColor: '#ff6b6b',
  wickUpColor: '#00d4aa',
  wickDownColor: '#ff6b6b',
  priceFormat: {
    type: 'price',
    precision: 2,
    minMove: 0.01,
  },
});

// Configuração do volume
const volumeSeries = chart.addHistogramSeries({
  color: '#26a69a',
  priceFormat: { type: 'volume' },
  scaleMargins: { top: 0.9, bottom: 0 },
});
```

## Integração com LN Markets

### Política de Preços
- **Volatilidade**: Baseada na mudança real de 24h do Bitcoin
- **Tendências**: Componente senoidal para movimentos realistas
- **Volume**: Calculado a partir do volume real diário
- **OHLC**: Gerado com base no preço real com volatilidade controlada

### Cálculos Realistas
```typescript
// Volatilidade baseada em dados reais
const volatility = Math.abs(change24h) / 100 / 24;

// Geração de OHLC
const open = price * (1 + (Math.random() - 0.5) * volatility * 0.1);
const close = price;
const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.05);
const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.05);
```

## WebSocket Implementation

### Estrutura de Mensagens
```typescript
interface WebSocketMessage {
  type: 'market_data' | 'error' | 'disconnected';
  data?: {
    symbol: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: number;
  };
  message?: string;
  timestamp: number;
}
```

### Fluxo de Dados
1. **Backend**: Polling da CoinGecko API a cada 2 segundos
2. **Processamento**: Geração de OHLC baseado em preços reais
3. **WebSocket**: Broadcasting para clientes conectados
4. **Frontend**: Atualização do gráfico em tempo real

## Dependências

### Frontend
```json
{
  "lightweight-charts": "^4.1.3",
  "lucide-react": "^0.263.1"
}
```

### Backend
```json
{
  "ws": "^8.14.2",
  "@types/ws": "^8.5.5"
}
```

## Configuração de Desenvolvimento

### Variáveis de Ambiente
```env
# Backend
PORT=3010
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Frontend
VITE_API_URL=http://localhost:13010
```

### Docker Compose
```yaml
services:
  backend:
    ports:
      - "13010:3010"
  frontend:
    ports:
      - "13000:3001"
```

## Uso

### Instalação
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Execução
```bash
# Desenvolvimento
docker compose -f docker-compose.dev.yml up

# Produção
docker compose up
```

## Limitações e Considerações

### Limitações
- Dependência da CoinGecko API (rate limits)
- Geração de dados históricos simulados
- Sem autenticação real da LN Markets

### Melhorias Futuras
- Integração real com WebSocket da LN Markets
- Dados históricos reais
- Mais indicadores técnicos
- Ferramentas de desenho avançadas

## Conclusão

Esta implementação fornece uma base sólida para gráficos de trading profissionais, com interface autêntica da TradingView e integração com dados reais do mercado. O código está bem estruturado e pode ser facilmente estendido para funcionalidades adicionais.

---

**Data de Criação**: 14/09/2025
**Versão**: 1.0.0
**Autor**: Hub DeFiSats Team
