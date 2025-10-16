# Decisões Técnicas (Architecture Decision Records)

Este documento registra as decisões técnicas importantes tomadas durante o desenvolvimento do Axisor.

## ADR-012: RENOMEAÇÃO COMPLETA - HUB DEFISATS → AXISOR

**Data**: 2025-01-10  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Migração completa do nome do projeto

### Problema
O projeto "Hub DeFiSats" precisava ser renomeado para "Axisor" por questões de branding e identidade visual.

### Decisão
Realizar uma renomeação completa e abrangente de todos os aspectos do projeto:

#### 1. **Nomenclatura de Containers**
- `hub-defisats-*` → `axisor-*`
- Network: `hub-defisats-network` → `axisor-network`

#### 2. **Database e Infraestrutura**
- Database name: `hub_defisats` → `axisor`
- User: `hubdefisats` → `axisor`
- Password: `hubdefisats_dev_password` → `axisor_dev_password`

#### 3. **Métricas e Monitoring**
- Prometheus metrics: `hub_defisats_*` → `axisor_*`
- Grafana dashboards atualizados
- AlertManager rules atualizadas

#### 4. **User-Agent Strings**
- Todos os User-Agent strings atualizados para "Axisor"
- Padrão: `Axisor/1.0`, `Axisor-Monitor/1.0`, etc.

#### 5. **Email Addresses**
- `@defisats.com` → `@axisor.com`
- Admin: `admin@axisor.com`
- Support: `support@axisor.com`

#### 6. **Package Metadata**
- Author: "Hub DeFiSATS Team" → "Axisor Team"
- Package names mantidos para compatibilidade

### Implementação
- **76 arquivos modificados** em 7 categorias:
  - Documentação (16 arquivos)
  - Configurações Docker/K8s (7 arquivos)
  - Services Backend (11 arquivos)
  - Routes/Scripts Backend (8 arquivos)
  - Tests/Workers Backend (5 arquivos)
  - Frontend (10 arquivos)
  - Scripts (11 arquivos)
  - Monitoring (2 arquivos)
  - Infraestrutura (6 arquivos)

### Consequências
#### Positivas
- ✅ Identidade visual consistente
- ✅ Branding unificado
- ✅ Ambiente limpo e organizado
- ✅ Zero referências aos nomes antigos

#### Negativas
- ⚠️ Breaking changes significativos
- ⚠️ Necessidade de migração completa
- ⚠️ Perda de histórico de containers antigos

### Alternativas Consideradas
1. **Migração Gradual**: Rejeitada por complexidade
2. **Manter Nomes Antigos**: Rejeitada por inconsistência
3. **Renomeação Parcial**: Rejeitada por confusão

### Validação
- ✅ Ambiente Docker funcional
- ✅ Banco de dados populado
- ✅ API endpoints respondendo
- ✅ Frontend servindo corretamente
- ✅ Login admin funcionando
- ✅ Zero referências antigas encontradas

---

## ADR-011: CORREÇÃO DEFINITIVA - DUPLA CONVERSÃO TIMESTAMPS

**Data**: 2025-01-26  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Problema crítico de timestamps duplicados

### Problema
Timestamps sendo convertidos duas vezes, causando inconsistências:
1. Conversão automática do Prisma (ISO → Date)
2. Conversão manual no código (Date → ISO)

### Decisão
Remover todas as conversões manuais de timestamps e confiar na conversão automática do Prisma.

### Implementação
- Removidas conversões manuais de `created_at` e `updated_at`
- Mantida conversão automática do Prisma
- Adicionados logs para debug de timestamps

### Resultado
- ✅ Timestamps consistentes
- ✅ Performance melhorada
- ✅ Código mais limpo

---

## ADR-010: ARQUITETURA DE MICROSERVIÇOS

**Data**: 2025-01-25  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Necessidade de escalabilidade e manutenibilidade

### Decisão
Implementar arquitetura de microserviços com:
- **Backend**: Node.js + Fastify
- **Frontend**: React + Vite
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Queue**: BullMQ
- **Monitoring**: Prometheus + Grafana

### Benefícios
- ✅ Escalabilidade horizontal
- ✅ Manutenibilidade melhorada
- ✅ Deploy independente
- ✅ Tecnologias especializadas

---

## ADR-009: SISTEMA DE RATE LIMITING

**Data**: 2025-01-24  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Proteção contra abuso e DDoS

### Decisão
Implementar rate limiting com:
- **Redis**: Armazenamento de contadores
- **Sliding Window**: Algoritmo de janela deslizante
- **Configuração por Endpoint**: Limites específicos
- **Environment-aware**: Diferentes limites por ambiente

### Configurações
- **Development**: 100 req/15min
- **Production**: 60 req/15min
- **Admin**: 200 req/15min

---

## ADR-008: AUTENTICAÇÃO JWT

**Data**: 2025-01-23  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Sistema de autenticação seguro e escalável

### Decisão
Implementar JWT com:
- **Access Token**: 24h de duração
- **Refresh Token**: 7 dias de duração
- **Secure Storage**: HttpOnly cookies
- **Rotation**: Refresh token rotation

### Segurança
- ✅ Tokens assinados com chave secreta
- ✅ Expiração automática
- ✅ Refresh token rotation
- ✅ Logout em todos os dispositivos

---

## ADR-007: BANCO DE DADOS POSTGRESQL

**Data**: 2025-01-22  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Necessidade de banco relacional robusto

### Decisão
Escolher PostgreSQL por:
- **ACID Compliance**: Transações confiáveis
- **JSON Support**: Dados semi-estruturados
- **Performance**: Otimizado para queries complexas
- **Ecosystem**: Prisma ORM

### Schema Design
- **Normalização**: 3NF para dados críticos
- **Denormalização**: JSON fields para flexibilidade
- **Indexes**: Otimização de queries frequentes
- **Constraints**: Integridade referencial

---

## ADR-006: FRONTEND REACT + TYPESCRIPT

**Data**: 2025-01-21  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Interface moderna e type-safe

### Decisão
Stack frontend:
- **React 18**: Hooks e Concurrent Features
- **TypeScript**: Type safety
- **Vite**: Build tool rápido
- **Tailwind CSS**: Utility-first CSS
- **React Query**: Server state management

### Benefícios
- ✅ Type safety completo
- ✅ Performance otimizada
- ✅ Developer experience melhorada
- ✅ Hot reload rápido

---

## ADR-005: DOCKER CONTAINERIZATION

**Data**: 2025-01-20  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Ambiente de desenvolvimento consistente

### Decisão
Containerizar toda a aplicação:
- **Multi-stage builds**: Otimização de imagens
- **Health checks**: Monitoramento de saúde
- **Volume mounts**: Desenvolvimento local
- **Network isolation**: Segurança

### Benefícios
- ✅ Ambiente consistente
- ✅ Deploy simplificado
- ✅ Isolamento de dependências
- ✅ Escalabilidade horizontal

---

## ADR-004: SISTEMA DE LOGS ESTRUTURADOS

**Data**: 2025-01-19  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Observabilidade e debugging

### Decisão
Implementar logs estruturados com:
- **Pino**: Logger performático
- **JSON Format**: Estrutura padronizada
- **Log Levels**: Debug, Info, Warn, Error
- **Correlation IDs**: Rastreamento de requests

### Estrutura
```json
{
  "timestamp": "2025-01-10T01:53:36.105Z",
  "level": "info",
  "message": "User logged in",
  "userId": "dad41202-4d60-4916-9a28-c7bb7008570b",
  "correlationId": "req-123"
}
```

---

## ADR-003: SISTEMA DE NOTIFICAÇÕES

**Data**: 2025-01-18  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Comunicação com usuários

### Decisão
Implementar sistema de notificações:
- **Email**: SMTP com templates
- **Push**: Web Push API
- **In-app**: Notificações internas
- **Queue**: BullMQ para processamento assíncrono

### Templates
- ✅ Welcome email
- ✅ Password reset
- ✅ Trade notifications
- ✅ System alerts

---

## ADR-002: SISTEMA DE AUTOMAÇÃO

**Data**: 2025-01-17  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Trading automatizado

### Decisão
Implementar sistema de automação:
- **Margin Guard**: Proteção de margem
- **Take Profit/Stop Loss**: Gestão de risco
- **Automatic Entries**: Entradas automáticas
- **Backtesting**: Simulação histórica

### Arquitetura
- **Event-driven**: Webhooks e polling
- **State machine**: Estados de automação
- **Queue system**: Processamento assíncrono
- **Monitoring**: Alertas e métricas

---

## ADR-001: ESCOLHA DA STACK TECNOLÓGICA

**Data**: 2025-01-16  
**Status**: ✅ Aprovado e Implementado  
**Contexto**: Definição da arquitetura base

### Decisão
Stack escolhida:
- **Backend**: Node.js + Fastify
- **Frontend**: React + TypeScript
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Queue**: BullMQ
- **Monitoring**: Prometheus + Grafana

### Critérios
- ✅ Performance
- ✅ Escalabilidade
- ✅ Developer experience
- ✅ Ecosystem maturity
- ✅ Community support

---

**Última Atualização**: 2025-01-10  
**Versão**: v1.5.0