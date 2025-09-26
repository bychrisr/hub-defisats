# 🌱 Database Seeders

Sistema para popular banco de dados vazio com dados padrão essenciais.

## 📋 Seeders Disponíveis

### 1. **rate-limit-config**
- **Descrição**: Configurações de rate limiting para todos os ambientes
- **Dados**: 28 configurações (4 ambientes × 7 tipos de endpoint)
- **Ambientes**: development, staging, production, global
- **Endpoints**: auth, api, trading, notifications, payments, admin, global

### 2. **admin-user**
- **Descrição**: Usuários administrativos padrão
- **Dados**: 
  - `admin@hub-defisats.com` (superadmin)
  - `support@hub-defisats.com` (admin)
- **Senhas**: Definidas nos dados padrão

### 3. **plans**
- **Descrição**: Planos de assinatura padrão
- **Dados**: Free, Pro, Enterprise, Pro Annual
- **Recursos**: Limites, preços, recursos por plano

## 🚀 Como Usar

### Via NPM Scripts (Recomendado)

```bash
# Executar todos os seeders
npm run seed:all

# Executar seeder específico
npm run seed:rate-limit
npm run seed:admin
npm run seed:plans

# Listar seeders disponíveis
npm run seed:list
```

### Via CLI Direto

```bash
# Executar todos
npx tsx src/seeders/index.ts all

# Executar específico
npx tsx src/seeders/index.ts specific rate-limit-config

# Listar disponíveis
npx tsx src/seeders/index.ts list
```

## 🔧 Desenvolvimento

### Criando Novo Seeder

1. **Criar arquivo**: `backend/src/seeders/meu-seeder.seeder.ts`

```typescript
import { getPrisma } from '../lib/prisma';
import { Seeder, SeederResult } from './index';

export const meuSeeder: Seeder = {
  name: 'meu-seeder',
  description: 'Descrição do que este seeder faz',

  async run(): Promise<SeederResult> {
    try {
      const prisma = await getPrisma();
      
      // Sua lógica aqui
      
      return {
        success: true,
        message: 'Seeder executado com sucesso',
        count: 0
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro: ${error.message}`,
        errors: [error.message]
      };
    }
  }
};
```

2. **Registrar no index**: Adicionar em `backend/src/seeders/index.ts`

```typescript
import { meuSeeder } from './meu-seeder.seeder';

// No array seeders:
this.seeders = [
  rateLimitConfigSeeder,
  adminUserSeeder,
  plansSeeder,
  meuSeeder, // ← Adicionar aqui
];
```

3. **Adicionar script**: Em `backend/package.json`

```json
{
  "scripts": {
    "seed:meu-seeder": "tsx src/seeders/index.ts specific meu-seeder"
  }
}
```

## 🛡️ Segurança

- **Idempotência**: Seeders verificam se dados já existem antes de criar
- **Rollback**: Não há rollback automático - use migrations do Prisma
- **Ambiente**: Seeders são seguros para executar em qualquer ambiente
- **Logs**: Todos os seeders logam suas ações

## 📊 Monitoramento

Os seeders retornam informações detalhadas:

```typescript
interface SeederResult {
  success: boolean;      // Se executou com sucesso
  message: string;        // Mensagem descritiva
  count?: number;         // Quantos registros foram criados
  errors?: string[];      // Lista de erros (se houver)
}
```

## 🔄 Fluxo de Deploy

1. **Desenvolvimento**: Execute seeders localmente
2. **Staging**: Execute seeders após deploy
3. **Produção**: Execute seeders após deploy inicial

```bash
# Em produção
npm run seed:all
```

## 🚨 Troubleshooting

### Erro de Conexão
```bash
# Verificar se banco está rodando
docker ps | grep postgres

# Verificar variáveis de ambiente
echo $DATABASE_URL
```

### Erro de Permissão
```bash
# Verificar se usuário tem acesso ao banco
psql $DATABASE_URL -c "SELECT 1;"
```

### Dados Duplicados
- Seeders são idempotentes por padrão
- Verificam existência antes de criar
- Use `skipDuplicates: true` no Prisma

## 📝 Exemplos de Uso

### Popular Banco Novo
```bash
# Banco completamente vazio
npm run seed:all
```

### Adicionar Apenas Rate Limiting
```bash
# Se já tem usuários mas precisa de rate limiting
npm run seed:rate-limit
```

### Verificar o que Foi Criado
```bash
# Listar seeders disponíveis
npm run seed:list
```

## 🎯 Casos de Uso

- ✅ **Deploy inicial**: Popular banco vazio
- ✅ **Desenvolvimento**: Resetar dados de teste
- ✅ **Staging**: Configurar ambiente de teste
- ✅ **Produção**: Configurar dados essenciais
- ✅ **CI/CD**: Automatizar configuração inicial
