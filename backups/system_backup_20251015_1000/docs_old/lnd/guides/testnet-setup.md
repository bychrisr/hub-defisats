# LND Testnet Setup Guide

**Data de Atualização**: 2025-10-11  
**Versão**: 1.0.0

## 📋 Visão Geral

Este guia cobre a configuração completa do LND para testnet, incluindo sincronização, funding, e integração com LN Markets testnet.

## 🎯 Objetivos da Configuração Testnet

1. **Desenvolvimento Seguro**: Testar funcionalidades sem risco
2. **Integração LN Markets**: Conectar com testnet oficial
3. **Funding Automático**: Sistema de faucet interno
4. **Criação de Posições**: Testar fluxos completos

## 🚀 Configuração Inicial

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
      "--debuglevel=info"
    ]
    networks:
      - axisor-network
    depends_on:
      - redis
      - postgres
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

## 🔄 Processo de Sincronização

### 1. **Inicialização e Sincronização**

```bash
# Subir serviços
docker compose -f config/docker/docker-compose.dev.yml up -d lnd-testnet

# Aguardar inicialização
sleep 30

# Verificar logs de sincronização
docker compose -f config/docker/docker-compose.dev.yml logs -f lnd-testnet
```

### 2. **Monitoramento da Sincronização**

```bash
# Verificar progresso via API
curl -k https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon | jq '.synced_to_chain'

# Verificar via backend
curl -s http://localhost:13010/api/lnd-sync/sync-progress | jq .
```

### 3. **Script de Monitoramento**

```bash
#!/bin/bash
# monitor-lnd-sync.sh

echo "🔄 Monitoring LND Testnet Sync"
echo "==============================="

while true; do
  # Verificar status de sincronização
  SYNC_STATUS=$(curl -k -s https://localhost:18080/v1/getinfo \
    --cert ~/.lnd/tls.cert \
    --key ~/.lnd/tls.key \
    --macaroon ~/.lnd/admin.macaroon | jq -r '.synced_to_chain')
  
  if [ "$SYNC_STATUS" = "true" ]; then
    echo "✅ LND Testnet fully synced!"
    break
  else
    echo "⏳ LND Testnet still syncing... ($(date))"
    sleep 30
  fi
done

echo "🚀 LND Testnet ready for operations"
```

## 💰 Configuração de Wallet

### 1. **Criar Wallet**

```bash
# Entrar no container
docker exec -it axisor-lnd-testnet bash

# Criar wallet
lncli --network=testnet create

# Exemplo de interação:
# Input wallet password: TestPassword123!
# Confirm password: TestPassword123!
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

### 3. **Verificar Saldo Inicial**

```bash
# Verificar saldo
lncli --network=testnet walletbalance

# Verificar UTXOs
lncli --network=testnet listunspent
```

## 🌊 Funding via Faucets

### 1. **Faucets Testnet Disponíveis**

```bash
# Lista de faucets testnet
FAUCETS=(
  "https://testnet.help/en/bitcoincoinfaucet/testnet/"
  "https://bitcoinfaucet.uo1.net/"
  "https://testnet-faucet.mempool.co/"
  "https://coinfaucet.eu/en/btc-testnet/"
  "https://testnet.bitcoinfaucet.ml/"
)

# Gerar endereço para receber
lncli --network=testnet newaddress p2wkh
```

### 2. **Script de Funding Automático**

```bash
#!/bin/bash
# fund-lnd-testnet.sh

echo "💰 Funding LND Testnet Wallet"
echo "=============================="

# Gerar endereço
ADDRESS=$(lncli --network=testnet newaddress p2wkh | jq -r '.address')
echo "📍 Generated address: $ADDRESS"

# Solicitar funding via faucet
echo "🌊 Requesting funding from faucets..."

for faucet in "${FAUCETS[@]}"; do
  echo "🔗 Requesting from: $faucet"
  # Aqui você faria a requisição para o faucet
  # (implementação específica depende do faucet)
done

echo "⏳ Waiting for funding confirmation..."
echo "💡 You can monitor the transaction at: https://blockstream.info/testnet/address/$ADDRESS"
```

### 3. **Verificar Funding**

```bash
# Verificar saldo após funding
lncli --network=testnet walletbalance

# Verificar transações
lncli --network=testnet listchaintxns

# Verificar UTXOs
lncli --network=testnet listunspent
```

## 🔗 Integração com LN Markets Testnet

### 1. **Configuração LN Markets Testnet**

```typescript
// backend/src/config/lnmarkets-testnet.ts
export const LN_MARKETS_TESTNET_CONFIG = {
  baseURL: 'https://api.testnet4.lnmarkets.com/v2',
  websocketURL: 'wss://api.testnet4.lnmarkets.com',
  credentials: {
    apiKey: 'k7WbaBogWpas/yZwkKE5mEJVAsOpxbQN1+mpTzo4+Qk=',
    apiSecret: '4LXnPFKCzARK6Asn9l/YyIWS08s9++4OSaXomss4b96dlf9apRAq621DI9KiSNhlaRRr7Czqg7g9hXxQYeOOSQ==',
    passphrase: 'e60b7c9bg0d7'
  }
};
```

### 2. **Sistema de Faucet Interno**

```typescript
// backend/src/services/testnet-faucet.service.ts
export class TestnetFaucetService {
  async requestFunding(request: FaucetRequest): Promise<FundingResult> {
    try {
      // 1. Verificar se LND tem saldo suficiente
      const lndBalance = await this.lndService.getTestnetBalance();
      if (lndBalance < request.amount) {
        throw new Error('Insufficient LND balance');
      }

      // 2. Criar invoice Lightning
      const invoice = await this.lndService.createTestnetInvoice({
        amount: request.amount,
        memo: request.memo || 'Testnet faucet funding'
      });

      // 3. Processar pagamento
      const paymentResult = await this.processPayment(invoice);

      return {
        requestId: this.generateRequestId(),
        amount: request.amount,
        lightningInvoice: invoice.paymentRequest,
        status: 'completed',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Funding failed: ${error.message}`);
    }
  }
}
```

### 3. **Interface de Funding**

```typescript
// frontend/src/hooks/useTestnetFaucet.ts
export function useTestnetFaucet() {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  const requestFunding = async (amount: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/testnet-faucet/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      const result = await response.json();
      if (result.success) {
        // Atualizar saldo
        await refreshBalance();
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return { requestFunding, loading, balance };
}
```

## 🧪 Testes de Funcionalidade

### 1. **Teste de Conectividade**

```bash
#!/bin/bash
# test-lnd-testnet.sh

echo "🧪 Testing LND Testnet Functionality"
echo "===================================="

# Teste 1: Verificar sincronização
echo "📡 Testing sync status..."
SYNC_STATUS=$(curl -k -s https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon | jq -r '.synced_to_chain')

if [ "$SYNC_STATUS" = "true" ]; then
  echo "✅ Sync: OK"
else
  echo "❌ Sync: FAILED"
fi

# Teste 2: Verificar saldo
echo "💰 Testing wallet balance..."
BALANCE=$(lncli --network=testnet walletbalance | jq -r '.total_balance')
echo "💰 Current balance: $BALANCE sats"

# Teste 3: Criar invoice
echo "📄 Testing invoice creation..."
INVOICE=$(lncli --network=testnet addinvoice --amt=1000 --memo="Test invoice" | jq -r '.payment_request')
echo "📄 Created invoice: $INVOICE"

# Teste 4: Verificar canais
echo "🔗 Testing channels..."
CHANNELS=$(lncli --network=testnet listchannels | jq '.channels | length')
echo "🔗 Active channels: $CHANNELS"

echo "🏁 Testnet functionality test complete"
```

### 2. **Teste de Integração LN Markets**

```bash
#!/bin/bash
# test-lnmarkets-integration.sh

echo "🧪 Testing LN Markets Testnet Integration"
echo "========================================="

# Teste 1: Verificar API testnet
echo "📡 Testing LN Markets testnet API..."
API_RESPONSE=$(curl -s "https://api.testnet4.lnmarkets.com/v2/futures/btc_usd/ticker")
if echo "$API_RESPONSE" | jq -e '.last' > /dev/null; then
  echo "✅ LN Markets API: OK"
else
  echo "❌ LN Markets API: FAILED"
fi

# Teste 2: Verificar autenticação
echo "🔐 Testing authentication..."
AUTH_RESPONSE=$(curl -s "https://api.testnet4.lnmarkets.com/v2/user" \
  -H "LNM-ACCESS-KEY: k7WbaBogWpas/yZwkKE5mEJVAsOpxbQN1+mpTzo4+Qk=" \
  -H "LNM-ACCESS-SIGNATURE: $(generate_signature)" \
  -H "LNM-ACCESS-PASSPHRASE: e60b7c9bg0d7" \
  -H "LNM-ACCESS-TIMESTAMP: $(date +%s)000")

if echo "$AUTH_RESPONSE" | jq -e '.uid' > /dev/null; then
  echo "✅ Authentication: OK"
  echo "$AUTH_RESPONSE" | jq '.username, .balance'
else
  echo "❌ Authentication: FAILED"
fi

echo "🏁 LN Markets integration test complete"
```

## 📊 Monitoramento e Logs

### 1. **Logs de Sincronização**

```bash
# Monitorar logs de sincronização
docker compose -f config/docker/docker-compose.dev.yml logs -f lnd-testnet | grep -E "(syncing|sync|block|height)"

# Filtrar logs por nível
docker compose -f config/docker/docker-compose.dev.yml logs lnd-testnet | grep -E "(ERROR|WARN|INFO)"
```

### 2. **Métricas de Performance**

```bash
# Verificar métricas via API
curl -s http://localhost:13010/api/lnd/metrics | jq .

# Verificar sincronização
curl -s http://localhost:13010/api/lnd-sync/sync-progress | jq .
```

### 3. **Health Checks**

```bash
# Health check básico
curl -k https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon | jq '.synced_to_chain, .block_height, .best_header_timestamp'

# Health check via backend
curl -s http://localhost:13010/api/lnd/info | jq '.data.syncedToChain, .data.blockHeight'
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. **Sincronização Lenta**
```bash
# Verificar conectividade neutrino
docker exec -it axisor-lnd-testnet ping -c 3 faucet.lightning.community

# Verificar configuração neutrino
docker exec -it axisor-lnd-testnet cat /home/lnd/.lnd/lnd.conf | grep neutrino

# Reiniciar com nós adicionais
docker exec -it axisor-lnd-testnet lncli --network=testnet connect 03abc123@faucet.lightning.community:9735
```

#### 2. **Falha na Criação de Wallet**
```bash
# Verificar se wallet já existe
docker exec -it axisor-lnd-testnet ls -la /home/lnd/.lnd/

# Remover wallet existente (CUIDADO!)
docker exec -it axisor-lnd-testnet rm -rf /home/lnd/.lnd/wallet.db
docker exec -it axisor-lnd-testnet rm -rf /home/lnd/.lnd/channel.db

# Recriar wallet
docker exec -it axisor-lnd-testnet lncli --network=testnet create
```

#### 3. **Falha no Funding**
```bash
# Verificar endereço gerado
lncli --network=testnet newaddress p2wkh

# Verificar transações na blockchain
curl -s "https://blockstream.info/testnet/api/address/$ADDRESS"

# Verificar UTXOs
lncli --network=testnet listunspent
```

#### 4. **Problemas de Conectividade**
```bash
# Verificar portas
netstat -tlnp | grep -E "(18080|18009|18001)"

# Verificar logs de conectividade
docker compose -f config/docker/docker-compose.dev.yml logs lnd-testnet | grep -E "(connection|connect|peer)"

# Testar conectividade manual
telnet localhost 18080
```

### Scripts de Diagnóstico

```bash
#!/bin/bash
# diagnose-lnd-testnet.sh

echo "🔍 LND Testnet Diagnostics"
echo "==========================="

# Verificar container
echo "📦 Checking container..."
docker compose -f config/docker/docker-compose.dev.yml ps lnd-testnet

# Verificar logs
echo "📋 Checking logs..."
docker compose -f config/docker/docker-compose.dev.yml logs --tail=10 lnd-testnet

# Verificar conectividade
echo "🌐 Testing connectivity..."
curl -k -s https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon \
  && echo "✅ API accessible" || echo "❌ API failed"

# Verificar sincronização
echo "🔄 Checking sync status..."
SYNC_STATUS=$(curl -k -s https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon | jq -r '.synced_to_chain')

if [ "$SYNC_STATUS" = "true" ]; then
  echo "✅ Fully synced"
else
  echo "⏳ Still syncing"
fi

# Verificar saldo
echo "💰 Checking balance..."
BALANCE=$(lncli --network=testnet walletbalance | jq -r '.total_balance')
echo "💰 Balance: $BALANCE sats"

echo "🏁 Diagnostics complete"
```

## 📋 Checklist de Configuração Testnet

### ✅ Pré-requisitos
- [ ] Docker e Docker Compose instalados
- [ ] Portas 18080, 18009, 18001 disponíveis
- [ ] Conexão com internet estável
- [ ] Pelo menos 5GB de espaço em disco

### ✅ Configuração LND
- [ ] Container LND testnet configurado
- [ ] Arquivo de configuração criado
- [ ] Wallet criada e desbloqueada
- [ ] Sincronização completa

### ✅ Funding
- [ ] Saldo inicial obtido via faucet
- [ ] Sistema de faucet interno funcionando
- [ ] Integração com LN Markets testnet

### ✅ Testes
- [ ] Conectividade básica testada
- [ ] Criação de invoice funcionando
- [ ] Verificação de saldo funcionando
- [ ] Integração LN Markets funcionando

### ✅ Monitoramento
- [ ] Health checks configurados
- [ ] Logs monitorados
- [ ] Métricas coletadas
- [ ] Alertas configurados

## 🔗 Referências

- **LND Testnet**: https://docs.lightning.engineering/lightning-network-tools/lnd/testnet
- **Bitcoin Testnet**: https://en.bitcoin.it/wiki/Testnet
- **Neutrino**: https://github.com/lightninglabs/neutrino
- **LN Markets Testnet**: https://testnet4.lnmarkets.com/
- **Testnet Faucets**: https://testnet.help/en/bitcoincoinfaucet/testnet/
