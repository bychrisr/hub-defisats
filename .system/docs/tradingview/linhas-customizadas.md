# Guia de Linhas Customizadas (Lightweight)

Documenta as linhas horizontais que renderizamos no gráfico Lightweight. Hoje: linhas de liquidação e Take Profit. Futuro: stop loss, entrada, marcações de PnL, etc.

## Sumário
- Objetivo
- API de entrada
- Renderização
- Estilo e rótulos
- Boas práticas
- Roadmap

## Objetivo
Exibir, por posição, linhas de referência nos preços de liquidação e Take Profit para facilitar a visualização de risco e oportunidades de lucro.

## API de entrada
Componente `LightweightLiquidationChart` aceita:

```ts
liquidationLines?: Array<{ price: number; label?: string; color?: string }>
takeProfitLines?: Array<{ price: number; label?: string; color?: string }>
```

### 🔴 **Linhas de Liquidação**
- price: preço numérico (obrigatório)
- label: rótulo exibido no eixo direito (opcional)
- color: cor da linha (opcional, padrão vermelho `#ff4444`)

### 🟢 **Linhas de Take Profit**
- price: preço numérico (obrigatório)
- label: rótulo exibido no eixo direito (opcional)
- color: cor da linha (opcional, padrão verde `#22c55e`)

Integração típica no `Dashboard.tsx`:
```tsx
// Linhas de liquidação
const liquidationLines = positions.map((p, i) => ({
  price: Math.round(p.liquidation_price),
  label: `${p.symbol} #${i+1}`,
}));

// Linhas de Take Profit
const takeProfitLines = positions
  .filter(p => p.takeprofit && p.takeprofit > 0)
  .map((p, i) => ({
    price: Math.round(p.takeprofit),
    label: `TP ${p.side === 'b' ? 'Long' : 'Short'} ${p.quantity} @ $${p.takeprofit.toLocaleString()}`,
    color: '#22c55e'
  }));

<LightweightLiquidationChart
  symbol="BINANCE:BTCUSDT"
  timeframe="1h"
  candleData={candleData}
  liquidationLines={liquidationLines}
  takeProfitLines={takeProfitLines}
/>
```

## Renderização
Para cada item, criamos uma `priceLine` na série ativa (candles, ou linha transparente de ancoragem quando não há dados):
- estilo sólido (`LineStyle.Solid`)
- largura 2px
- axisLabelVisible: true
- title: label personalizado

### 🔴 **Linhas de Liquidação**
- Cor padrão: `#ff4444` (vermelho)
- Label padrão: "Liquidação #N: $[preço]"

### 🟢 **Linhas de Take Profit**
- Cor padrão: `#22c55e` (verde)
- Label padrão: "TP [Side] [Quantity] @ $[preço]"

O gráfico executa `timeScale().fitContent()` no carregamento e tenta ajustar o range de preços para abranger todas as linhas (liquidação + Take Profit).

## Estilo e rótulos
- **Liquidação**: Cor padrão `#ff4444` (vermelho)
- **Take Profit**: Cor padrão `#22c55e` (verde)
- Título no eixo: `Liquidação #N` ou `TP [Side] [Quantity] @ $[preço]`
- Mantemos fundo transparente e tema herdado do app

## Boas práticas
- Não envie preços zero/NaN; filtramos valores inválidos.
- Para muitas linhas próximas, considere variar a cor ou título para diferenciação.
- Garanta candles reais quando possível para contexto visual.

## Roadmap
- [x] Linhas de Liquidação (vermelhas)
- [x] Linhas de Take Profit (verdes)
- [ ] Stop Loss (linhas laranja)
- [ ] Entrada (linhas azuis)
- [ ] Marcações de PnL (linhas pontilhadas)
- [ ] Suporte/Resistência (linhas cinza)
- [ ] Alertas visuais (pulsação, animação)
- [ ] Agrupamento/colapso de linhas por ativo
- Tooltip com metadados (margem, tamanho, PnL estimado).
