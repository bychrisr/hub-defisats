# Decisões Técnicas do Projeto Hub DeFiSats

Este documento registra decisões técnicas importantes tomadas durante o desenvolvimento do projeto.

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

---

**Última atualização**: 11 de Setembro de 2025  
**Próxima revisão**: 18 de Setembro de 2025
