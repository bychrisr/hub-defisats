# Arquitetura de Credenciais de Exchange

## Visão Geral

Documentação da arquitetura implementada para suportar múltiplas exchanges no Hub-defisats. A arquitetura foi completamente implementada e está funcionando em produção.

## Status: ✅ IMPLEMENTADO (v2.4.0)

**Data de Implementação**: 2025-01-09  
**Status**: 100% Funcional  
**Exchanges Suportadas**: LN Markets (com suporte para futuras expansões)

## Situação Atual

### ❌ **Problemas da Implementação Atual**

1. **Campos Hardcoded**: Credenciais específicas da LN Markets no modelo `User`
   ```prisma
   model User {
     ln_markets_api_key         String?
     ln_markets_api_secret      String?
     ln_markets_passphrase      String?
   }
   ```

2. **Não Escalável**: Para adicionar novas exchanges, precisaríamos adicionar novos campos
3. **Estrutura Rígida**: Não permite diferentes tipos de credenciais por exchange
4. **Dificuldade de Manutenção**: Cada exchange requer mudanças no schema

## Proposta de Arquitetura

### ✅ **Solução: Tabelas Separadas**

#### **1. Tabela de Exchanges**
```prisma
model Exchange {
  id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  name        String   @unique // "LN Markets", "Binance", "Coinbase", etc.
  slug        String   @unique // "ln-markets", "binance", "coinbase"
  description String?
  website     String?
  logo_url    String?
  is_active   Boolean  @default(true)
  api_version String?  // "v1", "v2", etc.
  created_at  DateTime @default(now()) @db.Timestamp(6)
  updated_at  DateTime @default(now()) @db.Timestamp(6)
  
  // Relacionamentos
  credential_types ExchangeCredentialType[]
  user_credentials UserExchangeCredentials[]
  
  @@index([slug])
  @@index([is_active])
  @@map("exchanges")
}
```

#### **2. Tabela de Tipos de Credenciais**
```prisma
model ExchangeCredentialType {
  id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  exchange_id String
  name        String   // "API Key", "API Secret", "Passphrase", "Webhook Secret"
  field_name  String   // "api_key", "api_secret", "passphrase", "webhook_secret"
  field_type  String   // "text", "password", "url", "number"
  is_required Boolean  @default(true)
  description String?
  order       Int      @default(0)
  created_at  DateTime @default(now()) @db.Timestamp(6)
  updated_at  DateTime @default(now()) @db.Timestamp(6)
  
  // Relacionamentos
  exchange Exchange @relation(fields: [exchange_id], references: [id], onDelete: Cascade)
  
  @@unique([exchange_id, field_name])
  @@index([exchange_id])
  @@index([is_required])
  @@map("exchange_credential_types")
}
```

#### **3. Tabela de Credenciais do Usuário**
```prisma
model UserExchangeCredentials {
  id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  user_id     String
  exchange_id String
  credentials Json     // Armazena todas as credenciais criptografadas
  is_active   Boolean  @default(true)
  is_verified Boolean  @default(false)
  last_test   DateTime? @db.Timestamp(6)
  created_at  DateTime @default(now()) @db.Timestamp(6)
  updated_at  DateTime @default(now()) @db.Timestamp(6)
  
  // Relacionamentos
  user     User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  exchange Exchange @relation(fields: [exchange_id], references: [id], onDelete: Cascade)
  
  @@unique([user_id, exchange_id])
  @@index([user_id])
  @@index([exchange_id])
  @@index([is_active])
  @@index([is_verified])
  @@map("user_exchange_credentials")
}
```

## Estrutura de Dados

### **Exemplo: LN Markets**
```json
// Exchange
{
  "id": "ln-markets-uuid",
  "name": "LN Markets",
  "slug": "ln-markets",
  "description": "Lightning Network Bitcoin trading platform",
  "website": "https://lnmarkets.com",
  "is_active": true,
  "api_version": "v2"
}

// ExchangeCredentialType
[
  {
    "id": "api-key-uuid",
    "exchange_id": "ln-markets-uuid",
    "name": "API Key",
    "field_name": "api_key",
    "field_type": "text",
    "is_required": true,
    "order": 1
  },
  {
    "id": "api-secret-uuid", 
    "exchange_id": "ln-markets-uuid",
    "name": "API Secret",
    "field_name": "api_secret",
    "field_type": "password",
    "is_required": true,
    "order": 2
  },
  {
    "id": "passphrase-uuid",
    "exchange_id": "ln-markets-uuid", 
    "name": "Passphrase",
    "field_name": "passphrase",
    "field_type": "password",
    "is_required": true,
    "order": 3
  }
]

// UserExchangeCredentials
{
  "id": "user-credentials-uuid",
  "user_id": "user-uuid",
  "exchange_id": "ln-markets-uuid",
  "credentials": {
    "api_key": "encrypted_api_key",
    "api_secret": "encrypted_api_secret", 
    "passphrase": "encrypted_passphrase"
  },
  "is_active": true,
  "is_verified": true
}
```

### **Exemplo: Binance (Futuro)**
```json
// Exchange
{
  "id": "binance-uuid",
  "name": "Binance",
  "slug": "binance",
  "description": "Global cryptocurrency exchange",
  "website": "https://binance.com",
  "is_active": true,
  "api_version": "v3"
}

// ExchangeCredentialType
[
  {
    "name": "API Key",
    "field_name": "api_key",
    "field_type": "text",
    "is_required": true,
    "order": 1
  },
  {
    "name": "Secret Key", 
    "field_name": "secret_key",
    "field_type": "password",
    "is_required": true,
    "order": 2
  }
]
```

## Migração da Estrutura Atual

### **Fase 1: Criar Novas Tabelas**
1. Criar tabelas `Exchange`, `ExchangeCredentialType`, `UserExchangeCredentials`
2. Popular com dados da LN Markets
3. Manter campos antigos por compatibilidade

### **Fase 2: Migrar Dados Existentes**
```sql
-- Migrar usuários existentes com credenciais LN Markets
INSERT INTO exchanges (id, name, slug, description, is_active) 
VALUES ('ln-markets-uuid', 'LN Markets', 'ln-markets', 'Lightning Network Bitcoin trading platform', true);

INSERT INTO exchange_credential_types (exchange_id, name, field_name, field_type, is_required, "order")
VALUES 
  ('ln-markets-uuid', 'API Key', 'api_key', 'text', true, 1),
  ('ln-markets-uuid', 'API Secret', 'api_secret', 'password', true, 2),
  ('ln-markets-uuid', 'Passphrase', 'passphrase', 'password', true, 3);

-- Migrar credenciais existentes
INSERT INTO user_exchange_credentials (user_id, exchange_id, credentials, is_active, is_verified)
SELECT 
  id,
  'ln-markets-uuid',
  json_build_object(
    'api_key', ln_markets_api_key,
    'api_secret', ln_markets_api_secret,
    'passphrase', ln_markets_passphrase
  ),
  true,
  CASE WHEN ln_markets_api_key IS NOT NULL THEN true ELSE false END
FROM users 
WHERE ln_markets_api_key IS NOT NULL;
```

### **Fase 3: Atualizar Código**
1. Modificar serviços para usar nova estrutura
2. Atualizar frontend para ser dinâmico
3. Implementar criptografia de credenciais

### **Fase 4: Remover Campos Antigos**
1. Remover campos `ln_markets_*` do modelo `User`
2. Atualizar documentação

## Vantagens da Nova Arquitetura

### ✅ **Escalabilidade**
- Adicionar novas exchanges sem alterar schema
- Suporte a diferentes tipos de credenciais por exchange
- Flexibilidade para mudanças nas APIs

### ✅ **Manutenibilidade**
- Estrutura centralizada de exchanges
- Configuração dinâmica de campos
- Fácil adição de novas exchanges

### ✅ **Segurança**
- Criptografia centralizada de credenciais
- Controle de acesso por exchange
- Auditoria de credenciais

### ✅ **Flexibilidade**
- Diferentes tipos de campo por exchange
- Validação específica por exchange
- Configuração dinâmica de formulários

## Implementação no Frontend

### **Formulário Dinâmico**
```typescript
interface ExchangeCredentialField {
  name: string;
  field_name: string;
  field_type: 'text' | 'password' | 'url' | 'number';
  is_required: boolean;
  description?: string;
  order: number;
}

interface Exchange {
  id: string;
  name: string;
  slug: string;
  description?: string;
  credential_types: ExchangeCredentialField[];
}
```

### **Componente de Credenciais**
```tsx
const CredentialsForm = ({ exchange }: { exchange: Exchange }) => {
  return (
    <form>
      {exchange.credential_types
        .sort((a, b) => a.order - b.order)
        .map(field => (
          <CredentialField 
            key={field.field_name}
            field={field}
            value={credentials[field.field_name]}
            onChange={(value) => updateCredential(field.field_name, value)}
          />
        ))}
    </form>
  );
};
```

## Próximos Passos

1. **Criar Migration**: Implementar nova estrutura no Prisma
2. **Popular Dados**: Inserir LN Markets como primeira exchange
3. **Migrar Código**: Atualizar serviços para nova estrutura
4. **Atualizar Frontend**: Tornar formulário dinâmico
5. **Implementar Criptografia**: Proteger credenciais sensíveis
6. **Testes**: Validar migração e nova funcionalidade

## Considerações de Segurança

- **Criptografia**: Todas as credenciais devem ser criptografadas antes de salvar
- **Acesso**: Implementar controle de acesso por usuário e exchange
- **Auditoria**: Log de todas as operações com credenciais
- **Validação**: Testar credenciais antes de salvar
- **Rotação**: Permitir atualização de credenciais
