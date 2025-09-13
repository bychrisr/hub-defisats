# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [v0.2.0] - 2025-01-13

### Adicionado
- **Sistema de Dados em Tempo Real**: Implementado WebSocket para dados de mercado ao vivo
- **Atualização Periódica**: Sistema de refresh automático a cada 5 segundos
- **Atualizações Silenciosas**: Interface atualiza sem recarregar a página
- **Indicador de Status**: Componente RealtimeStatus com melhor contraste e legibilidade
- **Feedback Visual**: Indicadores de loading e atualização em background
- **Integração LN Markets**: Dados reais da API LN Markets sem simulação
- **Gerenciamento de Estado**: Contexto RealtimeDataContext para dados centralizados
- **Funções de Transformação**: loadRealPositions e updatePositions para dados corretos

### Alterado
- **Configuração de Portas**: Frontend (13000) e Backend (13010) para desenvolvimento
- **Sistema de Cores**: Melhorado contraste do indicador "Tempo Real"
- **Atualização de Dados**: Reduzido intervalo de 30s para 5s para maior responsividade
- **Delay Inicial**: Adicionado delay de 3s antes da primeira atualização automática
- **Mapeamento de Dados**: Corrigido mapeamento de side (b=long, s=short) e P&L
- **URLs de API/WebSocket**: Atualizadas para usar porta 13010

### Corrigido
- **Import lightweight-charts**: Resolvido erro de importação do pacote
- **Compatibilidade Node.js**: Corrigido problema de versão do Node.js
- **P&L NaN**: Corrigido exibição de P&L com valores numéricos válidos
- **Side Invertido**: Corrigido mapeamento de posições long/short
- **Dupla Transformação**: Evitado processamento duplo de dados da API
- **Simulação de Dados**: Removida simulação que corrompia dados reais
- **Erro Fastify 5.x**: Corrigido `reply.getResponseTime` não disponível
- **Conflito de Cores**: Resolvido problema de contraste no indicador de status

### Removido
- **Simulação de Dados**: Removido sistema que simulava atualizações de P&L
- **Dependências Desnecessárias**: Limpeza de pacotes não utilizados
- **Código de Simulação**: Removidos useEffects que simulavam dados

### Detalhes Técnicos
- **WebSocket**: Conexão em tempo real para dados de mercado
- **API Integration**: Integração direta com LN Markets API v2
- **State Management**: Zustand + Context API para gerenciamento de estado
- **Error Handling**: Tratamento robusto de erros de conexão
- **Performance**: Otimizações para atualizações frequentes
- **UI/UX**: Transições suaves e feedback visual adequado

## [v0.9.0] - 2025-01-19

### Adicionado
- **Sistema de Design CoinGecko**: Paleta de cores completa inspirada no CoinGecko
- **Sistema de Temas**: Light/Dark mode com transições suaves
- **Design Tokens**: Sistema centralizado de cores, tipografia e espaçamentos
- **Componentes CoinGecko**: PriceChange, CoinGeckoCard, RealtimeStatus
- **Contexto de Tema**: ThemeContext com hooks para cores e classes
- **Documentação Visual**: Guia de estilos completo e página de exemplo
- **Página Design System**: Demonstração interativa de todos os componentes
- **Transições Globais**: Animações suaves para mudanças de tema
- **Contraste Melhorado**: Cores otimizadas para acessibilidade

### Alterado
- **Identidade Visual**: Overhaul completo da paleta de cores
- **Todas as Páginas**: Atualizadas para usar o novo sistema de cores
- **Componentes**: Migrados para usar variáveis CSS do tema
- **Tipografia**: Mantida Inter conforme especificação
- **Tema Padrão**: Dark como padrão quando não detectar preferência
- **Navegação**: Corrigidos links quebrados (automations, signup)

### Corrigido
- **Cores Hardcoded**: Removidas todas as cores fixas (text-gray-*, etc.)
- **Contraste Dark Mode**: Melhorada legibilidade em modo escuro
- **Links de Navegação**: Corrigidos links para rotas existentes
- **Ícone Sats**: Melhor contraste em ambos os temas
- **Loaders**: Cores adaptáveis ao tema
- **Páginas de Login/Registro**: Fundos adaptáveis ao tema

### Removido
- **Cores Antigas**: Sistema de cores anterior removido
- **Dependências Conflitantes**: Removido lovable-tagger
- **Classes Hardcoded**: Substituídas por variáveis de tema

### Breaking Changes
- **Sistema de Cores**: Mudança completa na paleta de cores
- **Contexto de Tema**: API atualizada com novos hooks
- **Componentes**: Estilos atualizados para nova identidade visual

## [Unreleased] - 2025-01-19

### Adicionado
- **Página de Trading**: Nova página `/trading` com gráficos de preços em tempo real
- **Gráfico customizado**: Implementado usando `lightweight-charts` para visualização de candlesticks
- **WebSocket integration**: Hook `useWebSocket` para conexão em tempo real com dados de mercado
- **Serviço de dados de mercado**: `marketDataService` para gerenciar dados históricos e em tempo real
- **Componente TradingChart**: Gráfico interativo com controles de conexão e atualização
- **Dados de mercado**: Exibição de preço atual, variação 24h, high/low, volume
- **Navegação**: Adicionado link "Trading" no menu lateral com ícone Activity
- **Backend WebSocket**: Serviços para conexão WebSocket com LN Markets
- **Dependências**: Instalado `lightweight-charts` e `recharts` para visualização de dados
- **Tema**: Gráficos adaptam cores automaticamente ao tema claro/escuro

### Corrigido
- **Dupla barra de rolagem**: Removido `overflow-auto` redundante do componente Table
- **Layout de tabelas**: Ajustado controle de scroll para evitar múltiplas camadas de rolagem
- **Experiência do usuário**: Interface agora tem scroll único e mais limpo
- **Todas as páginas com tabelas**: Aplicada correção em 7 páginas (Automations, Notifications, Users, Reports, admin/Users, admin/Coupons, Payments)
- **Scroll global único**: Removido scroll interno das tabelas, mantendo apenas scroll global da página
- **Sidebar fixa**: Sidebar permanece fixa sem scroll, conteúdo principal usa scroll global
- **Layout principal**: Removido `height: calc(100vh - 4rem)` que causava dupla barra de rolagem
- **Altura flexível**: Alterado para `min-h-[calc(100vh-4rem)]` permitindo conteúdo expandir naturalmente
- **Ícone de sats**: Redesenhado baseado na referência da LN Markets - maior, mais grosso, sem círculo
- **Legibilidade**: Aumentado tamanho padrão de 16px para 20px e tamanho de uso de 14px para 18px
- **Consistência global**: Aplicado SatsIcon em todas as páginas que exibem valores em sats
- **Páginas atualizadas**: Trades, admin/Dashboard, Payments com ícones padronizados
- **Tamanhos otimizados**: 18px para valores principais, 16px para tabelas secundárias
- **Símbolo correto**: Implementado símbolo oficial de satoshi com 5 retângulos horizontais
- **Design oficial**: Baseado na proposta do Bitcoin Design Initiative
- **Estrutura**: 2 quadrados nas extremidades + 3 linhas longas no centro
- **Sistema de temas**: Implementado toggle light/dark mode com Context API
- **Cores do SatsIcon**: Sempre preto (light) ou branco (dark) independente do contexto
- **Toggle no menu**: Adicionado no dropdown do usuário no header
- **Persistência**: Tema salvo no localStorage e detecta preferência do sistema
- **Formatação do Leverage**: Corrigido para mostrar apenas 1 casa decimal (7.8x em vez de 7.8882x)
- **Correção do Total Value**: Alterado cálculo para usar margin total em vez de quantity * price
- **Exibição em Sats**: Total Value agora mostra margin total em sats com ícone correto
- **Título atualizado**: "Total Value" alterado para "Total Margin" para maior clareza

### Adicionado
- **Ambiente de Staging Obrigatório**: Implementado `docker-compose.staging.yml` com portas separadas (23000, 23010)
- **Banco de dados staging**: `defisats_staging` independente da produção
- **Script de setup automatizado**: `scripts/setup-staging.sh` para configuração completa do ambiente
- **Nginx staging**: Configuração específica em `infra/nginx/staging.conf` com headers de ambiente
- **Validação real de credenciais**: Removida lógica de "aceitar qualquer coisa em dev"
- **Documentação ADR-017**: Decisão arquitetural para staging obrigatório

### Alterado
- **Validação LN Markets**: Agora valida SEMPRE credenciais reais, mesmo em desenvolvimento
- **Processo de deploy**: Staging obrigatório antes de qualquer deploy em produção
- **Configuração de ambiente**: `env.staging` com credenciais sandbox/testnet
- **Rate limiting**: Configurações mais permissivas para ambiente de staging

### Corrigido
- **Validação de credenciais**: Removida lógica que aceitava test credentials em desenvolvimento
- **Workflow de desenvolvimento**: Estabelecido processo profissional de validação

### Status
- ✅ **Ambiente de staging configurado**
- ✅ **Script de setup automatizado**
- ✅ **Validação real de credenciais**
- ✅ **Processo de deploy profissional**
- ⚠️ **Staging obrigatório antes de produção**

## [0.9.1-prod-test] - 2025-09-12

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
- ✅ **Produção funcional (em teste)**
- ✅ Backend: http://localhost:23000
- ✅ Frontend: http://localhost:23001
- ✅ PostgreSQL e Redis funcionando
- ✅ Workers funcionando
- ⚠️ **Versão de teste - não final para produção**

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
