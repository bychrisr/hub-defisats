# PDR - Product Requirements Document

## 1. Visão Geral do Produto

### 1.1 Propósito
O **Hub-defisats** é uma plataforma de automação de trading para a LN Markets que resolve o maior medo do trader avançado: **perder dinheiro por falhas técnicas ou liquidação não protegida**.

### 1.2 Proposta de Valor
- **Para testers**: Acesso vitalício, sem cobrança, testando todas as funcionalidades progressivamente
- **Para usuários comerciais (pós-produção)**: Planos pagos (Basic, Advanced, Pro), com recursos proporcionais e pagamento via Lightning

### 1.3 Posicionamento
O produto atua como uma **ponte inteligente** entre o usuário e a LN Markets, utilizando a API oficial para executar automações de margem, entradas e proteções.

## 2. Funcionalidades Principais

### 2.1 Core MVP

#### Margin Guard (Proteção de Margem)
- **Monitoramento Contínuo**: Verificação automática da margem a cada 5 segundos
- **Alertas Inteligentes**: Notificações quando a margem atinge níveis críticos (80%, 90%, 95%)
- **Ações Automáticas**: 
  - Fechar posição automaticamente
  - Reduzir posição por porcentagem configurável (ex: 50%)
  - Adicionar margem adicional (em sats)
- **Configuração Flexível**: Thresholds personalizáveis por usuário (15-25% recomendado)
- **Fórmula de Cálculo**: `Razão de Margem = Margem de Manutenção / (Margem + P&L)`
- **Níveis de Alerta**: 
  - Seguro: Razão > 80% do limite configurado
  - Aviso: Razão entre 80% e 100% do limite
  - Crítico: Razão ≤ limite configurado (ação executada)

#### Sistema de Simulações em Tempo Real
- **Cenários de Mercado Disponíveis**:
  - **Bull Market (🐂)**: Tendência positiva, baixa volatilidade (0.1-0.3%)
  - **Bear Market (🐻)**: Tendência negativa, média volatilidade (0.2-0.4%)
  - **Sideways (➡️)**: Sem tendência definida, baixa-média volatilidade
  - **Volatile (⚡)**: Alta volatilidade (até 2%), eventos extremos
- **Automações Suportadas**: Margin Guard, Take Profit, Trailing Stop, Auto Entry
- **Execução em Tempo Real**: Resolução temporal de 100ms por passo
- **Duração Configurável**: 10-3600 segundos por simulação
- **Métricas Detalhadas**: Taxa de sucesso, tempo de resposta, P&L total, drawdown máximo
- **Visualização**: Gráficos de preço, P&L e pontos de ação em tempo real

#### Entradas Automáticas + TP/SL
- **Take Profit**: Fechamento automático de posições em lucro
- **Stop Loss**: Proteção contra perdas excessivas
- **Trailing Stop**: Acompanhamento dinâmico de tendências
- **Auto Entry**: Entradas automáticas baseadas em sinais técnicos (RSI oversold)
- **Configuração por Cenário**: Otimização para diferentes tipos de mercado

#### Backtests (Individuais)
- **Análise Histórica**: Teste de estratégias com dados passados da LN Markets
- **Métricas de Performance**: Win rate, PnL, drawdown, Sharpe ratio
- **Dados Reais**: Uso do histórico pessoal de trades do usuário
- **Relatórios Detalhados**: Exportação em PDF/CSV

#### Relatórios e Logs
- **Granularidade Máxima**: Identificação clara de falhas da aplicação vs corretora
- **Status de Trades**: `success`, `app_error`, `exchange_error`
- **Logs Detalhados**: Raw response da API LN Markets, timestamps, metadados
- **Rastreabilidade**: Histórico completo de todas as operações

### 2.2 Sistema de Notificações
- **Alertas & Notificações**: Via Telegram, Email, WhatsApp
- **Configuração por usuário**: Canais personalizáveis
- **Alertas críticos**: Notificações em tempo real para risco de liquidação

### 2.3 Dashboard Administrativo
- **Dashboard Admin (Superadmin)**: Gestão de usuários, cupons, estatísticas, KPIs, logs e faturamento
- **Gerenciamento de usuários**: Controle de planos e permissões
- **Analytics**: Métricas de uso e performance

### 2.4 Sistema de Pagamentos
- **Pagamentos Lightning**: Via transferência interna LN Markets ou invoice Lightning externa
- **Validação automática**: Confirmação de pagamentos sem intervenção manual
- **Planos flexíveis**: Basic, Advanced, Pro com recursos proporcionais

### 2.5 Cadastro & Onboarding
- **Login social**: Google, GitHub, etc.
- **Cadastro de keys LN Markets**: Criptografadas e validadas
- **Sistema de cupons**: Para testers e promoções

## 3. Identidade Visual e Design System

### 3.1 Sistema de Design CoinGecko Inspired
- **Paleta de Cores**: Inspirada no CoinGecko para transmitir confiança e profissionalismo
  - **Primária**: `#3773f5` (CoinGecko Blue) - Botões principais, CTAs
  - **Secundária**: `#f5ac37` (CoinGecko Orange) - Badges, alertas secundários
  - **Sucesso**: `#0ecb81` (CoinGecko Green) - Valores positivos, confirmações
  - **Destrutiva**: `#f6465d` (CoinGecko Red) - Valores negativos, erros
- **Tipografia**: Inter (principal) + JetBrains Mono (dados técnicos)
- **Temas**: Light/Dark mode com transições suaves
- **Componentes**: Design system completo com tokens centralizados

### 3.2 Delimitações de Identidade Visual
- **Consistência**: Uso obrigatório das cores semânticas para valores financeiros
- **Acessibilidade**: Contraste adequado em ambos os temas
- **Responsividade**: Design adaptável para desktop e mobile
- **Performance**: Transições otimizadas (200-500ms)
- **Branding**: Visual que transmite confiança e profissionalismo financeiro

## 4. Requisitos Funcionais

### 4.1 Usuário Final
- [x] Criar conta via email/senha ou login social (Google, Github, etc)
- [x] Cadastrar keys LN Markets (criptografadas no banco)
- [x] Visualizar status da margem em tempo real
- [x] Configurar automações (Margin Guard, TP/SL, Entradas)
- [x] Executar backtests e visualizar relatório (histórico pessoal)
- [ ] Exportar relatórios em PDF/CSV (não essencial no MVP inicial)
- [x] Configurar alertas e notificações (default: todos ativos)
- [x] Receber alertas de risco de liquidação em tempo real
- [x] Realizar pagamento (versão comercial) e desbloquear plano correspondente
- [x] Acompanhar logs completos dos próprios trades

### 4.2 Administrador
- [x] Acessar dashboard administrativo como superadmin
- [x] Criar e gerenciar cupons (ex: testers vitalícios, trials, descontos)
- [x] Gerenciar usuários e planos ativos
- [x] Visualizar KPIs (usuários ativos, trades, falhas, receita)
- [x] Auditar logs detalhados (erro app vs erro corretora)
- [x] Gerenciar notificações globais (alertas sistêmicos)

## 5. Requisitos Não Funcionais

### 5.1 Performance
- **Latência**: Execução de automações com latência mínima (<200ms ideal)
- **Throughput**: Suporte a múltiplos usuários simultâneos
- **Escalabilidade**: Arquitetura preparada para crescimento

### 5.2 Disponibilidade
- **Uptime**: Mínimo de 99,5% (meta inicial)
- **Recuperação**: Fallback manual + alertas automáticos em caso de falha
- **Monitoramento**: Sistema de alertas proativo

### 5.3 Segurança
- **Criptografia**: Keys da LN Markets criptografadas com AES-256
- **Sessões**: Expiração após 30min de inatividade (configurável)
- **Auditoria**: Logs auditáveis para rastreabilidade completa
- **Autenticação**: JWT + Refresh Tokens, 2FA obrigatório para admins
- **Validação**: Requisitos mínimos de senhas, verificação contra vazamentos (HIBP)
- **Proteção**: Rate limiting, CAPTCHA, CSRF protection, XSS prevention
- **Compliance**: GDPR, auditoria de acessos, backup criptografado

### 5.4 Escalabilidade
- **Arquitetura**: Preparada para mobile (React Native), web (Expo Web) e futuro desktop (Electron)
- **Microserviços**: Separação clara entre responsabilidades
- **Workers**: Processamento assíncrono para automações

### 5.5 Pagamentos
- **Validação**: Validador automático de invoice Lightning
- **Reenvio**: Automático de cobrança em caso de expiração/falha
- **Flexibilidade**: Transferência interna LN Markets + invoice externa

## 6. Fluxos de Usuário (User Flows)

### 6.1 Onboarding (versão comercial)
1. Acessa landing page
2. Cria conta via login social/email
3. Escolhe plano → gera invoice Lightning → pagamento validado automaticamente
4. Cadastra keys LN Markets (criptografadas)
5. Acessa dashboard com recursos desbloqueados proporcional ao plano

### 6.2 Execução de Automação
1. Usuário configura parâmetros (ex: Margin Guard)
2. Sistema verifica margem via API LN Markets
3. Ordem executada
4. Log gerado em tempo real (com status: sucesso/erro app/erro corretora)
5. Notificações enviadas se necessário

### 6.3 Backtest
1. Usuário solicita backtest
2. Sistema puxa histórico pessoal via API
3. Avalia automações vs trades passados
4. Exibe relatório (com opção futura de exportar)

### 6.4 Alertas de Risco
1. Sistema monitora posições abertas
2. Detecta risco de liquidação sem automação ativa
3. Envia alerta (Telegram/Email/WhatsApp)

## 7. Critérios de Aceitação

### 7.1 Funcionalidade Core
- [x] Usuário consegue cadastrar keys LN Markets com sucesso e testá-las
- [x] Margin Guard funcional com taxa de sucesso ≥ 90% nos testers
- [x] Logs de trades distinguem claramente erro de app vs corretora
- [x] Backtests retornam relatório válido com histórico pessoal
- [x] Notificações são disparadas em eventos críticos
- [x] Admin consegue criar cupons e ver estatísticas básicas
- [ ] Pagamento Lightning é validado automaticamente (versão comercial)

### 7.2 Performance e Segurança
- [x] Latência de automações < 200ms
- [x] Uptime ≥ 99,5%
- [x] Keys LN Markets criptografadas
- [x] Logs auditáveis completos
- [x] Rate limiting implementado

## 8. Restrições

### 8.1 Temporais
- **MVP funcional**: Para testers em 60 dias (15 dias primeira entrega parcial)
- **Fase comercial**: Após validação com testers

### 8.2 Recursos
- **Equipe**: 1 pessoa (founder dev)
- **Orçamento**: Zero (bootstrapped, caixa virá dos planos pagos)

### 8.3 Técnicas
- **API**: Limite de 100 posições abertas por conta na LN Markets
- **Regulatório**: Sem KYC, 100% descentralizado

## 9. Cronograma e Prioridades

### 9.1 Fase 1 (Testers, até 60 dias)
- [x] Margin Guard 100% funcional
- [x] Cadastro de usuários + keys LN Markets
- [x] Dashboard admin básico
- [x] Logs completos de trades
- [x] Alertas (default: todos ativos)

### 9.2 Fase 2 (Pré-Comercial)
- [x] Entradas automáticas, TP/SL
- [x] Backtests pessoais
- [x] Relatórios (exportáveis no futuro)
- [x] Configuração granular de notificações

### 9.3 Fase 3 (Comercialização)
- [ ] Planos pagos (Basic, Advanced, Pro)
- [ ] Pagamentos Lightning (transferência interna + invoice externa)
- [ ] Dashboard admin completo (KPIs, faturamento, cupons avançados)
- [ ] Marketing site + onboarding comercial

## 10. KPIs e Métricas

### 10.1 Métricas de Produto
- **Usuários ativos**: 50 usuários ativos em 3 meses
- **Conversão**: 10 planos Pro vendidos
- **Confiabilidade**: 90%+ taxa de execução sem falhas atribuídas ao app
- **Volume**: 10.000 trades processados no período

### 10.2 Métricas Técnicas
- **Performance**: Latência < 200ms para automações
- **Disponibilidade**: Uptime ≥ 99,5%
- **Segurança**: Zero vazamentos de dados sensíveis
- **Qualidade**: Cobertura de testes ≥ 80%

## 11. Status Atual

### 11.1 Versão Atual
**Versão**: v1.3.0  
**Status**: Plataforma Completa com Margin Guard e Simulações em Tempo Real  
**Última Atualização**: 2025-09-15

### 11.2 Funcionalidades Implementadas
- ✅ **Sistema de Simulações em Tempo Real**: 4 cenários realistas, interface completa
- ✅ **Margin Guard 100% Funcional**: Monitoramento 24/7, ações automáticas
- ✅ **Sistema de Automações Avançado**: Workers assíncronos, filas Redis
- ✅ **Dashboard Financeiro**: Métricas em tempo real, histórico detalhado
- ✅ **Sistema Seguro**: Autenticação JWT, criptografia de credenciais
- ✅ **Interface Moderna**: Design responsivo, tema adaptativo, gráficos interativos

### 11.3 Próximos Passos
- [ ] Sistema de Trading Real com execução completa
- [ ] Análises Avançadas com Machine Learning
- [ ] Melhorias Técnicas (API Rate Limiting, Caching)
- [ ] UX/UI Enhancements (Dark Mode Completo, Mobile Optimization)

---

**Documento**: PDR - Product Requirements Document  
**Versão**: 1.3.0  
**Última Atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento
