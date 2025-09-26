# Guia de Troubleshooting - Problemas Comuns

## Visão Geral

Este guia aborda os problemas mais comuns encontrados durante o desenvolvimento e uso do Hub DeFiSats, com soluções práticas e comandos de diagnóstico.

## Problemas de Autenticação

### 1. Erro 401 Unauthorized

**Sintomas:**
- Requisições retornam erro 401
- Usuário é redirecionado para login
- Token parece válido mas não funciona

**Diagnóstico:**
```bash
# Verificar se token está presente
echo $ACCESS_TOKEN

# Testar endpoint de autenticação
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     https://api.defisats.site/api/auth/me
```

**Soluções:**
1. **Token Expirado**: Renovar usando refresh token
2. **Token Inválido**: Fazer login novamente
3. **Problema de CORS**: Verificar configuração do frontend

```javascript
// Renovar token automaticamente
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
  }
}
```

### 2. Problemas de Login

**Sintomas:**
- Login falha com credenciais corretas
- Erro 400 Bad Request
- Validação de credenciais LN Markets falha

**Diagnóstico:**
```bash
# Verificar logs do backend
docker logs hub-defisats-backend-prod

# Testar credenciais LN Markets
curl -X POST https://api.defisats.site/api/auth/test-sandbox \
     -H "Content-Type: application/json" \
     -d '{"api_key":"your-key","api_secret":"your-secret","passphrase":"your-passphrase"}'
```

**Soluções:**
1. **Credenciais Inválidas**: Verificar API Key, Secret e Passphrase
2. **Formato Incorreto**: Usar formato correto das credenciais
3. **Rate Limiting**: Aguardar antes de tentar novamente

## Problemas de Banco de Dados

### 1. Conexão com PostgreSQL Falha

**Sintomas:**
- Erro "Database connection failed"
- Aplicação não inicia
- Timeout de conexão

**Diagnóstico:**
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Testar conexão
docker exec hub-defisats-postgres-prod psql -U hubdefisats_prod -d hubdefisats_prod -c "SELECT 1;"

# Verificar logs
docker logs hub-defisats-postgres-prod
```

**Soluções:**
1. **Container Parado**: Reiniciar container PostgreSQL
2. **Credenciais Incorretas**: Verificar variáveis de ambiente
3. **Porta Bloqueada**: Verificar firewall e configurações de rede

```bash
# Reiniciar PostgreSQL
docker restart hub-defisats-postgres-prod

# Verificar variáveis de ambiente
echo $DATABASE_URL
```

### 2. Migrações Falham

**Sintomas:**
- Erro ao executar migrações Prisma
- Schema desatualizado
- Campos não encontrados

**Diagnóstico:**
```bash
# Verificar status das migrações
npx prisma migrate status

# Verificar schema atual
npx prisma db pull
```

**Soluções:**
1. **Reset do Banco**: Fazer reset completo (CUIDADO: perde dados)
2. **Migração Manual**: Executar migrações uma por uma
3. **Schema Sync**: Sincronizar schema com banco

```bash
# Reset completo (PERIGOSO)
npx prisma migrate reset

# Aplicar migrações pendentes
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate
```

## Problemas de Frontend

### 1. Frontend Não Carrega (502 Bad Gateway)

**Sintomas:**
- Erro 502 no navegador
- Frontend não responde
- Nginx retorna erro

**Diagnóstico:**
```bash
# Verificar containers
docker ps | grep frontend

# Verificar logs do frontend
docker logs hub-defisats-frontend-prod

# Verificar logs do nginx
docker logs hub-defisats-nginx-prod
```

**Soluções:**
1. **Container Parado**: Reiniciar container frontend
2. **Build Falhou**: Rebuild da imagem
3. **Configuração Nginx**: Verificar proxy reverso

```bash
# Reiniciar frontend
docker restart hub-defisats-frontend-prod

# Rebuild da imagem
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### 2. Problemas de CORS

**Sintomas:**
- Erro CORS no navegador
- Requisições bloqueadas
- Frontend não consegue acessar API

**Diagnóstico:**
```bash
# Verificar configuração CORS
echo $CORS_ORIGIN

# Testar requisição com curl
curl -H "Origin: https://defisats.site" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization" \
     -X OPTIONS https://api.defisats.site/api/dashboard/summary
```

**Soluções:**
1. **Origem Não Permitida**: Adicionar origem ao CORS_ORIGIN
2. **Headers Incorretos**: Verificar headers de requisição
3. **Configuração Backend**: Atualizar configuração CORS

```bash
# Atualizar CORS_ORIGIN
export CORS_ORIGIN="https://defisats.site,https://staging.defisats.site"

# Reiniciar backend
docker restart hub-defisats-backend-prod
```

## Problemas de Workers

### 1. Workers Não Funcionam

**Sintomas:**
- Automações não executam
- Margin Guard não monitora
- Logs de workers vazios

**Diagnóstico:**
```bash
# Verificar workers
docker ps | grep worker

# Verificar logs dos workers
docker logs hub-defisats-margin-monitor-prod
docker logs hub-defisats-automation-executor-prod

# Verificar Redis
docker logs hub-defisats-redis-prod
```

**Soluções:**
1. **Workers Parados**: Reiniciar workers
2. **Redis Indisponível**: Verificar conexão Redis
3. **Configuração Incorreta**: Verificar variáveis de ambiente

```bash
# Reiniciar workers
docker restart hub-defisats-margin-monitor-prod
docker restart hub-defisats-automation-executor-prod

# Verificar Redis
docker exec hub-defisats-redis-prod redis-cli ping
```

### 2. Margin Guard Não Monitora

**Sintomas:**
- Posições não são monitoradas
- Alertas não são enviados
- Logs de monitoramento vazios

**Diagnóstico:**
```bash
# Verificar logs do margin monitor
docker logs hub-defisats-margin-monitor-prod

# Verificar filas Redis
docker exec hub-defisats-redis-prod redis-cli llen margin-check

# Testar credenciais LN Markets
curl -X POST https://api.defisats.site/api/test/margin-guard \
     -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Soluções:**
1. **Credenciais Inválidas**: Verificar credenciais LN Markets
2. **Fila Vazia**: Verificar se há jobs na fila
3. **Configuração**: Verificar configuração do worker

## Problemas de Performance

### 1. Aplicação Lenta

**Sintomas:**
- Carregamento lento
- Timeouts frequentes
- CPU/RAM alta

**Diagnóstico:**
```bash
# Verificar uso de recursos
docker stats

# Verificar logs de performance
docker logs hub-defisats-backend-prod | grep -i "slow"

# Verificar índices do banco
docker exec hub-defisats-postgres-prod psql -U hubdefisats_prod -d hubdefisats_prod -c "\d+"
```

**Soluções:**
1. **Recursos Insuficientes**: Aumentar recursos do servidor
2. **Queries Lentas**: Otimizar queries do banco
3. **Cache**: Implementar cache Redis

### 2. Memory Leaks

**Sintomas:**
- Uso de memória cresce continuamente
- Aplicação fica lenta com o tempo
- Containers são reiniciados

**Diagnóstico:**
```bash
# Monitorar uso de memória
docker stats --no-stream

# Verificar logs de memória
docker logs hub-defisats-backend-prod | grep -i "memory"

# Verificar processos
docker exec hub-defisats-backend-prod ps aux
```

**Soluções:**
1. **Limpeza de Código**: Remover referências não utilizadas
2. **Garbage Collection**: Forçar GC do Node.js
3. **Restart Periódico**: Reiniciar containers periodicamente

## Problemas de Deploy

### 1. Deploy Falha

**Sintomas:**
- Script de deploy falha
- Containers não sobem
- Health checks falham

**Diagnóstico:**
```bash
# Verificar logs do deploy
./scripts/deploy/deploy-safe.sh

# Verificar health checks
./scripts/deploy/check-production.sh

# Verificar status dos containers
docker ps -a
```

**Soluções:**
1. **Rollback**: Usar backup automático
2. **Verificar Configuração**: Validar variáveis de ambiente
3. **Limpar Containers**: Remover containers antigos

```bash
# Rollback manual
cd backups/YYYYMMDD_HHMMSS
cp .env.production.backup ../../config/env/.env.production
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### 2. SSL/TLS Problemas

**Sintomas:**
- Certificados inválidos
- HTTPS não funciona
- Erros de certificado

**Diagnóstico:**
```bash
# Verificar certificados
openssl x509 -in ~/proxy/certs/defisats.site.crt -text -noout

# Verificar validade
openssl x509 -in ~/proxy/certs/defisats.site.crt -checkend 86400

# Testar SSL
curl -I https://defisats.site
```

**Soluções:**
1. **Renovar Certificados**: Usar Let's Encrypt
2. **Configuração Nginx**: Verificar configuração SSL
3. **Firewall**: Verificar portas 80/443

## Comandos de Diagnóstico Úteis

### Verificação Geral do Sistema
```bash
# Status geral
./scripts/deploy/check-production.sh

# Logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# Uso de recursos
docker stats --no-stream

# Espaço em disco
df -h
```

### Verificação de Conectividade
```bash
# Testar frontend
curl -I https://defisats.site

# Testar API
curl -I https://api.defisats.site/health

# Testar WebSocket
curl -I https://api.defisats.site/ws
```

### Verificação de Banco de Dados
```bash
# Conectar ao banco
docker exec -it hub-defisats-postgres-prod psql -U hubdefisats_prod -d hubdefisats_prod

# Verificar tabelas
\dt

# Verificar conexões
SELECT * FROM pg_stat_activity;
```

## Logs Importantes

### Localizações dos Logs
- **Backend**: `docker logs hub-defisats-backend-prod`
- **Frontend**: `docker logs hub-defisats-frontend-prod`
- **Nginx**: `docker logs hub-defisats-nginx-prod`
- **PostgreSQL**: `docker logs hub-defisats-postgres-prod`
- **Redis**: `docker logs hub-defisats-redis-prod`
- **Proxy Global**: `~/proxy/logs/`

### Comandos de Log
```bash
# Logs específicos
docker logs hub-defisats-backend-prod --tail 100

# Logs com timestamp
docker logs hub-defisats-backend-prod -t

# Logs de erro
docker logs hub-defisats-backend-prod 2>&1 | grep -i error
```

## Contatos de Suporte

- **Email**: support@defisats.site
- **Documentação**: https://docs.defisats.site
- **GitHub Issues**: https://github.com/defisats/hub-defisats/issues

---

**Última Atualização**: 2025-01-22  
**Versão**: 1.0.0
