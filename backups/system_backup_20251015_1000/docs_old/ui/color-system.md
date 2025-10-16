# Sistema de Cores dos Cards do Dashboard

## 📋 Visão Geral

Este documento descreve o sistema de cores implementado nos cards do dashboard, garantindo uma experiência visual consistente e informativa para o usuário.

## 🎨 Princípios do Sistema

### 1. **Estado Inicial Neutro**
- **TODOS os cards** começam com fundo neutro (cinza) durante o carregamento
- **Transição suave** para cores específicas após receber dados da API
- **Feedback visual claro** sobre o estado de carregamento

### 2. **Cores Dinâmicas vs Fixas**
- **Cores dinâmicas**: Baseadas nos valores retornados pela API
- **Cores fixas**: Sempre as mesmas, independente dos valores
- **Cores neutras**: Para cards informativos que não precisam de feedback visual

### 3. **Sistema de Tooltips**
- **Ícone HelpCircle**: Sempre `text-muted-foreground` com hover `text-vibrant`
- **Tooltip**: Fundo escuro com gradiente (`from-gray-900/95 to-gray-800/95`)
- **Borda**: `border-gray-600/30` para contraste sutil
- **Z-index**: `z-[99999]` para garantir visibilidade acima de todos os elementos

## 🏷️ Categorização dos Cards

### **Cards com Cores Dinâmicas (Baseadas em Valores)**

#### **1. Total PnL**
- **Estado de Loading**: Cinza neutro
- **Valor Positivo**: Verde (sucesso/lucro)
- **Valor Negativo**: Vermelho (perda/prejuízo)
- **Lógica**: `getPnLColor(positionsData.totalPL)`

#### **2. Estimated Profit**
- **Estado de Loading**: Cinza neutro
- **Valor Positivo**: Verde (lucro estimado)
- **Valor Zero/Negativo**: Cinza (sem lucro estimado)
- **Lógica**: `getProfitColor(positionsData.estimatedProfit)`

#### **3. Active Trades**
- **Estado de Loading**: Cinza neutro
- **Trades Ativos**: Azul (atividade)
- **Sem Trades**: Cinza (inativo)
- **Lógica**: `getTradesColor(positionsData.positionCount)`

### **Cards com Cores Fixas**

#### **4. Total Margin**
- **Estado de Loading**: Cinza neutro
- **Estado Carregado**: Roxo (fixo)
- **Propósito**: Informação de margem disponível

#### **5. Estimated Fees**
- **Estado de Loading**: Cinza neutro
- **Estado Carregado**: Laranja (fixo)
- **Propósito**: Informação de taxas estimadas

### **Cards da Seção History**

#### **6. Available Margin**
- **Estado de Loading**: Cinza neutro
- **Valor Positivo**: Verde (disponível)
- **Valor Zero**: Cinza (vazio)
- **Lógica**: `(balanceData?.total_balance || 0) > 0`

#### **7. Estimated Balance**
- **Estado de Loading**: Cinza neutro
- **Valor Positivo**: Verde (positivo)
- **Valor Negativo**: Vermelho (negativo)
- **Valor Zero**: Cinza (neutro)
- **Lógica**: `estimatedBalance.data?.estimated_balance`

#### **8. Total Invested**
- **Estado de Loading**: Cinza neutro
- **Estado Carregado**: Azul (fixo)
- **Propósito**: Informação de investimento total

#### **9. Net Profit**
- **Estado de Loading**: Cinza neutro
- **Valor Positivo**: Verde (lucro)
- **Valor Negativo**: Vermelho (prejuízo)
- **Valor Zero**: Cinza (neutro)
- **Lógica**: `historicalMetrics?.totalProfit`

#### **10. Fees Paid**
- **Estado de Loading**: Cinza neutro
- **Estado Carregado**: Laranja (fixo)
- **Propósito**: Informação de taxas pagas

#### **11. Success Rate**
- **Estado de Loading**: Cinza neutro
- **≥ 50%**: Verde (bom)
- **≥ 30%**: Amarelo (regular)
- **< 30%**: Vermelho (ruim)
- **Lógica**: `historicalMetrics?.successRate`

#### **12. Total Profitability**
- **Estado de Loading**: Cinza neutro
- **Valor Positivo**: Verde (positivo)
- **Valor Negativo**: Vermelho (negativo)
- **Lógica**: Cálculo de percentual

#### **13. Total Trades**
- **Estado de Loading**: Cinza neutro
- **Estado Carregado**: Roxo (fixo)
- **Propósito**: Informação de trades totais

#### **14. Winning Trades**
- **Estado de Loading**: Cinza neutro
- **Estado Carregado**: Verde (fixo)
- **Propósito**: Informação de trades vencedores

#### **15. Lost Trades**
- **Estado de Loading**: Cinza neutro
- **Estado Carregado**: Vermelho (fixo)
- **Propósito**: Informação de trades perdedores

## 🔧 Implementação Técnica

### **Função de Cores Dinâmicas**

```typescript
const getPnLColor = (value: number) => {
  if (positionsLoading) return 'neutral';
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
};

const getProfitColor = (value: number) => {
  if (positionsLoading) return 'neutral';
  if (value > 0) return 'positive';
  return 'neutral';
};

const getTradesColor = (value: number) => {
  if (positionsLoading) return 'neutral';
  if (value > 0) return 'positive';
  return 'neutral';
};
```

### **Aplicação das Cores**

```typescript
// Exemplo para card com cores dinâmicas
<Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
  positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
  getPnLColor(positionsData.totalPL || 0) === 'positive' ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
  getPnLColor(positionsData.totalPL || 0) === 'negative' ? 'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30' :
  'gradient-card-gray border-gray-500 hover:border-gray-400'
}`}>

// Exemplo para card com cor fixa
<Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
  positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
  'gradient-card-purple border-purple-500 hover:border-purple-400 hover:shadow-purple-500/30'
}`}>
```

## 🎯 Quebra de Títulos

### **Função de Quebra Automática**

```typescript
const breakTitleIntoTwoLines = (title: string) => {
  const words = title.split(' ');
  if (words.length === 1) {
    // Se só tem uma palavra, adiciona quebra no meio
    const mid = Math.ceil(title.length / 2);
    return `${title.slice(0, mid)}<br>${title.slice(mid)}`;
  } else if (words.length === 2) {
    // Se tem duas palavras, quebra entre elas
    return `${words[0]}<br>${words[1]}`;
  } else {
    // Se tem mais de duas palavras, quebra no meio
    const mid = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, mid).join(' ');
    const secondLine = words.slice(mid).join(' ');
    return `${firstLine}<br>${secondLine}`;
  }
};
```

### **Aplicação nos Títulos**

```typescript
<CardTitle 
  className="text-h3 text-vibrant"
  dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total PnL') }}
/>
```

## 📊 Mapeamento de Cores

| Cor | Uso | Significado |
|-----|-----|-------------|
| **Cinza** | Loading/Neutro | Carregando dados ou valor neutro |
| **Verde** | Positivo/Sucesso | Lucro, valor positivo, atividade, trades vencedores |
| **Vermelho** | Negativo/Perda | Prejuízo, valor negativo, trades perdedores |
| **Azul** | Atividade/Info | Trades ativos, investimento total |
| **Roxo** | Informação | Margem total, trades totais (fixo) |
| **Laranja** | Aviso/Info | Taxas estimadas, taxas pagas (fixo) |
| **Amarelo** | Aviso/Regular | Taxa de sucesso regular (30-50%) |

## 🔄 Fluxo de Estados

### **1. Estado Inicial (Loading)**
```
Todos os cards → Cinza neutro
Ícones → Cinza neutro
```

### **2. Estado Carregado (Dados Recebidos)**
```
Cards dinâmicos → Cores baseadas nos valores
Cards fixos → Cores específicas
Ícones → Cores correspondentes
```

### **3. Transições**
- **Duração**: 300ms
- **Easing**: `transition-all duration-300`
- **Hover**: Efeitos de escala e sombra

## 🎨 Classes CSS Utilizadas

### **Backgrounds**
- `gradient-card-gray`: Fundo cinza neutro
- `gradient-card-green`: Fundo verde (positivo)
- `gradient-card-red`: Fundo vermelho (negativo)
- `gradient-card-blue`: Fundo azul (atividade)
- `gradient-card-purple`: Fundo roxo (fixo)
- `gradient-card-orange`: Fundo laranja (fixo)
- `gradient-card-yellow`: Fundo amarelo (regular)

### **Bordas**
- `border-gray-500`: Borda cinza (neutro)
- `border-green-500`: Borda verde (positivo)
- `border-red-500`: Borda vermelha (negativo)
- `border-blue-500`: Borda azul (atividade)
- `border-purple-500`: Borda roxa (fixo)
- `border-orange-500`: Borda laranja (fixo)
- `border-yellow-500`: Borda amarela (regular)

### **Ícones**
- `text-gray-300`: Ícone cinza (neutro)
- `text-green-300`: Ícone verde (positivo)
- `text-red-300`: Ícone vermelho (negativo)
- `text-blue-300`: Ícone azul (atividade)
- `text-purple-300`: Ícone roxo (fixo)
- `text-orange-300`: Ícone laranja (fixo)
- `text-yellow-300`: Ícone amarelo (regular)

## 💡 Sistema de Cores dos Tooltips

### Cores dos Ícones HelpCircle
- **Estado Normal**: `text-muted-foreground` (cinza suave)
- **Estado Hover**: `text-vibrant` (cor vibrante do tema)
- **Transição**: `transition-colors` para mudança suave

### Cores do Tooltip
- **Fundo**: `bg-gradient-to-br from-gray-900/95 to-gray-800/95` (gradiente escuro)
- **Borda**: `border-gray-600/30` (borda sutil)
- **Texto**: `text-white` (branco para contraste)
- **Sombra**: `shadow-2xl` (sombra forte)
- **Ring**: `ring-1 ring-gray-700/20` (anel sutil)

### Classes CSS dos Tooltips
```css
/* Ícone HelpCircle */
.help-icon {
  @apply w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors;
}

/* Tooltip */
.tooltip {
  @apply fixed z-[99999] px-4 py-3 text-sm text-white;
  @apply bg-gradient-to-br from-gray-900/95 to-gray-800/95;
  @apply border border-gray-600/30 rounded-xl shadow-2xl;
  @apply backdrop-blur-md whitespace-normal break-words;
  @apply ring-1 ring-gray-700/20;
}
```

## ✅ Benefícios do Sistema

1. **Consistência Visual**: Todos os cards seguem o mesmo padrão
2. **Feedback Imediato**: Usuário sabe quando dados estão carregando
3. **Informação Clara**: Cores transmitem significado instantâneo
4. **Experiência Suave**: Transições fluidas entre estados
5. **Acessibilidade**: Contraste adequado e significado semântico
6. **Manutenibilidade**: Código organizado e reutilizável
7. **Tooltips Informativos**: Sistema de ajuda integrado em todos os cards
8. **Visibilidade Garantida**: Portal React e z-index alto para tooltips sempre visíveis

## 🚀 Próximos Passos

- [ ] Implementar animações de loading mais sofisticadas
- [ ] Adicionar suporte a temas (dark/light)
- [ ] Criar variações de cores para diferentes tipos de usuário
- [ ] Implementar notificações visuais para mudanças críticas
- [ ] Adicionar suporte a cores personalizáveis pelo usuário
- [ ] Personalizar textos dos tooltips com informações específicas de cada card
- [ ] Implementar tooltips responsivos para dispositivos móveis
- [ ] Adicionar animações de entrada/saída dos tooltips

---

**Última Atualização**: Janeiro 2025  
**Versão**: 1.0  
**Autor**: Sistema de Dashboard Axisor
