# 📊 Dashboard Cards - Guia do Desenvolvedor

## 🎯 Visão Geral

Este documento é um guia completo para desenvolvedores que irão continuar implementando e corrigindo os cards do dashboard do Hub DeFiSats. Ele contém toda a lógica, configuração, troubleshooting e exemplos práticos.

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos
```
frontend/src/
├── pages/Dashboard.tsx          # Componente principal do dashboard
├── hooks/
│   ├── useEstimatedBalance.ts   # Hook para dados de saldo estimado
│   ├── useHistoricalData.ts     # Hook para dados históricos
│   └── useFormatSats.tsx        # Hook para formatação de sats
├── contexts/
│   ├── RealtimeDataContext.tsx  # Context para dados em tempo real
│   └── PositionsContext.tsx     # Context para posições
└── components/dashboard/
    ├── MetricCard.tsx           # Componente base para cards
    └── PnLCard.tsx              # Card específico para PnL

backend/src/
├── controllers/lnmarkets-user.controller.ts  # Controller principal
├── services/lnmarkets-api.service.ts         # Serviço da API LN Markets
└── routes/lnmarkets-user.routes.ts           # Rotas da API
```

## 🐳 Configuração do Ambiente

### 1. Docker Compose (Desenvolvimento)
```bash
# Usar o arquivo correto de desenvolvimento
docker compose -f config/docker/docker-compose.dev.yml up --build -d

# Verificar status dos containers
docker compose -f config/docker/docker-compose.dev.yml ps

# Ver logs em tempo real
docker compose -f config/docker/docker-compose.dev.yml logs -f frontend
docker compose -f config/docker/docker-compose.dev.yml logs -f backend
```

### 2. Portas e Acesso
- **Frontend**: http://localhost:13000
- **Backend API**: http://localhost:13010
- **PostgreSQL**: localhost:15432
- **Redis**: localhost:16379

### 3. Credenciais de Teste
- **Email**: brainoschris@gmail.com
- **Senha**: password
- **Token JWT**: Gerado automaticamente no login

## 📊 Lógica dos Cards

### 1. Total Invested (✅ Funcionando)
**Fonte de Dados**: `useEstimatedBalance` → `estimatedBalance.data.total_invested`

**Lógica**:
```typescript
const calculateTotalInvested = () => {
  if (!estimatedBalance.data) return 0;
  return estimatedBalance.data.total_invested || 0;
};
```

**Backend**: Soma de `entry_margin` de todas as posições fechadas (status !== 'running')

### 2. Fees Paid (✅ Funcionando)
**Fonte de Dados**: `useEstimatedBalance` → `estimatedBalance.data.total_fees`

**Lógica**:
```typescript
const calculateFeesPaid = () => {
  // Usar dados do estimated-balance como fonte primária
  if (estimatedBalance.data?.total_fees !== undefined) {
    return estimatedBalance.data.total_fees;
  }
  // Fallback para dados históricos se disponível
  return historicalMetrics?.totalFees || 0;
};
```

**Backend**: Soma de todas as taxas pagas (opening_fee + closing_fee + sum_carry_fees)

### 3. Estimated Balance (✅ Funcionando)
**Fonte de Dados**: `useEstimatedBalance` → `estimatedBalance.data.estimated_balance`

**Lógica**:
```typescript
const calculateEstimatedBalance = () => {
  const availableMargin = calculateAvailableMargin();
  const totalMargin = calculateTotalMargin();
  const estimatedProfit = positionsData.estimatedProfit || 0;
  const estimatedFees = positionsData.estimatedFees || 0;
  
  return availableMargin + totalMargin + estimatedProfit - estimatedFees;
};
```

### 4. PnL (Profit/Loss) (✅ Funcionando)
**Fonte de Dados**: `usePositionsMetrics` → `positionsData.totalPL`

**Lógica**:
```typescript
const calculatePnL = () => {
  return positionsData.totalPL || 0;
};
```

## 🔧 Hooks Principais

### 1. useEstimatedBalance
**Arquivo**: `frontend/src/hooks/useEstimatedBalance.ts`

**Função**: Busca dados consolidados do backend via `/api/lnmarkets/user/estimated-balance`

**Dados Retornados**:
```typescript
interface EstimatedBalanceData {
  wallet_balance: number;      // Saldo da carteira
  total_margin: number;        // Margem total
  total_pnl: number;          // PnL total
  total_fees: number;         // Taxas totais
  estimated_balance: number;   // Saldo estimado
  total_invested: number;      // Total investido
  positions_count: number;     // Número de posições
  trades_count: number;        // Número de trades
}
```

**Uso**:
```typescript
const estimatedBalance = useEstimatedBalance();
const totalInvested = estimatedBalance.data?.total_invested || 0;
```

### 2. useHistoricalData
**Arquivo**: `frontend/src/hooks/useHistoricalData.ts`

**Função**: Busca dados históricos de trades via `/api/lnmarkets/user/trades`

**Problema Conhecido**: O endpoint retorna objetos vazios `[{}]` porque a API LN Markets não tem endpoint específico para trades históricos.

**Solução**: Usar dados do `useEstimatedBalance` como fonte primária.

### 3. usePositionsMetrics
**Arquivo**: `frontend/src/contexts/PositionsContext.tsx`

**Função**: Calcula métricas das posições atuais

**Dados Retornados**:
```typescript
interface PositionsMetrics {
  totalPL: number;           // PnL total das posições
  estimatedProfit: number;   // Lucro estimado
  estimatedFees: number;     // Taxas estimadas
  positions: Position[];     // Array de posições
}
```

## 🚨 Troubleshooting Comum

### 1. Card Mostra 0
**Causa**: Hook não está carregando dados ou usuário não autenticado

**Solução**:
```typescript
// Adicionar logs para debug
console.log('🔍 DEBUG - Hook data:', {
  hasData: !!hook.data,
  isLoading: hook.isLoading,
  error: hook.error,
  data: hook.data
});
```

### 2. Erro de Autenticação
**Causa**: Token JWT expirado ou inválido

**Solução**:
```bash
# Fazer login novamente
curl -X POST http://localhost:13010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"brainoschris@gmail.com","password":"password"}'
```

### 3. API Retorna Objetos Vazios
**Causa**: Endpoint da API LN Markets não existe ou retorna dados incorretos

**Solução**: Usar dados do `useEstimatedBalance` como fonte primária

### 4. Frontend Não Conecta no Backend
**Causa**: Configuração de proxy incorreta

**Solução**: Verificar `frontend/vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://backend:3010', // ✅ Correto para Docker
    changeOrigin: true,
    secure: false,
  }
}
```

## 🛠️ Como Implementar um Novo Card

### 1. Estrutura Básica
```typescript
// No Dashboard.tsx
const calculateNovoCard = () => {
  console.log('🔍 DASHBOARD - calculateNovoCard called:', {
    hasData: !!estimatedBalance.data,
    data: estimatedBalance.data,
    // ... outros dados necessários
  });
  
  // Lógica de cálculo
  if (!estimatedBalance.data) return 0;
  return estimatedBalance.data.novo_campo || 0;
};
```

### 2. Renderização no JSX
```typescript
{/* Novo Card */}
<div className="relative group">
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className="w-12 h-12 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
      <Icone className="w-6 h-6 text-blue-300 stroke-2 group-hover:text-blue-200 transition-colors duration-500" />
    </div>
  </div>
  
  <Card className="gradient-card gradient-card-gray border-2 border-gray-500 hover:border-gray-400 transition-all duration-300 hover:shadow-xl cursor-default">
    <div className="card-content">
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <CardTitle 
              className="text-h3 text-vibrant"
              dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Novo Card') }}
            />
            <Tooltip 
              content="Descrição do que o card mostra"
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
            {formatSats(calculateNovoCard(), { size: getGlobalDynamicSize().iconSize, variant: 'auto' })}
          </div>
        </div>
      </div>
    </div>
  </Card>
</div>
```

### 3. Adicionar ao Backend (se necessário)
```typescript
// No lnmarkets-user.controller.ts
async getEstimatedBalance(request: FastifyRequest, reply: FastifyReply) {
  // ... código existente ...
  
  const estimatedBalance = {
    // ... campos existentes ...
    novo_campo: calcularNovoCampo(), // ✅ Adicionar novo campo
  };
  
  return reply.send({
    success: true,
    data: estimatedBalance
  });
}
```

## 🔍 Debug e Logs

### 1. Logs do Frontend
```bash
# Ver logs do frontend
docker compose -f config/docker/docker-compose.dev.yml logs frontend

# Ver logs em tempo real
docker compose -f config/docker/docker-compose.dev.yml logs -f frontend
```

### 2. Logs do Backend
```bash
# Ver logs do backend
docker compose -f config/docker/docker-compose.dev.yml logs backend

# Ver logs em tempo real
docker compose -f config/docker/docker-compose.dev.yml logs -f backend
```

### 3. Testar API Diretamente
```bash
# Testar endpoint de health
curl http://localhost:13010/health

# Testar endpoint de estimated balance
curl -H "Authorization: Bearer TOKEN" http://localhost:13010/api/lnmarkets/user/estimated-balance

# Fazer login e obter token
curl -X POST http://localhost:13010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"brainoschris@gmail.com","password":"password"}'
```

## 📋 Checklist para Novos Cards

- [ ] **Backend**: Adicionar campo no endpoint `estimated-balance`
- [ ] **Frontend**: Criar função de cálculo no Dashboard
- [ ] **Frontend**: Adicionar renderização do card no JSX
- [ ] **Frontend**: Adicionar logs para debug
- [ ] **Teste**: Verificar se dados aparecem corretamente
- [ ] **Teste**: Verificar formatação de sats
- [ ] **Teste**: Verificar tooltip e ícone
- [ ] **Documentação**: Atualizar este guia

## 🎨 Estilos e Cores

### Cores dos Cards
- **Azul**: `gradient-card-blue` - Para métricas positivas
- **Verde**: `gradient-card-green` - Para lucros
- **Vermelho**: `gradient-card-red` - Para perdas
- **Cinza**: `gradient-card-gray` - Para métricas neutras

### Tamanhos Dinâmicos
```typescript
const { getDynamicSize } = useFormatSats();
const size = getDynamicSize();

// Usar em:
className={`${size.textSize} text-blue-200`}
formatSats(value, { size: size.iconSize, variant: 'auto' })
```

## 🚀 Comandos Úteis

### Reiniciar Serviços
```bash
# Reiniciar frontend
docker compose -f config/docker/docker-compose.dev.yml restart frontend

# Reiniciar backend
docker compose -f config/docker/docker-compose.dev.yml restart backend

# Reiniciar tudo
docker compose -f config/docker/docker-compose.dev.yml restart
```

### Rebuild Completo
```bash
# Rebuild e restart
docker compose -f config/docker/docker-compose.dev.yml up --build -d
```

### Limpar e Recomeçar
```bash
# Parar tudo
docker compose -f config/docker/docker-compose.dev.yml down

# Remover volumes (CUIDADO: apaga dados)
docker compose -f config/docker/docker-compose.dev.yml down -v

# Subir novamente
docker compose -f config/docker/docker-compose.dev.yml up --build -d
```

## 📞 Suporte

### Problemas Comuns
1. **"Total Invested" mostra 0**: Verificar se `useEstimatedBalance` está carregando dados
2. **"Fees Paid" mostra 0**: Verificar se está usando `estimatedBalance.data.total_fees`
3. **Frontend não carrega**: Verificar se containers estão rodando
4. **API retorna erro**: Verificar logs do backend

### Logs Importantes
- `🔍 ESTIMATED BALANCE HOOK` - Hook de saldo estimado
- `🔍 DASHBOARD - calculateXXX` - Funções de cálculo
- `🔍 LN MARKETS` - API do LN Markets
- `[UserController]` - Controller do backend

---

**Última atualização**: 22 de Setembro de 2025  
**Desenvolvedor**: Equipe Hub DeFiSats  
**Status**: Total Invested ✅ | Fees Paid ✅ | Estimated Balance ✅ | PnL ✅
