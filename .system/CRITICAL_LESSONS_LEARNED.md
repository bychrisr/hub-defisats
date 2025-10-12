# CRÍTICAS: Lições Aprendidas - Nunca Esquecer

## 🚨 MIGRAÇÕES DE BANCO PODEM QUEBRAR SISTEMA INTEIRO

### Data: 2025-01-12
### Problema: Sistema inteiro com erro 500 devido a migração mal formada

---

## ❌ O QUE DEU ERRADO

**Implementação do Margin Guard V2** quebrou todo o sistema com erros 500 em múltiplas APIs:
- `/api/auth/me` - 500
- `/api/version` - 500  
- `/api/market/index/public` - 500
- `/api/redirects/active` - 500
- Todas as outras APIs

### Causa Raiz
**Migração mal formada** em `20250112_margin_guard_v2/migration.sql`:
```sql
-- ❌ ERRADO - referenciou tabela inexistente
REFERENCES "users"("id")  -- "users" não existe

-- ✅ CORRETO - deveria ser
REFERENCES "User"("id")   -- "User" existe
```

---

## 🔍 INVESTIGAÇÃO SISTEMÁTICA NECESSÁRIA

Quando há erros 500 em múltiplas APIs, **SEMPRE** verificar:

### 1. Status das Migrações
```bash
docker exec axisor-backend npx prisma migrate status
```

### 2. Logs de Migração no Banco
```sql
SELECT * FROM _prisma_migrations WHERE migration_name LIKE '%nome_da_migração%';
```

### 3. Foreign Keys e Constraints
```sql
-- Verificar se tabelas referenciadas existem
\dt | grep -i user

-- Verificar constraints quebradas
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE contype = 'f';
```

### 4. Schema Consistency
```bash
docker exec axisor-backend npx prisma db push
```

---

## ✅ CORREÇÃO APLICADA

### 1. Marcar Migração como Aplicada
```bash
docker exec axisor-backend npx prisma migrate resolve --applied 20250112_margin_guard_v2
```

### 2. Corrigir Foreign Keys Manualmente
```sql
-- Corrigir todas as referências de "users" para "User"
ALTER TABLE "marginGuardConfig" DROP CONSTRAINT "marginGuardConfig_user_id_fkey";
ALTER TABLE "marginGuardConfig" ADD CONSTRAINT "marginGuardConfig_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Repetir para todas as tabelas afetadas
```

### 3. Sincronizar Schema
```bash
docker exec axisor-backend npx prisma db push
```

---

## 🛡️ REGRAS PARA NUNCA QUEBRAR NOVAMENTE

### 1. **SEMPRE** Verificar Nomes de Tabelas
- Usar nome EXATO da tabela no banco
- `"User"` (maiúsculo) não `"users"` (minúsculo)
- Verificar com `\dt` no PostgreSQL

### 2. **SEMPRE** Testar Migrações Antes de Aplicar
- Verificar se tabelas referenciadas existem
- Testar foreign keys em ambiente de desenvolvimento
- Validar constraints antes de aplicar

### 3. **SEMPRE** Investigar Problemas Sistêmicos
- Erros 500 em múltiplas APIs = problema de infraestrutura
- Verificar banco de dados PRIMEIRO
- Não assumir que é problema de código

### 4. **SEMPRE** Fazer Backup Antes de Migrações
- Backup do banco antes de aplicar migrações
- Plano de rollback se algo der errado
- Testar em ambiente isolado primeiro

---

## 🎯 CHECKLIST ANTES DE QUALQUER MIGRAÇÃO

- [ ] Backup do banco de dados
- [ ] Verificar nomes exatos das tabelas (`\dt`)
- [ ] Validar todas as foreign keys
- [ ] Testar em ambiente de desenvolvimento
- [ ] Verificar se não há breaking changes
- [ ] Plano de rollback preparado
- [ ] Monitoramento pós-aplicação

---

## 📚 REFERÊNCIAS ÚTEIS

### Comandos PostgreSQL
```sql
-- Listar tabelas
\dt

-- Listar constraints
SELECT * FROM pg_constraint WHERE contype = 'f';

-- Verificar foreign keys
\d+ nome_da_tabela
```

### Comandos Prisma
```bash
# Status das migrações
npx prisma migrate status

# Aplicar migrações
npx prisma migrate dev

# Marcar migração como aplicada (se falhou)
npx prisma migrate resolve --applied nome_da_migração

# Sincronizar schema
npx prisma db push
```

---

## 🚨 LEMBRETE CRÍTICO

**MIGRAÇÕES MAL FORMADAS PODEM QUEBRAR TODO O SISTEMA**

Não é apenas a funcionalidade sendo implementada que é afetada - é o sistema inteiro que pode parar de funcionar devido a foreign keys quebradas ou referências incorretas.

**SEMPRE INVESTIGAR SISTEMATICAMENTE ANTES DE ASSUMIR QUALQUER CAUSA.**

---

**Status**: ✅ Lição aprendida e documentada
**Versão**: 1.0.0
**Data**: 2025-01-12
**Responsável**: Sistema de Aprendizado
