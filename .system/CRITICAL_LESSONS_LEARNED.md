# Lições Críticas Aprendidas

## 🎯 Regras Fundamentais do Projeto Axisor

### 1. Nomes de Tabelas PostgreSQL - LETRA MAIÚSCULA OBRIGATÓRIA

**REGRA CRÍTICA**: No projeto Axisor, os nomes de tabelas PostgreSQL sempre usam **letra maiúscula** e precisam ser referenciados com **aspas duplas** nas queries SQL raw.

#### ✅ CORRETO:
```sql
SELECT * FROM "User" WHERE id = $1
SELECT * FROM "Plan" WHERE slug = $1  
SELECT * FROM "Exchange" WHERE is_active = true
```

#### ❌ ERRADO:
```sql
SELECT * FROM users WHERE id = $1
SELECT * FROM plans WHERE slug = $1
SELECT * FROM exchanges WHERE is_active = true
```

#### Por que isso é obrigatório:
- O Prisma usa **PascalCase** para os modelos (`User`, `Plan`, `Exchange`)
- O PostgreSQL é **case-sensitive**
- Sem aspas duplas, o PostgreSQL converte para lowercase
- Isso causa erro: `relation "users" does not exist`

#### Exemplos de campos que precisam de cast:
- `plan_type::text` (enum PlanType precisa de cast para comparar com string)
- `u.plan_type::text = p.slug`

### 2. Lógica de Detecção de Testnet - NÃO REINVENTAR A RODA

**REGRA CRÍTICA**: A aplicação já tem lógica automática para detecção de testnet. **NUNCA** criar lógica duplicada.

#### ✅ CORRETO:
```typescript
const lnMarkets = new LNMarketsAPIv2({
  credentials: {
    apiKey: account.credentials['API Key'],
    apiSecret: account.credentials['API Secret'], 
    passphrase: account.credentials['Passphrase'],
    isTestnet: account.credentials.isTestnet === 'true' || account.credentials.testnet === 'true'
  },
  logger: console as any
});
```

#### ❌ ERRADO:
```typescript
// NÃO criar métodos como detectTestnetMode()
// O LNMarketsClient já detecta automaticamente baseado no campo isTestnet
```

### 3. Chamadas de API Frontend - SEMPRE USAR apiFetch()

**REGRA CRÍTICA**: No frontend, **NUNCA** usar `fetch()` diretamente. Sempre usar `apiFetch()` que inclui automaticamente o token Bearer.

#### ✅ CORRETO:
```typescript
import { apiFetch } from '@/lib/fetch';

const response = await apiFetch('/api/user/margin-guard');
```

#### ❌ ERRADO:
```typescript
const response = await fetch('/api/user/margin-guard'); // 401 Unauthorized
```

### 4. Migrações de Banco - SEMPRE VERIFICAR ANTES DE APLICAR

**REGRA CRÍTICA**: Antes de aplicar qualquer migração:
1. Verificar se as tabelas referenciadas existem
2. Verificar se os campos existem com os nomes corretos
3. Testar em ambiente de desenvolvimento primeiro
4. **NUNCA** aplicar migrações que referenciem tabelas inexistentes

### 5. Seeders - SEMPRE EXECUTAR DENTRO DO CONTAINER

**REGRA CRÍTICA**: Seeders devem ser executados **dentro do container** que tem as credenciais corretas do banco.

#### ✅ CORRETO:
```bash
docker exec axisor-backend npm run seed:plans
```

#### ❌ ERRADO:
```bash
npm run seed:plans # Credenciais erradas
```

### 6. Tratamento de Erros - SEMPRE INCLUIR DETALHES

**REGRA CRÍTICA**: Em produção, sempre incluir detalhes do erro para debugging, mas sem expor informações sensíveis.

#### ✅ CORRETO:
```typescript
catch (error: any) {
  console.error('❌ API - Error details:', {
    message: error.message,
    stack: error.stack,
    code: error.code
  });
  reply.status(500).send({ 
    error: 'Erro interno do servidor',
    details: error.message 
  });
}
```

---

## 📝 Histórico de Problemas Resolvidos

### Problema: Erro 500 em `/api/user/margin-guard/available-upgrades`
**Causa**: Query SQL com nomes de tabelas incorretos e tabela `plans` vazia
**Solução**: 
1. Corrigir `users` para `"User"` com aspas
2. Corrigir `price` para `price_sats`
3. Adicionar cast `plan_type::text`
4. Executar seeder para popular tabela `plans`

### Problema: Erro 401 em chamadas do frontend
**Causa**: Uso de `fetch()` ao invés de `apiFetch()`
**Solução**: Substituir todas as chamadas por `apiFetch()` que inclui token automaticamente

### Problema: Lógica duplicada de detecção de testnet
**Causa**: Criação de método `detectTestnetMode()` desnecessário
**Solução**: Usar lógica automática já existente no `LNMarketsClient`

---

**Última Atualização**: 2025-01-12
**Versão**: 2.0
**Responsável**: Sistema de Lições Críticas Axisor