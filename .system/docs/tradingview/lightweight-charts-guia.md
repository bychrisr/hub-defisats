# Guia do Plugin Lightweight Charts (Frontend)

Este guia documenta como usamos o Lightweight Charts na plataforma: instalação, integração, opções de customização, endpoints remotos e boas práticas.

## Sumário
- Visão geral
- Instalação e dependências
- Integração rápida
- Propriedades e opções suportadas
- Endpoints de configuração (backend)
- Serviço de controle (frontend)
- Theming e transparência
- Performance (memoização, lazy e resize)
- Troubleshooting comum
- Roadmap

## Visão geral
Usamos o Lightweight Charts para renderizar gráficos leves, altamente customizáveis e responsivos. Escolhemos esta lib para contornar limitações do widget avançado do TradingView ao desenhar elementos customizados (linhas de liquidação, etc.).

Referência da API: https://tradingview.github.io/lightweight-charts/docs/api

## Instalação e dependências
```
npm i lightweight-charts
```

O componente principal fica em `frontend/src/components/charts/LightweightLiquidationChart.tsx`.

## Integração rápida
Exemplo mínimo de uso no Dashboard:
```tsx
<LightweightLiquidationChart
  symbol="BINANCE:BTCUSDT"
  timeframe="1h"
  height={220}
  candleData={candleData}
  liquidationLines={[{ price: 105091, label: 'Pos #1' }]}
  showToolbar
/>
```

Dados de candles aceitam `{ time: number(UTC s), open, high, low, close }`.

## Propriedades e opções suportadas
- symbol: string (ex.: `BINANCE:BTCUSDT`)
- timeframe: string (ex.: `1m`, `15m`, `1h`, `4h`, `1d`)
- height: number (px)
- showToolbar: boolean (exibe “símbolo • timeframe” no header do card)
- candleData: CandlestickPoint[] (série principal)
- linePriceData: LinePoint[] (fallback caso não existam candles)
- liquidationLines: `{ price, label?, color? }[]` (renderiza múltiplas priceLines)
- liquidationPrice: number (modo 1 linha – compatibilidade)

Opções internas do chart:
- layout transparente e tema dinâmico (contexto de tema da aplicação)
- grid em baixo contraste
- timeScale: `timeVisible: true`, `secondsVisible: false` e `tickMarkFormatter` intraday (HH:mm, e dd/MM na virada do dia)

## Endpoints de configuração (backend)
Arquivo: `backend/src/routes/market-data.routes.ts`

- GET `/api/lightweight/config`
- PUT `/api/lightweight/config` { symbol?, timeframe?, theme?, options? }

Estrutura:
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "theme": "dark",
  "options": {}
}
```

## Serviço de controle (frontend)
Arquivo: `frontend/src/services/chartControl.service.ts`

```ts
chartControlService.getConfig();
chartControlService.updateConfig({ timeframe: '4h' });
```

Integração típica: ao trocar timeframe pela UI, fazer PUT e re-renderizar o gráfico.

## Theming e transparência
- O gráfico herda o tema via `ThemeContext`.
- Background sempre `transparent` para integrar ao card.

## Performance
- Memoização de dados e props mais pesadas.
- `ResizeObserver` para recalcular `width/height` e `timeScale().fitContent()` após resize.
- Carregar candles apenas quando necessário; fallback direto para Binance se `/api/market/historical` falhar (401, etc.).

## Troubleshooting
- Eixo mostrando dias no intraday: garantimos `timeScale.timeVisible = true` e `tickMarkFormatter` custom.
- Linhas não aparecem: verifique se há ao menos uma série ancorando o eixo. Criamos uma série transparente quando não há candles.
- Histórico curto: aumentar `limit` ao buscar (até 1000 no Binance) e refazer `fitContent()`.

## Roadmap
- Toolbar com botões 1m/15m/1h/4h/1d.
- Modo multi-séries (comparação de símbolos).
- Plugins de marcações/indicadores próprios.


