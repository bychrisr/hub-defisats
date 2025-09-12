# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0-production] - 2025-09-12

### Adicionado
- **Script de correção Docker**: `scripts/fix-docker-production.sh` para resolver problemas de produção
- **Arquivo de ambiente produção**: `.env.production` com variáveis configuradas
- **Script de inicialização**: `backend/start.sh` para resolver paths do TypeScript
- **Documentação de soluções**: `PRODUCTION_FIXES_APPLIED.md` com detalhes das correções

### Corrigido
- **Erro ContainerConfig**: Resolvido problema de imagens Docker corrompidas
- **Validação de ambiente**: Corrigido schema para permitir URLs opcionais vazias
- **Paths do TypeScript**: Configurado tsconfig-paths corretamente
- **Dependências Prisma**: Adicionadas bibliotecas SSL necessárias
- **Inicialização PostgreSQL**: Removido volume mount problemático do init.sql

### Alterado
- **Dockerfile.prod**: Adicionadas dependências SSL e script de inicialização
- **docker-compose.prod.yml**: Removido volume mount do init.sql
- **env.ts**: Atualizado schema de validação para URLs opcionais
- **PRODUCTION_READY_SUMMARY.md**: Atualizado status para produção funcional

### Status
- ✅ **Produção 100% funcional**
- ✅ Backend: http://localhost:23000
- ✅ Frontend: http://localhost:23001
- ✅ PostgreSQL e Redis funcionando
- ✅ Workers funcionando

## [0.2.23] - 2025-01-20

### Adicionado
- **Arquitetura de Proxy Reverso Global**: Implementado proxy global para gerenciamento centralizado de SSL/TLS
- **Separação de responsabilidades**: Nginx interno simplificado para roteamento de aplicação
- **Rede compartilhada**: Implementada `proxy-network` para comunicação entre proxy e aplicações
- **Scripts de gerenciamento**: Criado `start-proxy.sh` para facilitar operações do proxy
- **Documentação de arquitetura**: Adicionada documentação específica sobre proxy architecture

### Alterado
- **nginx.conf interno**: Removido SSL e redirecionamento HTTP→HTTPS (agora gerenciado pelo proxy global)
- **docker-compose.prod.yml**: Conectado nginx interno à rede `proxy-network`
- **Arquitetura de deploy**: Separado proxy global em container independente

### Detalhes Técnicos
- Proxy global localizado em `~/proxy/` com configuração completa
- Nginx interno agora escuta apenas na porta 80 (HTTP)
- SSL termination centralizado no proxy global
- Headers de segurança movidos para o proxy global
- Estrutura escalável para múltiplos projetos

## [0.2.21] - 2025-09-11

### Corrigido
- **Schema do Fastify para dados LN Markets**: Corrigido schema de resposta que estava filtrando dados da API LN Markets
- **Campos de posições**: Adicionados todos os campos reais da API LN Markets no schema (quantity, price, liquidation, margin, pl, leverage, etc.)
- **Exibição de dados**: Frontend agora recebe dados completos em vez de apenas id e side
- **Página de trades**: Dados agora são exibidos corretamente com formatação adequada

### Detalhes Técnicos
- Schema anterior definia apenas campos genéricos (id, market, side, size, entryPrice, liquidationPrice, unrealizedPnl)
- API LN Markets retorna campos específicos (quantity, price, liquidation, margin, pl, leverage, opening_fee, closing_fee, etc.)
- Fastify filtra automaticamente dados de resposta baseado no schema definido
- Solução: Atualizado schema para incluir todos os campos da API LN Markets

## [0.2.20] - 2025-09-11

### Corrigido
- **Geração de assinatura HMAC-SHA256**: Corrigido path para incluir prefixo /v2
- **Configuração mainnet/testnet**: Alterado para usar mainnet por padrão
- **Middleware de autenticação**: Substituído (fastify as any).authenticate por authMiddleware
- **Tratamento de erros**: Melhorado tratamento de erros específicos da LN Markets

## [0.2.19] - 2025-09-10

### Adicionado
- **Integração completa com LN Markets API**: Wrapper abrangente para todas as operações disponíveis
- **Autenticação HMAC-SHA256**: Implementação correta da autenticação da LN Markets
- **Endpoints de posições**: Rota para buscar posições do usuário
- **Endpoints de dados de mercado**: Rota para buscar dados de mercado
- **Tratamento de erros**: Sistema robusto de tratamento de erros específicos da LN Markets
- **Interface de usuário**: Página de trades com exibição completa de posições
- **Validação de credenciais**: Sistema de validação e configuração de credenciais LN Markets

### Detalhes Técnicos
- Serviço principal: `LNMarketsAPIService` com interceptors Axios
- Controllers especializados: Futures, Options, User, Market Data
- Rotas REST: `/api/lnmarkets/*` para todas as operações
- Frontend: Componentes React para exibição e gerenciamento de credenciais
- Documentação: Swagger/OpenAPI para todos os endpoints

---

**Legenda:**
- `Adicionado` para novas funcionalidades
- `Alterado` para mudanças em funcionalidades existentes
- `Depreciado` para funcionalidades que serão removidas em versões futuras
- `Removido` para funcionalidades removidas nesta versão
- `Corrigido` para correções de bugs
- `Segurança` para vulnerabilidades corrigidas
