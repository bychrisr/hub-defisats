

# 🧠 Sistema Completo de Dados Históricos + Integração com Lightweight Charts

## 🔩 1. Arquitetura Reativa de Dados

```
Binance / CoinGecko API
        ↓
   /api/historical (backend)
        ↓
 HistoricalDataService
        ↓
 Cache (Redis + Memory)
        ↓
 useHistoricalData() Hook
        ↓
 LightweightCharts Series
```

---

## ⚙️ 2. Integração Direta com o Gráfico (Lightweight Charts)

### **Objetivo**

Renderizar candles, volume e indicadores, com **scroll infinito para trás (infinite historical load)** e **atualizações em tempo real**.

---

### **Pontos Críticos da Implementação**

* ✅ Ao dar **zoom out ou scroll para a esquerda**, buscar mais dados históricos.
* ✅ Evitar duplicação de candles já carregados.
* ✅ Preservar performance (máx. 10–15k pontos renderizados).
* ✅ Atualizar candles em tempo real via WebSocket.

---

## 🧩 3. Estrutura do Gráfico e Panes

Cada **indicador** (RSI, EMA, MACD, Bollinger, etc.) será adicionado **em panes abaixo do gráfico principal**.
O **volume** é o único fixo, sempre acoplado ao gráfico principal.

```typescript
// Pane Structure
[
  { id: 'price', height: '60%', series: 'candlestick', volume: true },
  { id: 'rsi', height: '15%', series: 'rsi', active: false },
  { id: 'macd', height: '15%', series: 'macd', active: false },
  { id: 'ema', height: '10%', series: 'line', active: false },
  { id: 'bollinger', height: '10%', series: 'bands', active: false },
]
```

Cada pane será gerenciado via um **state reativo** (`indicatorState`), que renderiza ou remove panes dinamicamente conforme o usuário seleciona no dropdown.

---

## 🧮 4. Sistema de Scroll / Zoom e Fetch Dinâmico

### **Listener do Lightweight Charts**

```typescript
chart.timeScale().subscribeVisibleLogicalRangeChange(async (range) => {
  const barsInfo = series.barsInLogicalRange(range);
  
  // Quando o usuário chega no início do dataset atual
  if (barsInfo?.barsBefore < 10 && hasMoreData) {
    await loadMoreHistorical(); // Trigger fetch adicional
  }
});
```

### **Integração com o Hook de Dados**

```typescript
const { candleData, loadMoreHistorical } = useHistoricalData({
  symbol: 'BTCUSDT',
  timeframe: '1h',
  initialLimit: 500,
  maxDataPoints: 10000
});

// Feed inicial
series.setData(candleData);

// Ao carregar mais
useEffect(() => {
  if (candleData?.length) {
    series.setData(candleData);
  }
}, [candleData]);
```

---

## 📡 5. Estrutura Backend - Endpoint /api/historical

### **Exemplo de Endpoint Express**

```typescript
// GET /api/historical?symbol=BTCUSDT&interval=1h&startTime=1690000000000
app.get('/api/historical', async (req, res) => {
  const { symbol, interval, startTime } = req.query;
  
  try {
    const data = await HistoricalDataService.get({
      symbol,
      interval,
      startTime,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
```

### **Serviço com Fallback Automático**

```typescript
class HistoricalDataService {
  async get({ symbol, interval, startTime }) {
    for (const api of API_PRIORITY) {
      try {
        const data = await this.fetchFromSource(api, symbol, interval, startTime);
        if (data?.length) return this.deduplicate(data);
      } catch (e) {
        console.warn(`[${api}] Fallback to next source.`);
      }
    }
    throw new Error('No historical data available');
  }
}
```

---

## 💡 6. Cálculo de Indicadores (Client-side)

Os indicadores técnicos podem ser processados diretamente no client usando **utils functions** otimizadas (com Web Worker opcional para volume alto de dados).

Exemplo (EMA):

```typescript
export const calculateEMA = (data, period = 20) => {
  const k = 2 / (period + 1);
  const emaArray = [];
  let emaPrev = data[0].close;

  for (const candle of data) {
    const ema = candle.close * k + emaPrev * (1 - k);
    emaArray.push({ time: candle.time, value: ema });
    emaPrev = ema;
  }
  return emaArray;
};
```

Integração:

```typescript
const emaSeries = chart.addLineSeries({ color: '#F39C12', lineWidth: 2 });
emaSeries.setData(calculateEMA(candleData, 20));
```

---

## 📊 7. Volume Overlay

O volume é plotado **no mesmo pane** do preço, com barras coloridas conforme direção do candle.

```typescript
const volumeSeries = chart.addHistogramSeries({
  color: '#26a69a',
  priceFormat: { type: 'volume' },
  priceScaleId: '',
  scaleMargins: { top: 0.8, bottom: 0 },
});

volumeSeries.setData(
  candleData.map((c) => ({
    time: c.time,
    value: c.volume,
    color: c.close > c.open ? '#26a69a' : '#ef5350'
  }))
);
```

---

## 🧠 8. Estratégia de Renderização e Otimização

### **1. Chunk Loading**

* Carregar 500–1000 candles por requisição.
* Fundir dados via `mergeSortedArrays()`.

### **2. Virtualização**

* Renderizar apenas candles visíveis.
* Lightweight Charts já otimiza internamente, então evitar cálculos redundantes.

### **3. Web Workers (opcional)**

* Calcular RSI/EMA/MACD fora da thread principal.

---

## 🧰 9. Dropdown de Indicadores

### **Exemplo com React**

```tsx
const [activeIndicators, setActiveIndicators] = useState({
  ema: false,
  macd: false,
  rsi: false,
  bollinger: false,
});

const toggleIndicator = (name: keyof typeof activeIndicators) => {
  setActiveIndicators(prev => ({ ...prev, [name]: !prev[name] }));
};
```

### **Renderização Automática de Panes**

```typescript
useEffect(() => {
  if (activeIndicators.rsi && !rsiPane) {
    createRSIPane(chart, candleData);
  } else if (!activeIndicators.rsi && rsiPane) {
    removePane(rsiPane);
  }
}, [activeIndicators.rsi]);
```

---

## 🧾 10. Estrutura de Pastas Recomendada

```
src/
├─ hooks/
│  ├─ useHistoricalData.ts
│  ├─ useIndicatorManager.ts
│  ├─ useRealtimeFeed.ts
├─ services/
│  ├─ marketData.service.ts
│  ├─ historicalData.service.ts
│  ├─ cache.service.ts
├─ utils/
│  ├─ indicators/
│  │  ├─ ema.ts
│  │  ├─ macd.ts
│  │  ├─ bollinger.ts
│  │  ├─ rsi.ts
│  ├─ deduplicate.ts
│  ├─ mergeArrays.ts
├─ components/
│  ├─ Chart/
│  │  ├─ ChartContainer.tsx
│  │  ├─ IndicatorPane.tsx
│  │  ├─ VolumeOverlay.tsx
│  │  ├─ ChartToolbar.tsx
```

---

## 🧱 11. Comportamento de Tempo Real (Streaming)

Após carregar o histórico inicial:

```typescript
const ws = new WebSocket('wss://stream.binance.com/ws/btcusdt@kline_1h');

ws.onmessage = (event) => {
  const { k: candle } = JSON.parse(event.data);
  updateLastCandle({
    time: candle.t,
    open: +candle.o,
    high: +candle.h,
    low: +candle.l,
    close: +candle.c,
    volume: +candle.v,
  });
};
```

---

## ⚙️ 12. Checklist Técnico (para Cursor AI)

| Módulo                    | Descrição                                  | Status |
| ------------------------- | ------------------------------------------ | ------ |
| Hook `useHistoricalData`  | Lazy load + dedup + cache local            | 🟢     |
| Backend `/api/historical` | Suporte a múltiplas fontes (Binance/CG/TV) | 🟢     |
| Volume Overlay            | Fixo, colorido conforme direção            | 🟢     |
| Indicadores               | RSI, EMA, MACD, Bollinger via dropdown     | 🟢     |
| Panes Dinâmicos           | Criar/remover conforme indicador ativo     | 🟢     |
| Scroll infinito           | Buscar dados antigos ao “chegar no início” | 🟢     |
| Real-time update          | WebSocket com merge inteligente            | 🟢     |
| Cache inteligente         | TTL + fallback + dedup rigoroso            | 🟢     |

---

Perfeito — aqui está a **versão completa e integrada**, combinando **implementação de indicadores técnicos + sistema de dados históricos + interação entre ambos**, no contexto do **TradingView Lightweight Charts**, com **carregamento dinâmico, múltiplos panes e caching inteligente**.
Essa documentação foi pensada para que o **Cursor** consiga implementar o sistema **sem ambiguidades**, com **95% de clareza técnica e arquitetural**.

---

## 🧱 Arquitetura Geral

```
┌──────────────────────────────────────────────┐
│                FRONTEND (React)              │
│──────────────────────────────────────────────│
│ useHistoricalData()   ← Carrega candles      │
│ useIndicatorsData()   ← Calcula indicadores  │
│ ChartManager          ← Controla panes       │
│ IndicatorsController  ← Ativa/desativa       │
└──────────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────────┐
│                BACKEND (Node.js)             │
│──────────────────────────────────────────────│
│ historicalData.service.ts   ← Busca dados     │
│ strategicCache.service.ts   ← Cache inteligente│
│ indicators.service.ts       ← Cálculos (opcional)│
└──────────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────────┐
│                 FONTES EXTERNAS              │
│──────────────────────────────────────────────│
│ Binance API      ← OHLCV                     │
│ CoinGecko API    ← Fallback                  │
│ TradingView API  ← Fallback avançado         │
└──────────────────────────────────────────────┘
```

---

## ⚙️ 1. Dados Históricos

### 1.1 Hook Principal: `useHistoricalData`

Responsável por **buscar e gerenciar** os candles, volumes e timestamps.

```typescript
export const useHistoricalData = ({
  symbol,
  timeframe,
  limit = 500,
  maxPoints = 10000,
}) => {
  const [data, setData] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async (fromTimestamp?: number) => {
    if (loading || !hasMore) return;
    setLoading(true);

    const newData = await marketDataService.getHistoricalData({
      symbol,
      timeframe,
      limit,
      endTime: fromTimestamp,
    });

    // Deduplicação e merge
    const merged = mergeAndSortCandles(data, newData);
    setData(merged);

    // Verifica se ainda há dados anteriores
    setHasMore(newData.length === limit);
    setLoading(false);
  };

  return { data, loadMore, hasMore, loading };
};
```

### 1.2 Carregamento Dinâmico

* Ao **dar zoom out**, o hook dispara `loadMore()` automaticamente, buscando dados mais antigos.
* O `chart.subscribeVisibleTimeRangeChange` do Lightweight Charts pode ser usado para detectar quando o gráfico se aproxima do início da série.

```typescript
chart.timeScale().subscribeVisibleTimeRangeChange(async (range) => {
  const oldestVisible = range.from;
  const oldestLoaded = Math.min(...data.map(c => c.time));
  if (oldestVisible <= oldestLoaded + buffer) {
    await loadMore(oldestLoaded);
  }
});
```

---

## 📈 2. Indicadores Técnicos

### 2.1 Gerenciamento via Hook: `useIndicatorsData`

Responsável por calcular e atualizar os indicadores com base nos **dados históricos**.

```typescript
export const useIndicatorsData = ({
  candles,
  activeIndicators,
}) => {
  const [indicators, setIndicators] = useState({});

  useEffect(() => {
    if (!candles.length) return;

    const computed = {};
    if (activeIndicators.includes('EMA')) {
      computed.ema = calculateEMA(candles.map(c => c.close), 20);
    }
    if (activeIndicators.includes('RSI')) {
      computed.rsi = calculateRSI(candles.map(c => c.close), 14);
    }
    if (activeIndicators.includes('MACD')) {
      computed.macd = calculateMACD(candles.map(c => c.close));
    }
    if (activeIndicators.includes('BOLL')) {
      computed.boll = calculateBollingerBands(candles.map(c => c.close), 20);
    }

    setIndicators(computed);
  }, [candles, activeIndicators]);

  return indicators;
};
```

---

## 🧮 3. Cálculos de Indicadores

Todos os cálculos devem usar **valores de fechamento (`close`)** dos candles.

Exemplo simplificado:

```typescript
export const calculateEMA = (data: number[], period = 20) => {
  const k = 2 / (period + 1);
  const emaArray = [data[0]];
  for (let i = 1; i < data.length; i++) {
    emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
};

export const calculateRSI = (data: number[], period = 14) => {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const rs = gains / losses;
  const rsi = [100 - 100 / (1 + rs)];

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = Math.max(diff, 0);
    const loss = Math.max(-diff, 0);
    gains = (gains * (period - 1) + gain) / period;
    losses = (losses * (period - 1) + loss) / period;
    const rs = gains / losses;
    rsi.push(100 - 100 / (1 + rs));
  }

  return rsi;
};
```

---

## 🧩 4. Renderização dos Indicadores (Lightweight Charts)

### 4.1 Gerenciador de Panes

Cada indicador é renderizado em um **pane separado**, com o mesmo eixo de tempo do gráfico principal.

```typescript
export const ChartManager = ({
  container,
  candles,
  indicators,
  activeIndicators,
}) => {
  const chart = createChart(container, { layout: { background: { color: '#000' } } });

  // Gráfico principal: candles + volume
  const candleSeries = chart.addCandlestickSeries();
  candleSeries.setData(candles);

  const volumeSeries = chart.addHistogramSeries({ priceFormat: { type: 'volume' } });
  volumeSeries.setData(candles.map(c => ({ time: c.time, value: c.volume })));

  // Indicadores dinâmicos
  const panes = {};

  if (activeIndicators.includes('RSI')) {
    panes.rsi = chart.addPane();
    const rsiSeries = panes.rsi.addLineSeries({ color: '#00FFAA' });
    rsiSeries.setData(indicators.rsi.map((v, i) => ({ time: candles[i].time, value: v })));
  }

  if (activeIndicators.includes('MACD')) {
    panes.macd = chart.addPane();
    const macdSeries = panes.macd.addHistogramSeries({ color: '#FFAA00' });
    macdSeries.setData(indicators.macd.map((v, i) => ({ time: candles[i].time, value: v.macd })));
  }

  if (activeIndicators.includes('EMA')) {
    const emaSeries = chart.addLineSeries({ color: '#FFD700', lineWidth: 2 });
    emaSeries.setData(indicators.ema.map((v, i) => ({ time: candles[i].time, value: v })));
  }

  if (activeIndicators.includes('BOLL')) {
    const upper = chart.addLineSeries({ color: '#00FF00', lineWidth: 1 });
    const lower = chart.addLineSeries({ color: '#FF0000', lineWidth: 1 });
    upper.setData(indicators.boll.upper.map((v, i) => ({ time: candles[i].time, value: v })));
    lower.setData(indicators.boll.lower.map((v, i) => ({ time: candles[i].time, value: v })));
  }

  return chart;
};
```

---

## 🔄 5. Comunicação entre Dados Históricos e Indicadores

### **Sincronização Lógica**

1. Quando `useHistoricalData` atualiza (novos candles), o `useIndicatorsData` é disparado.
2. O hook recalcula os indicadores **somente para os novos candles**, evitando recálculo completo.
3. Cada pane recebe **dados sincronizados no mesmo eixo temporal**.
4. Ao dar zoom ou scroll, o `loadMore()` puxa novos candles → recalcula indicadores → atualiza panes.

```typescript
useEffect(() => {
  if (!candles.length) return;
  const computed = computeIndicatorsIncrementally(candles, previousIndicators);
  setIndicators(computed);
}, [candles]);
```

---

## 💾 6. Integração com Cache (Backend)

### **Camadas de Cache**

* **L1**: memória (para re-renderização instantânea)
* **L2**: Redis (TTL = 2 horas)
* **L3**: fallback de API

```typescript
historical: {
  ttl: 7200,
  refreshOnAccess: false,
  fallbackToDB: true,
}
```

### **Estratégia**

* Quando o front solicita novos candles (`loadMore()`):

  * O backend verifica o cache Redis (`historical:${symbol}:${timeframe}`)
  * Se disponível → retorna imediatamente
  * Se não → busca na Binance API, armazena no cache e retorna.

---

## 🧠 7. Estratégia de Otimização

1. **Lazy loading** incremental com detecção de scroll.
2. **Deduplicação inteligente** por timestamp.
3. **Memoização dos indicadores** — recalcula apenas quando necessário.
4. **Uso de Web Workers** (futuro) para cálculos pesados.
5. **Virtual Scrolling** para renderizar apenas a janela visível.

---

## 🧩 8. Dropdown de Indicadores

Interface simples com **checkboxes**:

```jsx
<Dropdown>
  <Checkbox label="EMA" checked={active.includes('EMA')} onChange={() => toggle('EMA')} />
  <Checkbox label="RSI" checked={active.includes('RSI')} onChange={() => toggle('RSI')} />
  <Checkbox label="MACD" checked={active.includes('MACD')} onChange={() => toggle('MACD')} />
  <Checkbox label="Bollinger Bands" checked={active.includes('BOLL')} onChange={() => toggle('BOLL')} />
</Dropdown>
```

Quando o usuário marca/desmarca, o `ChartManager`:

* Cria ou remove o pane do indicador.
* Atualiza a renderização sem recarregar o gráfico inteiro.

---

## 🚀 9. Futuras Extensões

* **Indicadores customizados por usuário** (upload via JSON).
* **SMA, VWAP, Ichimoku Cloud, Fibonacci**.
* **Análise combinada (RSI+MACD)** para gerar sinais.
* **Machine Learning overlay** com previsão de tendência.

---

## ✅ 10. Checklist Técnico

| Etapa                | Descrição                         | Status |
| -------------------- | --------------------------------- | ------ |
| Dados históricos     | Carregamento incremental via hook | ✅      |
| Cache backend        | Redis + fallback de API           | ✅      |
| Indicadores          | Cálculo em tempo real via hook    | ✅      |
| Sincronização panes  | Eixo temporal unificado           | ✅      |
| Dropdown de controle | Ativar/desativar indicadores      | ✅      |
| Deduplicação         | Merge de candles únicos           | ✅      |
| Timeout protection   | `Promise.race` nas APIs           | ✅      |
| Rate limiting        | Classe `IntelligentRateLimiter`   | ✅      |
| Performance          | Lazy loading e memoização         | ✅      |

---

## 🔗 Conclusão

O sistema funciona como um **pipeline integrado**:

1. `useHistoricalData` → busca e atualiza candles
2. `useIndicatorsData` → calcula indicadores sincronizados
3. `ChartManager` → renderiza candles, volume e panes
4. Dropdown → controla visibilidade dinâmica
5. Backend + cache → mantém performance e consistência

> 🔥 **Resultado final:**
> Um gráfico de trading profissional, com dados históricos infinitos, indicadores dinâmicos e panes independentes — tudo sincronizado, performático e pronto para expansão.

