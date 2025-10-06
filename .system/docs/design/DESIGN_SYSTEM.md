# 🎨 Design System - Axisor

## 📋 Visão Geral

Este documento complementa o Guia de Identidade Visual com especificações técnicas detalhadas, exemplos de código e diretrizes de implementação para o design system do Axisor.

---

## 🎯 Princípios de Design

### 1. Consistência
- Todos os componentes seguem os mesmos padrões visuais
- Uso consistente de cores, tipografia e espaçamentos
- Comportamento previsível em toda a aplicação

### 2. Acessibilidade
- Contraste mínimo de 4.5:1 para texto normal
- Contraste mínimo de 3:1 para texto grande
- Suporte a leitores de tela
- Navegação por teclado

### 3. Responsividade
- Mobile-first approach
- Breakpoints bem definidos
- Layouts adaptativos
- Touch-friendly em dispositivos móveis

### 4. Performance
- Animações suaves (60fps)
- Transições otimizadas
- Carregamento rápido
- Bundle size otimizado

---

## 🧩 Componentes Base

### Button Component

#### Variantes
```tsx
// Primary Button
<Button variant="default">Primary Action</Button>

// Secondary Button
<Button variant="secondary">Secondary Action</Button>

// Destructive Button
<Button variant="destructive">Delete</Button>

// Outline Button
<Button variant="outline">Cancel</Button>

// Ghost Button
<Button variant="ghost">Subtle Action</Button>

// Link Button
<Button variant="link">Learn More</Button>
```

#### Tamanhos
```tsx
// Small
<Button size="sm">Small</Button>

// Default
<Button size="default">Default</Button>

// Large
<Button size="lg">Large</Button>

// Icon
<Button size="icon"><Icon /></Button>
```

#### Estados
```tsx
// Normal
<Button>Normal State</Button>

// Hover
<Button className="hover:bg-primary/90">Hover State</Button>

// Focus
<Button className="focus:ring-2 focus:ring-primary">Focus State</Button>

// Disabled
<Button disabled>Disabled State</Button>

// Loading
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

### Card Component

#### Estrutura Básica
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Variantes de Card
```tsx
// Default Card
<Card className="bg-card border-border">

// Highlighted Card
<Card className="bg-card border-primary shadow-lg">

// Interactive Card
<Card className="bg-card hover:shadow-lg transition-shadow cursor-pointer">

// Compact Card
<Card className="bg-card p-4">
```

### Badge Component

#### Variantes
```tsx
// Default
<Badge>Default</Badge>

// Success
<Badge variant="success">+3.2%</Badge>

// Danger
<Badge variant="danger">-1.5%</Badge>

// Secondary
<Badge variant="secondary">Premium</Badge>

// Outline
<Badge variant="outline">New</Badge>
```

#### Uso em Contexto
```tsx
// Market Data
<div className="flex items-center space-x-2">
  <span>$50,000</span>
  <Badge variant="success">+2.5%</Badge>
</div>

// Status Indicators
<Badge variant="success">Active</Badge>
<Badge variant="danger">Inactive</Badge>
<Badge variant="secondary">Pending</Badge>
```

---

## 🎨 Especificações de Cores

### Implementação CSS

#### CSS Custom Properties
```css
:root {
  /* Light Mode */
  --background: 0 0% 100%;
  --foreground: 210 24% 8%;
  --primary: 220 100% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 38 100% 60%;
  --secondary-foreground: 0 0% 100%;
  --success: 158 100% 40%;
  --success-foreground: 0 0% 100%;
  --destructive: 350 100% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 210 20% 90%;
  --input: 210 20% 90%;
  --ring: 220 100% 60%;
  --card: 0 0% 100%;
  --card-foreground: 210 24% 8%;
  --popover: 0 0% 100%;
  --popover-foreground: 210 24% 8%;
  --muted: 210 8% 40%;
  --muted-foreground: 210 8% 60%;
  --accent: 210 20% 96%;
  --accent-foreground: 210 24% 8%;
}

.dark {
  /* Dark Mode */
  --background: 210 24% 8%;
  --foreground: 210 20% 96%;
  --primary: 220 100% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 38 100% 60%;
  --secondary-foreground: 0 0% 100%;
  --success: 158 100% 40%;
  --success-foreground: 0 0% 100%;
  --destructive: 350 100% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 210 20% 20%;
  --input: 210 20% 20%;
  --ring: 220 100% 60%;
  --card: 210 24% 8%;
  --card-foreground: 210 20% 96%;
  --popover: 210 24% 8%;
  --popover-foreground: 210 20% 96%;
  --muted: 210 8% 40%;
  --muted-foreground: 210 8% 60%;
  --accent: 210 20% 20%;
  --accent-foreground: 210 20% 96%;
}
```

#### Tailwind Classes
```css
/* Primary Colors */
.bg-primary { background-color: hsl(var(--primary)); }
.text-primary { color: hsl(var(--primary)); }
.border-primary { border-color: hsl(var(--primary)); }

/* Success Colors */
.bg-success { background-color: #0ecb81; }
.text-success { color: #0ecb81; }
.border-success { border-color: #0ecb81; }

/* Danger Colors */
.bg-danger { background-color: #f6465d; }
.text-danger { color: #f6465d; }
.border-danger { border-color: #f6465d; }
```

---

## 📝 Tipografia

### Font Loading
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Font Stack
```css
.font-sans {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.font-mono {
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
}
```

### Typography Scale
```css
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
```

---

## 📐 Layout System

### Container
```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Grid System
```tsx
// 1 Column (Mobile)
<div className="grid grid-cols-1 gap-4">

// 2 Columns (Tablet)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// 3 Columns (Desktop)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 4 Columns (Large Desktop)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

### Flexbox Utilities
```tsx
// Center Content
<div className="flex items-center justify-center">

// Space Between
<div className="flex items-center justify-between">

// Flex Column
<div className="flex flex-col space-y-4">

// Responsive Flex
<div className="flex flex-col md:flex-row md:space-x-4 md:space-y-0 space-y-4">
```

---

## 🎭 Animações e Transições

### Transition Classes
```css
.transition-fast { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.transition-smooth { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.transition-slow { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
```

### Hover Effects
```css
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(55, 115, 245, 0.1);
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(55, 115, 245, 0.3);
}

.hover-scale:hover {
  transform: scale(1.05);
}
```

### Loading Animations
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## 📱 Responsividade

### Breakpoints
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Responsive Utilities
```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">

// Show on mobile, hide on desktop
<div className="block md:hidden">

// Responsive text sizes
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## 🎯 Componentes Específicos

### Trading Cards
```tsx
<Card className="bg-card border-border hover:shadow-lg transition-shadow">
  <CardHeader className="pb-2">
    <div className="flex items-center justify-between">
      <CardTitle className="text-lg font-semibold">BTC/USD</CardTitle>
      <Badge variant="success">+2.5%</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Price</span>
        <span className="font-mono">$50,000</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">24h Change</span>
        <span className="font-mono text-success">+$1,250</span>
      </div>
    </div>
  </CardContent>
</Card>
```

### Navigation Items
```tsx
<Link
  to="/dashboard"
  className={cn(
    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
  )}
>
  <Icon className="h-4 w-4" />
  <span>Dashboard</span>
</Link>
```

### Status Indicators
```tsx
<div className="flex items-center space-x-2">
  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
  <span className="text-sm text-success font-medium">Live</span>
</div>
```

---

## 🔧 Implementação Técnica

### Design Tokens (TypeScript)
```typescript
export const designTokens = {
  colors: {
    primary: '#3773f5',
    secondary: '#f5ac37',
    success: '#0ecb81',
    destructive: '#f6465d',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(55, 115, 245, 0.05)',
    md: '0 4px 6px -1px rgba(55, 115, 245, 0.1)',
    lg: '0 10px 15px -3px rgba(55, 115, 245, 0.1)',
    glow: '0 0 20px rgba(55, 115, 245, 0.3)',
  },
} as const;
```

### Utility Functions
```typescript
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const getColorValue = (color: string, theme: 'light' | 'dark') => {
  const colorMap = {
    primary: '#3773f5',
    secondary: '#f5ac37',
    success: '#0ecb81',
    destructive: '#f6465d',
  };
  return colorMap[color as keyof typeof colorMap] || color;
};
```

---

## 📋 Checklist de Implementação

### ✅ Componentes Base
- [ ] Button (todas as variantes)
- [ ] Card (header, content, footer)
- [ ] Badge (todas as variantes)
- [ ] Input (text, email, password)
- [ ] Select (dropdown, multi-select)
- [ ] Checkbox (single, group)
- [ ] Radio (single, group)
- [ ] Switch (toggle)
- [ ] Modal (dialog, alert)
- [ ] Tooltip (hover, click)

### ✅ Layout Components
- [ ] Container (responsive)
- [ ] Grid (1-4 columns)
- [ ] Flex (directions, alignment)
- [ ] Spacer (margins, padding)
- [ ] Divider (horizontal, vertical)

### ✅ Navigation Components
- [ ] Header (desktop, mobile)
- [ ] Sidebar (collapsible)
- [ ] Breadcrumb
- [ ] Pagination
- [ ] Tabs (horizontal, vertical)

### ✅ Data Display
- [ ] Table (sortable, filterable)
- [ ] List (ordered, unordered)
- [ ] Avatar (image, initials)
- [ ] Progress (linear, circular)
- [ ] Chart (line, bar, pie)

### ✅ Feedback Components
- [ ] Alert (success, error, warning, info)
- [ ] Toast (notification)
- [ ] Loading (spinner, skeleton)
- [ ] Empty State
- [ ] Error Boundary

---

## 🎨 Exemplos de Uso

### Dashboard Layout
```tsx
<div className="min-h-screen bg-background">
  <Header />
  <div className="container mx-auto px-4 py-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard title="Total PnL" value="$1,250" change="+2.5%" />
      <MetricCard title="Active Trades" value="3" change="+1" />
      <MetricCard title="Success Rate" value="87%" change="+5%" />
      <MetricCard title="Total Volume" value="$50K" change="+12%" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeList />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <MarketChart />
        </CardContent>
      </Card>
    </div>
  </div>
</div>
```

### Form Layout
```tsx
<Card className="max-w-md mx-auto">
  <CardHeader>
    <CardTitle>Create New Trade</CardTitle>
    <CardDescription>Configure your trading parameters</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label htmlFor="pair">Trading Pair</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select pair" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="btc-usd">BTC/USD</SelectItem>
          <SelectItem value="eth-usd">ETH/USD</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label htmlFor="amount">Amount</Label>
      <Input id="amount" type="number" placeholder="0.00" />
    </div>
    <div className="flex items-center space-x-2">
      <Checkbox id="auto-close" />
      <Label htmlFor="auto-close">Auto-close on profit</Label>
    </div>
  </CardContent>
  <CardFooter className="flex justify-end space-x-2">
    <Button variant="outline">Cancel</Button>
    <Button>Create Trade</Button>
  </CardFooter>
</Card>
```

---

## 📞 Suporte e Recursos

### Documentação
- **Guia de Identidade Visual**: `/docs/BRAND_GUIDE.md`
- **Design System**: `/docs/DESIGN_SYSTEM.md`
- **Componentes**: `/components/ui/`
- **Tokens**: `/lib/design-tokens.ts`

### Ferramentas
- **Figma**: Link para o design system
- **Storybook**: Componentes interativos
- **Chromatic**: Testes visuais
- **Lighthouse**: Performance e acessibilidade

### Contato
- **Design Team**: design@hubdefisats.com
- **Dev Team**: dev@hubdefisats.com
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2025  
**Responsável**: Equipe de Design Hub DeFiSats
