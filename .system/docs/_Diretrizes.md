## Diretrizes

Você obrigatóriamente deve usar docker compose no projeto, estamos em abiente de desenvolvimento. A pasta com o docker e env é 'config'

Para login com usuário admin:
   - Email: `admin@hub-defisats.com`
   - Senha: `Admin123!@#`

Para login com usuário comum:
   - Email: `brainoschris@gmail.com`
   - Senha: `TestPassword123!`




### ✅ **O que já está implementado:**

**✅ LightweightLiquidationChart** - Componente principal funcionando
**✅ TradingView Data Service** - Distribuição de requests entre exchanges
**✅ Linhas personalizadas** - Liquidação e Take Profit
**✅ Tema adaptativo** - Dark/Light mode
**✅ Dados históricos** - `useHistoricalData` com navegação e paginação 
**✅ Múltiplos timeframes** - 1m, 5m, 15m, 30m, 1h, 4h, 1d, ...
**✅ Zoom e navegação** - Sistema básico funcionando
**✅ Toolbar** - Controles básicos implementados

#### **2. Sistema de Zoom Avançado** 🔍
- **✅ Zoom preservado** durante carregamento de dados históricos
- **✅Navegação suave** entre períodos
- **✅Marcadores de tempo** mais precisos
- **✅Crosshair** com informações detalhadas







#### **1. Indicadores Técnicos** 🔧
- **RSI** - Relative Strength Index
- **MACD** - Moving Average Convergence Divergence  
- **Bollinger Bands** - Bandas de Bollinger
- **Volume** - Indicador de volume
- **Médias móveis** - SMA, EMA



#### **3. Linhas Dinâmicas** 📈
- **Linhas de liquidação** baseadas em posições reais
- **Take Profit/Stop Loss** automáticos
- **Linhas de suporte/resistência** calculadas
- **Alertas visuais** quando preço se aproxima

#### **4. Dados em Tempo Real** ⚡
- **WebSocket** para atualizações live
- **Novos candles** em tempo real
- **Indicadores atualizados** automaticamente

#### **5. Funcionalidades Avançadas** 🎯
- **Múltiplos símbolos** (BTC, ETH, etc.)
- **Comparação de símbolos** lado a lado
- **Exportação de dados** (CSV, PNG)
- **Anotações** no gráfico
- **Padrões de velas** detectados automaticamente

### 🎯 **Próximos Passos Recomendados:**

**Prioridade 1 - Indicadores Técnicos:**
```typescript
// Implementar RSI, MACD, Bollinger Bands
const indicators = {
  rsi: { period: 14, overbought: 70, oversold: 30 },
  macd: { fast: 12, slow: 26, signal: 9 },
  bollinger: { period: 20, stdDev: 2 }
};
```

**Prioridade 2 - Dados em Tempo Real:**
```typescript
// WebSocket para candles em tempo real
const realtimeCandles = useWebSocket('/ws/candles', {
  symbol: 'BTCUSDT',
  timeframe: '1h'
});
```

**Prioridade 3 - Linhas Dinâmicas:**
```typescript
// Linhas baseadas em posições reais
const liquidationLines = usePositions().map(pos => ({
  price: pos.liquidation,
  label: `Liquidation ${pos.side}`,
  color: pos.side === 'long' ? '#ff4444' : '#22c55e'
}));
```

### 🤔 **Qual funcionalidade você gostaria de implementar primeiro?**

1. **Indicadores técnicos** (RSI, MACD, Bollinger)
2. **Dados em tempo real** via WebSocket
3. **Linhas dinâmicas** baseadas em posições
4. **Sistema de zoom** mais avançado
5. **Outra funcionalidade específica**

**Me diga qual direção você quer seguir e começamos a implementar!** 🚀









Solução para que não aceitemos cadastros realizados com a mesma credencial de API mais de 2 vezes. Usuário pode usar outro email, mas as mesmas apis. Se isso acontecer, ele vai para blacklist, salvamos o IP, nome de usuário da credencial, email e banimos ele.
Se tiver mais alguma solução quie faça sentido

precisamos criar um mecanismo de teste para as automações. estamos criando os reports, mas precisamos fazer os testes em cadeia de sequencia. não sei se teemos algo parecido com isso, veja na documentação por favor





BASE_URL = "https://tradingview.github.io/lightweight-charts/docs"
OUTPUT_FILE = "lightweight-charts-docs.md"