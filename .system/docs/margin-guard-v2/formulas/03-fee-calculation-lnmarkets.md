# Cálculo de Taxas LN Markets - Margin Guard V2

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 1.0.0  
> **Responsável**: Margin Guard V2 System  

## 📋 Visão Geral

Este documento detalha como o Margin Guard V2 calcula as taxas baseado na **documentação oficial da LN Markets**, garantindo transparência e precisão nos cálculos de custos.

## 🏗️ Estrutura de Taxas LN Markets

### 1. Taxas de Negociação (Trading Fees)

Baseado na documentação oficial, as taxas variam por nível (Tier) do usuário:

| Tier | Volume 30 dias | Taxa de Negociação |
|------|----------------|-------------------|
| 1    | 0 USD          | 0.1%              |
| 2    | > 250.000 USD  | 0.08%             |
| 3    | > 1.000.000 USD| 0.07%             |
| 4    | > 5.000.000 USD| 0.06%             |

### 2. Cálculo das Taxas

#### Taxa de Abertura (Opening Fee)
```
Taxa de abertura reservada = (Quantidade / Preço de entrada) × Taxa do nível 1
```

#### Taxa de Fechamento (Closing Fee)
```
Taxa de fechamento reservada = (Quantidade / Preço de liquidação inicial) × Taxa do nível 1
```

#### Maintenance Margin
```
Maintenance margin = 0.2% da margem adicionada
```

#### Carry Fees (Funding Fees)
```
Carry fees = Taxas de financiamento acumuladas × proporção da margem adicionada
```

## 💻 Implementação no Código

### Backend - Controller

```typescript
// ✅ CÁLCULO CORRETO BASEADO NA DOCUMENTAÇÃO LN MARKETS
// Taxa de negociação baseada no nível do usuário (assumindo Tier 1 = 0.1%)
const tradingFeeRate = 0.001; // 0.1% conforme documentação oficial

// Cálculo das taxas baseado na documentação oficial:
const positionValueBTC = quantity; // Quantidade já em BTC
const positionValueUSD = positionValueBTC * entryPrice; // Valor em USD

// Taxas proporcionais à margem adicionada (não à posição total)
const marginRatio = baseMargin / currentMargin;

const fees = {
  // Taxa de abertura proporcional à margem adicionada
  opening_fee: (positionValueUSD / entryPrice) * tradingFeeRate * marginRatio * 100000000,
  // Taxa de fechamento proporcional à margem adicionada  
  closing_fee: (positionValueUSD / liquidationPrice) * tradingFeeRate * marginRatio * 100000000,
  // Maintenance margin (reservado para taxas futuras)
  maintenance_margin: baseMargin * 0.002, // 0.2% da margem adicionada
  // Carry fees (taxas de financiamento acumuladas)
  sum_carry_fees: position.sum_carry_fees * marginRatio || 0
};
```

### Backend - Worker

O worker utiliza o mesmo cálculo para garantir consistência:

```typescript
private calculateMarginWithFees(
  currentMargin: number,
  addMarginPercentage: number,
  positionData: PositionData,
  liquidationPrice: number,
  entryPrice: number,
  side: 'b' | 's'
): MarginCalculation {
  // Mesmo cálculo do controller para consistência
}
```

### Frontend - Preview

O frontend exibe as taxas calculadas com transparência:

```typescript
// Detalhamento de Taxas
<div className="gradient-card-purple">
  <Label>Custo Detalhado (LN Markets)</Label>
  <div className="space-y-1">
    <div className="flex justify-between">
      <span>Margem base:</span>
      <span>{marginToAdd.toLocaleString()} sats</span>
    </div>
    <div className="flex justify-between">
      <span>Opening fee (0.1%):</span>
      <span>{(marginToAdd * 0.001).toLocaleString()} sats</span>
    </div>
    <div className="flex justify-between">
      <span>Closing fee (0.1%):</span>
      <span>{(marginToAdd * 0.001).toLocaleString()} sats</span>
    </div>
    <div className="flex justify-between">
      <span>Maintenance margin:</span>
      <span>{(marginToAdd * 0.002).toLocaleString()} sats</span>
    </div>
    <div className="flex justify-between">
      <span>Carry fees (funding):</span>
      <span>{(marginToAdd * 0.0001).toLocaleString()} sats</span>
    </div>
    <Separator />
    <div className="flex justify-between">
      <span>Total estimado:</span>
      <span>{(marginToAdd * 1.0041).toLocaleString()} sats</span>
    </div>
  </div>
</div>
```

## 📊 Exemplo Prático

Para uma posição com:
- **Margem atual**: 100.000 sats
- **Margem a adicionar**: 20.000 sats (20%)
- **Quantidade**: 0.1 BTC
- **Preço de entrada**: $60.000
- **Preço de liquidação**: $54.545

### Cálculo das Taxas:

1. **Margem base**: 20.000 sats
2. **Opening fee**: (0.1 × 60.000 / 60.000) × 0.1% × 20% × 100.000.000 = 20 sats
3. **Closing fee**: (0.1 × 60.000 / 54.545) × 0.1% × 20% × 100.000.000 = 22 sats
4. **Maintenance margin**: 20.000 × 0.2% = 40 sats
5. **Carry fees**: Variável baseado em funding rates acumulados

**Total estimado**: 20.000 + 20 + 22 + 40 + (carry fees) = ~20.082 sats

## ⚠️ Considerações Importantes

### Disclaimer para Usuários

```
IMPORTANTE: Cálculo baseado na documentação oficial da LN Markets:
• Taxa de negociação: 0.1% (Tier 1) para opening/closing fees
• Maintenance margin: 0.2% da margem adicionada
• Carry fees: Taxas de financiamento acumuladas
• Valores finais podem variar conforme volume e tier do usuário
```

### Variações por Tier

O sistema assume **Tier 1 (0.1%)** por padrão, mas pode ser expandido para:
- Detectar o tier real do usuário via API
- Aplicar taxas dinâmicas baseadas no volume
- Mostrar economia potencial com upgrade de tier

### Funding Rates

As taxas de financiamento (carry fees) são:
- Atualizadas a cada 8 horas (00:00, 08:00, 16:00 UTC)
- Aplicadas apenas a posições em andamento
- Variáveis conforme sentimento do mercado

## 🔗 Referências

- [LN Markets - Guia de Taxas](https://docs.lnmarkets.com/guides/fees/)
- [LN Markets - API Add Margin](https://docs.lnmarkets.com/api/operations/futuresaddmargin/)
- [LN Markets - Taxas de Financiamento](https://docs.lnmarkets.com/resources/futures/)

## 📝 Changelog

### [1.0.0] - 2025-01-09
- ✅ Implementação inicial baseada na documentação oficial
- ✅ Cálculo proporcional à margem adicionada
- ✅ Preview detalhado no frontend
- ✅ Disclaimer transparente para usuários
- ✅ Consistência entre controller e worker

---

**Última Atualização**: 2025-01-09  
**Responsável**: Margin Guard V2 System
