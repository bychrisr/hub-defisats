# Cálculo de Margem com Taxas

> **Status**: Active  
> **Última Atualização**: 2025-01-12  
> **Versão**: 2.0.0  
> **Responsável**: Sistema de Automação Axisor  

## 💰 Fórmula Principal

### Margem Base
```typescript
const baseMargin = currentMargin * (addMarginPercentage / 100);
```

### Taxas da LN Markets
```typescript
const fees = {
  opening_fee: trade.opening_fee,
  closing_fee: trade.closing_fee,
  maintenance_margin: trade.maintenance_margin,
  sum_carry_fees: trade.sum_carry_fees
};
```

### Custo Total
```typescript
const totalCost = baseMargin + fees.opening_fee + fees.closing_fee + 
                  fees.maintenance_margin + fees.sum_carry_fees;
```

## 📊 Exemplo Prático

### Cenário: Adicionar 25% de Margem
- **Margem Atual**: 10,000 sats
- **Posição**: LONG BTC
- **Taxas da Posição**:
  - Opening Fee: 50 sats
  - Closing Fee: 50 sats
  - Maintenance Margin: 100 sats
  - Carry Fees: 25 sats

### Cálculos:
```typescript
// 1. Margem base a adicionar
const baseMargin = 10000 * (25 / 100); // = 2,500 sats

// 2. Taxas (proporcionais à margem adicional)
const proportionalOpeningFee = 50 * (2500 / 10000); // = 12.5 sats
const proportionalClosingFee = 50 * (2500 / 10000); // = 12.5 sats
const proportionalMaintenance = 100 * (2500 / 10000); // = 25 sats
const proportionalCarry = 25 * (2500 / 10000); // = 6.25 sats

// 3. Custo total
const totalCost = 2500 + 12.5 + 12.5 + 25 + 6.25; // = 2,556.25 sats
```

### Resultado:
- **Margem Adicionada**: 2,500 sats
- **Taxas**: 56.25 sats
- **Custo Total**: 2,556.25 sats

## 🧮 Implementação TypeScript

```typescript
interface MarginCalculation {
  baseMargin: number;
  fees: {
    opening_fee: number;
    closing_fee: number;
    maintenance_margin: number;
    sum_carry_fees: number;
  };
  totalCost: number;
  newMargin: number;
  newLiquidationPrice: number;
}

interface PositionFees {
  opening_fee: number;
  closing_fee: number;
  maintenance_margin: number;
  sum_carry_fees: number;
}

function calculateMarginWithFees(
  currentMargin: number,
  addMarginPercentage: number,
  positionFees: PositionFees,
  currentLiquidationPrice: number,
  entryPrice: number,
  side: 'b' | 's'
): MarginCalculation {
  
  // 1. Calcular margem base
  const baseMargin = currentMargin * (addMarginPercentage / 100);
  
  // 2. Calcular taxas proporcionais
  const feeRatio = baseMargin / currentMargin;
  
  const fees = {
    opening_fee: positionFees.opening_fee * feeRatio,
    closing_fee: positionFees.closing_fee * feeRatio,
    maintenance_margin: positionFees.maintenance_margin * feeRatio,
    sum_carry_fees: positionFees.sum_carry_fees * feeRatio
  };
  
  // 3. Calcular custo total
  const totalCost = baseMargin + 
                   fees.opening_fee + 
                   fees.closing_fee + 
                   fees.maintenance_margin + 
                   fees.sum_carry_fees;
  
  // 4. Nova margem total
  const newMargin = currentMargin + baseMargin;
  
  // 5. Calcular novo preço de liquidação
  const newLiquidationPrice = calculateNewLiquidationPrice(
    entryPrice,
    newMargin,
    side
  );
  
  return {
    baseMargin,
    fees,
    totalCost,
    newMargin,
    newLiquidationPrice
  };
}
```

## 📐 Cálculo do Novo Preço de Liquidação

### Fórmula para LONG (Buy)
```typescript
const newLiquidationPrice = entryPrice - (newMargin / positionSize);
```

### Fórmula para SHORT (Sell)
```typescript
const newLiquidationPrice = entryPrice + (newMargin / positionSize);
```

### Implementação:
```typescript
function calculateNewLiquidationPrice(
  entryPrice: number,
  newMargin: number,
  side: 'b' | 's',
  positionSize?: number
): number {
  // Se não temos o tamanho da posição, usar aproximação
  if (!positionSize) {
    // Assumir que 1 BTC = 100,000,000 sats
    positionSize = 100000000;
  }
  
  const marginPerUnit = newMargin / positionSize;
  
  return side === 'b' 
    ? entryPrice - marginPerUnit
    : entryPrice + marginPerUnit;
}
```

## 💡 Validações de Saldo

### Verificar Saldo Disponível
```typescript
async function validateBalance(userId: string, requiredAmount: number): Promise<boolean> {
  try {
    // 1. Buscar saldo do usuário
    const userBalance = await lnMarketsService.user.getBalance();
    
    // 2. Verificar se tem saldo suficiente
    const availableBalance = userBalance.available_balance || 0;
    
    // 3. Adicionar margem de segurança (5%)
    const safetyMargin = requiredAmount * 0.05;
    const totalRequired = requiredAmount + safetyMargin;
    
    if (availableBalance < totalRequired) {
      throw new Error(`Saldo insuficiente. Necessário: ${totalRequired} sats, Disponível: ${availableBalance} sats`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ MARGIN GUARD V2 - Balance validation failed:', error);
    return false;
  }
}
```

## 📊 Preview de Cálculo (Frontend)

### Interface do Usuário
```typescript
interface MarginPreview {
  currentMargin: number;
  marginToAdd: number;
  fees: {
    opening_fee: number;
    closing_fee: number;
    maintenance_margin: number;
    sum_carry_fees: number;
  };
  totalCost: number;
  newMargin: number;
  currentLiquidationPrice: number;
  newLiquidationPrice: number;
  distanceImprovement: number; // % de melhoria na distância
}

// Componente React
function MarginPreviewCard({ preview }: { preview: MarginPreview }) {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-green-100">
      <CardHeader>
        <CardTitle>💰 Simulação Real</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Margem Atual</Label>
              <p className="text-lg font-semibold">{preview.currentMargin.toLocaleString()} sats</p>
            </div>
            <div>
              <Label>Margem a Adicionar</Label>
              <p className="text-lg font-semibold text-green-600">
                +{preview.marginToAdd.toLocaleString()} sats
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label>Taxas Incluídas</Label>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Opening Fee:</span>
                <span>{preview.fees.opening_fee.toFixed(2)} sats</span>
              </div>
              <div className="flex justify-between">
                <span>Closing Fee:</span>
                <span>{preview.fees.closing_fee.toFixed(2)} sats</span>
              </div>
              <div className="flex justify-between">
                <span>Maintenance Margin:</span>
                <span>{preview.fees.maintenance_margin.toFixed(2)} sats</span>
              </div>
              <div className="flex justify-between">
                <span>Carry Fees:</span>
                <span>{preview.fees.sum_carry_fees.toFixed(2)} sats</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Custo Total</Label>
              <p className="text-xl font-bold text-red-600">
                {preview.totalCost.toLocaleString()} sats
              </p>
            </div>
            <div>
              <Label>Nova Margem</Label>
              <p className="text-xl font-bold text-green-600">
                {preview.newMargin.toLocaleString()} sats
              </p>
            </div>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              As taxas da LN Markets são descontadas automaticamente. 
              Certifique-se de ter saldo suficiente para cobrir o custo total.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
```

## ⚠️ Disclaimers Importantes

### 1. Taxas Proporcionais
- As taxas são calculadas proporcionalmente à margem adicional
- Isso pode não refletir exatamente as taxas reais da LN Markets
- Sempre há uma pequena margem de erro

### 2. Preço de Liquidação
- O novo preço de liquidação é uma estimativa
- Fatores como fees dinâmicas podem afetar o valor real
- A LN Markets recalcula automaticamente após a execução

### 3. Saldo Mínimo
- Sempre manter 5% de margem de segurança
- Considerar possíveis variações de preço durante a execução
- Taxas podem variar ligeiramente

## 🔄 API de Preview

### Endpoint
```typescript
POST /api/user/margin-guard/preview
```

### Request
```typescript
{
  position_id: string,
  margin_threshold: number,
  add_margin_percentage: number
}
```

### Response
```typescript
{
  trigger_price: number,
  margin_to_add: number,
  fees: {
    opening_fee: number,
    closing_fee: number,
    maintenance_margin: number,
    sum_carry_fees: number
  },
  total_cost: number,
  new_liquidation_price: number,
  distance_improvement: number
}
```

---

**Anterior**: [Cálculo de Distância](./01-distance-calculation.md)  
**Próximo**: [Boas Práticas](../internal-implementation/02-best-practices.md)
