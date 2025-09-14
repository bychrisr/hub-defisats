# Hub-defisats - LN Markets Automation Platform

## 🎯 Status Atual

**Versão**: v1.2.3  
**Status**: Plataforma Completa de Trading com Sistema de Administração Avançado  
**Última Atualização**: 2025-09-14

## ✅ Funcionalidades Implementadas

### 🔐 Sistema de Autenticação
- ✅ **Registro de usuários** com validação robusta
- ✅ **Login seguro** com JWT tokens
- ✅ **Detecção automática de admin** baseada em email
- ✅ **Redirecionamento inteligente**: Admin → `/admin`, Usuários → `/dashboard`
- ✅ **Proteção de rotas** com verificação de permissões

### 📊 Dashboard Admin
- ✅ **KPIs em tempo real** (usuários, trades, receita)
- ✅ **Gráficos interativos** com dados do backend
- ✅ **Filtros por período** (1h, 24h, 7d, 30d)
- ✅ **Atualização automática** de dados
- ✅ **Interface responsiva** e moderna

### 🔄 Sistema de Dados em Tempo Real (v0.2.1)
- ✅ **WebSocket Integration** para dados de mercado ao vivo
- ✅ **Atualização Periódica** automática a cada 5 segundos
- ✅ **Atualizações Silenciosas** sem recarregar a página
- ✅ **Dados Reais LN Markets** sem simulação
- ✅ **Indicador de Status** com melhor contraste e legibilidade
- ✅ **Feedback Visual** para operações em background
- ✅ **Gerenciamento de Estado** centralizado com Context API
- ✅ **Dados Corretos**: Margin Ratio, Trading Fees e Funding Cost exibem valores corretos
- ✅ **Consistência**: Dados iniciais e atualizações em tempo real são idênticos
- ✅ **Sistema Funcional**: Totalmente operacional sem corrupção de dados

### 🎫 Sistema de Cupons (v0.3.0)
- ✅ **CRUD Completo** para administração de cupons
- ✅ **3 Variáveis Principais**: Tempo (fixo/vitalício), Valor (fixo/percentual), Funcionalidade (5 planos)
- ✅ **Ativação/Desativação** instantânea de cupons
- ✅ **Dashboard Avançado** com métricas e gráficos interativos
- ✅ **Analytics Detalhados** (views, clicks, uses, conversão)
- ✅ **Rastreamento de Novos Usuários** atraídos por cupons
- ✅ **Receita Economizada** em tempo real
- ✅ **Interface Responsiva** para desktop e mobile
- ✅ **Validação Completa** no backend e frontend
- ✅ **Documentação Detalhada** do sistema

### 🚀 Sistema de Upgrade de Usuários (v1.2.0)
- ✅ **Administração de Planos** com upgrade/downgrade de usuários
- ✅ **5 Tipos de Plano**: free, basic, advanced, pro, lifetime
- ✅ **Histórico de Upgrades** com rastreamento completo
- ✅ **Validação Robusta** com motivos obrigatórios
- ✅ **Interface Admin** para gerenciamento de usuários
- ✅ **Controle de Acesso** baseado em permissões
- ✅ **Auditoria Completa** de alterações de plano

### 📊 Sistema de Posições em Tempo Real (v1.2.3)
- ✅ **Tracking de P&L** em tempo real via LN Markets
- ✅ **Favicon Dinâmico** baseado no status de lucro/prejuízo
- ✅ **Títulos de Página** com informações de P&L
- ✅ **Context de Posições** centralizado
- ✅ **Atualizações Automáticas** a cada 5 segundos
- ✅ **Tratamento de Erros** robusto
- ✅ **Integração LN Markets** completa
- ✅ **Sincronização de Dados** entre contextos corrigida
- ✅ **Header Dinâmico** com índice, trading fees, next funding e rate atualizados

### 🎛️ Sistema de Menus Dinâmicos (v1.2.0)
- ✅ **Configuração Dinâmica** de menus via admin
- ✅ **Estrutura Hierárquica** de navegação
- ✅ **Controle de Visibilidade** baseado em permissões
- ✅ **Interface de Administração** para gerenciar menus
- ✅ **Configuração de Páginas** dinâmica
- ✅ **Sistema de Roles** integrado
- ✅ **Seed Scripts** para dados iniciais

### 🔧 Melhorias na API (v1.2.3)
- ✅ **Correção de Serialização** JSON dupla
- ✅ **Headers Corretos** em requisições
- ✅ **Resolução de Erros 400** em upgrades
- ✅ **Integração Axios** melhorada
- ✅ **Logging Detalhado** de requisições
- ✅ **Rate Corrigido** de 0.002% para 0.001%
- ✅ **Sincronização de Contextos** corrigida
- ✅ **Dados em Tempo Real** funcionando perfeitamente

### 🧭 Navegação Responsiva (v0.3.0)
- ✅ **Menu Desktop** centralizado com perfil de usuário
- ✅ **Menu Mobile** fixo na parte inferior (estilo CoinGecko)
- ✅ **Drawer Lateral** para configurações e opções
- ✅ **Navegação Intuitiva** entre todas as páginas
- ✅ **Design Consistente** em todos os dispositivos
- ✅ **Tema Dark/Light** com persistência

### 📈 Gráficos e Visualizações (v0.3.0)
- ✅ **Gráfico LN Markets Style** com design autêntico
- ✅ **Dados de Mercado em Tempo Real** via WebSocket
- ✅ **Integração CoinGecko** para preços BTC
- ✅ **Charts Interativos** com Recharts
- ✅ **Visualizações Responsivas** para mobile
- ✅ **Tema Adaptativo** (dark/light)

### 🛠️ Infraestrutura
- ✅ **Backend Node.js** com Fastify
- ✅ **Frontend React** com Vite
- ✅ **Banco PostgreSQL** com Prisma ORM
- ✅ **Cache Redis** para performance
- ✅ **Docker Compose** para desenvolvimento
- ✅ **Sistema de logs** detalhado

## 🎨 Identidade Visual (CoinGecko Inspired)

A aplicação utiliza uma paleta de cores inspirada no CoinGecko, mantendo a tipografia Inter conforme especificado.

## 🧭 UI/UX: Menu Responsivo

### 📱 Estrutura de Navegação

A aplicação implementa um sistema de navegação responsivo que replica exatamente o design do CoinGecko:

#### 🖥️ **Desktop (≥ 768px)**
- **Menu Superior Fixo**: `position: sticky` com suporte a tema claro/escuro
- **Layout Perfeitamente Centralizado**: Menu de navegação centralizado horizontalmente e verticalmente usando `absolute left-1/2 transform -translate-x-1/2` e `h-16 items-center justify-center`
- **Itens de Navegação**: Dashboard, Automations, Positions, Backtests, Reports
- **Área do Usuário**: 
  - **Notificações**: Ícone de sino para alertas (estilo simplificado)
  - **Perfil do Usuário**: Avatar com dropdown contendo:
    - **Profile**: Acesso ao perfil do usuário (configurações centralizadas)
    - **Idioma**: Seleção entre Português (BR) e English (US)
    - **Moeda**: Seleção entre SATS e USD
    - **Tema**: Alternância entre Claro, Escuro e Sistema
    - **Logout**: Sair da aplicação
  - **Informações**: Email e tipo de plano do usuário
- **Tipografia**: Inter, 14px, maiúsculas, espaçamento uniforme
- **Tema Adaptativo**: 
  - **Claro**: Fundo branco (#ffffff), texto escuro (#13161c)
  - **Escuro**: Fundo cinza escuro (#111827), texto claro (#f9fafb)
- **Borda**: Sutil na parte inferior com cor adaptativa ao tema
- **Comportamento**: Permanece visível ao rolar a página

#### 📱 **Mobile (< 768px)**
- **Menu Inferior Fixo**: `position: fixed, bottom: 0` com fundo branco
- **6 Ícones com Rótulos**:
  - 🏠 **Home** → `/dashboard`
  - ⚡ **Automations** → `/automation`
  - 📊 **Positions** → `/trades`
  - 📈 **Backtests** → `/backtests`
  - 📋 **Reports** → `/reports`
  - ⚙️ **Menu** → Dropdown com todas as opções
- **Design**: Ícones pretos (#13161c), 24px, rótulos cinza (#62666f), Inter 12px
- **Item Ativo**: Azul (#3773f5) com sublinha fina
- **Dimensões**: 60px altura, largura total da tela
- **Bordas**: Apenas superior (`border-top: 1px solid #e6e8ec`)

#### ⚙️ **Menu Mobile Avançado (Drawer)**
O item "Menu" no mobile abre um drawer lateral que replica exatamente o design do CoinGecko:

**🎨 Design do Drawer:**
- **Header**: Logo defiSATS + botão X para fechar
- **Navegação Principal**: Seções expansíveis com ícones + (chevron)
  - Criptomoedas, Câmbios, NFT, Informação, Produtos, API
- **Seção do Usuário**: Links pessoais com ícones coloridos
  - Os meus Candies (ícone roxo), A minha carteira (ícone amarelo), A minha conta (ícone cinza)
- **Configurações Inferiores**: 3 botões horizontais
  - 🌐 **Idioma**: PT-BR/EN-US
  - 💰 **Moeda**: USD/SATS
  - 🌓 **Tema**: Claro/Escuro

**📱 Comportamento:**
- **Abertura**: Desliza da esquerda para direita
- **Backdrop**: Fundo escuro semi-transparente
- **Fechamento**: Toque no backdrop ou botão X
- **Seções Expansíveis**: Animações suaves com rotação do chevron

### 🎯 **Componentes Implementados**

```typescript
// Estrutura de Componentes
components/layout/
├── DesktopNavigation.tsx    // Menu superior para desktop
├── MobileNavigation.tsx     // Menu inferior para mobile
└── ResponsiveLayout.tsx     // Layout responsivo principal
```

### 📐 **Padronização de Larguras da Dashboard**

#### 🎯 **Largura Consistente**
- **Container Principal**: `max-w-4xl mx-auto` para largura fixa e centralizada
- **Cards de Estatísticas**: Grid responsivo `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` com `gap-4`
- **Quick Actions**: Grid `grid-cols-1 lg:grid-cols-2` com `gap-4`
- **Botões Internos**: Grid `grid-cols-1 sm:grid-cols-2` com `gap-3`
- **Automation Overview**: Grid `grid-cols-1 md:grid-cols-3` com `gap-3`
- **Gráfico de Preços BTC**: Mesma largura que todos os outros cards

#### 📊 **Gráfico LN Markets Style**
- **Componente**: `LNMarketsChart` com design inspirado na LN Markets
- **Funcionalidades**:
  - **Timeframe Selector**: 1m, 5m, 15m, 1h, 4h, 1d
  - **Chart Tools**: Crosshair, Magnet, Ruler, Text, Shapes, Lock, Eye, Trash
  - **Indicators**: fx Indicators button
  - **Undo/Redo**: Controles de desfazer/refazer
  - **Fullscreen**: Modo tela cheia
  - **Live Data**: Conexão WebSocket em tempo real
  - **Volume**: Gráfico de volume integrado
  - **OHLC Display**: Open, High, Low, Close com badges
  - **Price Change**: Indicador de mudança de preço com cores
- **Estilo**:
  - **Cores**: Verde (#00d4aa) e Vermelho (#ff6b6b) da LN Markets
  - **Grid**: Linhas pontilhadas para melhor visualização
  - **Crosshair**: Modo normal com linhas tracejadas
  - **Font**: Inter para consistência visual
- **Responsividade**: Adapta-se perfeitamente ao container

### 📈 **Sistema de Gráficos Avançado**

#### 🎯 **Componente Principal: LNMarketsChart**
- **Arquivo**: `frontend/src/components/charts/LNMarketsChart.tsx`
- **Base**: `lightweight-charts` com customizações avançadas
- **Inspiração**: Interface da LN Markets para máxima familiaridade

#### 🛠️ **Ferramentas de Gráfico**
```typescript
// Timeframe Selector
['1m', '5m', '15m', '1h', '4h', '1d']

// Chart Tools
Crosshair, Magnet, Ruler, Text, Shapes, Lock, Eye, Trash

// Controles
Undo/Redo, Play/Pause, Refresh, Fullscreen, Indicators
```

#### 🎨 **Design System**
- **Cores**: Verde (#00d4aa) e Vermelho (#ff6b6b) da LN Markets
- **Grid**: Linhas pontilhadas para melhor visualização
- **Crosshair**: Modo normal com linhas tracejadas
- **Font**: Inter para consistência visual
- **Layout**: Header com controles, área de gráfico, footer com volume

#### 📊 **Funcionalidades Avançadas**
- **WebSocket**: Dados em tempo real via WebSocket
- **Volume**: Gráfico de volume integrado com cores
- **OHLC**: Display de Open, High, Low, Close com badges
- **Price Change**: Indicador de mudança de preço com cores
- **Responsive**: Adapta-se perfeitamente ao container
- **Theme**: Suporte completo a tema claro/escuro
- **Real Data**: Dados reais da LN Markets via API
- **Historical Data**: Dados históricos para análise técnica

#### 🔧 **Configuração**
```typescript
<LNMarketsChart 
  symbol="BTCUSD: LNM Futures"
  height={400}
  showControls={true}
/>
```

#### 📊 **Exibição na Dashboard**
- **Localização**: Dashboard principal (`/dashboard`)
- **Layout**: Gráfico sem Card wrapper, igual ao da LN Markets
- **Integração**: Usa `SimpleChart` que renderiza `LNMarketsChart`
- **Largura**: Segue o padrão `max-w-4xl mx-auto` da dashboard
- **Responsividade**: Adapta-se perfeitamente ao container
- **Altura**: 500px para melhor visualização

#### 🔧 **Correções Implementadas**
- **API Routes**: Criadas rotas `/api/market/historical` e `/api/market/data`
- **Backend Integration**: Integração com LN Markets API para dados reais
- **Authentication**: Headers de autenticação para requisições
- **Error Handling**: Tratamento de erros e fallback para dados simulados
- **Real-time Updates**: Dados atualizados em tempo real via WebSocket
- **Price Accuracy**: Preços reais refletidos no gráfico
- **Route Update**: Alterada rota de `/trades` para `/positions`
- **Dashboard Card**: Terceiro card atualizado para "Margem Disponível"
- **Auth Redirect**: Usuários autenticados redirecionados de `/login` e `/register` para `/dashboard`

### 🔄 **Mudanças de Rota e Interface**

#### 📍 **Atualização de Rotas**
- **Antes**: `/trades` → **Agora**: `/positions`
- **Arquivo**: `Trades.tsx` renomeado para `Positions.tsx`
- **Navegação**: Atualizada em desktop e mobile
- **Consistência**: Mantida em toda a aplicação

#### 💰 **Card de Margem Disponível**
- **Posição**: Terceiro card na dashboard
- **Dados**: Mostra saldo disponível em BTC e sats
- **Fonte**: `userBalance.available_balance` da LN Markets
- **Formato**: BTC (8 decimais) e sats (2 decimais)
- **Ícone**: `DollarSign` para representar valor monetário

#### 🔐 **Redirecionamento de Autenticação**
- **Comportamento**: Usuários autenticados são redirecionados automaticamente
- **Rotas afetadas**: `/login` e `/register`
- **Destino**: `/dashboard` (com `replace` para limpar histórico)
- **Lógica**: Verifica `isAuthenticated` e `isInitialized` antes de permitir acesso
- **Logs**: Console logs para debug do redirecionamento

### 🔧 **Funcionalidades do Dropdown do Usuário**

#### 🌐 **Seleção de Idioma**
- **Português (BR)**: 🇧🇷 Interface em português brasileiro
- **English (US)**: 🇺🇸 Interface em inglês americano
- **Estado**: Gerenciado via `useState` com persistência futura

#### 💰 **Seleção de Moeda**
- **SATS**: ₿ Exibição em satoshis (Bitcoin)
- **USD**: $ Exibição em dólares americanos
- **Estado**: Gerenciado via `useState` com persistência futura

#### 🎨 **Alternância de Tema**
- **Claro**: ☀️ Tema claro com fundo branco
- **Escuro**: 🌙 Tema escuro com fundo cinza escuro
- **Sistema**: 🖥️ Segue as preferências do sistema operacional
- **Ícones**: Dinâmicos baseados no tema atual
- **Integração**: Usa `useTheme` context existente

#### 🔔 **Ícone de Notificações**
- **Estilo**: Simplificado com `size="icon"` e `h-9 w-9`
- **Hover**: Efeito suave com mudança de cor e fundo
- **Tema**: Adaptativo (claro/escuro)
- **Tamanho**: Ícone `h-4 w-4` para melhor proporção

### 🎨 **Classes Tailwind Utilizadas**

```css
/* Desktop - Layout Perfeitamente Centralizado */
sticky top-0 z-50 w-full border-b transition-colors duration-200
absolute left-1/2 transform -translate-x-1/2  /* Centralização horizontal */
flex items-center justify-center space-x-8 h-16  /* Centralização vertical */
text-sm uppercase tracking-wide
text-[#3773f5] hover:text-[#2c5aa0]

/* Desktop - Tema Adaptativo */
bg-white border-[#e6e8ec]  /* Modo claro */
bg-gray-900 border-gray-700  /* Modo escuro */
text-[#13161c] hover:text-[#3773f5]  /* Modo claro */
text-gray-300 hover:text-[#3773f5]  /* Modo escuro */

/* Desktop - Dropdown do Usuário */
h-9 w-9  /* Botão de notificações */
h-4 w-4  /* Ícones internos */
hover:bg-gray-100  /* Hover modo claro */
hover:bg-gray-800  /* Hover modo escuro */

/* Desktop - Submenu Dropdown */
DropdownMenuSub  /* Submenu para Idioma/Moeda/Tema */
DropdownMenuSubTrigger  /* Trigger do submenu */
DropdownMenuSubContent  /* Conteúdo do submenu */

/* Desktop - Área do Usuário */
ml-auto flex items-center space-x-4  /* Alinha à direita */
h-8 w-8 rounded-full  /* Avatar circular */
w-56 bg-white border-gray-200  /* Dropdown menu */

/* Mobile */
fixed bottom-0 left-0 right-0 bg-white border-t border-[#e6e8ec]
flex justify-around items-center h-15
text-xs text-[#62666f] hover:text-[#3773f5]
```

### 🔄 **Integração com React Router**

- **Navegação Suave**: Todos os links funcionam com React Router
- **Estados Ativos**: Detecção automática da rota atual
- **Transições**: Animações suaves entre páginas
- **Responsividade**: Menu se adapta automaticamente ao tamanho da tela

### 📱 **Experiência do Usuário**

- **Desktop**: Navegação horizontal intuitiva com acesso rápido a todas as funcionalidades
- **Mobile**: Menu inferior acessível com polegar, sem obstruir conteúdo
- **Consistência**: Design idêntico ao CoinGecko em ambos os modos
- **Acessibilidade**: Contraste adequado e tamanhos de toque otimizados

### 🌈 Paleta de Cores

#### Modo Claro (Light Mode)
- **Primária (botões, links, interações)**: `#3773f5` (CoinGecko Blue)
- **Secundária (destaques, badges)**: `#f5ac37` (CoinGecko Orange)
- **Fundo principal**: `#ffffff`
- **Texto principal**: `#13161c`
- **Texto secundário**: `#62666f`
- **Alta (positivo, verde)**: `#0ecb81`
- **Baixa (negativo, vermelho)**: `#f6465d`
- **Linhas/divisores**: `#e6e8ec`
- **Fundo cabeçalho tabela**: `#f6f7f8`
- **Fundo cards (alternativo)**: `#f9fafb`

#### Modo Escuro (Dark Mode)
- **Primária (mantenha consistência)**: `#3773f5`
- **Secundária (mantenha consistência)**: `#f5ac37`
- **Fundo principal**: `#0d0f13`
- **Fundo cards/containers**: `#16191d`
- **Texto principal**: `#f1f3f4` (melhor contraste)
- **Texto secundário**: `#a8b0b8` (melhor contraste)
- **Alta (positivo, verde)**: `#0ecb81`
- **Baixa (negativo, vermelho)**: `#f6465d`
- **Linhas/divisores**: `#21262d`
- **Fundo cabeçalho tabela**: `#16191d`
- **Fundo cards (alternativo)**: `#1a1d22`

### 📝 Tipografia
- **Fonte principal**: Inter (mantida conforme especificação)
- **Fonte monospace**: JetBrains Mono
- **Pesos**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### 🎯 Uso Semântico das Cores
- `#0ecb81` para todos os valores positivos (ex: +3.2%)
- `#f6465d` para todos os valores negativos
- `#3773f5` para botões primários, links e CTAs
- `#f5ac37` para badges, alertas secundários ou destaques de atenção

## 🚀 Como Executar

### Desenvolvimento
```bash
# Iniciar todos os serviços
docker compose -f docker-compose.dev.yml up -d

# Acessar aplicação
# Frontend: http://localhost:13000
# Backend: http://localhost:13010
# Admin: http://localhost:13000/admin
```

### Credenciais de Teste
- **Admin**: `admin@hub-defisats.com` / `AdminPass123!`
- **Usuário comum**: Qualquer email válido

## 📋 Próximos Passos

### 🔄 Em Desenvolvimento
- [ ] Implementar campo `role` no banco de dados
- [ ] Atualizar outros componentes admin para usar função utilitária
- [ ] Implementar sistema de permissões baseado em roles
- [ ] Adicionar testes automatizados

## 📋 Changelog

### v1.2.3 (2025-09-14) - Correção de Sincronização
- 🔧 **Correção**: Resolvido problema do header não atualizar o índice
- 🔧 **Correção**: Adicionado campo `userPositions` no RealtimeDataContext
- 🔧 **Correção**: Sincronização entre PositionsContext e RealtimeDataContext
- 🔧 **Correção**: Rate corrigido de 0.002% para 0.001% no backend
- 🔧 **Melhoria**: Header dinâmico com dados atualizados em tempo real
- 🔧 **Melhoria**: Logs de debug para identificar problemas de sincronização
- ✅ **Funcionalidade**: Índice, trading fees, next funding e rate atualizam junto com posições

### v1.2.1 (2025-09-14) - Hotfix
- 🔧 **Correção**: Resolvido erro 400 em upgrades de usuário
- 🔧 **Correção**: Corrigida serialização JSON dupla na API
- 🔧 **Correção**: Headers de requisição agora são mesclados corretamente
- 🔧 **Melhoria**: Logging detalhado de requisições para debugging

### v1.2.0 (2025-09-14) - Major Release
- 🚀 **Novo**: Sistema completo de upgrade de usuários
- 📊 **Novo**: Tracking de posições em tempo real com P&L
- 🎛️ **Novo**: Sistema de menus dinâmicos configuráveis
- 🔧 **Novo**: Melhorias no WebSocket para dados em tempo real
- 🎨 **Novo**: Favicon dinâmico baseado no status de P&L
- 🎨 **Novo**: Títulos de página dinâmicos com informações de P&L
- 🛡️ **Novo**: Sistema de permissões e guards de rota
- 📱 **Novo**: Interface admin responsiva para gerenciamento
- 🔧 **Novo**: Scripts de teste e seeding de dados
- 📚 **Novo**: Documentação abrangente e exemplos de uso

### v0.3.0 (2025-01-13) - Sistema de Cupons
- 🎫 **Novo**: Sistema completo de administração de cupons
- 📊 **Novo**: Analytics detalhados de cupons
- 🧭 **Novo**: Navegação responsiva

### 🎯 Próximas Funcionalidades
- [ ] Dashboard de usuário comum
- [ ] Sistema de automações
- [ ] Integração com LN Markets API
- [ ] Sistema de notificações
- [ ] Relatórios avançados

## 🏗️ Arquitetura

### Backend
- **Framework**: Fastify
- **ORM**: Prisma
- **Banco**: PostgreSQL
- **Cache**: Redis
- **Autenticação**: JWT
- **Validação**: Zod

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand
- **Roteamento**: React Router
- **HTTP**: Axios + Fetch utilitário

## 📊 Métricas de Qualidade

- **Cobertura de Testes**: Em desenvolvimento
- **Performance**: Otimizada com cache Redis
- **Segurança**: Validação robusta e sanitização
- **Logs**: Sistema centralizado de logging
- **Monitoramento**: Métricas em tempo real

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
├── backend/          # API Node.js
├── frontend/         # Interface React
├── infra/           # Configurações de infraestrutura
└── 0.contexto/      # Documentação técnica
```

### Convenções
- **Commits**: Conventional Commits
- **Versionamento**: Semantic Versioning
- **Branches**: Git Flow
- **Documentação**: Markdown + ADRs

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do sistema
2. Consultar documentação em `0.contexto/`
3. Verificar issues conhecidas no CHANGELOG

---

**Desenvolvido com ❤️ para automatização de trading no LN Markets**
