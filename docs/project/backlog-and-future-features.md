# Backlog e Features Futuras - Axisor

**Última atualização**: 2025-10-16  
**Responsável**: Equipe de Desenvolvimento

## Índice

1. [Features em Desenvolvimento](#features-em-desenvolvimento)
2. [Features Planejadas](#features-planejadas)
3. [Melhorias Pendentes](#melhorias-pendentes)
4. [Bugs Conhecidos](#bugs-conhecidos)
5. [Débito Técnico](#debito-tecnico)
6. [Ideas e Brainstorming](#ideas-e-brainstorming)

---

## Features em Desenvolvimento

### Fluxo de Cadastro Multi-Etapas
- **Status**: 🟡 Em andamento
- **Prioridade**: Alta
- **Descrição**: Sistema completo de registro com 4 etapas (dados pessoais, plano, pagamento, credenciais)
- **Progresso**: 90%
- **Bloqueios**: Nenhum
- **Responsável**: Dev Team
- **Data prevista**: 2025-10-20

### Product Tour com React Joyride
- **Status**: 🟡 Em andamento
- **Prioridade**: Média
- **Descrição**: Tour guiado para novos usuários após registro
- **Progresso**: 80%
- **Bloqueios**: Nenhum
- **Responsável**: Dev Team
- **Data prevista**: 2025-10-22

---

## Features Planejadas

### Curto Prazo (1-2 semanas)

#### Sistema de Email
- **Prioridade**: Alta
- **Descrição**: Configurar servidor de email para notificações e verificação
- **Requisitos**: 
  - Configurar servidor de email (SendGrid, AWS SES, etc)
  - Implementar templates de email
  - Email de verificação de cadastro
  - Email de confirmação de cupom
  - Email de reset de senha
  - Email de notificações importantes
- **Estimativa**: 5-7 dias
- **Notas**: Necessário para completar o fluxo de registro com verificação de email

### Curto Prazo (1-2 semanas)

#### Autenticação Social (Google, GitHub)
- **Prioridade**: Média
- **Descrição**: OAuth para login com Google e GitHub
- **Requisitos**: Configurar OAuth providers, criar endpoints de callback
- **Estimativa**: 3-5 dias
- **Notas**: Botões já existem no Register.tsx mas estão desabilitados

#### Integração com TradingView
- **Prioridade**: Alta
- **Descrição**: Exibir gráficos do TradingView nas páginas de análise
- **Requisitos**: TradingView Widget API
- **Estimativa**: 2-3 dias
- **Notas**: Componente TradingViewMonitor.tsx existe mas não está integrado

#### Sistema de Notificações Push
- **Prioridade**: Média
- **Descrição**: Notificações push para alertas importantes
- **Requisitos**: Service Worker, Push API
- **Estimativa**: 3-4 dias
- **Notas**: Componente PushNotificationManager.tsx existe

### Médio Prazo (3-6 semanas)

#### Multi-Idioma (i18n)
- **Prioridade**: Média
- **Descrição**: Suporte para inglês, português, espanhol
- **Requisitos**: i18next está instalado, precisa de traduções
- **Estimativa**: 1-2 semanas
- **Notas**: Estrutura já existe (frontend/src/i18n/)

#### WebSocket Avançado para Real-time
- **Prioridade**: Alta
- **Descrição**: Melhorar sistema de WebSocket para dados em tempo real
- **Requisitos**: WebSocket Manager completo
- **Estimativa**: 1 semana
- **Notas**: websocket-manager.service.ts existe mas precisa de melhorias

#### Simulador de Trading
- **Prioridade**: Alta
- **Descrição**: Modo de simulação para testar estratégias sem risco
- **Requisitos**: Dados históricos, motor de simulação
- **Estimativa**: 2-3 semanas
- **Notas**: Simulation.tsx existe mas implementação básica

#### Backtest Avançado
- **Prioridade**: Alta
- **Descrição**: Sistema completo de backtesting com múltiplos indicadores
- **Requisitos**: Dados históricos, engine de cálculo
- **Estimativa**: 2-3 semanas
- **Notas**: Backtests.tsx existe mas funcionalidade limitada

### Longo Prazo (2-3 meses)

#### Mobile App (React Native)
- **Prioridade**: Baixa
- **Descrição**: App nativo para iOS e Android
- **Requisitos**: React Native, expo
- **Estimativa**: 2-3 meses

#### AI/ML para Trading Signals
- **Prioridade**: Média
- **Descrição**: Usar machine learning para gerar sinais de trading
- **Requisitos**: Modelos ML, dados históricos
- **Estimativa**: 3+ meses

#### Copy Trading
- **Prioridade**: Média
- **Descrição**: Seguir estratégias de outros traders
- **Requisitos**: Sistema de perfis públicos, permissões
- **Estimativa**: 2+ meses

---

## Melhorias Pendentes

### Performance

- [ ] Otimizar queries do Prisma (identificadas na auditoria)
- [ ] Implementar lazy loading em rotas pesadas
- [ ] Code splitting avançado com Vite
- [ ] Service Worker para cache offline
- [ ] Compressão de assets (Gzip/Brotli)

### UX/UI

- [ ] Dark/Light theme toggle funcional
- [ ] Animações de transição entre páginas
- [ ] Skeleton loaders em loading states
- [ ] Toasts de feedback mais informativos
- [ ] Responsividade mobile melhorada

### Segurança

- [ ] Rate limiting por usuário (além de por IP)
- [ ] CAPTCHA no registro e login
- [ ] 2FA via authenticator app (já existe via TOTP, melhorar UX)
- [ ] Audit logs mais detalhados
- [ ] Penetration testing completo

### DevOps

- [ ] CI/CD pipeline automatizado
- [ ] Testes E2E com Playwright
- [ ] Monitoring com Prometheus + Grafana
- [ ] Logs centralizados (ELK Stack)
- [ ] Blue-Green deployment

---

## Bugs Conhecidos

### Críticos
- Nenhum bug crítico identificado

### Alta Prioridade
- [ ] Margin Guard Worker v1 usa dados mock (identificado na auditoria)
- [ ] Email validation às vezes não retorna disponibilidade

### Média Prioridade
- [ ] Toast notifications às vezes não aparecem
- [ ] WebSocket reconecta mas não recupera estado anterior
- [ ] Charts podem ter lag em intervalos < 1s

### Baixa Prioridade
- [ ] Alguns componentes têm warnings no console
- [ ] Favicon dinâmico nem sempre atualiza

---

## Débito Técnico

### Código Morto (identificado na auditoria)

**Frontend** (40% das páginas):
- [ ] Remover pages/Profile.backup.tsx
- [ ] Remover pages/Automations.backup-20251012.tsx
- [ ] Remover pages/TestAuth.tsx
- [ ] Remover pages/TestPermissions.tsx
- [ ] Remover pages/IndicatorTestPage.tsx
- [ ] Remover pages/EMATestPage.tsx
- [ ] Remover components/EMATestComponent.tsx
- [ ] Remover components/PositionTestManager.tsx

**Backend** (6.8% dos controllers):
- [ ] Remover ou integrar exchangeCredentialsSimple.controller.ts
- [ ] Remover lnmarkets-options.controller.ts
- [ ] Remover route-redirect.controller.ts
- [ ] Remover LNMarketsRobustService.ts (duplicado)
- [ ] Remover AutomationService.ts (duplicado)

### Refatorações Necessárias

- [ ] Consolidar stores (auth, automation, chart) em um único store Zustand
- [ ] Separar lógica de negócio dos componentes React
- [ ] Criar custom hooks reutilizáveis
- [ ] Padronizar error handling em toda aplicação
- [ ] Melhorar tipagem TypeScript (eliminar `any`)

### Documentação

- [ ] Documentar todos os hooks (JSDoc)
- [ ] Criar guia de contribuição (CONTRIBUTING.md)
- [ ] Documentar variáveis de ambiente
- [ ] Adicionar exemplos de uso da API
- [ ] Criar diagrams de arquitetura atualizados

---

## Ideas e Brainstorming

### Funcionalidades Inovadoras
- Social trading features
- Gamificação (achievements, leaderboards)
- Portfolio analytics avançado
- Tax reporting automático
- Integração com mais exchanges
- Custom indicators builder
- Strategy marketplace
- Discord/Telegram bot

### Integrações
- Stripe para pagamentos fiat
- OpenAI para análise de mercado
- Webhook para notificações externas
- Zapier integration
- API pública para desenvolvedores

### Melhorias de Negócio
- Programa de afiliados
- Plano enterprise
- White-label solution
- Consultoria de trading
- Cursos e tutoriais premium

---

## Como Usar Este Documento

### Adicionar Novo Item
1. Identifique a seção apropriada
2. Use o template adequado
3. Adicione prioridade e estimativa
4. Atualize data de modificação

### Mover Item para Desenvolvimento
1. Marque status como 🟡 Em andamento
2. Mova para "Features em Desenvolvimento"
3. Atribua responsável e prazo

### Marcar Item como Concluído
1. Marque checkbox com [x]
2. Adicione link para PR/commit
3. Mova para seção "Concluído" (criar se necessário)

### Revisar Backlog
- Frequência: Semanal
- Responsável: Tech Lead
- Ação: Repriorizar items conforme necessidade
