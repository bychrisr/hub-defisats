# Exemplos de Código - Botão Salvar Automações

## 🚀 Solução Recomendada: Simplificação Radical

### 1. Hook Customizado para Detecção de Mudanças

```typescript
// hooks/useAutomationChanges.ts
import { useMemo, useRef, useEffect } from 'react';

interface MarginGuardSettings {
  enabled: boolean;
  threshold: number;
  reduction: number;
}

interface TakeProfitStopLossSettings {
  enabled: boolean;
  takeProfitPercent: number;
  stopLossPercent: number;
  trailingEnabled: boolean;
  trailingDistance: number;
}

export const useAutomationChanges = (
  marginGuard: MarginGuardSettings,
  tpsl: TakeProfitStopLossSettings,
  isDataLoaded: boolean
) => {
  const originalValuesRef = useRef<{
    marginGuard: MarginGuardSettings | null;
    tpsl: TakeProfitStopLossSettings | null;
  }>({ marginGuard: null, tpsl: null });

  // Função para definir valores originais
  const setOriginalValues = (marginGuard: MarginGuardSettings, tpsl: TakeProfitStopLossSettings) => {
    originalValuesRef.current = {
      marginGuard: { ...marginGuard },
      tpsl: { ...tpsl },
    };
    console.log('🔍 AUTOMATION - Original values set:', originalValuesRef.current);
  };

  // Detecção de mudanças usando useMemo
  const hasChanges = useMemo(() => {
    if (!isDataLoaded || !originalValuesRef.current.marginGuard || !originalValuesRef.current.tpsl) {
      console.log('🔍 AUTOMATION - No changes detected (not loaded or no original values)');
      return false;
    }

    const mgChanged = (
      marginGuard.enabled !== originalValuesRef.current.marginGuard.enabled ||
      marginGuard.threshold !== originalValuesRef.current.marginGuard.threshold ||
      marginGuard.reduction !== originalValuesRef.current.marginGuard.reduction
    );

    const tpslChanged = (
      tpsl.enabled !== originalValuesRef.current.tpsl.enabled ||
      tpsl.takeProfitPercent !== originalValuesRef.current.tpsl.takeProfitPercent ||
      tpsl.stopLossPercent !== originalValuesRef.current.tpsl.stopLossPercent ||
      tpsl.trailingEnabled !== originalValuesRef.current.tpsl.trailingEnabled ||
      tpsl.trailingDistance !== originalValuesRef.current.tpsl.trailingDistance
    );

    const hasRealChanges = mgChanged || tpslChanged;

    console.log('🔍 AUTOMATION - Change detection:', {
      marginGuard: { current: marginGuard, original: originalValuesRef.current.marginGuard, changed: mgChanged },
      tpsl: { current: tpsl, original: originalValuesRef.current.tpsl, changed: tpslChanged },
      hasChanges: hasRealChanges
    });

    return hasRealChanges;
  }, [marginGuard, tpsl, isDataLoaded]);

  return {
    hasChanges,
    setOriginalValues,
    originalValues: originalValuesRef.current
  };
};
```

### 2. Implementação na Página de Automações

```typescript
// pages/Automation.tsx
import { useState, useEffect } from 'react';
import { useAutomationChanges } from '@/hooks/useAutomationChanges';

export const Automation = () => {
  const {
    automations,
    fetchAutomations,
    createAutomation,
    updateAutomation,
    isLoading: storeLoading,
    error: storeError,
  } = useAutomationStore();

  const [marginGuard, setMarginGuard] = useState<MarginGuardSettings>({
    enabled: true,
    threshold: 90,
    reduction: 20,
  });

  const [tpsl, setTpsl] = useState<TakeProfitStopLossSettings>({
    enabled: true,
    takeProfitPercent: 8,
    stopLossPercent: 3,
    trailingEnabled: true,
    trailingDistance: 2,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Usar hook customizado
  const { hasChanges, setOriginalValues } = useAutomationChanges(
    marginGuard,
    tpsl,
    isDataLoaded
  );

  // Carregar automações existentes
  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  // Carregar configurações existentes das automações
  useEffect(() => {
    console.log('🔍 AUTOMATION - Loading configurations from store:', {
      automations,
      automationsLength: automations.length,
      storeLoading
    });

    const marginGuardAutomation = automations.find(a => a.type === 'margin_guard');
    const tpslAutomation = automations.find(a => a.type === 'tp_sl');

    const newMarginGuard = {
      enabled: marginGuardAutomation?.is_active || false,
      threshold: marginGuardAutomation?.config.margin_threshold || 90,
      reduction: marginGuardAutomation?.config.new_liquidation_distance || 20,
    };

    const newTpsl = {
      enabled: tpslAutomation?.is_active || false,
      takeProfitPercent: tpslAutomation?.config.take_profit_percentage || 8,
      stopLossPercent: tpslAutomation?.config.stop_loss_percentage || 3,
      trailingEnabled: tpslAutomation?.config.trailing_stop || false,
      trailingDistance: tpslAutomation?.config.trailing_percentage || 2,
    };

    console.log('🔍 AUTOMATION - New configurations:', {
      newMarginGuard,
      newTpsl
    });

    // Atualizar estado local
    setMarginGuard(newMarginGuard);
    setTpsl(newTpsl);

    // Definir valores originais
    setOriginalValues(newMarginGuard, newTpsl);

    // Marcar como carregado
    setIsDataLoaded(true);

    console.log('🔍 AUTOMATION - Data loaded successfully');
  }, [automations, setOriginalValues]);

  // Função de salvamento
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Salvar Margin Guard
      const marginGuardAutomation = automations.find(a => a.type === 'margin_guard');
      const marginGuardConfig = {
        margin_threshold: marginGuard.threshold,
        action: 'increase_liquidation_distance',
        new_liquidation_distance: marginGuard.reduction,
        enabled: marginGuard.enabled,
      };

      if (marginGuardAutomation) {
        await updateAutomation(marginGuardAutomation.id, {
          config: marginGuardConfig,
          is_active: marginGuard.enabled,
        });
      } else {
        await createAutomation({
          type: 'margin_guard',
          config: marginGuardConfig,
          is_active: marginGuard.enabled,
        });
      }

      // Salvar TP/SL
      const tpslAutomation = automations.find(a => a.type === 'tp_sl');
      const tpslConfig = {
        take_profit_percentage: tpsl.takeProfitPercent,
        stop_loss_percentage: tpsl.stopLossPercent,
        trailing_stop: tpsl.trailingEnabled,
        trailing_percentage: tpsl.trailingDistance,
        enabled: tpsl.enabled,
      };

      if (tpslAutomation) {
        await updateAutomation(tpslAutomation.id, {
          config: tpslConfig,
          is_active: tpsl.enabled,
        });
      } else {
        await createAutomation({
          type: 'tp_sl',
          config: tpslConfig,
          is_active: tpsl.enabled,
        });
      }
      
      // Atualizar valores originais após salvar
      setOriginalValues(marginGuard, tpsl);
      
      console.log('🔍 AUTOMATION - Save completed successfully');
      toast.success('Configurações salvas com sucesso!', {
        description: 'Suas configurações de automação foram salvas e estão ativas.',
        duration: 4000,
      });
      
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações', {
        description: error.message || 'Tente novamente em alguns instantes.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Conteúdo da página */}
      
      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading || storeLoading || !hasChanges}
          className={`px-6 py-2 ${
            hasChanges 
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isLoading || storeLoading ? 'Salvando...' : hasChanges ? 'Salvar Configurações' : 'Configurações Salvas'}
        </Button>
      </div>
    </div>
  );
};
```

### 3. Testes Unitários

```typescript
// __tests__/useAutomationChanges.test.ts
import { renderHook } from '@testing-library/react';
import { useAutomationChanges } from '@/hooks/useAutomationChanges';

describe('useAutomationChanges', () => {
  const mockMarginGuard = {
    enabled: true,
    threshold: 90,
    reduction: 20,
  };

  const mockTpsl = {
    enabled: true,
    takeProfitPercent: 8,
    stopLossPercent: 3,
    trailingEnabled: true,
    trailingDistance: 2,
  };

  it('should return false when data is not loaded', () => {
    const { result } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, false)
    );

    expect(result.current.hasChanges).toBe(false);
  });

  it('should return false when no original values are set', () => {
    const { result } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    expect(result.current.hasChanges).toBe(false);
  });

  it('should return true when margin guard enabled changes', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar enabled
    const changedMarginGuard = { ...mockMarginGuard, enabled: false };
    rerender();

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return true when threshold changes', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar threshold
    const changedMarginGuard = { ...mockMarginGuard, threshold: 85 };
    rerender();

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return false when values are the same', () => {
    const { result } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    expect(result.current.hasChanges).toBe(false);
  });
});
```

### 4. Testes de Integração

```typescript
// __tests__/Automation.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Automation } from '@/pages/Automation';

describe('Automation Integration', () => {
  it('should enable save button when margin guard is toggled', async () => {
    render(<Automation />);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Configurações Salvas')).toBeInTheDocument();
    });

    // Toggle margin guard
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // Verificar se botão fica enabled
    await waitFor(() => {
      expect(screen.getByText('Salvar Configurações')).toBeInTheDocument();
    });
  });

  it('should disable save button after saving', async () => {
    render(<Automation />);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Configurações Salvas')).toBeInTheDocument();
    });

    // Fazer mudança
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // Salvar
    const saveButton = screen.getByText('Salvar Configurações');
    fireEvent.click(saveButton);

    // Verificar se botão fica disabled
    await waitFor(() => {
      expect(screen.getByText('Configurações Salvas')).toBeInTheDocument();
    });
  });
});
```

## 🔧 Configuração de Desenvolvimento

### 1. Instalar Dependências de Teste

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 2. Configurar Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### 3. Setup de Testes

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
```

## 📊 Logs de Debug

### 1. Logs de Carregamento
```typescript
console.log('🔍 AUTOMATION - Loading configurations:', {
  automations: automations.length,
  marginGuardAutomation: marginGuardAutomation?.id,
  tpslAutomation: tpslAutomation?.id
});
```

### 2. Logs de Detecção
```typescript
console.log('🔍 AUTOMATION - Change detection:', {
  marginGuard: { current: marginGuard, original: originalValuesRef.current.marginGuard },
  tpsl: { current: tpsl, original: originalValuesRef.current.tpsl },
  hasChanges: hasChanges,
  isDataLoaded
});
```

### 3. Logs de Salvamento
```typescript
console.log('🔍 AUTOMATION - Save completed:', {
  newOriginalValues: originalValuesRef.current,
  hasChanges: false
});
```

## 🎯 Checklist de Implementação

- [ ] Criar hook `useAutomationChanges`
- [ ] Implementar na página `Automation.tsx`
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração
- [ ] Configurar logs de debug
- [ ] Testar cenários de usuário novo
- [ ] Testar cenários de usuário existente
- [ ] Testar cenários de refresh
- [ ] Testar cenários de salvamento
- [ ] Validar performance
- [ ] Documentar mudanças
