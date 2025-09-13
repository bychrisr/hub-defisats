# Guia de Estilos - CoinGecko Inspired

## 🎨 Visão Geral

Este guia documenta o sistema de design da aplicação Hub-defisats, inspirado na identidade visual do CoinGecko. A paleta de cores foi cuidadosamente selecionada para replicar a sensação moderna, vibrante e profissional do CoinGecko.

## 🌈 Paleta de Cores

### Cores Principais (Consistentes em Ambos os Temas)

| Cor | Hex | Uso | Exemplo |
|-----|-----|-----|---------|
| **Primária** | `#3773f5` | Botões primários, links, CTAs | Botão "Comprar" |
| **Secundária** | `#f5ac37` | Badges, alertas secundários, destaques | Badge "Premium" |
| **Sucesso** | `#0ecb81` | Valores positivos, confirmações | "+3.2%" |
| **Destrutiva** | `#f6465d` | Valores negativos, erros | "-1.5%" |

### Modo Claro (Light Mode)

| Elemento | Hex | Uso | Exemplo |
|----------|-----|-----|---------|
| **Fundo Principal** | `#ffffff` | Background da aplicação | Body, containers principais |
| **Texto Principal** | `#13161c` | Títulos, textos importantes | Headers, labels |
| **Texto Secundário** | `#62666f` | Textos auxiliares | Descriptions, subtitles |
| **Bordas** | `#e6e8ec` | Divisores, bordas | Separadores, cards |
| **Header** | `#f6f7f8` | Cabeçalhos de tabela | Table headers |
| **Cards** | `#f9fafb` | Fundo de cards | Card backgrounds |

### Modo Escuro (Dark Mode)

| Elemento | Hex | Uso | Exemplo |
|----------|-----|-----|---------|
| **Fundo Principal** | `#0d0f13` | Background da aplicação | Body, containers principais |
| **Cards** | `#16191d` | Fundo de cards/containers | Card backgrounds |
| **Cards Alt** | `#1a1d22` | Fundo alternativo | Hover states |
| **Texto Principal** | `#f1f3f4` | Títulos, textos importantes | Headers, labels |
| **Texto Secundário** | `#a8b0b8` | Textos auxiliares | Descriptions, subtitles |
| **Bordas** | `#21262d` | Divisores, bordas | Separadores, cards |
| **Header** | `#16191d` | Cabeçalhos de tabela | Table headers |

## 📝 Tipografia

### Fonte Principal: Inter
- **Família**: `Inter, system-ui, sans-serif`
- **Pesos disponíveis**: 400, 500, 600, 700
- **Não foi alterada** conforme especificação

### Fonte Monospace: JetBrains Mono
- **Família**: `JetBrains Mono, Fira Code, Monaco, monospace`
- **Uso**: Código, valores numéricos, dados técnicos

### Tamanhos de Fonte

| Tamanho | Classe | Pixels | Uso |
|---------|--------|--------|-----|
| **xs** | `text-xs` | 12px | Labels pequenos, badges |
| **sm** | `text-sm` | 14px | Texto secundário |
| **base** | `text-base` | 16px | Texto padrão |
| **lg** | `text-lg` | 18px | Subtítulos |
| **xl** | `text-xl` | 20px | Títulos pequenos |
| **2xl** | `text-2xl` | 24px | Títulos médios |
| **3xl** | `text-3xl` | 30px | Títulos grandes |
| **4xl** | `text-4xl` | 36px | Headers principais |

## 🎯 Uso Semântico das Cores

### Valores Financeiros
- **Positivos**: Sempre use `#0ecb81` (verde)
  - Exemplo: `+3.2%`, `+$150`, `Ganho`
- **Negativos**: Sempre use `#f6465d` (vermelho)
  - Exemplo: `-1.5%`, `-$75`, `Perda`

### Interações
- **Primária**: `#3773f5` para ações principais
  - Botões de compra/venda
  - Links importantes
  - CTAs principais
- **Secundária**: `#f5ac37` para ações secundárias
  - Badges de status
  - Alertas de atenção
  - Destaques especiais

### Estados
- **Sucesso**: `#0ecb81`
- **Erro**: `#f6465d`
- **Atenção**: `#f5ac37`
- **Info**: `#3773f5`

## 🧩 Componentes

### Botões

#### Primário
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Ação Principal
</Button>
```

#### Secundário
```tsx
<Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
  Ação Secundária
</Button>
```

### Cards

#### Card Padrão
```tsx
<CoinGeckoCard>
  <CardContent>
    Conteúdo do card
  </CardContent>
</CoinGeckoCard>
```

#### Card com Header
```tsx
<CoinGeckoCard variant="header">
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    Conteúdo
  </CardContent>
</CoinGeckoCard>
```

### Valores de Preço

#### Positivo
```tsx
<PriceChange value={3.2} />
// Resultado: +3.2% (verde)
```

#### Negativo
```tsx
<PriceChange value={-1.5} />
// Resultado: -1.5% (vermelho)
```

## 🔄 Transições

### Transições Padrão
- **Rápida**: `transition-all duration-200 ease-in-out`
- **Suave**: `transition-all duration-300 ease-in-out`
- **Lenta**: `transition-all duration-500 ease-in-out`

### Mudança de Tema
- **Duração**: 300ms
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Propriedades**: `background-color`, `border-color`, `color`

## 📱 Responsividade

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Classes Utilitárias
- `coingecko-card`: Card com estilo CoinGecko
- `coingecko-header`: Header de tabela
- `coingecko-positive`: Texto positivo
- `coingecko-negative`: Texto negativo
- `coingecko-primary`: Texto primário
- `coingecko-secondary`: Texto secundário

## 🎨 Gradientes

### Gradiente Primário
```css
background: linear-gradient(135deg, #3773f5, #2c5ce6);
```

### Gradiente Sucesso
```css
background: linear-gradient(135deg, #0ecb81, #0bb870);
```

### Gradiente Hero
```css
background: linear-gradient(135deg, #3773f5, #f5ac37);
```

## 🔧 Implementação Técnica

### CSS Variables
Todas as cores são definidas como variáveis CSS para facilitar a mudança de tema:

```css
:root {
  --primary: 220 100% 60%; /* #3773f5 */
  --success: 158 100% 40%; /* #0ecb81 */
  /* ... */
}
```

### Tailwind Classes
As cores são mapeadas para classes Tailwind:

```tsx
className="text-success" // Verde para valores positivos
className="text-destructive" // Vermelho para valores negativos
className="bg-primary" // Azul para fundos primários
```

### Hooks React
Use os hooks fornecidos para acessar as cores:

```tsx
import { useThemeColors, useThemeClasses } from '@/contexts/ThemeContext';

const { primary, success, destructive } = useThemeColors();
const { coingeckoPositive, coingeckoNegative } = useThemeClasses();
```

## 📋 Checklist de Implementação

- [x] Paleta de cores CoinGecko implementada
- [x] Sistema de temas light/dark
- [x] Tipografia Inter mantida
- [x] Componentes base atualizados
- [x] Transições suaves implementadas
- [x] Documentação criada
- [x] Design tokens definidos
- [x] Classes utilitárias criadas

## 🚀 Próximos Passos

1. Atualizar todos os componentes existentes
2. Implementar componentes específicos do CoinGecko
3. Criar templates de página
4. Adicionar animações específicas
5. Otimizar para acessibilidade
