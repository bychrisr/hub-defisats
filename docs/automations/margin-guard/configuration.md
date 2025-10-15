---
title: "Margin Guard - Configuration"
version: "1.0.0"
created: "2025-01-26"
updated: "2025-01-26"
author: "Documentation Agent"
status: "active"
tags: ["automations", "margin-guard", "configuration", "trading"]
---

# Margin Guard - Configuration

> **Status**: Active  
> **Última Atualização**: 2025-01-26  
> **Versão**: 1.0.0  
> **Responsável**: Axisor Margin Guard System  

## Índice

- [Visão Geral](#visão-geral)
- [Configuração Básica](#configuração-básica)
- [Modos de Operação](#modos-de-operação)
- [Configuração por Plano](#configuração-por-plano)
- [API Configuration](#api-configuration)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

## Visão Geral

O Margin Guard é um sistema de proteção automática contra liquidações que monitora as margens dos usuários e executa ações preventivas. Suporta diferentes modos de operação e configurações personalizáveis por plano de usuário.

## Configuração Básica

### Configuração do Usuário

```typescript
interface MarginGuardConfig {
  userId: string;
  isActive: boolean;
  mode: 'global' | 'individual' | 'unit';
  marginThreshold: number; // % de distância para acionar
  addMarginPercentage: number; // % de margem a adicionar
  selectedPositions: string[]; // IDs das posições (modo unitário)
  individualConfigs: Record<string, PositionConfig>;
  autoActions: {
    enabled: boolean;
    addMargin: boolean;
    closePosition: boolean;
    reduceSize: boolean;
  };
  notifications: {
    email: boolean;
    telegram: boolean;
    push: boolean;
    inApp: boolean;
  };
}

interface PositionConfig {
  positionId: string;
  enabled: boolean;
  threshold: number;
  autoActions: AutoActionConfig;
}

interface AutoActionConfig {
  addMargin: boolean;
  closePosition: boolean;
  reduceSize: boolean;
  minAmount: number;
  maxAmount: number;
}
```

### Configuração Inicial

```typescript
class MarginGuardConfigService {
  async createDefaultConfig(userId: string): Promise<MarginGuardConfig> {
    const user = await this.getUser(userId);
    
    const defaultConfig: MarginGuardConfig = {
      userId,
      isActive: false,
      mode: 'global',
      marginThreshold: this.getDefaultThreshold(user.planType),
      addMarginPercentage: 20,
      selectedPositions: [],
      individualConfigs: {},
      autoActions: {
        enabled: user.planType !== 'free',
        addMargin: user.planType !== 'free',
        closePosition: user.planType === 'pro',
        reduceSize: user.planType === 'advanced' || user.planType === 'pro'
      },
      notifications: {
        email: true,
        telegram: false,
        push: true,
        inApp: true
      }
    };

    return await this.saveConfig(defaultConfig);
  }

  private getDefaultThreshold(planType: string): number {
    switch (planType) {
      case 'free': return 15;
      case 'basic': return 12;
      case 'advanced': return 10;
      case 'pro': return 8;
      case 'lifetime': return 8;
      default: return 15;
    }
  }
}
```

## Modos de Operação

### Modo Global

Monitora todas as posições do usuário com uma única configuração.

```typescript
class GlobalModeConfig {
  async configure(userId: string, config: GlobalConfig): Promise<void> {
    const marginConfig = await this.getUserConfig(userId);
    
    marginConfig.mode = 'global';
    marginConfig.marginThreshold = config.threshold;
    marginConfig.addMarginPercentage = config.addMarginPercentage;
    marginConfig.selectedPositions = []; // Empty for global mode
    
    await this.saveConfig(marginConfig);
  }

  async executeGlobalMonitoring(userId: string): Promise<void> {
    const config = await this.getUserConfig(userId);
    const positions = await this.getUserPositions(userId);
    
    for (const position of positions) {
      const marginData = await this.calculateMargin(position);
      
      if (marginData.distancePercentage < config.marginThreshold) {
        await this.executeAction(userId, position, config);
      }
    }
  }
}
```

### Modo Individual

Configurações específicas para cada posição.

```typescript
class IndividualModeConfig {
  async configurePosition(
    userId: string, 
    positionId: string, 
    config: PositionConfig
  ): Promise<void> {
    const marginConfig = await this.getUserConfig(userId);
    
    marginConfig.mode = 'individual';
    marginConfig.individualConfigs[positionId] = {
      positionId,
      enabled: config.enabled,
      threshold: config.threshold,
      autoActions: config.autoActions
    };
    
    await this.saveConfig(marginConfig);
  }

  async executeIndividualMonitoring(userId: string): Promise<void> {
    const config = await this.getUserConfig(userId);
    
    for (const [positionId, positionConfig] of Object.entries(config.individualConfigs)) {
      if (!positionConfig.enabled) continue;
      
      const position = await this.getPosition(positionId);
      const marginData = await this.calculateMargin(position);
      
      if (marginData.distancePercentage < positionConfig.threshold) {
        await this.executeAction(userId, position, positionConfig);
      }
    }
  }
}
```

### Modo Unitário

Monitora apenas posições selecionadas pelo usuário.

```typescript
class UnitModeConfig {
  async selectPositions(userId: string, positionIds: string[]): Promise<void> {
    const marginConfig = await this.getUserConfig(userId);
    
    marginConfig.mode = 'unit';
    marginConfig.selectedPositions = positionIds;
    
    await this.saveConfig(marginConfig);
  }

  async executeUnitMonitoring(userId: string): Promise<void> {
    const config = await this.getUserConfig(userId);
    
    for (const positionId of config.selectedPositions) {
      const position = await this.getPosition(positionId);
      const marginData = await this.calculateMargin(position);
      
      if (marginData.distancePercentage < config.marginThreshold) {
        await this.executeAction(userId, position, config);
      }
    }
  }
}
```

## Configuração por Plano

### Limitações por Plano

```typescript
interface PlanLimitations {
  free: {
    maxPositions: 1;
    autoActions: false;
    notifications: ['inApp'];
    threshold: { min: 15, max: 50 };
  };
  basic: {
    maxPositions: 5;
    autoActions: ['addMargin'];
    notifications: ['email', 'inApp'];
    threshold: { min: 10, max: 30 };
  };
  advanced: {
    maxPositions: 20;
    autoActions: ['addMargin', 'reduceSize'];
    notifications: ['email', 'telegram', 'push', 'inApp'];
    threshold: { min: 5, max: 25 };
  };
  pro: {
    maxPositions: -1; // unlimited
    autoActions: ['addMargin', 'closePosition', 'reduceSize'];
    notifications: ['email', 'telegram', 'push', 'inApp'];
    threshold: { min: 2, max: 20 };
  };
  lifetime: {
    maxPositions: -1;
    autoActions: ['addMargin', 'closePosition', 'reduceSize'];
    notifications: ['email', 'telegram', 'push', 'inApp'];
    threshold: { min: 2, max: 20 };
  };
}

class PlanValidationService {
  validateConfig(userId: string, config: Partial<MarginGuardConfig>): ValidationResult {
    const user = this.getUser(userId);
    const limitations = this.getPlanLimitations(user.planType);
    
    const errors: string[] = [];
    
    // Validate threshold
    if (config.marginThreshold) {
      if (config.marginThreshold < limitations.threshold.min) {
        errors.push(`Threshold must be at least ${limitations.threshold.min}%`);
      }
      if (config.marginThreshold > limitations.threshold.max) {
        errors.push(`Threshold must be at most ${limitations.threshold.max}%`);
      }
    }
    
    // Validate auto actions
    if (config.autoActions && !limitations.autoActions) {
      if (config.autoActions.enabled) {
        errors.push('Auto actions not available in free plan');
      }
    }
    
    // Validate position count
    if (config.selectedPositions && limitations.maxPositions !== -1) {
      if (config.selectedPositions.length > limitations.maxPositions) {
        errors.push(`Maximum ${limitations.maxPositions} positions allowed`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

## API Configuration

### Configuration Endpoints

```typescript
// GET /api/margin-guard/config
async function getMarginGuardConfig(request: FastifyRequest): Promise<MarginGuardConfig> {
  const userId = request.user.id;
  const config = await marginGuardService.getUserConfig(userId);
  
  return {
    ...config,
    // Remove sensitive data
    individualConfigs: this.sanitizeConfig(config.individualConfigs)
  };
}

// PUT /api/margin-guard/config
async function updateMarginGuardConfig(
  request: FastifyRequest<{ Body: Partial<MarginGuardConfig> }>
): Promise<UpdateResult> {
  const userId = request.user.id;
  const newConfig = request.body;
  
  // Validate configuration
  const validation = await planValidationService.validateConfig(userId, newConfig);
  if (!validation.valid) {
    throw new ValidationError('Invalid configuration', validation.errors);
  }
  
  // Update configuration
  const updatedConfig = await marginGuardService.updateConfig(userId, newConfig);
  
  // Restart monitoring if configuration changed
  if (newConfig.isActive !== undefined) {
    await marginGuardService.restartMonitoring(userId);
  }
  
  return {
    success: true,
    config: updatedConfig
  };
}

// POST /api/margin-guard/test
async function testMarginGuardConfig(
  request: FastifyRequest<{ Body: TestConfigRequest }>
): Promise<TestResult> {
  const userId = request.user.id;
  const testConfig = request.body;
  
  try {
    const positions = await lnMarketsService.getPositions(userId);
    const results = [];
    
    for (const position of positions) {
      const marginData = await marginCalculator.calculate(position);
      const shouldTrigger = marginData.distancePercentage < testConfig.threshold;
      
      results.push({
        positionId: position.id,
        currentMargin: marginData.currentMargin,
        distancePercentage: marginData.distancePercentage,
        wouldTrigger: shouldTrigger
      });
    }
    
    return {
      success: true,
      results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

## Troubleshooting

### Common Configuration Issues

#### Invalid Threshold Values

```typescript
async function validateThreshold(userId: string, threshold: number): Promise<boolean> {
  const user = await getUser(userId);
  const limitations = getPlanLimitations(user.planType);
  
  if (threshold < limitations.threshold.min) {
    throw new ValidationError(
      `Threshold too low. Minimum: ${limitations.threshold.min}%`
    );
  }
  
  if (threshold > limitations.threshold.max) {
    throw new ValidationError(
      `Threshold too high. Maximum: ${limitations.threshold.max}%`
    );
  }
  
  return true;
}
```

#### Position Not Found

```typescript
async function validatePositions(userId: string, positionIds: string[]): Promise<void> {
  const userPositions = await lnMarketsService.getPositions(userId);
  const userPositionIds = userPositions.map(p => p.id);
  
  const invalidPositions = positionIds.filter(id => !userPositionIds.includes(id));
  
  if (invalidPositions.length > 0) {
    throw new ValidationError(
      `Invalid positions: ${invalidPositions.join(', ')}`
    );
  }
}
```

#### Auto Actions Not Available

```typescript
async function validateAutoActions(userId: string, autoActions: AutoActions): Promise<void> {
  const user = await getUser(userId);
  const limitations = getPlanLimitations(user.planType);
  
  if (autoActions.enabled && !limitations.autoActions) {
    throw new ValidationError('Auto actions not available in your plan');
  }
  
  if (autoActions.closePosition && !limitations.autoActions.includes('closePosition')) {
    throw new ValidationError('Close position action not available in your plan');
  }
}
```

## Referências

- [Margin Guard Architecture](../architecture.md)
- [Margin Guard Plans](../../administration/plan-system/margin-guard-plans.md)
- [LN Markets Integration](../../integrations/external-apis/ln-markets/authentication.md)
- [User Plans](../../user-management/plan-limitations.md)

## Como Usar Este Documento

• **Para Usuários**: Use como guia para configurar o Margin Guard de acordo com seu plano e necessidades.

• **Para Desenvolvedores**: Use como referência para implementar novas funcionalidades de configuração.

• **Para Administradores**: Use para entender as limitações por plano e configurar o sistema adequadamente.
