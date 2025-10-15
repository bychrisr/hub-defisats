# Liquid Glass Design System - Dashboard

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 1.0.0  
> **Responsável**: Sistema de Design Axisor

## Visão Geral

O Liquid Glass Design System é um sistema de design moderno inspirado no iOS 26 Glass Liquid, implementado para criar uma experiência visual fluida e dinâmica na dashboard do Axisor. O sistema combina glassmorphism, animações suaves e layouts responsivos para uma interface premium.

## Características Principais

### 🎨 Estética Visual
- **Glassmorphism**: Efeitos de vidro translúcido com `backdrop-filter`
- **Gradientes Dinâmicos**: Cores que mudam baseadas no estado dos dados
- **Animações Fluidas**: Transições suaves com Framer Motion
- **Responsividade**: Layout adaptativo para todos os dispositivos

### 🧩 Componentes Base

#### LiquidGlassCard
Componente base para todos os cards do sistema liquid glass.

```typescript
interface LiquidGlassCardProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'success' | 'danger' | 'neutral' | 'warning';
  children: React.ReactNode;
  className?: string;
  tooltipContent?: string;
}
```

**Características:**
- Efeito de vidro translúcido
- Bordas com gradiente dinâmico
- Animações de hover e interação
- Tooltip integrado opcional

#### LiquidGlassTooltip
Sistema de tooltips com efeito liquid glass.

```typescript
interface LiquidGlassTooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}
```

### 📊 Componentes de Dashboard

#### PnLChartCard
Card principal para exibir Profit & Loss com gráfico integrado.

```typescript
interface PnLChartCardProps {
  pnlValue: number;
  percentageChange?: number;
  subtitle?: string;
  className?: string;
  showChart?: boolean;
  showFilters?: boolean;
  initialPeriod?: TimeFilterPeriod;
}
```

**Funcionalidades:**
- Gráfico de linha animado
- Filtros temporais (24H, 7D, 30D, 90D, ALL)
- Validação de dados para prevenir erros NaN
- Cores dinâmicas baseadas no valor (positivo/negativo)

#### MetricMiniCard
Cards pequenos para métricas específicas.

```typescript
interface MetricMiniCardProps {
  title: string;
  value: number | string;
  formatAsSats?: boolean;
  showSatsIcon?: boolean;
  variant?: 'success' | 'danger' | 'neutral' | 'warning';
  tooltip?: string;
  size?: 'small' | 'medium';
}
```

**Variantes Especiais:**
- `ActiveTradesMiniCard`: Para trades ativos
- `BalanceMiniCard`: Para saldo e balance
- `MarginMiniCard`: Para margem total

### 🎛️ Componentes de Controle

#### TimeFilter
Filtros temporais para dados históricos.

```typescript
interface TimeFilterProps {
  selectedPeriod: TimeFilterPeriod;
  onPeriodChange: (period: TimeFilterPeriod) => void;
  className?: string;
}

type TimeFilterPeriod = '24H' | '7D' | '30D' | '90D' | 'ALL';
```

### 🎭 Sistema de Animações

#### useLiquidGlassAnimation
Hook para gerenciar animações liquid glass.

```typescript
interface UseLiquidGlassAnimationProps {
  variant?: 'success' | 'danger' | 'neutral' | 'warning';
  value?: number;
  isPositive?: boolean;
  isNegative?: boolean;
  isNeutral?: boolean;
  intensity?: number;
  breathing?: boolean;
}

interface UseLiquidGlassAnimationReturn {
  isHovered: boolean;
  isNearby: boolean;
  intensity: number;
  shouldBreathe: boolean;
  animationClass: string;
  dynamicStyle: React.CSSProperties;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseMove: (event: React.MouseEvent) => void;
  setNearby: (nearby: boolean) => void;
  getGlowIntensity: () => number;
  shouldAnimate: boolean;
  getVariantIntensity: () => string;
}
```

## Layout System

### Mosaic Grid Layout
Layout responsivo em mosaico para cards de diferentes tamanhos.

```css
.mosaic-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
  grid-auto-rows: 140px;
}

/* Card principal - PnL Chart */
.pnl-chart-card {
  grid-column: span 12 / span 12;
  grid-row: span 2 / span 2;
}

@media (min-width: 768px) {
  .pnl-chart-card {
    grid-column: span 6 / span 6;
  }
}

@media (min-width: 1024px) {
  .pnl-chart-card {
    grid-column: span 5 / span 5;
  }
}

/* Mini cards grid */
.mini-cards-grid {
  grid-column: span 12 / span 12;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .mini-cards-grid {
    grid-column: span 6 / span 6;
  }
}

@media (min-width: 1024px) {
  .mini-cards-grid {
    grid-column: span 7 / span 7;
  }
}
```

## Estilos CSS

### Classes Base
Localizadas em `frontend/src/styles/liquid-glass.css`:

```css
.liquid-glass-base {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.liquid-glass-border {
  position: relative;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1), 
    rgba(255, 255, 255, 0.05)
  );
}

.liquid-glass-gradient {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.05) 100%
  );
}

.liquid-glass-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.liquid-glass-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
```

### Variantes de Cores

```css
.liquid-glass-success {
  border-color: rgba(34, 197, 94, 0.3);
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.1), 
    rgba(22, 163, 74, 0.05)
  );
}

.liquid-glass-danger {
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(135deg, 
    rgba(239, 68, 68, 0.1), 
    rgba(220, 38, 38, 0.05)
  );
}

.liquid-glass-neutral {
  border-color: rgba(156, 163, 175, 0.3);
  background: linear-gradient(135deg, 
    rgba(156, 163, 175, 0.1), 
    rgba(107, 114, 128, 0.05)
  );
}
```

## Integração com Dados

### Validação de Dados
Todos os componentes implementam validação robusta para prevenir erros:

```typescript
// Exemplo de validação no PnLChartCard
const safePnlValue = Number.isFinite(pnlValue) ? pnlValue : 0;
const validData = data.filter(d => Number.isFinite(d.value));

if (validData.length === 0) {
  return <div>No data available</div>;
}
```

### Hooks de Dados
Integração com hooks existentes:

- `useHistoricalData`: Para dados históricos com cache por período
- `useFormatSats`: Para formatação de valores em satoshis
- `useLiquidGlassAnimation`: Para animações contextuais

## Responsividade

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Comportamento
- **Mobile**: Cards empilham verticalmente
- **Tablet**: Layout em 2 colunas
- **Desktop**: Layout em mosaico otimizado

## Performance

### Otimizações Implementadas
- **Memoização**: `useMemo` para cálculos pesados
- **Validação**: Prevenção de re-renders desnecessários
- **Lazy Loading**: Componentes carregados sob demanda
- **CSS Transforms**: Animações GPU-aceleradas

### Métricas
- **First Paint**: < 1.5s
- **Interactive**: < 2.0s
- **Smooth Animations**: 60fps

## Acessibilidade

### Recursos Implementados
- **ARIA Labels**: Para screen readers
- **Keyboard Navigation**: Suporte completo
- **Color Contrast**: Conformidade WCAG 2.1
- **Focus Indicators**: Visibilidade clara

## Troubleshooting

### Problemas Comuns

#### Erros NaN no Gráfico
```typescript
// Solução: Validar dados antes de renderizar
const safeValue = Number.isFinite(value) ? value : 0;
```

#### Animações Não Funcionam
```typescript
// Verificar se o hook está configurado corretamente
const animation = useLiquidGlassAnimation({
  variant: 'success',
  value: pnlValue,
  isPositive: pnlValue > 0
});
```

#### Layout Quebrado em Mobile
```css
/* Garantir que o grid seja responsivo */
@media (max-width: 767px) {
  .mosaic-grid {
    grid-template-columns: 1fr;
  }
}
```

## Roadmap

### Próximas Funcionalidades
- [ ] **Theme Switching**: Modo claro/escuro
- [ ] **Custom Animations**: Mais tipos de animação
- [ ] **Advanced Charts**: Gráficos mais complexos
- [ ] **Accessibility**: Melhorias de acessibilidade
- [ ] **Performance**: Otimizações adicionais

### Migração da Seção History
- [ ] Migrar cards da seção History para liquid glass
- [ ] Implementar paginação para muitos cards
- [ ] Adicionar filtros avançados

## Exemplos de Uso

### Card Básico
```tsx
<LiquidGlassCard variant="success" size="medium">
  <div className="p-4">
    <h3>Total P&L</h3>
    <p className="text-2xl font-bold">+1,234 sats</p>
  </div>
</LiquidGlassCard>
```

### Card com Gráfico
```tsx
<PnLChartCard
  pnlValue={totalPL}
  percentageChange={percentageChange}
  showChart={true}
  showFilters={true}
  initialPeriod="7D"
/>
```

### Mini Card
```tsx
<MetricMiniCard
  title="Active Trades"
  value={activeTrades}
  variant="success"
  showSatsIcon={true}
  tooltip="Trades ativos no momento"
/>
```

## Arquivos Relacionados

- `frontend/src/components/ui/LiquidGlassCard.tsx`
- `frontend/src/components/ui/LiquidGlassTooltip.tsx`
- `frontend/src/components/dashboard/PnLChartCard.tsx`
- `frontend/src/components/dashboard/MetricMiniCard.tsx`
- `frontend/src/components/dashboard/TimeFilter.tsx`
- `frontend/src/hooks/useLiquidGlassAnimation.ts`
- `frontend/src/styles/liquid-glass.css`
- `frontend/src/pages/DashboardLiquid.tsx`

## Changelog

### [1.0.0] - 2025-01-09
- Implementação inicial do Liquid Glass Design System
- Criação de componentes base (LiquidGlassCard, LiquidGlassTooltip)
- Implementação do PnLChartCard com gráfico integrado
- Sistema de animações com useLiquidGlassAnimation
- Layout mosaic responsivo
- Validação robusta de dados para prevenir erros NaN
- Integração com dashboard principal
- Documentação completa

---

**Última Atualização**: 2025-01-09  
**Versão**: 1.0.0  
**Status**: Active
