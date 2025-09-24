# 📊 Guia Completo dos Cards do Dashboard

## 🎯 Visão Geral

Este documento serve como guia completo para entender, manter e desenvolver os cards do dashboard. O sistema foi projetado para ser modular, reutilizável e fácil de manter.

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos
```
frontend/src/
├── pages/Dashboard.tsx              # Página principal com layout dos cards
├── components/dashboard/
│   ├── PnLCard.tsx                  # Componente base para cards de PnL
│   └── MetricCard.tsx               # Componente para métricas simples
├── contexts/
│   ├── PositionsContext.tsx         # Contexto com dados das posições
│   └── RealtimeDataContext.tsx      # Contexto com dados em tempo real
└── hooks/
    ├── useFormatSats.tsx            # Hook para formatação de valores
    └── useEstimatedBalance.ts       # Hook específico (DEPRECATED)
```

## 🎨 Sistema de Cores Dinâmicas

### Estados dos Cards
1. **Estado Neutro (Loading)**: Cinza - quando `positionsLoading = true`
2. **Estado Positivo**: Verde - quando valor > 0
3. **Estado Negativo**: Vermelho - quando valor < 0
4. **Estado Neutro Permanente**: Cinza - para cards específicos (Active Trades, Total Margin)

## 💡 Sistema de Tooltips

### Características dos Tooltips
- **Renderização**: Portal React no `document.body` para garantir visibilidade
- **Largura**: 1.5x a largura do card pai
- **Posicionamento**: Centralizado acima do card
- **Z-index**: `z-[99999]` para ficar acima de todos os elementos
- **Ícone**: HelpCircle inline com o título do card
- **Texto**: Atualmente "Lorem Ipsum" (temporário)

### Implementação
```typescript
// Estrutura do tooltip
<div className="flex items-center gap-2">
  <CardTitle className="text-h3 text-vibrant">
    Nome do Card
  </CardTitle>
  <Tooltip 
    content="Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
    position="top"
    delay={200}
    className="z-50"
  >
    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
  </Tooltip>
</div>
```

### Cards com Tooltips
- **Key Metrics**: 5 cards (Total PnL, Estimated Profit, Active Trades, Total Margin, Estimated Fees)
- **History**: 10 cards (Available Margin, Estimated Balance, Total Invested, Net Profit, Fees Paid, Success Rate, Total Profitability, Total Trades, Winning Trades, Lost Trades)

### Implementação das Cores
```typescript
// Função para determinar cor do PnL
const getPnLColor = (value: number) => {
  if (positionsLoading) return 'neutral';
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
};

// Aplicação das cores
className={`gradient-card border-2 ${
  positionsLoading ? 'gradient-card-gray border-gray-500' :
  getPnLColor(value) === 'positive' ? 'gradient-card-green border-green-500' :
  getPnLColor(value) === 'negative' ? 'gradient-card-red border-red-500' :
  'gradient-card-gray border-gray-500'
}`}
```

## 📋 Cards Implementados

### 1. Key Metrics (Métricas Principais)

#### Total PnL
- **Fonte de Dados**: `positionsData.totalPL`
- **Cores**: Dinâmicas (verde/vermelho/cinza)
- **Ícone**: TrendingUp
- **Badge**: Percentual vs Margin
- **Implementação**: Card customizado com cores dinâmicas

#### Estimated Profit
- **Fonte de Dados**: `positionsData.estimatedProfit`
- **Cores**: Dinâmicas (verde/cinza)
- **Ícone**: TrendingUp
- **Badge**: Percentual vs Margin
- **Implementação**: Card customizado com `formatSats({ size: 24, variant: 'auto' })`

#### Active Trades
- **Fonte de Dados**: `positionsData.positions.filter(pos => pos.status === 'running')`
- **Cores**: Neutro permanente (cinza) com ícone azul
- **Ícone**: Activity
- **Badges**: Long/Short counts como badges estilizados
- **Implementação**: Card customizado com filtros específicos

#### Total Margin
- **Fonte de Dados**: `positionsData.totalMargin`
- **Cores**: Neutro permanente (cinza) com ícone roxo
- **Ícone**: BarChart3
- **Implementação**: Card customizado sem badges

#### Estimated Fees
- **Fonte de Dados**: `positionsData.estimatedFees`
- **Cores**: Dinâmicas (laranja/cinza)
- **Ícone**: Clock
- **Badge**: Taxa de 0.1%
- **Implementação**: Card customizado com formatação sem decimais

### 2. History (Histórico)

#### Available Margin
- **Fonte de Dados**: `balanceData.total_balance`
- **Cores**: Dinâmicas (verde/cinza)
- **Ícone**: Wallet
- **Badge**: "Available"/"Empty"
- **Implementação**: Card customizado com cores dinâmicas

#### Estimated Balance
- **Fonte de Dados**: `estimatedBalance.data.estimated_balance`
- **Cores**: Dinâmicas (verde/vermelho/cinza)
- **Ícone**: Wallet
- **Badge**: "Positive"/"Negative"/"Neutral"
- **Implementação**: Card customizado com cores dinâmicas

#### Total Invested
- **Fonte de Dados**: `estimatedBalance.data.total_invested`
- **Cores**: Azul fixo
- **Ícone**: Target
- **Implementação**: Card customizado sem badges

#### Net Profit
- **Fonte de Dados**: `historicalMetrics.totalProfit`
- **Cores**: Dinâmicas (verde/vermelho/cinza)
- **Ícone**: TrendingUp
- **Badge**: "Profit"/"Loss"/"Neutral"
- **Implementação**: Card customizado com cores dinâmicas

#### Fees Paid
- **Fonte de Dados**: `historicalMetrics.totalFees`
- **Cores**: Laranja fixo
- **Ícone**: DollarSign
- **Implementação**: Card customizado sem badges

#### Success Rate
- **Fonte de Dados**: `historicalMetrics.successRate`
- **Cores**: Dinâmicas (verde/amarelo/vermelho)
- **Ícone**: CheckCircle
- **Badge**: "Good"/"Fair"/"Poor"
- **Implementação**: Card customizado com cores baseadas em percentual

#### Total Profitability
- **Fonte de Dados**: Cálculo de percentual (`totalProfit / totalInvested * 100`)
- **Cores**: Dinâmicas (verde/vermelho)
- **Ícone**: PieChart
- **Badge**: "Positive"/"Negative"
- **Implementação**: Card customizado com cálculo dinâmico

#### Total Trades
- **Fonte de Dados**: `historicalMetrics.totalTrades`
- **Cores**: Roxo fixo
- **Ícone**: BarChart3
- **Implementação**: Card customizado sem badges

#### Winning Trades
- **Fonte de Dados**: `historicalMetrics.winningTrades`
- **Cores**: Verde fixo
- **Ícone**: TrendingUp
- **Implementação**: Card customizado sem badges

#### Lost Trades
- **Fonte de Dados**: `historicalMetrics.lostTrades`
- **Cores**: Vermelho fixo
- **Ícone**: TrendingDown
- **Implementação**: Card customizado sem badges

## 🔧 Como Adicionar um Novo Card

### Passo 1: Definir a Fonte de Dados
```typescript
// No PositionsContext.tsx, adicionar ao usePositionsMetrics:
export const usePositionsMetrics = () => {
  const { data } = usePositions();
  return {
    // ... dados existentes
    novoValor: data.novoValor || 0, // Adicionar nova propriedade
  };
};
```

### Passo 2: Implementar o Card
```typescript
// No Dashboard.tsx, adicionar após os cards existentes:
{/* Card Novo Card */}
<div className="relative group">
  {/* Ícone posicionado fora do card */}
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
      positionsLoading ? 'bg-gray-600/20 border-gray-500/30' :
      getCorDoCard(positionsData.novoValor) === 'positive' ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
      'bg-red-600/20 border-red-500/30 group-hover:shadow-red-500/30'
    }`}>
      <NovoIcone className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
        positionsLoading ? 'text-gray-300 group-hover:text-gray-200' :
        getCorDoCard(positionsData.novoValor) === 'positive' ? 'text-green-300 group-hover:text-green-200' :
        'text-red-300 group-hover:text-red-200'
      }`} />
    </div>
  </div>
  
  <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
    positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
    getCorDoCard(positionsData.novoValor) === 'positive' ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
    'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30'
  }`}>
    <div className="card-content">
      <div className="p-6">
        {/* Título */}
        <div className="mb-4">
          <CardTitle 
            className="text-h3 text-vibrant"
            dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Novo Card') }}
          />
        </div>
        
        {/* Valor principal */}
        <div className="mb-3">
          <div className={`text-number-lg ${
            positionsLoading ? 'text-gray-200' :
            getCorDoCard(positionsData.novoValor) === 'positive' ? 'text-green-200' :
            'text-red-200'
          }`}>
            {formatSats(positionsData.novoValor || 0, { size: 24, variant: 'auto' })}
          </div>
        </div>
        
        {/* Badge e label (opcional) */}
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`text-label-sm px-2 py-1 ${
              positionsLoading ? 'border-gray-400/60 text-gray-200 bg-gray-600/20' :
              getCorDoCard(positionsData.novoValor) === 'positive' ? 'border-green-400/60 text-green-200 bg-green-600/20' :
              'border-red-400/60 text-red-200 bg-red-600/20'
            }`}
          >
            {positionsLoading ? '...' : getCorDoCard(positionsData.novoValor) === 'positive' ? 'Positive' : 'Negative'}
          </Badge>
          <span className={`text-caption ${
            positionsLoading ? 'text-gray-300/80' :
            getCorDoCard(positionsData.novoValor) === 'positive' ? 'text-green-300/80' :
            'text-red-300/80'
          }`}>label</span>
        </div>
      </div>
    </div>
    {/* Efeito de brilho */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
  </Card>
</div>
```

### Passo 3: Adicionar Função de Cor (se necessário)
```typescript
// No Dashboard.tsx, adicionar função específica:
const getCorDoCard = (value: number) => {
  if (positionsLoading) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
};
```

## 🎨 Classes CSS Importantes

### Gradientes de Fundo
- `gradient-card-gray`: Fundo cinza neutro
- `gradient-card-green`: Fundo verde para valores positivos
- `gradient-card-red`: Fundo vermelho para valores negativos

### Cores de Texto
- `text-green-200`: Texto verde para valores positivos
- `text-red-200`: Texto vermelho para valores negativos
- `text-gray-200`: Texto cinza para estado neutro

### Tamanhos de Texto
- `text-number-lg`: Tamanho grande para valores principais
- `text-h3`: Tamanho para títulos
- `text-caption`: Tamanho pequeno para labels

## 🔄 Sistema de Quebra de Títulos

### Função `breakTitleIntoTwoLines`
```typescript
const breakTitleIntoTwoLines = (title: string) => {
  const words = title.split(' ');
  if (words.length === 1) {
    const mid = Math.ceil(title.length / 2);
    return `${title.slice(0, mid)}<br>${title.slice(mid)}`;
  } else if (words.length === 2) {
    return `${words[0]}<br>${words[1]}`;
  } else {
    const mid = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, mid).join(' ');
    const secondLine = words.slice(mid).join(' ');
    return `${firstLine}<br>${secondLine}`;
  }
};
```

## 📊 Formatação de Valores

### Hook `useFormatSats`
```typescript
// Para valores com ícone de Sats
formatSats(value, { size: 24, variant: 'auto' })

// Para valores sem ícone
formatSats(value, { size: 24, showIcon: false, variant: 'auto' })

// Para valores neutros
formatSats(value, { size: 24, variant: 'neutral' })
```

## 🐛 Troubleshooting Comum

### Problema: Card não muda de cor
**Solução**: Verificar se `positionsLoading` está sendo passado corretamente e se a função de cor está implementada.

### Problema: Ícone de Sats muito pequeno
**Solução**: Usar `formatSats` com `{ size: 24, variant: 'auto' }` em vez do componente `PnLCard`.

### Problema: Valores retornando 0
**Solução**: Verificar se a fonte de dados está correta no `PositionsContext.tsx` e se o backend está retornando os dados esperados.

### Problema: Badge quebra linha
**Solução**: Adicionar `whitespace-nowrap` à classe do badge.

## 📝 Notas Importantes

1. **Sempre usar `positionsData`** em vez de hooks separados para consistência
2. **Manter padrão de cores** para melhor UX
3. **Testar em diferentes estados** (loading, positivo, negativo)
4. **Usar `dangerouslySetInnerHTML`** para títulos com quebras de linha
5. **Manter estrutura HTML consistente** para facilitar manutenção

## 🚀 Próximos Passos

1. Implementar animações de transição entre estados
2. Adicionar tooltips informativos nos cards
3. Criar sistema de configuração de cards via admin
4. Implementar cache local para melhor performance
5. Adicionar suporte a temas personalizados

---

**Última atualização**: 22/09/2025
**Versão**: 1.0
**Autor**: Sistema de Cards Dashboard
