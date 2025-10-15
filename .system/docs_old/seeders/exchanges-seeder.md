# 🌱 Seeder de Exchanges

## Visão Geral

O seeder de exchanges popula o banco de dados com as exchanges suportadas pelo sistema, incluindo seus tipos de credenciais necessários.

## Exchanges Configuradas

### **LN Markets**
- **Nome**: LN Markets
- **Slug**: ln-markets
- **Descrição**: The ultimate aggregation layer for Bitcoin derivatives
- **Website**: https://lnmarkets.com
- **API Version**: v2
- **Status**: Ativo

#### Tipos de Credenciais:
1. **API Key** (`api_key`)
   - Tipo: text
   - Obrigatório: Sim
   - Descrição: Your LN Markets API key

2. **API Secret** (`api_secret`)
   - Tipo: password
   - Obrigatório: Sim
   - Descrição: Your LN Markets API secret

3. **Passphrase** (`passphrase`)
   - Tipo: password
   - Obrigatório: Sim
   - Descrição: Your LN Markets passphrase

## Como Executar

### **1. Executar Todos os Seeders**
```bash
cd backend
npm run seed
```

### **2. Executar Apenas o Seeder de Exchanges**
```bash
cd backend
npm run seed:exchanges
```

### **3. Executar Seeder Específico via CLI**
```bash
cd backend
npm run seed:all exchanges
```

### **4. Listar Seeders Disponíveis**
```bash
cd backend
npm run seed:list
```

## Estrutura do Banco

### **Tabela: exchanges**
```sql
CREATE TABLE exchanges (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    api_version TEXT,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);
```

### **Tabela: exchange_credential_types**
```sql
CREATE TABLE exchange_credential_types (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
    exchange_id TEXT NOT NULL REFERENCES exchanges(id),
    name TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_type TEXT DEFAULT 'text',
    is_required BOOLEAN DEFAULT true,
    description TEXT,
    order INTEGER DEFAULT 0,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exchange_id, field_name)
);
```

### **Tabela: user_exchange_credentials**
```sql
CREATE TABLE user_exchange_credentials (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
    user_id TEXT NOT NULL REFERENCES users(id),
    exchange_id TEXT NOT NULL REFERENCES exchanges(id),
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_test TIMESTAMP(6),
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, exchange_id)
);
```

## Verificação

### **Verificar se foi executado com sucesso:**
```bash
cd backend
npx prisma studio
```

### **Verificar via SQL:**
```sql
-- Verificar exchanges criadas
SELECT * FROM exchanges;

-- Verificar tipos de credenciais
SELECT e.name, ect.name, ect.field_name, ect.is_required 
FROM exchanges e 
JOIN exchange_credential_types ect ON e.id = ect.exchange_id 
ORDER BY e.name, ect.order;
```

## Adicionando Novas Exchanges

Para adicionar uma nova exchange, edite o arquivo `backend/src/seeders/exchanges.seeder.ts`:

```typescript
const defaultExchanges: ExchangeData[] = [
  // ... exchanges existentes ...
  {
    name: 'Binance',
    slug: 'binance',
    description: 'Global cryptocurrency exchange',
    website: 'https://binance.com',
    is_active: true,
    api_version: 'v3',
    credential_types: [
      {
        name: 'API Key',
        field_name: 'api_key',
        field_type: 'text',
        is_required: true,
        description: 'Your Binance API key',
        order: 1
      },
      {
        name: 'Secret Key',
        field_name: 'secret_key',
        field_type: 'password',
        is_required: true,
        description: 'Your Binance secret key',
        order: 2
      }
    ]
  }
];
```

## Logs de Execução

O seeder produz logs detalhados:

```
🌱 Executando seeder de exchanges...
📦 Running seeder: exchanges
✅ exchanges: Successfully created 1 exchanges with 3 credential types
🌱 Database seeding completed!
```

## Tratamento de Erros

- **Exchanges já existem**: O seeder pula a execução se já existirem exchanges
- **Erro de conexão**: Verifica se o banco está acessível
- **Erro de validação**: Valida dados antes de inserir
- **Erro de constraint**: Trata violações de chave única

## Produção

Este seeder é executado automaticamente durante o deploy inicial em produção, garantindo que as exchanges estejam sempre disponíveis no sistema.
