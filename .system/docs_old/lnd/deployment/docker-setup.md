# LND Docker Setup & Deployment

**Data de Atualização**: 2025-10-11  
**Versão**: 1.0.0

## 📋 Visão Geral

Este guia cobre a configuração completa do LND usando Docker, incluindo setup de desenvolvimento, produção, e otimizações de performance.

## 🐳 Configuração Docker Compose

### 1. **Docker Compose Principal**

```yaml
# config/docker/docker-compose.dev.yml
version: '3.8'

services:
  # LND Testnet
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
      - ./config/lnd/tls-testnet.cert:/home/lnd/.lnd/tls.cert:ro
      - ./config/lnd/tls-testnet.key:/home/lnd/.lnd/tls.key:ro
    environment:
      - BITCOIN_NETWORK=testnet
      - LND_CHAIN=bitcoin
      - LND_NETWORK=testnet
      - LND_ALIAS=axisor-testnet-node
      - LND_COLOR=#68F442
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
    healthcheck:
      test: ["CMD", "curl", "-k", "https://localhost:8080/v1/getinfo"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # LND Production
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
      - ./config/lnd/tls-production.cert:/home/lnd/.lnd/tls.cert:ro
      - ./config/lnd/tls-production.key:/home/lnd/.lnd/tls.key:ro
    environment:
      - BITCOIN_NETWORK=mainnet
      - LND_CHAIN=bitcoin
      - LND_NETWORK=mainnet
      - LND_ALIAS=axisor-production-node
      - LND_COLOR=#68F442
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
    healthcheck:
      test: ["CMD", "curl", "-k", "https://localhost:8080/v1/getinfo"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Bitcoin Core (para produção)
  bitcoind:
    image: bitcoin/bitcoin:25.0
    container_name: axisor-bitcoind
    restart: unless-stopped
    ports:
      - "8332:8332"  # RPC
      - "28332:28332" # ZMQ Raw Block
      - "28333:28333" # ZMQ Raw Transaction
    volumes:
      - bitcoind-data:/home/bitcoin/.bitcoin
      - ./config/bitcoin/bitcoin.conf:/home/bitcoin/.bitcoin/bitcoin.conf:ro
    command: [
      "bitcoind",
      "-conf=/home/bitcoin/.bitcoin/bitcoin.conf",
      "-daemon=0"
    ]
    networks:
      - axisor-network

volumes:
  lnd-testnet-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/docker/volumes/lnd-testnet-data
  lnd-production-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/docker/volumes/lnd-production-data
  bitcoind-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/docker/volumes/bitcoind-data

networks:
  axisor-network:
    external: true
```

### 2. **Configuração de Desenvolvimento**

```yaml
# config/docker/docker-compose.dev.yml
version: '3.8'

services:
  # LND Testnet para desenvolvimento
  lnd-testnet:
    image: lightninglabs/lnd:v0.17.0-beta
    container_name: axisor-lnd-testnet-dev
    restart: unless-stopped
    ports:
      - "18080:8080"
      - "18009:10009"
      - "18001:10001"
    volumes:
      - lnd-testnet-dev-data:/home/lnd/.lnd
      - ./config/lnd/lnd-testnet-dev.conf:/home/lnd/.lnd/lnd.conf:ro
    environment:
      - BITCOIN_NETWORK=testnet
      - LND_CHAIN=bitcoin
      - LND_NETWORK=testnet
      - LND_ALIAS=axisor-testnet-dev
      - LND_COLOR=#FF6B6B
    command: [
      "lnd",
      "--configfile=/home/lnd/.lnd/lnd.conf",
      "--bitcoin.testnet=true",
      "--bitcoin.node=neutrino",
      "--neutrino.connect=faucet.lightning.community",
      "--neutrino.connect=btcd-testnet.lightning.computer",
      "--debuglevel=debug",
      "--logdir=/home/lnd/.lnd/logs"
    ]
    networks:
      - axisor-dev-network
    depends_on:
      - redis
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-k", "https://localhost:8080/v1/getinfo"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s

volumes:
  lnd-testnet-dev-data:
    driver: local

networks:
  axisor-dev-network:
    driver: bridge
```

### 3. **Configuração de Produção**

```yaml
# config/docker/docker-compose.prod.yml
version: '3.8'

services:
  # LND Production
  lnd-production:
    image: lightninglabs/lnd:v0.17.0-beta
    container_name: axisor-lnd-production
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "10009:10009"
      - "9735:9735"
    volumes:
      - lnd-production-data:/home/lnd/.lnd
      - ./config/lnd/lnd-production.conf:/home/lnd/.lnd/lnd.conf:ro
      - ./config/lnd/tls-production.cert:/home/lnd/.lnd/tls.cert:ro
      - ./config/lnd/tls-production.key:/home/lnd/.lnd/tls.key:ro
      - ./config/lnd/admin-production.macaroon:/home/lnd/.lnd/admin.macaroon:ro
      - ./config/lnd/readonly-production.macaroon:/home/lnd/.lnd/readonly.macaroon:ro
    environment:
      - BITCOIN_NETWORK=mainnet
      - LND_CHAIN=bitcoin
      - LND_NETWORK=mainnet
      - LND_ALIAS=axisor-production-node
      - LND_COLOR=#68F442
    command: [
      "lnd",
      "--configfile=/home/lnd/.lnd/lnd.conf",
      "--bitcoin.mainnet=true",
      "--bitcoin.node=bitcoind",
      "--bitcoind.rpchost=bitcoind:8332",
      "--bitcoind.rpcuser=${BITCOIND_RPC_USER}",
      "--bitcoind.rpcpass=${BITCOIND_RPC_PASS}",
      "--bitcoind.zmqpubrawblock=tcp://bitcoind:28332",
      "--bitcoind.zmqpubrawtx=tcp://bitcoind:28333",
      "--debuglevel=info",
      "--logdir=/home/lnd/.lnd/logs"
    ]
    networks:
      - axisor-production-network
    depends_on:
      - bitcoind
      - redis
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-k", "https://localhost:8080/v1/getinfo"]
      interval: 60s
      timeout: 30s
      retries: 3
      start_period: 300s
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'

volumes:
  lnd-production-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/docker/volumes/lnd-production-data

networks:
  axisor-production-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## 🔧 Configurações LND

### 1. **Configuração Testnet**

```ini
# config/lnd/lnd-testnet.conf
[Application Options]
debuglevel=info
maxpendingchannels=10
alias=axisor-testnet-node
color=#68F442
listen=0.0.0.0:10001
rpclisten=0.0.0.0:10009
restlisten=0.0.0.0:8080

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

[log]
logdir=/home/lnd/.lnd/logs
maxlogfiles=10
maxlogfilesize=10
```

### 2. **Configuração Production**

```ini
# config/lnd/lnd-production.conf
[Application Options]
debuglevel=info
maxpendingchannels=10
alias=axisor-production-node
color=#68F442
listen=0.0.0.0:9735
rpclisten=0.0.0.0:10009
restlisten=0.0.0.0:8080

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
healthcheck.interval=60s
healthcheck.successfulresponses=1

[protocol]
protocol.wumbo-channels=1
protocol.option-scid-alias=1
protocol.zero-conf=1

[routing]
routing.assumechanvalid=1

[db]
db.no-graph-cache=1

[log]
logdir=/home/lnd/.lnd/logs
maxlogfiles=10
maxlogfilesize=10
```

### 3. **Configuração Bitcoin Core**

```ini
# config/bitcoin/bitcoin.conf
# Bitcoin Core Configuration for LND

# Network
testnet=0
mainnet=1

# RPC Configuration
server=1
rpcuser=bitcoin
rpcpassword=bitcoin
rpcbind=0.0.0.0:8332
rpcallowip=0.0.0.0/0

# ZMQ Configuration
zmqpubrawblock=tcp://0.0.0.0:28332
zmqpubrawtx=tcp://0.0.0.0:28333

# Performance
dbcache=1000
maxmempool=1000
maxconnections=100

# Logging
debug=0
logtimestamps=1
logips=1

# Security
rpcworkqueue=100
rpcthreads=16
```

## 🚀 Scripts de Deploy

### 1. **Script de Deploy Completo**

```bash
#!/bin/bash
# deploy-lnd.sh

set -e

echo "🚀 Deploying LND Infrastructure"
echo "================================"

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar pré-requisitos
echo "🔍 Checking prerequisites..."
if ! command_exists docker; then
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Criar diretórios necessários
echo "📁 Creating directories..."
mkdir -p config/lnd
mkdir -p config/bitcoin
mkdir -p logs/lnd
mkdir -p logs/bitcoin

# Criar rede Docker se não existir
echo "🌐 Creating Docker network..."
docker network create axisor-network 2>/dev/null || echo "Network already exists"

# Parar serviços existentes
echo "🛑 Stopping existing services..."
docker-compose -f config/docker/docker-compose.dev.yml down 2>/dev/null || true

# Construir e subir serviços
echo "🏗️ Building and starting services..."
docker-compose -f config/docker/docker-compose.dev.yml up -d

# Aguardar inicialização
echo "⏳ Waiting for services to initialize..."
sleep 30

# Verificar saúde dos serviços
echo "🏥 Checking service health..."
docker-compose -f config/docker/docker-compose.dev.yml ps

# Verificar conectividade LND
echo "🔗 Testing LND connectivity..."
if curl -k -s https://localhost:18080/v1/getinfo > /dev/null; then
    echo "✅ LND Testnet is accessible"
else
    echo "❌ LND Testnet is not accessible"
    exit 1
fi

echo "✅ LND deployment completed successfully!"
```

### 2. **Script de Inicialização de Wallet**

```bash
#!/bin/bash
# init-lnd-wallet.sh

set -e

echo "🔐 Initializing LND Wallet"
echo "=========================="

# Verificar se LND está rodando
if ! docker-compose -f config/docker/docker-compose.dev.yml ps lnd-testnet | grep -q "Up"; then
    echo "❌ LND Testnet is not running. Please start it first."
    exit 1
fi

# Verificar se wallet já existe
if docker exec axisor-lnd-testnet ls /home/lnd/.lnd/wallet.db >/dev/null 2>&1; then
    echo "⚠️ Wallet already exists. Do you want to recreate it? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🗑️ Removing existing wallet..."
        docker exec axisor-lnd-testnet rm -rf /home/lnd/.lnd/wallet.db
        docker exec axisor-lnd-testnet rm -rf /home/lnd/.lnd/channel.db
    else
        echo "✅ Using existing wallet"
        exit 0
    fi
fi

# Criar wallet
echo "🔑 Creating wallet..."
docker exec -it axisor-lnd-testnet lncli --network=testnet create

echo "✅ Wallet initialization completed!"
```

### 3. **Script de Backup**

```bash
#!/bin/bash
# backup-lnd.sh

set -e

echo "💾 Backing up LND Data"
echo "====================="

# Criar diretório de backup
BACKUP_DIR="backups/lnd-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup LND Testnet
echo "📦 Backing up LND Testnet..."
docker run --rm -v lnd-testnet-data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/lnd-testnet-backup.tar.gz -C /data .

# Backup LND Production
if docker-compose -f config/docker/docker-compose.dev.yml ps lnd-production | grep -q "Up"; then
    echo "📦 Backing up LND Production..."
    docker run --rm -v lnd-production-data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/lnd-production-backup.tar.gz -C /data .
fi

# Backup configurações
echo "📋 Backing up configurations..."
cp -r config/lnd "$BACKUP_DIR/"
cp -r config/bitcoin "$BACKUP_DIR/"

# Backup logs
echo "📝 Backing up logs..."
cp -r logs "$BACKUP_DIR/"

echo "✅ Backup completed: $BACKUP_DIR"
```

## 🔍 Monitoramento

### 1. **Health Checks**

```bash
#!/bin/bash
# health-check-lnd.sh

echo "🏥 LND Health Check"
echo "=================="

# Verificar containers
echo "📦 Checking containers..."
docker-compose -f config/docker/docker-compose.dev.yml ps | grep lnd

# Verificar conectividade
echo "🌐 Testing connectivity..."
if curl -k -s https://localhost:18080/v1/getinfo > /dev/null; then
    echo "✅ LND Testnet API: OK"
else
    echo "❌ LND Testnet API: FAILED"
fi

# Verificar sincronização
echo "🔄 Checking sync status..."
SYNC_STATUS=$(curl -k -s https://localhost:18080/v1/getinfo | jq -r '.synced_to_chain')
if [ "$SYNC_STATUS" = "true" ]; then
    echo "✅ LND Testnet: Fully synced"
else
    echo "⏳ LND Testnet: Still syncing"
fi

# Verificar logs de erro
echo "📋 Checking for errors..."
ERROR_COUNT=$(docker-compose -f config/docker/docker-compose.dev.yml logs lnd-testnet | grep -c "ERROR" || true)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "✅ No errors found in logs"
else
    echo "⚠️ Found $ERROR_COUNT errors in logs"
fi

echo "🏁 Health check completed"
```

### 2. **Monitoramento de Recursos**

```bash
#!/bin/bash
# monitor-lnd-resources.sh

echo "📊 LND Resource Monitoring"
echo "========================="

# Monitorar uso de CPU e memória
echo "💻 Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep lnd

# Monitorar uso de disco
echo "💾 Disk usage:"
docker system df | grep lnd

# Monitorar logs em tempo real
echo "📝 Recent logs (last 10 lines):"
docker-compose -f config/docker/docker-compose.dev.yml logs --tail=10 lnd-testnet
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. **Container não inicia**
```bash
# Verificar logs
docker-compose -f config/docker/docker-compose.dev.yml logs lnd-testnet

# Verificar configuração
docker-compose -f config/docker/docker-compose.dev.yml config

# Verificar volumes
docker volume ls | grep lnd
```

#### 2. **Falha na conectividade**
```bash
# Verificar portas
netstat -tlnp | grep -E "(18080|18009|18001)"

# Verificar firewall
sudo ufw status

# Verificar DNS
nslookup localhost
```

#### 3. **Problemas de permissão**
```bash
# Verificar permissões dos volumes
ls -la /var/lib/docker/volumes/lnd-testnet-data/

# Corrigir permissões
sudo chown -R 1000:1000 /var/lib/docker/volumes/lnd-testnet-data/
```

#### 4. **Falha na sincronização**
```bash
# Verificar conectividade neutrino
docker exec axisor-lnd-testnet ping -c 3 faucet.lightning.community

# Verificar configuração neutrino
docker exec axisor-lnd-testnet cat /home/lnd/.lnd/lnd.conf | grep neutrino

# Reiniciar container
docker-compose -f config/docker/docker-compose.dev.yml restart lnd-testnet
```

## 📋 Checklist de Deploy

### ✅ Pré-requisitos
- [ ] Docker instalado e funcionando
- [ ] Docker Compose instalado
- [ ] Portas 18080, 18009, 18001 disponíveis
- [ ] Pelo menos 10GB de espaço em disco
- [ ] Conexão com internet estável

### ✅ Configuração
- [ ] Docker Compose configurado
- [ ] Arquivos de configuração LND criados
- [ ] Configuração Bitcoin Core (produção)
- [ ] Volumes Docker configurados

### ✅ Deploy
- [ ] Containers LND subindo sem erro
- [ ] Health checks passando
- [ ] API LND respondendo
- [ ] Logs sem erros críticos

### ✅ Pós-Deploy
- [ ] Wallet criada e desbloqueada
- [ ] Sincronização funcionando
- [ ] Backup configurado
- [ ] Monitoramento ativo

## 🔗 Referências

- **Docker LND**: https://hub.docker.com/r/lightninglabs/lnd
- **Docker Compose**: https://docs.docker.com/compose/
- **LND Configuration**: https://docs.lightning.engineering/lightning-network-tools/lnd
- **Bitcoin Core**: https://bitcoin.org/en/bitcoin-core/
