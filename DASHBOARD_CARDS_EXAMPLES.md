# 📊 Dashboard Cards - Exemplos Práticos

## 🎯 Exemplos de Implementação

### 1. Card "Success Rate" (Taxa de Sucesso)

#### Backend (lnmarkets-user.controller.ts)
```typescript
// Adicionar ao getEstimatedBalance
const successRate = calculateSuccessRate(closedTrades);

const estimatedBalance = {
  // ... campos existentes ...
  success_rate: successRate, // ✅ Novo campo
};

// Função auxiliar
function calculateSuccessRate(trades: any[]): number {
  if (trades.length === 0) return 0;
  
  const winningTrades = trades.filter(trade => 
    trade.status !== 'running' && (trade.pnl || 0) > 0
  ).length;
  
  return (winningTrades / trades.length) * 100;
}
```

#### Frontend (Dashboard.tsx)
```typescript
// Função de cálculo
const calculateSuccessRate = () => {
  console.log('🔍 DASHBOARD - calculateSuccessRate called:', {
    hasData: !!estimatedBalance.data,
    successRate: estimatedBalance.data?.success_rate,
    isLoading: estimatedBalance.isLoading,
    error: estimatedBalance.error
  });
  
  if (!estimatedBalance.data) return 0;
  return estimatedBalance.data.success_rate || 0;
};

// Renderização no JSX
{/* Success Rate Card */}
<div className="relative group">
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className="w-12 h-12 bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-green-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
      <Target className="w-6 h-6 text-green-300 stroke-2 group-hover:text-green-200 transition-colors duration-500" />
    </div>
  </div>
  
  <Card className="gradient-card gradient-card-green border-2 border-green-500 hover:border-green-400 transition-all duration-300 hover:shadow-xl cursor-default">
    <div className="card-content">
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <CardTitle 
              className="text-h3 text-vibrant"
              dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Success Rate') }}
            />
            <Tooltip 
              content="Percentual de trades vencedores em relação ao total de trades fechados."
              position="top"
              delay={200}
              className="z-50"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
            </Tooltip>
          </div>
        </div>

        <div className="mb-3">
          <div className={`${getGlobalDynamicSize().textSize} text-green-200`}>
            {calculateSuccessRate().toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  </Card>
</div>
```

### 2. Card "Active Positions" (Posições Ativas)

#### Frontend (Dashboard.tsx)
```typescript
// Função de cálculo (já existe)
const calculateActiveTrades = () => {
  if (!positionsData.positions) return 0;
  return positionsData.positions.filter(pos => pos.status === 'running').length;
};

// Renderização no JSX
{/* Active Positions Card */}
<div className="relative group">
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className="w-12 h-12 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
      <Activity className="w-6 h-6 text-blue-300 stroke-2 group-hover:text-blue-200 transition-colors duration-500" />
    </div>
  </div>
  
  <Card className="gradient-card gradient-card-blue border-2 border-blue-500 hover:border-blue-400 transition-all duration-300 hover:shadow-xl cursor-default">
    <div className="card-content">
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <CardTitle 
              className="text-h3 text-vibrant"
              dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Active Positions') }}
            />
            <Tooltip 
              content="Número de posições que estão atualmente abertas e sendo negociadas."
              position="top"
              delay={200}
              className="z-50"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
            </Tooltip>
          </div>
        </div>

        <div className="mb-3">
          <div className={`${getGlobalDynamicSize().textSize} text-blue-200`}>
            {calculateActiveTrades()}
          </div>
        </div>
      </div>
    </div>
  </Card>
</div>
```

### 3. Card "Total Trades" (Total de Trades)

#### Backend (lnmarkets-user.controller.ts)
```typescript
// Adicionar ao getEstimatedBalance
const totalTrades = allTrades.length;

const estimatedBalance = {
  // ... campos existentes ...
  total_trades: totalTrades, // ✅ Novo campo
};
```

#### Frontend (Dashboard.tsx)
```typescript
// Função de cálculo
const calculateTotalTrades = () => {
  console.log('🔍 DASHBOARD - calculateTotalTrades called:', {
    hasData: !!estimatedBalance.data,
    totalTrades: estimatedBalance.data?.total_trades,
    isLoading: estimatedBalance.isLoading,
    error: estimatedBalance.error
  });
  
  if (!estimatedBalance.data) return 0;
  return estimatedBalance.data.total_trades || 0;
};

// Renderização no JSX
{/* Total Trades Card */}
<div className="relative group">
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className="w-12 h-12 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
      <BarChart3 className="w-6 h-6 text-purple-300 stroke-2 group-hover:text-purple-200 transition-colors duration-500" />
    </div>
  </div>
  
  <Card className="gradient-card gradient-card-purple border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 hover:shadow-xl cursor-default">
    <div className="card-content">
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <CardTitle 
              className="text-h3 text-vibrant"
              dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total Trades') }}
            />
            <Tooltip 
              content="Número total de trades executados (abertos e fechados)."
              position="top"
              delay={200}
              className="z-50"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
            </Tooltip>
          </div>
        </div>

        <div className="mb-3">
          <div className={`${getGlobalDynamicSize().textSize} text-purple-200`}>
            {calculateTotalTrades()}
          </div>
        </div>
      </div>
    </div>
  </Card>
</div>
```

### 4. Card "Win Streak" (Sequência de Vitórias)

#### Backend (lnmarkets-user.controller.ts)
```typescript
// Win Streak - Sequência de vitórias consecutivas mais recentes
let winStreak = 0;
if (Array.isArray(allTrades) && allTrades.length > 0) {
  const closedTrades = allTrades.filter(trade => trade.status !== 'running');
  // Ordenar por data de fechamento (mais recente primeiro)
  const sortedTrades = closedTrades.sort((a, b) => {
    const dateA = new Date(a.closing_date || a.created_at || 0);
    const dateB = new Date(b.closing_date || b.created_at || 0);
    return dateB.getTime() - dateA.getTime();
  });
  
  // Contar vitórias consecutivas a partir do mais recente
  for (const trade of sortedTrades) {
    const pnl = trade.pnl || trade.pl || 0;
    if (pnl > 0) {
      winStreak++;
    } else {
      break; // Para na primeira derrota
    }
  }
}

const estimatedBalance = {
  // ... campos existentes ...
  win_streak: winStreak, // ✅ Novo campo
};
```

#### Frontend (Dashboard.tsx)
```typescript
// Função de cálculo
const calculateWinStreak = () => {
  console.log('🔍 DASHBOARD - calculateWinStreak called:', {
    hasData: !!estimatedBalance.data,
    winStreak: estimatedBalance.data?.win_streak,
    isLoading: estimatedBalance.isLoading,
    error: estimatedBalance.error
  });
  
  if (!estimatedBalance.data) return 0;
  return estimatedBalance.data.win_streak || 0;
};

// Renderização no JSX
{/* Win Streak Card */}
<div className="relative group">
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
      calculateWinStreak() > 0 ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
      'bg-gray-600/20 border-gray-500/30'
    }`}>
      <CheckCircle className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
        calculateWinStreak() > 0 ? 'text-green-300 group-hover:text-green-200' :
        'text-gray-300 group-hover:text-gray-200'
      }`} />
    </div>
  </div>
  
  <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
    calculateWinStreak() > 0 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
    'gradient-card-gray border-gray-500 hover:border-gray-400'
  }`}>
    <div className="card-content">
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <CardTitle 
              className="text-h3 text-vibrant"
              dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Win Streak') }}
            />
            <Tooltip 
              content="Número de trades vencedores consecutivos mais recentes."
              position="top"
              delay={200}
              className="z-50"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
            </Tooltip>
          </div>
        </div>
        
        <div className="mb-3">
          <div className={`${getGlobalDynamicSize().textSize} ${
            calculateWinStreak() > 0 ? 'text-green-200' :
            'text-gray-200'
          }`}>
            {calculateWinStreak()}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`text-label-sm px-2 py-1 ${
              calculateWinStreak() > 0 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
              'border-gray-400/60 text-gray-200 bg-gray-600/20'
            }`}
          >
            {calculateWinStreak() > 0 ? 'Hot' : 'Cold'}
          </Badge>
        </div>
      </div>
    </div>
  </Card>
</div>
```

### 5. Card "Best Trade" (Melhor Trade)

#### Backend (lnmarkets-user.controller.ts)
```typescript
// Best Trade - Maior lucro em um único trade
let bestTrade = 0;
if (Array.isArray(allTrades) && allTrades.length > 0) {
  const closedTrades = allTrades.filter(trade => trade.status !== 'running');
  if (closedTrades.length > 0) {
    const maxPnL = Math.max(...closedTrades.map(trade => trade.pnl || trade.pl || 0));
    bestTrade = Math.max(0, maxPnL); // Só considerar lucros positivos
  }
}

const estimatedBalance = {
  // ... campos existentes ...
  best_trade: bestTrade, // ✅ Novo campo
};
```

#### Frontend (Dashboard.tsx)
```typescript
// Função de cálculo
const calculateBestTrade = () => {
  console.log('🔍 DASHBOARD - calculateBestTrade called:', {
    hasData: !!estimatedBalance.data,
    bestTrade: estimatedBalance.data?.best_trade,
    isLoading: estimatedBalance.isLoading,
    error: estimatedBalance.error
  });
  
  if (!estimatedBalance.data) return 0;
  return estimatedBalance.data.best_trade || 0;
};

// Renderização no JSX
{/* Best Trade Card */}
<div className="relative group">
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
      calculateBestTrade() > 0 ? 'bg-yellow-600/20 border-yellow-500/30 group-hover:shadow-yellow-500/30' :
      'bg-gray-600/20 border-gray-500/30'
    }`}>
      <TrendingUp className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
        calculateBestTrade() > 0 ? 'text-yellow-300 group-hover:text-yellow-200' :
        'text-gray-300 group-hover:text-gray-200'
      }`} />
    </div>
  </div>
  
  <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
    calculateBestTrade() > 0 ? 'gradient-card-yellow border-yellow-500 hover:border-yellow-400 hover:shadow-yellow-500/30' :
    'gradient-card-gray border-gray-500 hover:border-gray-400'
  }`}>
    <div className="card-content">
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <CardTitle 
              className="text-h3 text-vibrant"
              dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Best Trade') }}
            />
            <Tooltip 
              content="Maior lucro obtido em um único trade fechado."
              position="top"
              delay={200}
              className="z-50"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
            </Tooltip>
          </div>
        </div>
        
        <div className="mb-3">
          <div className={`${getGlobalDynamicSize().textSize} ${
            calculateBestTrade() > 0 ? 'text-yellow-200' :
            'text-gray-200'
          }`}>
            {formatSats(calculateBestTrade(), { size: getGlobalDynamicSize().iconSize, variant: 'auto' })}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`text-label-sm px-2 py-1 ${
              calculateBestTrade() > 0 ? 'border-yellow-400/60 text-yellow-200 bg-yellow-600/20' :
              'border-gray-400/60 text-gray-200 bg-gray-600/20'
            }`}
          >
            {calculateBestTrade() > 0 ? 'Record' : 'None'}
          </Badge>
        </div>
      </div>
    </div>
  </Card>
</div>
```

### 6. Card "Risk/Reward Ratio" (Relação Risco/Retorno)

#### Backend (lnmarkets-user.controller.ts)
```typescript
// Risk/Reward Ratio - Relação risco/retorno
let riskRewardRatio = 0;
if (Array.isArray(allTrades) && allTrades.length > 0) {
  const closedTrades = allTrades.filter(trade => trade.status !== 'running');
  if (closedTrades.length > 0) {
    const pnls = closedTrades.map(trade => trade.pnl || trade.pl || 0);
    const positivePnls = pnls.filter(pnl => pnl > 0);
    const negativePnls = pnls.filter(pnl => pnl < 0);
    
    if (positivePnls.length > 0 && negativePnls.length > 0) {
      const avgGain = positivePnls.reduce((sum, pnl) => sum + pnl, 0) / positivePnls.length;
      const avgLoss = Math.abs(negativePnls.reduce((sum, pnl) => sum + pnl, 0) / negativePnls.length);
      riskRewardRatio = avgGain / avgLoss;
    }
  }
}

const estimatedBalance = {
  // ... campos existentes ...
  risk_reward_ratio: riskRewardRatio, // ✅ Novo campo
};
```

#### Frontend (Dashboard.tsx)
```typescript
// Função de cálculo
const calculateRiskRewardRatio = () => {
  console.log('🔍 DASHBOARD - calculateRiskRewardRatio called:', {
    hasData: !!estimatedBalance.data,
    riskRewardRatio: estimatedBalance.data?.risk_reward_ratio,
    isLoading: estimatedBalance.isLoading,
    error: estimatedBalance.error
  });
  
  if (!estimatedBalance.data) return 0;
  return estimatedBalance.data.risk_reward_ratio || 0;
};

// Renderização no JSX
{/* Risk/Reward Ratio Card */}
<div className="relative group">
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
      calculateRiskRewardRatio() > 1 ? 'bg-blue-600/20 border-blue-500/30 group-hover:shadow-blue-500/30' :
      calculateRiskRewardRatio() > 0 ? 'bg-yellow-600/20 border-yellow-500/30 group-hover:shadow-yellow-500/30' :
      'bg-gray-600/20 border-gray-500/30'
    }`}>
      <BarChart3 className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
        calculateRiskRewardRatio() > 1 ? 'text-blue-300 group-hover:text-blue-200' :
        calculateRiskRewardRatio() > 0 ? 'text-yellow-300 group-hover:text-yellow-200' :
        'text-gray-300 group-hover:text-gray-200'
      }`} />
    </div>
  </div>
  
  <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
    calculateRiskRewardRatio() > 1 ? 'gradient-card-blue border-blue-500 hover:border-blue-400 hover:shadow-blue-500/30' :
    calculateRiskRewardRatio() > 0 ? 'gradient-card-yellow border-yellow-500 hover:border-yellow-400 hover:shadow-yellow-500/30' :
    'gradient-card-gray border-gray-500 hover:border-gray-400'
  }`}>
    <div className="card-content">
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <CardTitle 
              className="text-h3 text-vibrant"
              dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Risk/Reward') }}
            />
            <Tooltip 
              content="Relação risco/retorno - eficiência da estratégia (ganho médio / perda média)."
              position="top"
              delay={200}
              className="z-50"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
            </Tooltip>
          </div>
        </div>
        
        <div className="mb-3">
          <div className={`${getGlobalDynamicSize().textSize} ${
            calculateRiskRewardRatio() > 1 ? 'text-blue-200' :
            calculateRiskRewardRatio() > 0 ? 'text-yellow-200' :
            'text-gray-200'
          }`}>
            {calculateRiskRewardRatio().toFixed(2)}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`text-label-sm px-2 py-1 ${
              calculateRiskRewardRatio() > 1 ? 'border-blue-400/60 text-blue-200 bg-blue-600/20' :
              calculateRiskRewardRatio() > 0 ? 'border-yellow-400/60 text-yellow-200 bg-yellow-600/20' :
              'border-gray-400/60 text-gray-200 bg-gray-600/20'
            }`}
          >
            {calculateRiskRewardRatio() > 1 ? 'Good' : calculateRiskRewardRatio() > 0 ? 'Fair' : 'Poor'}
          </Badge>
        </div>
      </div>
    </div>
  </Card>
</div>
```

### 7. Card "Trading Frequency" (Frequência de Trading)

#### Backend (lnmarkets-user.controller.ts)
```typescript
// Trading Frequency - Frequência de trading (trades por dia nos últimos 30 dias)
let tradingFrequency = 0;
if (Array.isArray(allTrades) && allTrades.length > 0) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTrades = allTrades.filter(trade => {
    const tradeDate = new Date(trade.created_at || trade.opening_date || 0);
    return tradeDate >= thirtyDaysAgo;
  });
  
  tradingFrequency = recentTrades.length / 30; // Trades por dia
}

const estimatedBalance = {
  // ... campos existentes ...
  trading_frequency: tradingFrequency, // ✅ Novo campo
};
```

#### Frontend (Dashboard.tsx)
```typescript
// Função de cálculo
const calculateTradingFrequency = () => {
  console.log('🔍 DASHBOARD - calculateTradingFrequency called:', {
    hasData: !!estimatedBalance.data,
    tradingFrequency: estimatedBalance.data?.trading_frequency,
    isLoading: estimatedBalance.isLoading,
    error: estimatedBalance.error
  });
  
  if (!estimatedBalance.data) return 0;
  return estimatedBalance.data.trading_frequency || 0;
};

// Renderização no JSX
{/* Trading Frequency Card */}
<div className="relative group">
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
      calculateTradingFrequency() > 1 ? 'bg-purple-600/20 border-purple-500/30 group-hover:shadow-purple-500/30' :
      calculateTradingFrequency() > 0 ? 'bg-blue-600/20 border-blue-500/30 group-hover:shadow-blue-500/30' :
      'bg-gray-600/20 border-gray-500/30'
    }`}>
      <Activity className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
        calculateTradingFrequency() > 1 ? 'text-purple-300 group-hover:text-purple-200' :
        calculateTradingFrequency() > 0 ? 'text-blue-300 group-hover:text-blue-200' :
        'text-gray-300 group-hover:text-gray-200'
      }`} />
    </div>
  </div>
  
  <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
    calculateTradingFrequency() > 1 ? 'gradient-card-purple border-purple-500 hover:border-purple-400 hover:shadow-purple-500/30' :
    calculateTradingFrequency() > 0 ? 'gradient-card-blue border-blue-500 hover:border-blue-400 hover:shadow-blue-500/30' :
    'gradient-card-gray border-gray-500 hover:border-gray-400'
  }`}>
    <div className="card-content">
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <CardTitle 
              className="text-h3 text-vibrant"
              dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Trading Frequency') }}
            />
            <Tooltip 
              content="Número de trades por dia nos últimos 30 dias - indica estilo de trading."
              position="top"
              delay={200}
              className="z-50"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
            </Tooltip>
          </div>
        </div>
        
        <div className="mb-3">
          <div className={`${getGlobalDynamicSize().textSize} ${
            calculateTradingFrequency() > 1 ? 'text-purple-200' :
            calculateTradingFrequency() > 0 ? 'text-blue-200' :
            'text-gray-200'
          }`}>
            {calculateTradingFrequency().toFixed(1)}/day
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`text-label-sm px-2 py-1 ${
              calculateTradingFrequency() > 1 ? 'border-purple-400/60 text-purple-200 bg-purple-600/20' :
              calculateTradingFrequency() > 0 ? 'border-blue-400/60 text-blue-200 bg-blue-600/20' :
              'border-gray-400/60 text-gray-200 bg-gray-600/20'
            }`}
          >
            {calculateTradingFrequency() > 1 ? 'Scalper' : calculateTradingFrequency() > 0 ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
    </div>
  </Card>
</div>
```

## 🎨 Paleta de Cores para Cards

### Cores Disponíveis
```css
/* Azul - Métricas neutras/positivas */
gradient-card-blue
border-blue-500
text-blue-200
bg-blue-600/20

/* Verde - Lucros/sucessos */
gradient-card-green
border-green-500
text-green-200
bg-green-600/20

/* Vermelho - Perdas/alertas */
gradient-card-red
border-red-500
text-red-200
bg-red-600/20

/* Cinza - Métricas neutras */
gradient-card-gray
border-gray-500
text-gray-200
bg-gray-600/20

/* Roxo - Estatísticas */
gradient-card-purple
border-purple-500
text-purple-200
bg-purple-600/20

/* Amarelo - Avisos/Records */
gradient-card-yellow
border-yellow-500
text-yellow-200
bg-yellow-600/20

/* Laranja - Taxas/Custos */
gradient-card-orange
border-orange-500
text-orange-200
bg-orange-600/20
```

## 🔧 Padrões de Código

### 1. Função de Cálculo Padrão
```typescript
const calculateNovoCard = () => {
  console.log('🔍 DASHBOARD - calculateNovoCard called:', {
    hasData: !!estimatedBalance.data,
    data: estimatedBalance.data,
    novoCampo: estimatedBalance.data?.novo_campo,
    isLoading: estimatedBalance.isLoading,
    error: estimatedBalance.error
  });
  
  // Validação de dados
  if (!estimatedBalance.data) return 0;
  
  // Lógica de cálculo
  return estimatedBalance.data.novo_campo || 0;
};
```

### 2. Estrutura de Card Padrão
```typescript
{/* Nome do Card */}
<div className="relative group">
  {/* Ícone flutuante */}
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className="w-12 h-12 bg-COR-600/20 backdrop-blur-sm border border-COR-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-COR-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
      <Icone className="w-6 h-6 text-COR-300 stroke-2 group-hover:text-COR-200 transition-colors duration-500" />
    </div>
  </div>
  
  {/* Card principal */}
  <Card className="gradient-card gradient-card-COR border-2 border-COR-500 hover:border-COR-400 transition-all duration-300 hover:shadow-xl cursor-default">
    <div className="card-content">
      <div className="p-6">
        {/* Título e tooltip */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <CardTitle 
              className="text-h3 text-vibrant"
              dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Nome do Card') }}
            />
            <Tooltip 
              content="Descrição detalhada do que o card mostra"
              position="top"
              delay={200}
              className="z-50"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
            </Tooltip>
          </div>
        </div>

        {/* Valor principal */}
        <div className="mb-3">
          <div className={`${getGlobalDynamicSize().textSize} text-COR-200`}>
            {formatSats(calculateNovoCard(), { size: getGlobalDynamicSize().iconSize, variant: 'auto' })}
          </div>
        </div>
      </div>
    </div>
  </Card>
</div>
```

## 🚀 Comandos de Teste

### Testar Novo Card
```bash
# 1. Verificar se backend está retornando dados
curl -H "Authorization: Bearer TOKEN" http://localhost:13010/api/lnmarkets/user/estimated-balance | jq .

# 2. Verificar logs do frontend
docker compose -f config/docker/docker-compose.dev.yml logs frontend | grep "calculateNovoCard"

# 3. Verificar logs do backend
docker compose -f config/docker/docker-compose.dev.yml logs backend | grep "estimated-balance"
```

### Debug de Problemas
```bash
# Ver todos os logs em tempo real
docker compose -f config/docker/docker-compose.dev.yml logs -f

# Ver logs específicos do frontend
docker compose -f config/docker/docker-compose.dev.yml logs -f frontend | grep "DASHBOARD"

# Ver logs específicos do backend
docker compose -f config/docker/docker-compose.dev.yml logs -f backend | grep "UserController"
```

## 📋 Checklist de Implementação

### Backend
- [ ] Adicionar campo no `getEstimatedBalance`
- [ ] Implementar lógica de cálculo
- [ ] Adicionar logs para debug
- [ ] Testar endpoint com curl

### Frontend
- [ ] Criar função `calculateNovoCard`
- [ ] Adicionar renderização do card
- [ ] Escolher cor e ícone apropriados
- [ ] Adicionar tooltip descritivo
- [ ] Adicionar logs para debug
- [ ] Testar no navegador

### Testes
- [ ] Verificar se dados aparecem
- [ ] Verificar formatação correta
- [ ] Verificar responsividade
- [ ] Verificar tooltip
- [ ] Verificar logs no console

---

**Desenvolvedor**: Use este guia como referência para implementar novos cards de forma consistente e eficiente.
