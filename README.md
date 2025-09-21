# Hub DeFiSats - Plataforma de Automação de Trading

## 🎯 Visão Geral

O Hub DeFiSats é uma plataforma completa de automação de trading para LN Markets, construída com Node.js 18+, Fastify e Next.js, rodando em containers Docker. A plataforma oferece funcionalidades avançadas como Margin Guard, simulações em tempo real, sistema de cupons e muito mais.

## 🏗️ Estrutura do Projeto

```
hub-defisats/
├── 📁 backend/                    # API Node.js + Fastify
├── 📁 frontend/                   # Interface React + Next.js
├── 📁 .system/                    # Documentação completa
│   ├── 📄 PDR.md                  # Product Requirements Document
│   ├── 📄 ANALYSIS.md             # Análise técnica detalhada
│   ├── 📄 FULLSTACK.md            # Stack tecnológica
│   ├── 📄 ROADMAP.md              # Plano técnico de execução
│   ├── 📄 DECISIONS.md            # Decisões arquiteturais (ADRs)
│   ├── 📄 CHANGELOG.md            # Histórico de alterações
│   ├── 📄 OWNER_TASKS.md          # Pendências externas
│   └── 📁 docs/                   # Documentação técnica detalhada
├── 📁 scripts/                    # Scripts organizados por categoria
│   ├── 📁 admin/                  # Scripts de administração
│   ├── 📁 deploy/                 # Scripts de deploy
│   ├── 📁 dev/                    # Scripts de desenvolvimento
│   └── 📁 test/                   # Scripts de teste
├── 📁 config/                     # Configurações do projeto
│   ├── 📁 docker/                 # Docker Compose files
│   └── 📁 env/                    # Arquivos de ambiente
├── 📁 tools/                      # Ferramentas e utilitários
├── 📁 monitoring/                 # Configurações de monitoramento
├── 📁 k8s/                        # Configurações Kubernetes
├── 📁 infra/                      # Infraestrutura
└── 📁 nginx/                      # Configurações Nginx
```

## 🚀 Início Rápido

### Desenvolvimento
```bash
# Iniciar todos os serviços
docker compose -f config/docker/docker-compose.dev.yml up -d

# Acessar aplicação
# Frontend: http://localhost:13000
# Backend: http://localhost:13010
# Admin: http://localhost:13000/admin
```

### Produção
```bash
# Deploy em produção
./scripts/deploy/deploy-prod.sh

# Setup de staging
./scripts/deploy/setup-staging.sh
```

## 📚 Documentação

Toda a documentação está organizada na pasta `.system/`:

- **📋 PDR.md** - Visão macro do produto e funcionalidades
- **🔍 ANALYSIS.md** - Análise técnica detalhada
- **🛠️ FULLSTACK.md** - Stack tecnológica completa
- **🗺️ ROADMAP.md** - Plano técnico de execução
- **📝 DECISIONS.md** - Decisões arquiteturais (ADRs)
- **📊 CHANGELOG.md** - Histórico de alterações
- **📋 OWNER_TASKS.md** - Pendências externas

### Documentação Técnica Detalhada
- **API**: `docs/api/endpoints.md` - Documentação completa da API
- **Arquitetura**: `docs/architecture/` - Workers, simulações, i18n, gráficos, cupons
- **Segurança**: `docs/security/overview.md` - Implementações de segurança

## 🛠️ Scripts Disponíveis

### Administração
```bash
./scripts/admin/create-admin.js          # Criar usuário admin
./scripts/admin/create-super-admin.sh    # Criar super admin
```

### Desenvolvimento
```bash
./scripts/dev/setup-dev.sh               # Setup de desenvolvimento
./scripts/dev/create-dev-user.sh         # Criar usuário de teste
./scripts/dev/fix-typescript-errors.sh   # Corrigir erros TypeScript
```

### Deploy
```bash
./scripts/deploy/deploy-prod.sh          # Deploy em produção
./scripts/deploy/setup-staging.sh        # Setup de staging
```

### Testes
```bash
./scripts/test/test-local.sh             # Testes locais
./scripts/test/test-production.sh        # Testes de produção
./scripts/test/test-user-permissions.sh  # Teste de permissões
```

## 🔧 Configuração

### Variáveis de Ambiente
- **Desenvolvimento**: `config/env/.env.development`
- **Produção**: `config/env/.env.production`
- **Staging**: `config/env/.env.staging`

### Docker Compose
- **Desenvolvimento**: `config/docker/docker-compose.dev.yml`
- **Produção**: `config/docker/docker-compose.prod.yml`
- **Staging**: `config/docker/docker-compose.staging.yml`
- **Testes**: `config/docker/docker-compose.test.yml`

## 🎯 Funcionalidades Principais

### 🛡️ Margin Guard
- Monitoramento contínuo da margem (5 segundos)
- Ações automáticas: Close, Reduce, Add Margin
- Notificações multi-canal (Email, Telegram, Webhook)
- Configuração personalizada por usuário

### 🎮 Simulações em Tempo Real
- 4 cenários de mercado: Bull, Bear, Sideways, Volatile
- 4 tipos de automação: Margin Guard, Take Profit, Trailing Stop, Auto Entry
- Interface visual com gráficos interativos
- Métricas detalhadas de performance

### 🎫 Sistema de Cupons
- 3 variáveis principais: Tempo, Valor, Funcionalidade
- Analytics avançados com rastreamento de eventos
- Interface de administração completa
- Validações robustas

### 🌐 Internacionalização
- Suporte a PT-BR e EN-US
- Conversão inteligente de moedas (BTC, USD, BRL, EUR, sats)
- Cache inteligente com APIs externas
- Hooks customizados para formatação

### 📊 Gráficos e Visualizações
- Gráfico customizado TradingView-style
- Widget TradingView oficial com dados reais
- Dashboard cards financeiros com cálculos precisos
- Validação matemática 100% precisa

### 🔐 Sistema de Segurança Avançado
- **JWT de acesso**: 2 horas (configurável)
- **Refresh tokens**: 7 dias (configurável)
- **Criptografia AES-256-CBC** para credenciais sensíveis
- **Sistema de auditoria completo** com logs detalhados
- **Revogação de tokens** por usuário ou global
- **Monitoramento de sessões** e atividades suspeitas
- **Painel administrativo** para configurações de segurança
- **Detecção de tentativas** de login suspeitas
- **Limpeza automática** de tokens expirados
- **Rastreamento de IP e User-Agent** para todas as ações
- **Configurações dinâmicas** via banco de dados

#### APIs de Segurança (Admin)
```bash
GET    /api/admin/security/configs              # Listar configurações
PUT    /api/admin/security/configs/:key         # Atualizar configuração
GET    /api/admin/security/audit-logs           # Logs de auditoria
POST   /api/admin/security/revoke-tokens/:userId # Revogar tokens
POST   /api/admin/security/cleanup-tokens       # Limpar tokens expirados
GET    /api/admin/security/dashboard            # Dashboard de segurança
```

#### Configurações de Segurança Disponíveis
| Configuração | Padrão | Descrição |
|-------------|--------|-----------|
| `jwt_expires_in` | `2h` | Expiração do JWT de acesso |
| `refresh_token_expires_in` | `7d` | Expiração do refresh token |
| `max_login_attempts` | `5` | Máximo de tentativas de login |
| `lockout_duration` | `15m` | Duração do bloqueio |
| `session_timeout` | `30m` | Timeout de sessão |
| `require_2fa` | `false` | Obrigar 2FA |
| `token_rotation_enabled` | `true` | Rotação automática de tokens |
| `max_concurrent_sessions` | `3` | Máximo de sessões simultâneas |

## 🏗️ Arquitetura

### Backend
- **Framework**: Fastify
- **ORM**: Prisma
- **Banco**: PostgreSQL
- **Cache**: Redis
- **Queue**: BullMQ
- **Autenticação**: JWT + Refresh Tokens

### Frontend
- **Framework**: React 18 + Next.js
- **Build Tool**: Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts + lightweight-charts
- **Estado**: Zustand
- **i18n**: react-i18next

### Workers
- **Margin Monitor**: Monitoramento contínuo de margem
- **Automation Executor**: Execução de automações
- **Simulation Executor**: Simulações em tempo real
- **Notification**: Sistema de notificações
- **Payment Validator**: Validação de pagamentos

## 🔒 Segurança

- **Autenticação**: JWT + 2FA + Social Auth
- **Criptografia**: AES-256 para dados sensíveis
- **Proteção**: Rate limiting + CAPTCHA + CSRF + XSS
- **Monitoramento**: Logs de segurança + alertas
- **Compliance**: GDPR + auditoria + backup

## 📊 Monitoramento

- **Prometheus**: Métricas de sistema
- **Grafana**: Dashboards visuais
- **Alertmanager**: Alertas automáticos
- **Sentry**: Error tracking
- **Logs**: Estruturados e centralizados

## 🚀 Deploy

### Docker
```bash
# Desenvolvimento
docker compose -f config/docker/docker-compose.dev.yml up -d

# Produção
docker compose -f config/docker/docker-compose.prod.yml up -d
```

### Kubernetes
```bash
# Aplicar configurações
kubectl apply -f k8s/
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Testes de produção
./scripts/test/test-production.sh
```

## 📈 Status do Projeto

- **Versão**: 1.3.1
- **Status**: Produção Ready
- **Documentação**: 100% Completa
- **Testes**: Cobertura abrangente
- **Segurança**: Auditada e aprovada

## 🤝 Contribuição

1. Fork do repositório
2. Crie uma branch para sua feature
3. Faça as alterações necessárias
4. Execute os testes
5. Abra um pull request

## 📞 Suporte

- **Email**: dev@hub-defisats.com
- **GitHub**: [Issues do repositório]
- **Documentação**: `.system/README.md`

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Hub DeFiSats** - Plataforma completa de automação de trading no LN Markets 🚀

*Desenvolvido com ❤️ para traders que buscam eficiência e segurança máxima*
