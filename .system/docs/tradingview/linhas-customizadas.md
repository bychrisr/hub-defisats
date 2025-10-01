# Guia de Linhas Customizadas (Lightweight)

Documenta as linhas horizontais que renderizamos no gráfico Lightweight. Hoje: linhas de liquidação. Futuro: stop, alvo, entrada, marcações de PnL, etc.

## Sumário
- Objetivo
- API de entrada
- Renderização
- Estilo e rótulos
- Boas práticas
- Roadmap

## Objetivo
Exibir, por posição, uma linha de referência no preço de liquidação para facilitar a visualização de risco.

## API de entrada
Componente `LightweightLiquidationChart` aceita:

```ts
liquidationLines?: Array<{ price: number; label?: string; color?: string }>
```

- price: preço numérico (obrigatório)
- label: rótulo exibido no eixo direito (opcional)
- color: cor da linha (opcional, padrão vermelho)

Integração típica no `Dashboard.tsx`:
```tsx
const liquidationLines = positions.map((p, i) => ({
  price: Math.round(p.liquidation_price),
  label: `${p.symbol} #${i+1}`,
}));

<LightweightLiquidationChart
  symbol="BINANCE:BTCUSDT"
  timeframe="1h"
  candleData={candleData}
  liquidationLines={liquidationLines}
/>
```

## Renderização
Para cada item, criamos uma `priceLine` na série ativa (candles, ou linha transparente de ancoragem quando não há dados):
- estilo sólido
- largura 2px
- axisLabelVisible: true
- title: label

O gráfico executa `timeScale().fitContent()` no carregamento e tenta ajustar o range de preços para abranger todas as linhas.

## Estilo e rótulos
- Cor padrão `#ff4444`.
- Título no eixo: `Liquidação #N` ou `label` informado.
- Mantemos fundo transparente e tema herdado do app.

## Boas práticas
- Não envie preços zero/NaN; filtramos valores inválidos.
- Para muitas linhas próximas, considere variar a cor ou título para diferenciação.
- Garanta candles reais quando possível para contexto visual.

## Roadmap
- Linhas de entrada, stop e alvo.
- Agrupamento/colapso de linhas por ativo.
- Tooltip com metadados (margem, tamanho, PnL estimado).
