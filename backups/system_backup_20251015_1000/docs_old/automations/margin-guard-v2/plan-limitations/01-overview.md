# Sistema de Limitações por Plano - Margin Guard V2

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 1.0.0  
> **Responsável**: Margin Guard V2 System  

## 📋 Visão Geral

O sistema de limitações por plano do Margin Guard V2 garante que os usuários tenham acesso apenas às funcionalidades permitidas pelo seu plano atual, incentivando upgrades quando necessário.

## 🏗️ Estrutura de Planos

### Hierarquia de Planos

| Plano | Nome | Posições | Modos | Configurações | Notificações |
|-------|------|----------|-------|---------------|--------------|
| **FREE** | Gratuito | 2 máx | Global apenas | Básicas | Push apenas |
| **BASIC** | Básico | Ilimitado | Global apenas | Padrão | Push apenas |
| **ADVANCED** | Avançado | Ilimitado | Global + Unitário | Avançadas | Push apenas |
| **PRO** | Profissional | Ilimitado | Todos | Individuais | Multi-canal |
| **LIFETIME** | Vitalício | Ilimitado | Todos | Personalizadas | Multi-canal |

### Limitações por Plano

#### 🆓 FREE (Gratuito)
- **Posições**: Máximo 2 posições monitoradas
- **Modos**: Apenas modo global
- **Configurações**: Configurações básicas
- **Notificações**: Push apenas
- **Limitações**:
  - Máximo 2 posições monitoradas
  - Apenas modo global
  - Configurações básicas

#### 🟢 BASIC (Básico)
- **Posições**: Ilimitado
- **Modos**: Apenas modo global
- **Configurações**: Configurações padrão
- **Notificações**: Push apenas
- **Limitações**:
  - Apenas modo global
  - Configurações padrão

#### 🔵 ADVANCED (Avançado)
- **Posições**: Ilimitado
- **Modos**: Global + Unitário
- **Configurações**: Configurações avançadas
- **Notificações**: Push apenas
- **Limitações**:
  - Configurações avançadas
  - Modo unitário disponível

#### 🟣 PRO (Profissional)
- **Posições**: Ilimitado
- **Modos**: Todos (Global, Unitário, Individual)
- **Configurações**: Configurações individuais por posição
- **Notificações**: Multi-canal (Push, Email, SMS, Webhook)
- **Limitações**: Nenhuma

#### ⭐ LIFETIME (Vitalício)
- **Posições**: Ilimitado
- **Modos**: Todos
- **Configurações**: Configurações personalizadas
- **Notificações**: Multi-canal + Suporte prioritário
- **Limitações**: Nenhuma

## 💻 Implementação

### Backend - PlanLimitsService

```typescript
// backend/src/services/plan-limits.service.ts
getMarginGuardFeatures(planType: string): MarginGuardFeatures {
  const planLimits = {
    'free': {
      maxPositions: 2,
      modes: ['global'],
      features: ['basic_config', 'preview'],
      limitations: [
        'Máximo 2 posições monitoradas',
        'Apenas modo global',
        'Configurações básicas'
      ]
    },
    'basic': {
      maxPositions: -1, // ilimitado
      modes: ['global'],
      features: ['basic_config', 'preview', 'reports'],
      limitations: [
        'Apenas modo global',
        'Configurações padrão'
      ]
    },
    // ... outros planos
  };

  return planLimits[planType as keyof typeof planLimits] || planLimits.free;
}
```

### Backend - Validação de Configuração

```typescript
// backend/src/services/plan-limits.service.ts
async validateMarginGuardConfig(config: MarginGuardConfigRequest): Promise<PlanValidationResult> {
  const user = await this.prisma.user.findUnique({
    where: { id: config.userId },
    select: { plan_type: true }
  });

  const planFeatures = this.getMarginGuardFeatures(user.plan_type);

  // Validar modo
  if (!planFeatures.modes.includes(config.mode)) {
    return {
      isValid: false,
      error: `Modo ${config.mode} não disponível no plano ${user.plan_type}`,
      limitations: planFeatures.limitations,
      availableUpgrades: await this.getAvailableUpgrades(user.plan_type)
    };
  }

  // Validar número de posições
  if (config.mode === 'unitario' && planFeatures.maxPositions > 0) {
    if (config.selectedPositions.length > planFeatures.maxPositions) {
      return {
        isValid: false,
        error: `Máximo ${planFeatures.maxPositions} posições no plano ${user.plan_type}`,
        limitations: planFeatures.limitations,
        availableUpgrades: await this.getAvailableUpgrades(user.plan_type)
      };
    }
  }

  return { isValid: true, errors: [], warnings: [] };
}
```

### Frontend - Validação e UI

```typescript
// frontend/src/pages/Automations.tsx
const isModeAllowed = (mode: string) => {
  return planFeatures?.modes.includes(mode) || false;
};

const canSelectMore = () => {
  if (!planFeatures) return false;
  if (planFeatures.maxPositions === -1) return true;
  return marginGuardConfig.selected_positions.length < planFeatures.maxPositions;
};

// Validação antes de salvar
const saveConfiguration = async () => {
  if (planFeatures) {
    // Validar modo
    if (!isModeAllowed(marginGuardConfig.mode)) {
      toast.error(`Modo ${marginGuardConfig.mode} não disponível no seu plano atual`);
      return;
    }
    
    // Validar número de posições
    if (marginGuardConfig.mode === 'unitario' && 
        marginGuardConfig.selected_positions.length > planFeatures.maxPositions && 
        planFeatures.maxPositions !== -1) {
      toast.error(`Máximo ${planFeatures.maxPositions} posições permitidas no seu plano atual`);
      return;
    }
  }
  
  // ... salvar configuração
};
```

## 🎨 Interface do Usuário

### Card de Informações do Plano

```typescript
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Shield className="h-4 w-4" />
      Plano Atual: {planFeatures.plan_info?.name}
    </CardTitle>
    <CardDescription>
      {planFeatures.plan_info?.description}
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Recursos Disponíveis */}
    <div>
      <Label>Recursos Disponíveis</Label>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span>Modos: {planFeatures.modes?.join(', ')}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span>Posições: {planFeatures.maxPositions === -1 ? 'Ilimitado' : planFeatures.maxPositions}</span>
        </div>
      </div>
    </div>

    {/* Limitações */}
    {planFeatures.limitations && planFeatures.limitations.length > 0 && (
      <div>
        <Label className="text-orange-600">Limitações</Label>
        <ul className="space-y-1 mt-2">
          {planFeatures.limitations.map((limitation, index) => (
            <li key={index} className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {limitation}
            </li>
          ))}
        </ul>
      </div>
    )}
  </CardContent>
</Card>
```

### Card de Sugestões de Upgrade

```typescript
<Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-blue-100/30" data-upgrades>
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-blue-700">
      <TrendingUp className="h-5 w-5" />
      Upgrades Disponíveis
    </CardTitle>
    <CardDescription className="text-blue-600">
      Desbloqueie mais funcionalidades do Margin Guard
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {availableUpgrades.slice(0, 3).map((plan) => (
        <div key={plan.slug} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-white">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{plan.name}</p>
            <p className="text-xs text-gray-600 mb-1">
              {plan.features.margin_guard?.max_positions === -1 
                ? 'Posições ilimitadas' 
                : `Até ${plan.features.margin_guard?.max_positions} posições`
              }
            </p>
            <p className="text-sm font-medium text-blue-600">
              {plan.price_sats?.toLocaleString()} sats
            </p>
          </div>
          <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
            <ArrowRight className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

## 🔄 Fluxo de Validação

### 1. Carregamento da Página
1. Frontend carrega features do plano via `/api/user/margin-guard/plan-features`
2. UI é renderizada com base nas limitações
3. Botões e opções são desabilitados conforme necessário

### 2. Configuração do Usuário
1. Usuário tenta configurar Margin Guard
2. Frontend valida limitações localmente
3. Se válido, envia para backend
4. Backend valida novamente com dados atualizados
5. Se inválido, retorna erro com sugestões de upgrade

### 3. Tratamento de Erros
1. Erro de validação retorna informações detalhadas
2. Frontend mostra toast com sugestão de upgrade
3. Link direto para seção de upgrades
4. Scroll automático para facilitar conversão

## 📊 Métricas e Analytics

### Dados Coletados
- Tentativas de uso de funcionalidades bloqueadas
- Conversões de upgrade por plano
- Funcionalidades mais solicitadas
- Pontos de abandono na jornada

### KPIs
- **Taxa de conversão**: % de usuários que fazem upgrade
- **Funcionalidades bloqueadas**: Quantas vezes cada limitação é atingida
- **Tempo até upgrade**: Tempo médio entre bloqueio e conversão
- **Satisfação**: Feedback sobre limitações e sugestões

## 🔗 Integração com Sistema de Pagamentos

### Próximos Passos
1. **Integração com gateway de pagamento**
2. **Processamento de upgrades em tempo real**
3. **Ativação automática de funcionalidades**
4. **Histórico de upgrades e downgrades**

### Webhooks
- `plan.upgraded`: Usuário fez upgrade
- `plan.downgraded`: Usuário fez downgrade
- `plan.expired`: Plano expirou
- `plan.renewed`: Plano foi renovado

## 📝 Changelog

### [1.0.0] - 2025-01-09
- ✅ Implementação inicial do sistema de limitações
- ✅ Validação de modo e número de posições
- ✅ UI informativa com recursos e limitações
- ✅ Sugestões de upgrade com scroll automático
- ✅ Validação tanto no frontend quanto no backend
- ✅ Feedback detalhado em caso de limitações
- ✅ Integração com sistema de planos existente

---

**Última Atualização**: 2025-01-09  
**Responsável**: Margin Guard V2 System
