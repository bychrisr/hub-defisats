# Decisões Técnicas do Projeto Hub DeFiSats

Este documento registra decisões técnicas importantes tomadas durante o desenvolvimento do projeto.

## 2025-01-13 - Sistema de Cupons e Navegação Responsiva (v0.3.0)

### Decisão: Implementação de Sistema de Cupons Completo
**Problema**: Necessidade de sistema de cupons com 3 variáveis principais (tempo, valor, funcionalidade) e administração completa.

**Decisão**: Implementar sistema completo com:
- **Backend**: Prisma schema com `Coupon` e `CouponAnalytics` models
- **API**: Rotas dedicadas `/api/admin/coupons` com CRUD completo
- **Validação**: Zod schemas com regras de negócio complexas
- **Frontend**: Interface administrativa com dashboard e métricas
- **Analytics**: Rastreamento de views, clicks, uses e conversão

**Justificativa**: Sistema modular e escalável que permite gestão completa de cupons com métricas detalhadas.

### Decisão: Navegação Responsiva Estilo CoinGecko
**Problema**: Interface não era otimizada para mobile e não seguia padrões modernos de UX.

**Decisão**: Implementar navegação responsiva com:
- **Desktop**: Menu centralizado com perfil de usuário e notificações
- **Mobile**: Menu fixo na parte inferior com drawer lateral
- **Componentes**: `ResponsiveLayout`, `DesktopNavigation`, `MobileNavigation`, `MobileDrawer`
- **Tema**: Sistema dark/light com persistência

**Justificativa**: Melhora significativa na experiência do usuário e consistência visual.

### Decisão: Gráfico LN Markets Style
**Problema**: Gráfico não seguia o design da LN Markets conforme solicitado.

**Decisão**: Criar componente `LNMarketsChart` que replica:
- **Design**: Cores, tipografia e layout idênticos à LN Markets
- **Dados**: Integração com WebSocket para dados em tempo real
- **Responsividade**: Adaptação para diferentes tamanhos de tela

**Justificativa**: Consistência visual com a plataforma de referência e melhor experiência do usuário.

### Decisão: Conversão de Schemas Zod para JSON Schema
**Problema**: Fastify não aceita schemas Zod diretamente, causando erros de serialização.

**Decisão**: Converter todos os schemas Zod para JSON Schema nas rotas:
- **Manter Zod**: Para validação de dados no service layer
- **JSON Schema**: Para documentação e validação de rotas Fastify
- **Dupla Validação**: Zod no service + JSON Schema nas rotas

**Justificativa**: Compatibilidade com Fastify mantendo validação robusta.

## 2025-01-13 - Correção de Dupla Transformação (v0.2.1)

### Problema
Após implementação do sistema de dados em tempo real, foi identificado um problema crítico:
- **Dupla Transformação**: Dados eram transformados duas vezes, causando sobrescrita
- **Dados Zerados**: Margin Ratio, Trading Fees e Funding Cost apareciam como "0" após atualizações
- **Inconsistência**: Dados iniciais corretos, mas atualizações em tempo real corrompiam valores
- **Logs Mostravam**: Primeira exibição com valores corretos, segunda exibição com valores zerados

### Decisão
Corrigir o `useEffect` que sincroniza dados em tempo real para usar valores já calculados:

**Antes:**
```typescript
marginRatio: pos.leverage > 0 ? (100 / pos.leverage) : 0,
tradingFees: 0, // Será calculado pelo backend
fundingCost: 0, // Será calculado pelo backend
```

**Depois:**
```typescript
marginRatio: (pos as any).marginRatio || (pos.leverage > 0 ? (100 / pos.leverage) : 0),
tradingFees: (pos as any).tradingFees || 0,
fundingCost: (pos as any).fundingCost || 0,
```

### Justificativa
- **Reutilizar Cálculos**: O RealtimeDataContext já calcula corretamente os valores
- **Evitar Duplicação**: Não recalcular dados já processados
- **Manter Consistência**: Usar mesma lógica de transformação em todo o sistema
- **Performance**: Evitar processamento desnecessário

### Implementação
1. **Modificar useEffect**: Usar valores calculados do contexto em vez de recalcular
2. **Type Casting**: Usar `(pos as any)` para acessar propriedades não tipadas
3. **Fallback**: Manter cálculo original como fallback se valores não existirem
4. **Consistência**: Garantir que dados iniciais e atualizações sejam idênticos

### Consequências
- ✅ **Dados Corretos**: Margin Ratio, Trading Fees e Funding Cost exibem valores corretos
- ✅ **Consistência**: Dados iniciais e atualizações em tempo real são idênticos
- ✅ **Performance**: Reduzido processamento desnecessário
- ✅ **Manutenibilidade**: Código mais limpo e lógico
- ✅ **Sistema Funcional**: Sistema de dados em tempo real totalmente operacional

## 2025-01-13 - Sistema de Dados em Tempo Real (v0.2.0)

### Problema
A aplicação precisava exibir dados de posições da LN Markets em tempo real, mas enfrentava múltiplos problemas:
1. **Import lightweight-charts**: Erro de importação do pacote
2. **Compatibilidade Node.js**: Incompatibilidade de versão
3. **P&L NaN**: Valores de P&L não exibidos corretamente
4. **Side Invertido**: Posições long/short exibidas incorretamente
5. **Simulação de Dados**: Sistema de simulação corrompia dados reais
6. **Atualizações**: Dados não atualizavam automaticamente
7. **Contraste UI**: Indicador "Tempo Real" com baixo contraste

### Decisão
Implementar sistema completo de dados em tempo real com correções abrangentes:

1. **WebSocket Integration**: Conexão em tempo real para dados de mercado
2. **Atualização Periódica**: Sistema de refresh automático a cada 5 segundos
3. **Atualizações Silenciosas**: Interface atualiza sem recarregar a página
4. **Dados Reais**: Remover simulação e usar apenas dados da LN Markets API
5. **Transformação Correta**: Evitar dupla transformação de dados
6. **UI/UX Melhorada**: Indicadores visuais com melhor contraste
7. **Gerenciamento de Estado**: Contexto centralizado para dados em tempo real

### Justificativa
1. **Dados Fidedignos**: Usuário solicitou dados reais da LN Markets sem simulação
2. **Experiência Fluida**: Atualizações silenciosas melhoram UX
3. **Performance**: 5 segundos é balance ideal entre responsividade e carga
4. **Confiabilidade**: Dados reais são mais confiáveis que simulação
5. **Manutenibilidade**: Código mais limpo sem lógica de simulação
6. **Acessibilidade**: Melhor contraste melhora legibilidade

### Implementação
```typescript
// Sistema de atualização periódica
useEffect(() => {
  let intervalId: NodeJS.Timeout;
  const initialDelay = setTimeout(() => {
    intervalId = setInterval(() => {
      fetchPositions(false); // Atualização periódica
    }, 5000); // 5 segundos
  }, 3000); // Delay inicial de 3s

  return () => {
    clearTimeout(initialDelay);
    if (intervalId) clearInterval(intervalId);
  };
}, []);

// Transformação correta de dados
const loadRealPositions = useCallback((positions: any[]) => {
  const transformedPositions = positions.map(pos => ({
    id: pos.id,
    symbol: 'BTC',
    side: pos.side === 'b' ? 'long' : 'short', // Correto
    pnl: typeof pos.pl === 'number' ? pos.pl : 0, // Numérico
    // ... outros campos
  }));
  setData(prev => ({ ...prev, positions: transformedPositions }));
}, []);

// Indicador com melhor contraste
className: 'bg-success/20 text-success border-success/30 hover:bg-success/30'
```

### Consequências
- ✅ **Dados reais em tempo real** - sem simulação
- ✅ **Atualizações silenciosas** - UX melhorada
- ✅ **P&L correto** - valores numéricos válidos
- ✅ **Side correto** - long/short mapeados corretamente
- ✅ **Contraste melhorado** - indicador legível
- ✅ **Performance otimizada** - 5s de intervalo
- ✅ **Código limpo** - sem lógica de simulação

## 2025-01-19 - Implementação de Gráficos de Trading

### Problema
O usuário solicitou integração de TradingView com dados da LN Markets para exibir gráficos de preços em tempo real na aplicação.

### Decisão
Implementar solução customizada usando bibliotecas de gráficos leves ao invés do widget oficial do TradingView:

1. **Biblioteca escolhida**: `lightweight-charts` - mais leve e customizável que TradingView
2. **Arquitetura**: Separar em componentes reutilizáveis (TradingChart, useWebSocket, marketDataService)
3. **WebSocket**: Implementar conexão em tempo real para dados de mercado
4. **Dados**: Usar API REST para dados históricos e WebSocket para atualizações em tempo real
5. **Tema**: Adaptar cores automaticamente ao tema claro/escuro da aplicação

### Justificativa
- **Performance**: `lightweight-charts` é mais leve que TradingView widget
- **Customização**: Maior controle sobre aparência e funcionalidades
- **Integração**: Melhor integração com o design system existente
- **Flexibilidade**: Fácil adaptação para diferentes tipos de dados de mercado

### Implementação
- Criado componente `TradingChart` com controles de conexão
- Implementado hook `useWebSocket` para gerenciar conexões
- Desenvolvido `marketDataService` para processar dados de mercado
- Adicionada página `/trading` com interface completa
- Configurado backend WebSocket para dados em tempo real

## 2025-09-12 - Resolução de Problemas de Produção

### Problema
A aplicação apresentava múltiplos problemas ao tentar fazer deploy em produção:
1. Erro `KeyError: 'ContainerConfig'` do Docker Compose
2. Variáveis de ambiente não configuradas
3. Paths do TypeScript não resolvidos em runtime
4. Dependências SSL do Prisma faltando
5. Validação de ambiente falhando para URLs opcionais

### Decisão
Implementar soluções específicas para cada problema identificado:

1. **Script de correção Docker**: Criar `scripts/fix-docker-production.sh` para limpeza completa
2. **Configuração de ambiente**: Criar `.env.production` com valores válidos
3. **Resolução de paths**: Implementar `backend/start.sh` com tsconfig-paths
4. **Dependências SSL**: Adicionar `openssl libc6-compat` ao Dockerfile.prod
5. **Validação flexível**: Permitir strings vazias para URLs opcionais no schema

### Justificativa
1. **Problemas de cache**: Docker Compose com imagens corrompidas necessitava limpeza completa
2. **Configuração centralizada**: Arquivo `.env.production` facilita gerenciamento de variáveis
3. **Runtime vs Build**: TypeScript paths funcionam em build mas não em runtime sem configuração
4. **Compatibilidade Prisma**: Prisma requer bibliotecas SSL específicas no Alpine Linux
5. **Flexibilidade**: URLs opcionais devem permitir valores vazios para funcionalidades desabilitadas

### Implementação
- Script automatizado para correção de problemas Docker
- Schema de validação atualizado com `.or(z.literal(''))`
- Dockerfile otimizado com dependências necessárias
- Documentação completa das soluções aplicadas

### Resultado
✅ **Produção 100% funcional** com todos os serviços operacionais

## 2025-09-11 - Schema do Fastify para LN Markets

### Problema
O frontend estava recebendo apenas `id` e `side` de cada posição da LN Markets, mesmo que o backend estivesse retornando dados completos.

### Decisão
Atualizar o schema de resposta do Fastify para incluir todos os campos da API LN Markets.

### Justificativa
1. **Filtragem Automática**: O Fastify filtra automaticamente os dados de resposta baseado no schema definido
2. **Incompatibilidade de Campos**: O schema anterior definia campos genéricos que não correspondiam aos campos reais da API LN Markets
3. **Experiência do Usuário**: Dados incompletos causavam experiência "mock-like" na interface

### Implementação
```json
{
  "positions": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "uid": { "type": "string" },
        "type": { "type": "string" },
        "side": { "type": "string" },
        "quantity": { "type": "number" },
        "price": { "type": "number" },
        "liquidation": { "type": "number" },
        "margin": { "type": "number" },
        "pl": { "type": "number" },
        "leverage": { "type": "number" },
        // ... todos os campos da API LN Markets
      }
    }
  }
}
```

### Consequências
- ✅ Frontend recebe dados completos
- ✅ Página de trades exibe informações reais
- ✅ Experiência do usuário melhorada
- ⚠️ Schema mais complexo e verboso

## 2025-09-11 - Configuração Mainnet vs Testnet

### Problema
Aplicação estava usando testnet por padrão, causando erro 404 ao acessar endpoints da LN Markets.

### Decisão
Usar mainnet por padrão (`isTestnet: false`).

### Justificativa
1. **Credenciais do Usuário**: As credenciais fornecidas são de mainnet
2. **Ambiente de Desenvolvimento**: Mesmo em desenvolvimento, é melhor usar mainnet para testes reais
3. **Simplicidade**: Evita confusão entre ambientes

### Implementação
```typescript
const lnMarketsService = new LNMarketsAPIService(
  user.ln_markets_api_key!,
  user.ln_markets_api_secret!,
  user.ln_markets_passphrase!,
  false // isTestnet: false
);
```

### Consequências
- ✅ Funciona com credenciais reais
- ✅ Dados reais em desenvolvimento
- ⚠️ Requer credenciais de mainnet para funcionar

## 2025-09-11 - Geração de Assinatura HMAC-SHA256

### Problema
Erro "Signature is not valid" da API LN Markets, mesmo com credenciais corretas.

### Decisão
Corrigir a geração de assinatura para incluir prefixo `/v2` e simplificar a lógica.

### Justificativa
1. **Documentação da API**: A API LN Markets v2 requer prefixo `/v2` no path
2. **Validação Externa**: Testado com OpenSSL e curl para confirmar correção
3. **Simplicidade**: Lógica mais simples e clara

### Implementação
```typescript
// Path correto com prefixo /v2
const path = config.url ? `/v2${config.url}` : '';

// Assinatura simplificada
const message = timestamp + method + path + params;
const signature = hmac.update(message, 'utf8').digest('base64');
```

### Consequências
- ✅ Assinatura válida aceita pela API
- ✅ Autenticação funcionando corretamente
- ✅ Dados reais sendo retornados

## 2025-09-11 - Middleware de Autenticação

### Problema
Logs de debug não apareciam, indicando que o middleware não estava sendo executado.

### Decisão
Substituir `(fastify as any).authenticate` por `authMiddleware` customizado.

### Justificativa
1. **Controle**: Middleware customizado oferece melhor controle
2. **Debugging**: Logs mais detalhados e específicos
3. **Manutenibilidade**: Código mais limpo e fácil de manter

### Implementação
```typescript
// Antes
preHandler: [(fastify as any).authenticate]

// Depois
preHandler: [authMiddleware]
```

### Consequências
- ✅ Middleware executando corretamente
- ✅ Logs de debug funcionando
- ✅ Melhor rastreabilidade de problemas

## 2025-09-10 - Arquitetura da Integração LN Markets

### Problema
Necessidade de integrar com a API LN Markets de forma abrangente e escalável.

### Decisão
Implementar wrapper completo com serviços especializados e controllers modulares.

### Justificativa
1. **Escalabilidade**: Arquitetura modular permite fácil expansão
2. **Manutenibilidade**: Código organizado e fácil de manter
3. **Reutilização**: Serviços podem ser reutilizados em diferentes contextos
4. **Testabilidade**: Cada componente pode ser testado independentemente

### Implementação
```
backend/src/
├── services/
│   └── lnmarkets-api.service.ts          # Serviço principal
├── controllers/
│   ├── lnmarkets-futures.controller.ts   # Controller de Futures
│   ├── lnmarkets-options.controller.ts   # Controller de Options
│   ├── lnmarkets-user.controller.ts      # Controller de User
│   └── lnmarkets-market.controller.ts    # Controller de Market Data
└── routes/
    ├── lnmarkets-futures.routes.ts       # Rotas de Futures
    ├── lnmarkets-options.routes.ts       # Rotas de Options
    ├── lnmarkets-user.routes.ts          # Rotas de User
    └── lnmarkets-market.routes.ts        # Rotas de Market Data
```

### Consequências
- ✅ Código organizado e modular
- ✅ Fácil manutenção e expansão
- ✅ Reutilização de componentes
- ⚠️ Mais arquivos para gerenciar

## 2025-01-19 - Correção de Dupla Barra de Rolagem

### Problema
A interface apresentava dupla barra de rolagem devido a:
1. Layout principal com `height: calc(100vh - 4rem)` forçando altura fixa
2. Layout principal (`main`) com `overflow-auto` criando scroll interno
3. Componente Table com `overflow-auto` redundante

### Decisão
Remover altura fixa do layout principal e `overflow-auto` redundante para usar apenas scroll global.

### Justificativa
1. **UX**: Dupla barra de rolagem confunde o usuário e prejudica a experiência
2. **Performance**: Múltiplas camadas de scroll podem causar problemas de performance
3. **Simplicidade**: Scroll único é mais intuitivo e limpo
4. **Padrão**: Seguir convenções de design para interfaces web

### Implementação
```typescript
// Antes - Layout principal (CAUSA DO PROBLEMA)
<div className="flex h-[calc(100vh-4rem)]">
  <Sidebar />
  <main className="flex-1 overflow-auto">
    <div className="container mx-auto p-6">{children}</div>
  </main>
</div>

// Depois - Layout principal (SOLUÇÃO)
<div className="flex min-h-[calc(100vh-4rem)]">
  <Sidebar />
  <main className="flex-1">
    <div className="container mx-auto p-6">{children}</div>
  </main>
</div>

// Componente Table - Sem overflow redundante
<div className="relative w-full">
  <table className="w-full caption-bottom text-sm">
    ...
  </table>
</div>
```

### Implementação Final
Aplicada a correção em **7 páginas** do projeto:
- `pages/Automations.tsx`
- `pages/Notifications.tsx` 
- `pages/Users.tsx`
- `pages/Reports.tsx`
- `pages/admin/Users.tsx`
- `pages/admin/Coupons.tsx`
- `pages/Payments.tsx`

### Solução Implementada
```tsx
// Antes - Dupla barra de rolagem
<CardContent>
  <div className="overflow-x-auto max-h-[calc(100vh-24rem)]">
    <Table>...</Table>
  </div>
</CardContent>

// Depois - Scroll global único
<CardContent>
  <div className="overflow-x-auto">
    <Table>...</Table>
  </div>
</CardContent>
```

### Consequências
- ✅ **Scroll global único** (amarelo) - apenas uma barra de rolagem
- ✅ **Sidebar fixa** (verde) - sem scroll, sempre visível
- ✅ **Conteúdo principal** (vermelho) - usa scroll global quando necessário
- ✅ **Experiência do usuário otimizada** - scroll intuitivo e limpo
- ✅ **Interface profissional** - comportamento consistente em todas as páginas

## 2025-01-19 - Redesign do Ícone de Sats

### Problema
O ícone de sats estava ilegível devido a:
1. **Tamanho muito pequeno** (14px em uso, 16px padrão)
2. **Círculo desnecessário** que poluía o visual
3. **Design complexo** com "B" e "s" pequeno
4. **Falta de referência visual** com a LN Markets

### Decisão
Redesenhar o SatsIcon baseado na referência da LN Markets para melhor legibilidade e consistência visual.

### Justificativa
1. **Legibilidade**: Ícone muito pequeno dificultava leitura dos valores
2. **Consistência**: Alinhar com padrões visuais da LN Markets
3. **Simplicidade**: Remover elementos desnecessários (círculo)
4. **UX**: Melhor experiência visual para valores monetários

### Implementação
```tsx
// Antes - Ícone pequeno e complexo
<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
<path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h6v2H8v-2z" fill="currentColor" />
<text x="12" y="20" fontSize="6">s</text>

// Depois - Ícone maior e limpo
<path d="M6 4h8c2.2 0 4 1.8 4 4s-1.8 4-4 4H8v4H6V4zm2 6h6c1.1 0 2-.9 2-2s-.9-2-2-2H8v4z" fill="currentColor" />
<text x="18" y="18" fontSize="8" fontFamily="monospace">s</text>
```

### Implementação Global
Aplicada a correção em **3 páginas** que exibem valores em sats:
- `pages/Trades.tsx` - Valores de P&L, margin, fees, funding
- `pages/admin/Dashboard.tsx` - Revenue em sats
- `pages/Payments.tsx` - Amount em sats na tabela

### Tamanhos Padronizados
- **Valores principais**: 18px (P&L, margin, revenue)
- **Tabelas secundárias**: 16px (payments, fees)
- **Padrão do componente**: 20px (quando não especificado)

### Consequências
- ✅ **Legibilidade melhorada** - ícone maior e mais visível
- ✅ **Design limpo** - sem círculo desnecessário
- ✅ **Consistência visual** - alinhado com LN Markets
- ✅ **Melhor UX** - valores monetários mais claros
- ✅ **Padronização global** - mesmo visual em toda aplicação

## 2025-01-19 - ADR-017: Staging Environment Obrigatório

### Problema
Deploy direto para produção sem validação adequada, causando problemas em ambiente real.

### Decisão
Implementar ambiente de staging obrigatório antes de qualquer deploy em produção.

### Justificativa
1. **Validação Real**: Staging permite testar com credenciais reais (sandbox) sem afetar produção
2. **Redução de Riscos**: Problemas são identificados antes de chegar ao usuário final
3. **Qualidade**: Maior confiança na estabilidade da aplicação
4. **Processo**: Estabelece workflow profissional de desenvolvimento

### Implementação
- **Ambiente Staging**: `docker-compose.staging.yml` com portas separadas (23000, 23010)
- **Banco Separado**: `defisats_staging` independente da produção
- **Credenciais Sandbox**: LN Markets testnet/sandbox obrigatório em staging
- **Validação Real**: Removida lógica de "aceitar qualquer coisa em dev"
- **Script Automatizado**: `scripts/setup-staging.sh` para configuração automática
- **Nginx Staging**: Configuração específica com headers de ambiente

### Consequências
- ✅ **Nunca mais deploy direto para produção**
- ✅ **Validação com credenciais reais (sandbox)**
- ✅ **Processo profissional de desenvolvimento**
- ✅ **Redução significativa de bugs em produção**
- ⚠️ **Workflow mais rigoroso (obrigatório)**

### Checklist Obrigatório (Staging → Produção)
- [ ] Testar cadastro com credenciais LN Markets sandbox
- [ ] Testar Margin Guard com dados reais
- [ ] Testar notificações (Telegram, Email, WhatsApp)
- [ ] Testar pagamento Lightning (invoice sandbox)
- [ ] Verificar logs, métricas, alertas
- [ ] Validar performance (<200ms)
- [ ] Validar segurança (headers, CORS, rate limiting)

---

**Última atualização**: 19 de Janeiro de 2025  
**Próxima revisão**: 26 de Janeiro de 2025
