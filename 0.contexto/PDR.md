## 1. Visão Geral do Produto

O produto é uma **plataforma de automação de trades para LN Markets**, com foco em **segurança, confiabilidade e controle total do usuário sobre suas operações**.

A proposta central é resolver o maior medo do trader avançado: **perder dinheiro por falhas técnicas ou liquidação não protegida**.

- **Para testers**: acesso vitalício, sem cobrança, testando todas as funcionalidades progressivamente.
- **Para usuários comerciais (pós-produção)**: planos pagos (Basic, Advanced, Pro), com recursos proporcionais e pagamento via Lightning.

O produto atua como uma **ponte inteligente** entre o usuário e a LN Markets, utilizando a API oficial para executar automações de margem, entradas e proteções.

---

## 2. Funcionalidades Principais

- **Margin Guard (MVP Core)**: automação de proteção contra liquidação.
- **Entradas Automáticas + TP/SL**: ordens automatizadas com parâmetros configuráveis.
- **Backtests (individuais)**: relatórios baseados no histórico de trades pessoais, com preparação para agregação futura.
- **Relatórios e Logs**: granularidade máxima, permitindo identificar falhas da aplicação vs corretora.
- **Alertas & Notificações**: via Telegram, Email, WhatsApp; configuráveis pelo usuário.
- **Dashboard Admin (Superadmin)**: gestão de usuários, cupons, estatísticas, KPIs, logs e faturamento.
- **Pagamentos Lightning**: via transferência interna LN Markets ou invoice Lightning externa.
- **Cadastro & Onboarding**: login social + cadastro de keys LN Markets (criptografadas).

---

## 3. Requisitos Funcionais

### Usuário

- [ ]  Criar conta via email/senha ou login social (Google, Github, etc).
- [ ]  Cadastrar keys LN Markets (criptografadas no banco).
- [ ]  Visualizar status da margem em tempo real.
- [ ]  Configurar automações (Margin Guard, TP/SL, Entradas).
- [ ]  Executar backtests e visualizar relatório (histórico pessoal).
- [ ]  Exportar relatórios em PDF/CSV (⚠️ não essencial no MVP inicial).
- [ ]  Configurar alertas e notificações (default: todos ativos).
- [ ]  Receber alertas de risco de liquidação em tempo real.
- [ ]  Realizar pagamento (versão comercial) e desbloquear plano correspondente.
- [ ]  Acompanhar logs completos dos próprios trades.

### **Status Atual (v0.0.7) - Autenticação Funcional**

- ✅ **Frontend Funcionando**: Interface React completa disponível em http://localhost:3001
  - Todas as páginas implementadas (Dashboard, Login, Register, Automations, etc.)
  - Roteamento React Router configurado
  - Design system com Tailwind CSS
  - Componentes UI com Radix UI

- ✅ **Backend Funcionando**: API Fastify rodando em http://localhost:3010
  - Health check disponível em `/health`
  - **Autenticação completa implementada**:
    - `POST /api/auth/register` - Cadastro de usuários
    - `POST /api/auth/login` - Login com validação
    - `GET /api/users/me` - Perfil do usuário
  - Hash de senhas com bcrypt
  - Armazenamento em memória (independente do Prisma)
  - Tratamento de erros adequado

- ✅ **Funcionalidades Básicas**:
  - **Cadastro de usuários**: Email, senha e chaves LN Markets
  - **Login**: Validação de credenciais com hash
  - **Perfil do usuário**: Dados refletindo o que foi cadastrado
  - **Dashboard acessível**: Após autenticação bem-sucedida

- ✅ **Infraestrutura Completa**:
  - PostgreSQL rodando na porta 5432
  - Redis rodando na porta 6379
  - Docker Compose com todos os serviços
  - Containers sem crashes
  - Workers preparados para desenvolvimento

### Admin

- [ ]  Acessar dashboard administrativo como superadmin.
- [ ]  Criar e gerenciar cupons (ex: testers vitalícios, trials, descontos).
- [ ]  Gerenciar usuários e planos ativos.
- [ ]  Visualizar KPIs (usuários ativos, trades, falhas, receita).
- [ ]  Auditar logs detalhados (erro app vs erro corretora).
- [ ]  Gerenciar notificações globais (alertas sistêmicos).

---

## 4. Requisitos Não Funcionais

- **Performance**: execução de automações com latência mínima (<200ms ideal).
- **Disponibilidade**: uptime mínimo de 99,5% (meta inicial).
- **Segurança**:
    - Keys da LN Markets criptografadas com AES-256.
    - Sessão expira após 30min de inatividade (configurável pelo usuário).
    - Logs auditáveis para rastreabilidade completa.
    - **Autenticação robusta**: JWT + Refresh Tokens, 2FA obrigatório para admins.
    - **Validação de senhas**: Requisitos mínimos, verificação contra vazamentos (HIBP).
    - **Proteção contra ataques**: Rate limiting, CAPTCHA, CSRF protection, XSS prevention.
    - **Criptografia**: bcrypt para senhas, libsodium para dados sensíveis.
    - **Monitoramento**: Logs de segurança, alertas de atividades suspeitas.
    - **Compliance**: GDPR, auditoria de acessos, backup criptografado.
- **Escalabilidade**: arquitetura preparada para mobile (React Native), web (Expo Web) e futuro desktop (Electron).
- **Pagamentos**: validador automático de invoice Lightning.
    - Reenvio automático de cobrança em caso de expiração/falha.
- **Resiliência**: fallback manual + alertas automáticos em caso de falha.

---

## 5. Fluxos de Usuário (User Flows / UX)

### Onboarding (versão comercial)

1. Acessa landing page.
2. Cria conta via login social/email.
3. Escolhe plano → gera invoice Lightning → pagamento validado automaticamente.
4. Cadastra keys LN Markets (criptografadas).
5. Acessa dashboard com recursos desbloqueados proporcional ao plano.

### Execução de Automação

1. Usuário configura parâmetros (ex: Margin Guard).
2. Sistema verifica margem via API LN Markets.
3. Ordem executada.
4. Log gerado em tempo real (com status: sucesso/erro app/erro corretora).
5. Notificações enviadas se necessário.

### Backtest

1. Usuário solicita backtest.
2. Sistema puxa histórico pessoal via API.
3. Avalia automações vs trades passados.
4. Exibe relatório (com opção futura de exportar).

### Alertas de Risco

1. Sistema monitora posições abertas.
2. Detecta risco de liquidação sem automação ativa.
3. Envia alerta (Telegram/Email/WhatsApp).

---

## 6. Critérios de Aceitação

- [ ]  Usuário consegue cadastrar keys LN Markets com sucesso e testá-las.
- [ ]  Margin Guard funcional com taxa de sucesso ≥ 90% nos testers.
- [ ]  Logs de trades distinguem claramente erro de app vs corretora.
- [ ]  Backtests retornam relatório válido com histórico pessoal.
- [ ]  Notificações são disparadas em eventos críticos.
- [ ]  Admin consegue criar cupons e ver estatísticas básicas.
- [ ]  Pagamento Lightning é validado automaticamente (versão comercial).

---

## 7. Restrições

- Tempo: MVP funcional para testers em 60 dias (15 dias primeira entrega parcial).
- Equipe: 1 pessoa (founder dev).
- Orçamento: zero (bootstrapped, caixa virá dos planos pagos).
- API: limite de 100 posições abertas por conta na LN Markets.
- Regulatório: sem KYC, 100% descentralizado.

---

## 8. Cronograma e Prioridades

### Fase 1 (Testers, até 60 dias)

- Margin Guard 100% funcional.
- Cadastro de usuários + keys LN Markets.
- Dashboard admin básico.
- Logs completos de trades.
- Alertas (default: todos ativos).

### Fase 2 (Pré-Comercial)

- Entradas automáticas, TP/SL.
- Backtests pessoais.
- Relatórios (exportáveis no futuro).
- Configuração granular de notificações.

### Fase 3 (Comercialização)

- Planos pagos (Basic, Advanced, Pro).
- Pagamentos Lightning (transferência interna + invoice externa).
- Dashboard admin completo (KPIs, faturamento, cupons avançados).
- Marketing site + onboarding comercial.

---

✅ **Hack do 0,1%**:

- **Testers via cupom único/token rastreável**, limitado a 30 usos.
- Uso de **EvolutionAPI para WhatsApp** já no MVP, garantindo canal crítico de notificações.
- Primeiro backtest pode ser apenas **simulação manual via script + relatório em CSV**, antes de codar toda a lógica de exportação.

---

📊 **KPIs sugeridos (versão comercial)**

- 50 usuários ativos em 3 meses.
- 10 planos Pro vendidos.
- 90%+ taxa de execução sem falhas atribuídas ao app.
- 10.000 trades processados no período.