# LND Installation & Setup Guide

**Data de Atualização**: 2025-10-11  
**Versão**: 1.0.0

## 📋 Visão Geral

Este guia cobre a instalação completa do LND (Lightning Network Daemon) para o sistema Axisor, incluindo configuração testnet e produção, Docker, e integração com o backend.

## 🐳 Instalação via Docker (Recomendado)

### 1. **Configuração Docker Compose**

```yaml
# config/docker/docker-compose.dev.yml
services:
  lnd-testnet:
    image: lightninglabs/lnd:v0.17.0-beta
    container_name: axisor-lnd-testnet
    restart: unless-stopped
    ports:
      - "18080:8080"  # REST API
      - "18009:10009" # gRPC
      - "18001:10001" # P2P
    volumes:
      - lnd-testnet-data:/home/lnd/.lnd
      - ./config/lnd/lnd-testnet.conf:/home/lnd/.lnd/lnd.conf:ro
    environment:
      - BITCOIN_NETWORK=testnet
      - LND_CHAIN=bitcoin
      - LND_NETWORK=testnet
    command: [
      "lnd",
      "--configfile=/home/lnd/.lnd/lnd.conf",
      "--bitcoin.testnet=true",
      "--bitcoin.node=neutrino",
      "--neutrino.connect=faucet.lightning.community",
      "--neutrino.connect=btcd-testnet.lightning.computer",
      "--debuglevel=info",
      "--tls.certpath=/home/lnd/.lnd/tls.cert",
      "--tls.keypath=/home/lnd/.lnd/tls.key",
      "--adminmacaroonpath=/home/lnd/.lnd/admin.macaroon",
      "--readonlymacaroonpath=/home/lnd/.lnd/readonly.macaroon",
      "--invoicemacaroonpath=/home/lnd/.lnd/invoice.macaroon"
    ]
    networks:
      - axisor-network
    depends_on:
      - redis
      - postgres

  lnd-production:
    image: lightninglabs/lnd:v0.17.0-beta
    container_name: axisor-lnd-production
    restart: unless-stopped
    ports:
      - "8080:8080"  # REST API
      - "10009:10009" # gRPC
      - "9735:9735"  # P2P
    volumes:
      - lnd-production-data:/home/lnd/.lnd
      - ./config/lnd/lnd-production.conf:/home/lnd/.lnd/lnd.conf:ro
    environment:
      - BITCOIN_NETWORK=mainnet
      - LND_CHAIN=bitcoin
      - LND_NETWORK=mainnet
    command: [
      "lnd",
      "--configfile=/home/lnd/.lnd/lnd.conf",
      "--bitcoin.mainnet=true",
      "--bitcoin.node=bitcoind",
      "--bitcoind.rpchost=bitcoind:8332",
      "--bitcoind.rpcuser=bitcoin",
      "--bitcoind.rpcpass=bitcoin",
      "--bitcoind.zmqpubrawblock=tcp://bitcoind:28332",
      "--bitcoind.zmqpubrawtx=tcp://bitcoind:28333",
      "--debuglevel=info"
    ]
    networks:
      - axisor-network
    depends_on:
      - bitcoind
      - redis
      - postgres

volumes:
  lnd-testnet-data:
    driver: local
  lnd-production-data:
    driver: local

networks:
  axisor-network:
    external: true
```

### 2. **Configuração LND Testnet**

```ini
# config/lnd/lnd-testnet.conf
[Application Options]
debuglevel=info
maxpendingchannels=10
alias=axisor-testnet-node
color=#68F442

[Bitcoin]
bitcoin.testnet=1
bitcoin.node=neutrino

[Neutrino]
neutrino.connect=faucet.lightning.community
neutrino.connect=btcd-testnet.lightning.computer
neutrino.feeurl=https://api.blockcypher.com/v1/btc/test3

[tor]
tor.active=0
tor.streamisolation=0

[watchtower]
watchtower.active=0

[wtclient]
wtclient.active=0

[healthcheck]
healthcheck.active=1
healthcheck.interval=30s
healthcheck.successfulresponses=1

[protocol]
protocol.wumbo-channels=1
protocol.option-scid-alias=1
protocol.zero-conf=1

[routing]
routing.assumechanvalid=1

[db]
db.no-graph-cache=1
```

### 3. **Configuração LND Production**

```ini
# config/lnd/lnd-production.conf
[Application Options]
debuglevel=info
maxpendingchannels=10
alias=axisor-production-node
color=#68F442

[Bitcoin]
bitcoin.mainnet=1
bitcoin.node=bitcoind

[Bitcoind]
bitcoind.rpchost=bitcoind:8332
bitcoind.rpcuser=bitcoin
bitcoind.rpcpass=bitcoin
bitcoind.zmqpubrawblock=tcp://bitcoind:28332
bitcoind.zmqpubrawtx=tcp://bitcoind:28333

[tor]
tor.active=0
tor.streamisolation=0

[watchtower]
watchtower.active=1

[wtclient]
wtclient.active=1

[healthcheck]
healthcheck.active=1
healthcheck.interval=30s
healthcheck.successfulresponses=1

[protocol]
protocol.wumbo-channels=1
protocol.option-scid-alias=1
protocol.zero-conf=1

[routing]
routing.assumechanvalid=1

[db]
db.no-graph-cache=1
```

## 🚀 Inicialização

### 1. **Subir os Serviços**

```bash
# Subir ambiente completo
cd /home/bychrisr/projects/axisor
docker compose -f config/docker/docker-compose.dev.yml up -d

# Aguardar inicialização
sleep 30

# Verificar status
docker compose -f config/docker/docker-compose.dev.yml ps
```

### 2. **Verificar Logs**

```bash
# Logs do LND testnet
docker compose -f config/docker/docker-compose.dev.yml logs -f lnd-testnet

# Logs do LND production
docker compose -f config/docker/docker-compose.dev.yml logs -f lnd-production
```

### 3. **Verificar Conectividade**

```bash
# Testar API testnet
curl -k https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon

# Testar API production
curl -k https://localhost:8080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon
```

## 🔐 Configuração de Wallet

### 1. **Criar Wallet (Testnet)**

```bash
# Entrar no container
docker exec -it axisor-lnd-testnet bash

# Criar wallet
lncli --network=testnet create

# Exemplo de saída:
# Input wallet password: 
# Confirm password:
# Do you have an existing cipher seed mnemonic you want to use? (Enter y/n): n
# Your cipher seed can optionally be encrypted with a passphrase. 
# Your cipher seed is: abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
# Please confirm your cipher seed to verify you have written it down correctly.
# Input cipher seed mnemonic: abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
# lnd successfully initialized!
```

### 2. **Desbloquear Wallet**

```bash
# Desbloquear wallet
lncli --network=testnet unlock

# Verificar status
lncli --network=testnet getinfo
```

### 3. **Configurar Variáveis de Ambiente**

```env
# .env.development
# LND Testnet
LND_TESTNET_BASE_URL=https://localhost:18080
LND_TESTNET_TLS_CERT=/home/lnd/.lnd/tls.cert
LND_TESTNET_MACAROON=/home/lnd/.lnd/admin.macaroon
LND_TESTNET_NETWORK=testnet

# LND Production
LND_PRODUCTION_BASE_URL=https://localhost:8080
LND_PRODUCTION_TLS_CERT=/home/lnd/.lnd/tls.cert
LND_PRODUCTION_MACAROON=/home/lnd/.lnd/admin.macaroon
LND_PRODUCTION_NETWORK=mainnet
```

## 🔧 Configuração do Backend

### 1. **Instalar Dependências**

```bash
# Instalar dependências Node.js
cd backend
npm install

# Instalar dependências LND
npm install @lightningdevkit/ldk-node
npm install @grpc/grpc-js
npm install @grpc/proto-loader
```

### 2. **Configurar Serviço LND**

```typescript
// backend/src/services/lnd/LNDService.ts
import { LNDClient } from '@lightningdevkit/ldk-node';

export class LNDService {
  private testnetClient: LNDClient;
  private productionClient: LNDClient;

  constructor() {
    this.initializeClients();
  }

  private async initializeClients() {
    // Cliente testnet
    this.testnetClient = new LNDClient({
      host: process.env.LND_TESTNET_BASE_URL,
      port: 18080,
      cert: fs.readFileSync(process.env.LND_TESTNET_TLS_CERT),
      macaroon: fs.readFileSync(process.env.LND_TESTNET_MACAROON)
    });

    // Cliente production
    this.productionClient = new LNDClient({
      host: process.env.LND_PRODUCTION_BASE_URL,
      port: 8080,
      cert: fs.readFileSync(process.env.LND_PRODUCTION_TLS_CERT),
      macaroon: fs.readFileSync(process.env.LND_PRODUCTION_MACAROON)
    });
  }
}
```

### 3. **Registrar Rotas**

```typescript
// backend/src/app.ts
import { lndRoutes } from './routes/lnd.routes';

// Registrar rotas LND
fastify.register(lndRoutes, { prefix: '/api/lnd' });
```

## 🧪 Testes de Instalação

### 1. **Teste Básico de Conectividade**

```bash
#!/bin/bash
# test-lnd-installation.sh

echo "🧪 Testing LND Installation"
echo "============================"

# Testar LND testnet
echo "📡 Testing LND Testnet..."
TESTNET_RESPONSE=$(curl -k -s https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon)

if echo "$TESTNET_RESPONSE" | jq -e '.identity_pubkey' > /dev/null; then
  echo "✅ LND Testnet: OK"
  echo "$TESTNET_RESPONSE" | jq '.alias, .identity_pubkey, .synced_to_chain'
else
  echo "❌ LND Testnet: FAILED"
  echo "$TESTNET_RESPONSE"
fi

# Testar LND production
echo "📡 Testing LND Production..."
PROD_RESPONSE=$(curl -k -s https://localhost:8080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon)

if echo "$PROD_RESPONSE" | jq -e '.identity_pubkey' > /dev/null; then
  echo "✅ LND Production: OK"
  echo "$PROD_RESPONSE" | jq '.alias, .identity_pubkey, .synced_to_chain'
else
  echo "❌ LND Production: FAILED"
  echo "$PROD_RESPONSE"
fi

echo "🏁 Installation test complete"
```

### 2. **Teste de API do Backend**

```bash
# Testar endpoints do backend
curl -s http://localhost:13010/api/lnd/info | jq .

# Testar sincronização
curl -s http://localhost:13010/api/lnd-sync/sync-progress | jq .

# Testar saldo
curl -s http://localhost:13010/api/lnd/wallet/balance | jq .
```

### 3. **Teste de Criação de Invoice**

```bash
# Criar invoice via backend
curl -X POST http://localhost:13010/api/lnd/invoices \
  -H "Content-Type: application/json" \
  -d '{"memo": "Test invoice", "value": 1000}' | jq .

# Verificar invoice criado
curl -s http://localhost:13010/api/lnd/invoices | jq '.data.invoices[0]'
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. **Erro: "connection refused"**
```bash
# Verificar se LND está rodando
docker compose ps lnd-testnet

# Verificar logs
docker compose logs lnd-testnet

# Verificar portas
netstat -tlnp | grep -E "(18080|18009)"
```

#### 2. **Erro: "certificate verify failed"**
```bash
# Verificar certificado
openssl x509 -in ~/.lnd/tls.cert -text -noout

# Verificar se é o certificado correto
openssl s_client -connect localhost:18080 -servername localhost
```

#### 3. **Erro: "wallet not unlocked"**
```bash
# Desbloquear wallet
docker exec -it axisor-lnd-testnet lncli --network=testnet unlock

# Verificar status
docker exec -it axisor-lnd-testnet lncli --network=testnet getinfo
```

#### 4. **Erro: "neutrino sync failed"**
```bash
# Verificar conectividade neutrino
docker exec -it axisor-lnd-testnet ping -c 3 faucet.lightning.community

# Verificar configuração neutrino
docker exec -it axisor-lnd-testnet cat /home/lnd/.lnd/lnd.conf | grep neutrino
```

### Scripts de Diagnóstico

```bash
#!/bin/bash
# diagnose-lnd.sh

echo "🔍 LND Diagnostics"
echo "=================="

# Verificar containers
echo "📦 Checking containers..."
docker compose ps | grep lnd

# Verificar volumes
echo "💾 Checking volumes..."
docker volume ls | grep lnd

# Verificar portas
echo "🔌 Checking ports..."
netstat -tlnp | grep -E "(18080|18009|8080|10009)"

# Verificar conectividade
echo "🌐 Testing connectivity..."
curl -k -s https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon \
  && echo "✅ Testnet API accessible" || echo "❌ Testnet API failed"

# Verificar logs
echo "📋 Recent logs..."
docker compose logs --tail=20 lnd-testnet

echo "🏁 Diagnostics complete"
```

## 📊 Monitoramento

### 1. **Health Checks**

```bash
# Health check básico
curl -k https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon | jq '.synced_to_chain'

# Health check via backend
curl -s http://localhost:13010/api/lnd/info | jq '.data.syncedToChain'
```

### 2. **Métricas de Performance**

```bash
# Verificar métricas
curl -s http://localhost:13010/api/lnd/metrics | jq .

# Verificar sincronização
curl -s http://localhost:13010/api/lnd-sync/sync-progress | jq .
```

### 3. **Logs de Monitoramento**

```bash
# Monitorar logs em tempo real
docker compose logs -f lnd-testnet

# Filtrar logs por nível
docker compose logs lnd-testnet | grep -E "(ERROR|WARN|INFO)"
```

## 🔄 Atualizações

### 1. **Atualizar LND**

```bash
# Parar serviços
docker compose -f config/docker/docker-compose.dev.yml down

# Atualizar imagem
docker pull lightninglabs/lnd:v0.17.0-beta

# Subir serviços
docker compose -f config/docker/docker-compose.dev.yml up -d
```

### 2. **Backup e Restore**

```bash
# Backup
docker run --rm -v lnd-testnet-data:/data -v $(pwd):/backup alpine tar czf /backup/lnd-testnet-backup.tar.gz -C /data .

# Restore
docker run --rm -v lnd-testnet-data:/data -v $(pwd):/backup alpine tar xzf /backup/lnd-testnet-backup.tar.gz -C /data
```

## 📋 Checklist de Instalação

### ✅ Pré-requisitos
- [ ] Docker e Docker Compose instalados
- [ ] Portas 18080, 18009, 8080, 10009 disponíveis
- [ ] Pelo menos 10GB de espaço em disco
- [ ] Conexão com internet estável

### ✅ Configuração
- [ ] Docker Compose configurado
- [ ] Arquivos de configuração LND criados
- [ ] Variáveis de ambiente configuradas
- [ ] Volumes Docker criados

### ✅ Inicialização
- [ ] Containers LND subindo sem erro
- [ ] Wallet criada e desbloqueada
- [ ] API LND respondendo
- [ ] Backend conectando ao LND

### ✅ Testes
- [ ] Conectividade básica testada
- [ ] Criação de invoice funcionando
- [ ] Verificação de saldo funcionando
- [ ] Logs sem erros críticos

### ✅ Monitoramento
- [ ] Health checks configurados
- [ ] Métricas coletadas
- [ ] Logs monitorados
- [ ] Alertas configurados

## 🔗 Referências

- **LND Oficial**: https://github.com/lightningnetwork/lnd
- **Docker Hub**: https://hub.docker.com/r/lightninglabs/lnd
- **Documentação LND**: https://docs.lightning.engineering/
- **Lightning Labs**: https://lightning.engineering/
- **BOLT Specs**: https://github.com/lightningnetwork/lightning-rfc
