# Soluções Aplicadas para Problemas de Produção

## Problemas Identificados e Soluções

### 1. Erro 'ContainerConfig' do Docker Compose

**Problema**: 
```
KeyError: 'ContainerConfig'
```

**Causa**: Imagens Docker corrompidas ou problemas de cache

**Solução**:
- Criado script `scripts/fix-docker-production.sh`
- Limpeza completa de containers, imagens e volumes
- Rebuild completo das imagens

### 2. Variáveis de Ambiente Não Configuradas

**Problema**: 
```
WARNING: The TELEGRAM_BOT_TOKEN variable is not set. Defaulting to a blank string.
```

**Causa**: Arquivo `.env.production` não existia

**Solução**:
- Criado arquivo `.env.production` com valores padrão
- Configurado Docker Compose para usar `--env-file .env.production`

### 3. Rede proxy-network Não Existia

**Problema**:
```
network proxy-network declared as external, but could not be found
```

**Solução**:
```bash
docker network create proxy-network
```

### 4. Arquivo init.sql Era Diretório

**Problema**:
```
psql:/docker-entrypoint-initdb.d/init.sql: error: could not read from input file: Is a directory
```

**Solução**:
- Removido volume mount do init.sql do docker-compose.prod.yml
- PostgreSQL inicializa sem script customizado

### 5. Paths do TypeScript Não Resolvidos

**Problema**:
```
Error: Cannot find module '@/config/env'
```

**Causa**: tsconfig-paths não funcionando corretamente

**Solução**:
- Criado script `backend/start.sh` para configurar tsconfig-paths
- Adicionado tsconfig.json ao container de produção
- Modificado Dockerfile.prod para usar o script

### 6. Validação de Ambiente Falhando

**Problema**:
```
❌ Environment validation failed:
Invalid variables: LNBITS_URL: Invalid url
```

**Causa**: Schema de validação não permitia strings vazias para URLs opcionais

**Solução**:
- Modificado `backend/src/config/env.ts`
- Adicionado `.or(z.literal(''))` para URLs opcionais

### 7. Prisma SSL Library Missing

**Problema**:
```
Error loading shared library libssl.so.1.1: No such file or directory
```

**Causa**: Bibliotecas SSL necessárias para Prisma não estavam instaladas

**Solução**:
- Adicionado `openssl libc6-compat` ao Dockerfile.prod
- Prisma agora funciona corretamente

## Arquivos Modificados

1. `scripts/fix-docker-production.sh` - Script de correção Docker
2. `.env.production` - Variáveis de ambiente de produção
3. `docker-compose.prod.yml` - Removido volume init.sql
4. `backend/Dockerfile.prod` - Adicionado SSL libraries e start.sh
5. `backend/start.sh` - Script de inicialização com tsconfig-paths
6. `backend/src/config/env.ts` - Corrigido schema de validação

## Comandos de Deploy

```bash
# 1. Criar rede proxy
docker network create proxy-network

# 2. Executar script de correção
./scripts/fix-docker-production.sh

# 3. Verificar status
docker compose -f docker-compose.prod.yml ps

# 4. Testar aplicação
curl http://localhost:23000/health
curl http://localhost:23001
```

## Status Final

✅ **PRODUÇÃO FUNCIONANDO**
- Backend: http://localhost:23000
- Frontend: http://localhost:23001
- PostgreSQL: Funcionando
- Redis: Funcionando
- Workers: Funcionando
