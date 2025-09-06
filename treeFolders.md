## 1. Estrutura de Pastas Raiz

/hub-defisats
├── backend/
│   ├── src/
│   │   ├── controllers/           # Request handlers e validação
│   │   ├── services/              # Business logic e integrações externas
│   │   ├── models/                # Prisma models e data access
│   │   ├── routes/                # Definição de endpoints da API
│   │   ├── middleware/            # Auth, logging, error handling
│   │   ├── workers/               # Background jobs e cron tasks
│   │   ├── utils/                 # Funções auxiliares e helpers
│   │   └── config/                # Configurações de ambiente e constants
│   ├── tests/                     # Testes unitários e integração
│   ├── prisma/                    # Schema Prisma e migrations
│   └── Dockerfile                 # Containerização do backend
├── frontend/
│   ├── public/                    # Assets estáticos
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages/routes
│   │   ├── components/            # Componentes reutilizáveis
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # Client services e utilities
│   │   ├── stores/                # Zustand stores
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── styles/                # Tailwind config e CSS global
│   │   └── middleware/            # Next.js middleware
│   ├── next.config.js             # Configuração do Next.js
│   └── tsconfig.json              # Configuração do TypeScript
├── infra/                         # Infraestrutura como código
│   ├── docker-compose.yml         # Orquestração local
│   ├── k8s/                       # Kubernetes manifests
│   └── terraform/                 # IaC para cloud providers
├── scripts/                       # Scripts de desenvolvimento e deploy
├── data/                          # Dados de seed e backup
├── docs/                          # Documentação técnica
├── .github/                       # GitHub workflows e configs
├── .env.example                   # Template de variáveis de ambiente
├── docker-compose.yml             # Orquestração completa (dev)
├── [setup.sh](http://setup.sh/)                       # Script de setup inicial
├── package.json                   # Dependencies raiz (monorepo)
└── [README.md](http://readme.md/)                      # Documentação principal

## 2. Arquivos Iniciais Boilerplate

### Backend (/backend/src/)

**Controllers:**

- `controllers/auth.controller.ts` - Autenticação e registro de usuários
- `controllers/user.controller.ts` - Gerenciamento de perfil e configurações
- `controllers/automation.controller.ts` - CRUD de automações e configurações
- `controllers/trade.controller.ts` - Logs de trades e histórico
- `controllers/payment.controller.ts` - Processamento de pagamentos Lightning
- `controllers/admin.controller.ts` - Funcionalidades administrativas

**Services:**

- `services/auth.service.ts` - Lógica de autenticação e JWT
- `services/lnmarkets.service.ts` - Integração com API LN Markets
- `services/automation.service.ts` - Execução e gerenciamento de automações
- `services/notification.service.ts` - Envio de alertas por múltiplos canais
- `services/payment.service.ts` - Validação e processamento de invoices
- `services/encryption.service.ts` - Criptografia de keys LN Markets

**Models:**

- `models/user.model.ts` - Operações com modelo User via Prisma
- `models/automation.model.ts` - Operações com modelo Automation
- `models/trade.model.ts` - Operações com logs de trades
- `models/payment.model.ts` - Gerenciamento de pagamentos

**Routes:**

- `routes/auth.routes.ts` - Endpoints de autenticação
- `routes/user.routes.ts` - Endpoints de usuário/perfil
- `routes/automation.routes.ts` - Endpoints de automações
- `routes/trade.routes.ts` - Endpoints de trades e logs
- `routes/payment.routes.ts` - Endpoints de pagamento
- `routes/admin.routes.ts` - Endpoints administrativos

**Workers:**

- `workers/margin-monitor.worker.ts` - Monitoramento em tempo real de margem
- `workers/automation-executor.worker.ts` - Executor de ordens automatizadas
- `workers/notification.worker.ts` - Processador de fila de notificações
- `workers/payment-validator.worker.ts` - Validador de invoices Lightning

**Middleware:**

- `middleware/auth.middleware.ts` - Autenticação JWT e autorização
- `middleware/validation.middleware.ts` - Validação de payloads
- `middleware/error.middleware.ts` - Tratamento global de erros
- `middleware/rate-limit.middleware.ts` - Limitação de requisições

### Frontend (/frontend/src/)

**App Router:**

- `app/page.tsx` - Landing page principal
- `app/auth/signin/page.tsx` - Página de login
- `app/auth/signup/page.tsx` - Página de registro
- `app/dashboard/page.tsx` - Dashboard principal do usuário
- `app/dashboard/automation/page.tsx` - Configuração de automações
- `app/dashboard/reports/page.tsx` - Relatórios e backtests
- `app/dashboard/settings/page.tsx` - Configurações da conta
- `app/admin/page.tsx` - Dashboard administrativo

**Components:**

- `components/ui/Button.tsx` - Componente de botão reutilizável
- `components/ui/Input.tsx` - Componente de input com validação
- `components/layout/Header.tsx` - Header/navigation da aplicação
- `components/layout/Sidebar.tsx` - Sidebar do dashboard
- `components/charts/MarginChart.tsx` - Gráfico de margem em tempo real
- `components/forms/AutomationForm.tsx` - Formulário de configuração de automações

**Hooks:**

- `hooks/useAuth.ts` - Gerenciamento de estado de autenticação
- `hooks/useAutomation.ts` - Hooks para integração com automações
- `hooks/useMarginData.ts` - Fetch e cache de dados de margem
- `hooks/useNotifications.ts` - Gerenciamento de notificações em tempo real

**Lib (Services):**

- `lib/api/client.ts` - Configuração do axios e interceptors
- `lib/api/auth.ts` - Endpoints de autenticação
- `lib/api/automations.ts` - Endpoints de automações
- `lib/api/trades.ts` - Endpoints de trades e logs
- `lib/query-client.ts` - Configuração do TanStack Query

**Stores:**

- `stores/user.store.ts` - Zustand store para dados do usuário
- `stores/automation.store.ts` - Store para estado das automações
- `stores/notification.store.ts` - Store para notificações em tempo real

### Infraestrutura (/infra/)

- `docker-compose.yml` - Orquestração local com PostgreSQL, Redis, etc.
- `Dockerfile` - Build da aplicação para deploy
- `k8s/deployment.yaml` - Deployment para Kubernetes
- `terraform/main.tf` - Infraestrutura como código

### Raiz do Projeto

- `.env.example` - Template de variáveis de ambiente
- `setup.sh` - Script de inicialização do ambiente de desenvolvimento
- `docker-compose.yml` - Orquestração completa para desenvolvimento local
- `package.json` - Dependencies e scripts do monorepo
- `README.md` - Documentação principal do projeto