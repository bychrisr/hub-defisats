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

/* Amarelo - Avisos */
gradient-card-yellow
border-yellow-500
text-yellow-200
bg-yellow-600/20
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
