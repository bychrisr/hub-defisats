# Scripts do Hub DeFiSats

Esta pasta contém todos os scripts organizados por categoria para facilitar a manutenção e uso.

## 📁 Estrutura

```
scripts/
├── admin/          # Scripts de administração
├── deploy/         # Scripts de deploy
├── dev/            # Scripts de desenvolvimento
└── test/           # Scripts de teste
```

## 🔧 Scripts de Administração (`admin/`)

### `create-admin.js`
Cria um usuário administrador no sistema.

```bash
node scripts/admin/create-admin.js
```

### `create-super-admin.sh`
Cria um super administrador com todas as permissões.

```bash
./scripts/admin/create-super-admin.sh
```

## 🚀 Scripts de Deploy (`deploy/`)

### `deploy-prod.sh`
Executa o deploy completo em produção.

```bash
./scripts/deploy/deploy-prod.sh
```

### `setup-staging.sh`
Configura o ambiente de staging.

```bash
./scripts/deploy/setup-staging.sh
```

## 🛠️ Scripts de Desenvolvimento (`dev/`)

### `setup-dev.sh`
Configura o ambiente de desenvolvimento completo.

```bash
./scripts/dev/setup-dev.sh
```

### `setup-database.sh`
**NOVO** - Configuração completa do banco de dados (migrações + população).

```bash
./scripts/dev/setup-database.sh
```

### `fix-migration-order.sh`
**NOVO** - Corrige problemas de ordem de migrações do Prisma.

```bash
./scripts/dev/fix-migration-order.sh
```

### `populate-database.sh`
**NOVO** - Popula banco de dados com dados padrão (seeders).

```bash
./scripts/dev/populate-database.sh
```

### `fix-admin-users.sh`
**NOVO** - Corrige usuários administrativos que não têm registro de admin.

```bash
./scripts/dev/fix-admin-users.sh
```

### `create-user-with-hash.sh`
**NOVO** - Cria usuários com hash de senha correto e plano específico.

```bash
./scripts/dev/create-user-with-hash.sh
```

### `run-essential-seeders.sh`
**NOVO** - Executa apenas os seeders essenciais que funcionam.

```bash
./scripts/dev/run-essential-seeders.sh
```

### `ensure-proper-setup.sh`
**NOVO** - Garante que configurações essenciais estejam corretas.

```bash
./scripts/dev/ensure-proper-setup.sh
```

### `create-dev-user.sh`
Cria usuários de teste para desenvolvimento.

```bash
./scripts/dev/create-dev-user.sh
```

### `fix-typescript-errors.sh`
Corrige erros comuns de TypeScript no projeto.

```bash
./scripts/dev/fix-typescript-errors.sh
```

### `fix-docker-production.sh`
Corrige problemas comuns do Docker em produção.

```bash
./scripts/dev/fix-docker-production.sh
```

### `seed-menus.js`
Popula o banco com menus padrão do sistema.

```bash
node scripts/dev/seed-menus.js
```

## 🧪 Scripts de Teste (`test/`)

### `test-local.sh`
Executa todos os testes locais.

```bash
./scripts/test/test-local.sh
```

### `test-production.sh`
Testa a aplicação em ambiente de produção.

```bash
./scripts/test/test-production.sh
```

### `test-user-permissions.sh`
Testa o sistema de permissões de usuários.

```bash
./scripts/test/test-user-permissions.sh
```

### `test-user-upgrade.sh`
Testa o sistema de upgrade de usuários.

```bash
./scripts/test/test-user-upgrade.sh
```

### `test-real-pl-integration.sh`
Testa a integração real com Profit/Loss.

```bash
./scripts/test/test-real-pl-integration.sh
```

### `test-frontend-registration.js`
Testa o processo de registro no frontend.

```bash
node scripts/test/test-frontend-registration.js
```

### `test-frontend-registration.sh`
Script shell para teste de registro.

```bash
./scripts/test/test-frontend-registration.sh
```

### `test-exact-frontend-data.sh`
Testa dados específicos do frontend.

```bash
./scripts/test/test-exact-frontend-data.sh
```

### `test-registration.sh`
Testa o processo completo de registro.

```bash
./scripts/test/test-registration.sh
```

## 🛠️ Ferramentas (`tools/`)

### `debug-production.sh`
Ferramenta de debug para problemas em produção.

```bash
./tools/debug-production.sh
```

### `fix-production-502.sh`
Corrige erros 502 em produção.

```bash
./tools/fix-production-502.sh
```

## 📋 Convenções

### Nomenclatura
- **Scripts Shell**: `kebab-case.sh`
- **Scripts Node.js**: `kebab-case.js`
- **Executáveis**: Sempre com `#!/bin/bash` ou `#!/usr/bin/env node`

### Permissões
- **Scripts Shell**: `chmod +x script.sh`
- **Scripts Node.js**: `chmod +x script.js` (opcional)

### Documentação
- Cada script deve ter comentários explicativos
- README.md atualizado com novos scripts
- Exemplos de uso para cada script

## 🔧 Configuração

### Variáveis de Ambiente
Os scripts usam as variáveis de ambiente definidas em:
- `config/env/.env.development`
- `config/env/.env.production`
- `config/env/.env.staging`

### Docker Compose
Os scripts de deploy usam os arquivos em:
- `config/docker/docker-compose.dev.yml`
- `config/docker/docker-compose.prod.yml`
- `config/docker/docker-compose.staging.yml`

## 🚨 Troubleshooting

### Problemas Comuns

1. **Permissão negada**: `chmod +x script.sh`
2. **Docker não encontrado**: Verificar se Docker está rodando
3. **Variáveis de ambiente**: Verificar arquivos `.env`
4. **Porta em uso**: Verificar se as portas estão livres

### Logs
- Scripts de deploy: Logs em `logs/deploy/`
- Scripts de teste: Logs em `logs/test/`
- Scripts de admin: Logs em `logs/admin/`

## 📞 Suporte

Para problemas com scripts:
1. Verificar logs de erro
2. Consultar documentação específica
3. Abrir issue no GitHub
4. Contatar: dev@hub-defisats.com

---

**Última atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento
