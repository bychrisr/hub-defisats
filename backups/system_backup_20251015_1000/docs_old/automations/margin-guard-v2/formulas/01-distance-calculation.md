# Cálculo de Distância de Liquidação

> **Status**: Active  
> **Última Atualização**: 2025-01-12  
> **Versão**: 2.0.0  
> **Responsável**: Sistema de Automação Axisor  

## 📐 Fórmula Principal

### Distância Absoluta
```typescript
const distanceToLiquidation = Math.abs(entryPrice - liquidationPrice);
```

### Distância Percentual
```typescript
const distancePercentage = (distanceToLiquidation / liquidationPrice) * 100;
```

### Preço de Trigger
```typescript
const activationDistance = distanceToLiquidation * (1 - marginThreshold / 100);

const triggerPrice = trade.side === 'b' 
  ? liquidationPrice + activationDistance  // LONG: preço sobe para liquidação
  : liquidationPrice - activationDistance; // SHORT: preço desce para liquidação
```

## 🔍 Exemplo Prático

### Cenário: Posição LONG
- **Preço de Entrada**: $50,000
- **Preço de Liquidação**: $40,000
- **Threshold Configurado**: 10%

### Cálculos:
```typescript
// 1. Distância absoluta
const distanceToLiquidation = Math.abs(50000 - 40000); // = 10,000

// 2. Distância percentual
const distancePercentage = (10000 / 40000) * 100; // = 25%

// 3. Distância de ativação (10% da distância total)
const activationDistance = 10000 * (1 - 10/100); // = 9,000

// 4. Preço de trigger
const triggerPrice = 40000 + 9000; // = $49,000
```

### Resultado:
- **Quando BTC chegar a $49,000** (10% da distância de liquidação)
- **Margin Guard será acionado**
- **Adicionará margem configurada**

## 📊 Cenário: Posição SHORT

### Dados:
- **Preço de Entrada**: $50,000
- **Preço de Liquidação**: $60,000
- **Threshold Configurado**: 15%

### Cálculos:
```typescript
// 1. Distância absoluta
const distanceToLiquidation = Math.abs(50000 - 60000); // = 10,000

// 2. Distância percentual
const distancePercentage = (10000 / 60000) * 100; // = 16.67%

// 3. Distância de ativação (15% da distância total)
const activationDistance = 10000 * (1 - 15/100); // = 8,500

// 4. Preço de trigger
const triggerPrice = 60000 - 8500; // = $51,500
```

### Resultado:
- **Quando BTC subir para $51,500** (15% da distância de liquidação)
- **Margin Guard será acionado**

## ⚠️ Validações Importantes

### 1. Timestamp dos Dados
```typescript
// Sempre validar se os dados não são antigos
const dataAge = Date.now() - positionData.timestamp;
if (dataAge > 30000) { // 30 segundos
  throw new Error('Dados de mercado muito antigos');
}
```

### 2. Preços Válidos
```typescript
// Validar se os preços fazem sentido
if (liquidationPrice <= 0 || currentPrice <= 0) {
  throw new Error('Preços inválidos');
}

// Para LONG: liquidation < entry
// Para SHORT: liquidation > entry
const isValidLiquidation = trade.side === 'b' 
  ? liquidationPrice < entryPrice
  : liquidationPrice > entryPrice;

if (!isValidLiquidation) {
  throw new Error('Preço de liquidação inválido');
}
```

### 3. Threshold Mínimo
```typescript
// Evitar triggers muito próximos da liquidação
const minThreshold = 5; // 5% mínimo
if (marginThreshold < minThreshold) {
  throw new Error('Threshold muito baixo, risco de liquidação');
}
```

## 🧮 Implementação TypeScript

```typescript
interface LiquidationDistance {
  absolute: number;
  percentage: number;
  triggerPrice: number;
  activationDistance: number;
  isAtRisk: boolean;
}

function calculateLiquidationDistance(
  entryPrice: number,
  liquidationPrice: number,
  currentPrice: number,
  marginThreshold: number,
  side: 'b' | 's'
): LiquidationDistance {
  
  // 1. Validar dados
  if (liquidationPrice <= 0 || currentPrice <= 0) {
    throw new Error('Preços inválidos');
  }

  // 2. Calcular distância absoluta
  const absolute = Math.abs(entryPrice - liquidationPrice);
  
  // 3. Calcular distância percentual
  const percentage = (absolute / liquidationPrice) * 100;
  
  // 4. Calcular distância de ativação
  const activationDistance = absolute * (1 - marginThreshold / 100);
  
  // 5. Calcular preço de trigger
  const triggerPrice = side === 'b' 
    ? liquidationPrice + activationDistance
    : liquidationPrice - activationDistance;
  
  // 6. Verificar se está em risco
  const isAtRisk = side === 'b' 
    ? currentPrice >= triggerPrice
    : currentPrice <= triggerPrice;
  
  return {
    absolute,
    percentage,
    triggerPrice,
    activationDistance,
    isAtRisk
  };
}
```

## 📈 Casos de Uso Comuns

### Configuração Conservadora
- **Threshold**: 20%
- **Uso**: Mercados muito voláteis
- **Vantagem**: Muita margem de segurança
- **Desvantagem**: Execuções mais frequentes

### Configuração Agressiva
- **Threshold**: 5%
- **Uso**: Mercados estáveis
- **Vantagem**: Execuções menos frequentes
- **Desvantagem**: Menos margem de segurança

### Configuração Balanceada
- **Threshold**: 10-15%
- **Uso**: Maioria dos casos
- **Vantagem**: Equilíbrio entre segurança e eficiência

## 🔄 Atualizações em Tempo Real

O cálculo é executado a cada atualização de preço via WebSocket:

```typescript
// Listener do WebSocket
websocketManager.on('priceUpdate', (userId, priceData) => {
  // 1. Buscar posições ativas do usuário
  const positions = getUserActivePositions(userId);
  
  // 2. Para cada posição, recalcular distância
  positions.forEach(position => {
    const distance = calculateLiquidationDistance(
      position.entry_price,
      position.liquidation_price,
      priceData.price,
      position.margin_threshold,
      position.side
    );
    
    // 3. Se em risco, acionar proteção
    if (distance.isAtRisk) {
      triggerMarginGuard(userId, position, distance);
    }
  });
});
```

---

**Próximo**: [Margem com Taxas](./02-margin-with-fees.md)
