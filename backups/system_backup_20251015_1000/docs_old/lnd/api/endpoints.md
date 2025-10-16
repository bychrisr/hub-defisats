# LND API Endpoints - Documentação Completa

**Data de Atualização**: 2025-10-11  
**Versão**: 1.0.0

## 📋 Visão Geral

Esta documentação cobre todos os endpoints LND implementados no sistema Axisor, incluindo parâmetros, respostas, códigos de erro e exemplos de uso.

## 🔗 Base URLs

- **Testnet**: `http://localhost:13010/api/lnd/`
- **Production**: `http://localhost:13010/api/lnd/` (mesma base, configuração via env)

## 📊 Endpoints por Categoria

### 🏠 **Informações Gerais**

#### `GET /api/lnd/info`
Informações básicas do nó LND.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "alias": "axisor-testnet-node",
    "identityPubkey": "03abc123...",
    "numPendingChannels": 0,
    "numActiveChannels": 2,
    "numPeers": 3,
    "blockHeight": 2500000,
    "blockHash": "abc123...",
    "syncedToChain": true,
    "testnet": true,
    "chains": ["bitcoin"],
    "uris": ["03abc123@localhost:9735"],
    "bestHeaderTimestamp": "2025-10-11T15:30:00Z",
    "version": "0.17.0-beta"
  }
}
```

#### `GET /api/lnd/network-info`
Informações sobre a rede Lightning.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "graphDiameter": 20,
    "avgOutDegree": 2.5,
    "maxOutDegree": 10,
    "numNodes": 15000,
    "numChannels": 80000,
    "totalNetworkCapacity": 5000000000,
    "avgChannelSize": 62500,
    "minChannelSize": 1000,
    "maxChannelSize": 16777215
  }
}
```

#### `GET /api/lnd/metrics`
Métricas de performance do nó.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "uptime": "7d 12h 30m",
    "totalChannels": 2,
    "activeChannels": 2,
    "pendingChannels": 0,
    "totalPeers": 3,
    "connectedPeers": 3,
    "totalInvoices": 150,
    "paidInvoices": 145,
    "pendingInvoices": 5,
    "totalPayments": 89,
    "successfulPayments": 87,
    "failedPayments": 2
  }
}
```

### 💰 **Gerenciamento de Wallet**

#### `GET /api/lnd/wallet/balance`
Saldo total da carteira (on-chain + off-chain).

**Resposta:**
```json
{
  "success": true,
  "data": {
    "totalBalance": 200000,
    "confirmedBalance": 150000,
    "unconfirmedBalance": 50000,
    "lockedBalance": 0,
    "reservedBalanceAnchorChan": 0,
    "accountBalance": {
      "default": {
        "confirmedBalance": 150000,
        "unconfirmedBalance": 50000
      }
    }
  }
}
```

#### `GET /api/lnd/wallet/balance/onchain`
Saldo apenas on-chain.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "confirmedBalance": 150000,
    "unconfirmedBalance": 50000,
    "totalBalance": 200000
  }
}
```

#### `GET /api/lnd/wallet/channels`
Lista de canais abertos.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "active": true,
        "remotePubkey": "03def456...",
        "channelPoint": "abc123:0",
        "chanId": "123456789",
        "capacity": 1000000,
        "localBalance": 400000,
        "remoteBalance": 600000,
        "commitFee": 1500,
        "commitWeight": 724,
        "feePerKw": 1250,
        "unsettledBalance": 0,
        "totalSatoshisReceived": 50000,
        "totalSatoshisSent": 10000,
        "numUpdates": 25,
        "pendingHtlcs": [],
        "csvDelay": 144,
        "private": false,
        "initiator": true,
        "chanStatusFlags": "ChanStatusDefault"
      }
    ]
  }
}
```

#### `GET /api/lnd/wallet/utxos`
UTXOs disponíveis na carteira.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "utxos": [
      {
        "addressType": "WITNESS_PUBKEY_HASH",
        "address": "tb1qabc123...",
        "amountSat": 100000,
        "pkScript": "0014...",
        "outpoint": {
          "txidBytes": "abc123...",
          "txidStr": "abc123...",
          "outputIndex": 0
        },
        "confirmations": 6,
        "rawConfirmations": 6
      }
    ]
  }
}
```

#### `POST /api/lnd/wallet/estimate-fee`
Estimar taxa para transação.

**Parâmetros:**
```json
{
  "targetConf": 6,
  "amount": 50000,
  "satPerVbyte": 10
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "feeSat": 1500,
    "feerateSatPerByte": 10,
    "satPerVbyte": 10
  }
}
```

### 📄 **Gerenciamento de Invoices**

#### `GET /api/lnd/invoices`
Lista invoices da carteira.

**Query Parameters:**
- `indexOffset` (number): Offset para paginação
- `numMaxInvoices` (number): Máximo de invoices (default: 100)
- `reversed` (boolean): Ordem reversa (default: false)
- `pendingOnly` (boolean): Apenas pendentes (default: false)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "memo": "Test invoice",
        "rPreimage": "abc123...",
        "rHash": "def456...",
        "value": 10000,
        "valueMsat": 10000000,
        "creationDate": "2025-10-11T15:30:00Z",
        "settleDate": "2025-10-11T15:35:00Z",
        "paymentRequest": "lnbc100n1p...",
        "descriptionHash": null,
        "expiry": 3600,
        "fallbackAddr": "",
        "cltvExpiry": 40,
        "routeHints": [],
        "private": false,
        "addIndex": 1,
        "settleIndex": 1,
        "amtPaid": 10000,
        "amtPaidSat": 10000,
        "amtPaidMsat": 10000000,
        "state": "SETTLED",
        "htlcs": [],
        "features": {},
        "isKeysend": false
      }
    ],
    "firstIndexOffset": 0,
    "lastIndexOffset": 0
  }
}
```

#### `POST /api/lnd/invoices`
Criar novo invoice.

**Parâmetros:**
```json
{
  "memo": "Payment for services",
  "value": 50000,
  "expiry": 3600,
  "private": false
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "paymentRequest": "lnbc500n1p...",
    "addIndex": 2,
    "paymentAddr": "abc123...",
    "rHash": "def456..."
  }
}
```

#### `GET /api/lnd/invoices/hold`
Invoices em hold (aguardando confirmação).

**Resposta:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "memo": "Hold invoice",
        "rHash": "abc123...",
        "value": 25000,
        "creationDate": "2025-10-11T15:30:00Z",
        "expiry": 3600,
        "state": "ACCEPTED",
        "htlcs": []
      }
    ]
  }
}
```

#### `GET /api/lnd/invoices/:paymentHash`
Obter invoice específico por hash.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "memo": "Test invoice",
    "rHash": "abc123...",
    "value": 10000,
    "state": "SETTLED",
    "creationDate": "2025-10-11T15:30:00Z",
    "settleDate": "2025-10-11T15:35:00Z",
    "paymentRequest": "lnbc100n1p...",
    "amtPaid": 10000
  }
}
```

#### `POST /api/lnd/invoices/:paymentHash/settle`
Settlar invoice (confirmar pagamento).

**Resposta:**
```json
{
  "success": true,
  "data": {
    "message": "Invoice settled successfully"
  }
}
```

#### `POST /api/lnd/invoices/:paymentHash/cancel`
Cancelar invoice.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "message": "Invoice cancelled successfully"
  }
}
```

#### `POST /api/lnd/invoices/decode`
Decodificar payment request.

**Parâmetros:**
```json
{
  "paymentRequest": "lnbc100n1p..."
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "destination": "03abc123...",
    "paymentHash": "def456...",
    "numSatoshis": 10000,
    "timestamp": 1736515800,
    "expiry": 3600,
    "description": "Test invoice",
    "descriptionHash": null,
    "fallbackAddr": "",
    "cltvExpiry": 40,
    "routeHints": [],
    "paymentAddr": "abc123...",
    "numMsat": 10000000,
    "features": {}
  }
}
```

### 💸 **Processamento de Pagamentos**

#### `GET /api/lnd/payments`
Lista pagamentos realizados.

**Query Parameters:**
- `indexOffset` (number): Offset para paginação
- `maxPayments` (number): Máximo de pagamentos (default: 100)
- `reversed` (boolean): Ordem reversa (default: false)
- `includeIncomplete` (boolean): Incluir incompletos (default: false)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "paymentHash": "abc123...",
        "value": 50000,
        "creationDate": "2025-10-11T15:30:00Z",
        "fee": 1500,
        "paymentPreimage": "def456...",
        "valueSat": 50000,
        "valueMsat": 50000000,
        "paymentRequest": "lnbc500n1p...",
        "status": "SUCCEEDED",
        "feeSat": 1500,
        "feeMsat": 1500000,
        "creationTimeNs": "1736515800000000000",
        "htlcs": [],
        "paymentIndex": 1,
        "failureReason": "FAILURE_REASON_NONE"
      }
    ],
    "firstIndexOffset": 0,
    "lastIndexOffset": 0
  }
}
```

#### `POST /api/lnd/payments/invoice`
Pagar invoice.

**Parâmetros:**
```json
{
  "paymentRequest": "lnbc500n1p...",
  "amt": 50000,
  "feeLimit": 5000,
  "timeoutSeconds": 60
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "paymentHash": "abc123...",
    "preimage": "def456...",
    "route": {
      "totalTimeLock": 100,
      "totalFees": 1500,
      "totalAmt": 51500,
      "hops": []
    },
    "paymentError": "",
    "paymentPreimage": "def456...",
    "paymentRoute": {
      "totalTimeLock": 100,
      "totalFees": 1500,
      "totalAmt": 51500,
      "hops": []
    }
  }
}
```

#### `GET /api/lnd/payments/:paymentHash`
Obter pagamento específico por hash.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "paymentHash": "abc123...",
    "value": 50000,
    "creationDate": "2025-10-11T15:30:00Z",
    "fee": 1500,
    "paymentPreimage": "def456...",
    "valueSat": 50000,
    "valueMsat": 50000000,
    "paymentRequest": "lnbc500n1p...",
    "status": "SUCCEEDED",
    "feeSat": 1500,
    "feeMsat": 1500000,
    "creationTimeNs": "1736515800000000000",
    "htlcs": [],
    "paymentIndex": 1,
    "failureReason": "FAILURE_REASON_NONE"
  }
}
```

#### `POST /api/lnd/payments/:paymentHash/track`
Rastrear pagamento.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "paymentHash": "abc123...",
    "status": "IN_FLIGHT",
    "route": {
      "totalTimeLock": 100,
      "totalFees": 1500,
      "totalAmt": 51500,
      "hops": []
    }
  }
}
```

#### `POST /api/lnd/payments/estimate-route`
Estimar rota para pagamento.

**Parâmetros:**
```json
{
  "dest": "03abc123...",
  "amt": 50000,
  "finalCltvDelta": 40,
  "feeLimit": 5000
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "route": {
      "totalTimeLock": 100,
      "totalFees": 1500,
      "totalAmt": 51500,
      "hops": [
        {
          "chanId": "123456789",
          "chanCapacity": 1000000,
          "amtToForward": 50000,
          "fee": 1500,
          "expiry": 100,
          "amtToForwardMsat": 50000000,
          "feeMsat": 1500000,
          "pubKey": "03def456..."
        }
      ]
    },
    "successProb": 0.95
  }
}
```

### 🔗 **Gerenciamento de Canais**

#### `GET /api/lnd/channels`
Lista todos os canais.

**Query Parameters:**
- `activeOnly` (boolean): Apenas canais ativos (default: false)
- `inactiveOnly` (boolean): Apenas canais inativos (default: false)
- `publicOnly` (boolean): Apenas canais públicos (default: false)
- `privateOnly` (boolean): Apenas canais privados (default: false)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "active": true,
        "remotePubkey": "03def456...",
        "channelPoint": "abc123:0",
        "chanId": "123456789",
        "capacity": 1000000,
        "localBalance": 400000,
        "remoteBalance": 600000,
        "commitFee": 1500,
        "commitWeight": 724,
        "feePerKw": 1250,
        "unsettledBalance": 0,
        "totalSatoshisReceived": 50000,
        "totalSatoshisSent": 10000,
        "numUpdates": 25,
        "pendingHtlcs": [],
        "csvDelay": 144,
        "private": false,
        "initiator": true,
        "chanStatusFlags": "ChanStatusDefault"
      }
    ]
  }
}
```

#### `GET /api/lnd/channels/pending`
Canais pendentes.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "totalLimboBalance": 100000,
    "pendingOpenChannels": [
      {
        "channel": {
          "remoteNodePub": "03def456...",
          "channelPoint": "abc123:0",
          "capacity": 1000000,
          "localBalance": 500000,
          "remoteBalance": 500000,
          "commitFee": 1500,
          "commitWeight": 724,
          "feePerKw": 1250,
          "fundingTxid": "abc123...",
          "outputIndex": 0
        },
        "confirmationHeight": 6,
        "commitFee": 1500,
        "commitWeight": 724,
        "feePerKw": 1250,
        "fundingTxid": "abc123...",
        "outputIndex": 0,
        "chanStatusFlags": "ChanStatusDefault",
        "chanStatusFlagsString": "ChanStatusDefault",
        "maturityHeight": 2500006,
        "blocksTilMaturity": 144,
        "recoveryWindow": 1008,
        "nextRecoveryHeight": 2501008
      }
    ],
    "pendingClosingChannels": [],
    "pendingForceClosingChannels": [],
    "waitingCloseChannels": []
  }
}
```

#### `GET /api/lnd/channels/closed`
Canais fechados.

**Query Parameters:**
- `cooperative` (boolean): Fechamentos cooperativos (default: false)
- `localForce` (boolean): Fechamentos forçados locais (default: false)
- `remoteForce` (boolean): Fechamentos forçados remotos (default: false)
- `breach` (boolean): Fechamentos por violação (default: false)
- `fundingCanceled` (boolean): Fechamentos cancelados (default: false)
- `abandoned` (boolean): Fechamentos abandonados (default: false)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "channelPoint": "abc123:0",
        "chanId": "123456789",
        "chainHash": "def456...",
        "closingTxHash": "ghi789...",
        "remotePubkey": "03def456...",
        "capacity": 1000000,
        "closeHeight": 2500000,
        "settledBalance": 400000,
        "timeLockedBalance": 0,
        "closeType": "COOPERATIVE_CLOSE",
        "openInitiator": "INITIATOR_LOCAL",
        "closeInitiator": "INITIATOR_LOCAL"
      }
    ]
  }
}
```

#### `POST /api/lnd/channels/open`
Abrir novo canal.

**Parâmetros:**
```json
{
  "nodePubkeyString": "03def456...",
  "localFundingAmount": 500000,
  "pushSat": 100000,
  "private": false,
  "minHtlcMsat": 1000,
  "remoteCsvDelay": 144,
  "minConfs": 1,
  "spendUnconfirmed": false,
  "closeAddress": "",
  "fundingShim": null,
  "remoteMaxValueInFlightMsat": 16777215,
  "remoteMaxHtlcs": 30,
  "maxLocalCsv": 2016,
  "commitmentType": "LEGACY"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "fundingTxid": "abc123...",
    "outputIndex": 0,
    "fundingTxidBytes": "abc123..."
  }
}
```

#### `POST /api/lnd/channels/:channelPoint/close`
Fechar canal.

**Parâmetros:**
```json
{
  "channelPoint": "abc123:0",
  "force": false,
  "targetConf": 6,
  "deliveryAddress": "",
  "satPerByte": 10
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "closingTxid": "def456...",
    "message": "Channel closing initiated"
  }
}
```

#### `POST /api/lnd/channels/:channelPoint/update-policy`
Atualizar política de canal.

**Parâmetros:**
```json
{
  "channelPoint": "abc123:0",
  "baseFeeMsat": 1000,
  "feeRate": 0.000001,
  "timeLockDelta": 144,
  "maxHtlcMsat": 16777215,
  "minHtlcMsat": 1000,
  "minHtlcMsatSpecified": true
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "message": "Channel policy updated successfully"
  }
}
```

#### `POST /api/lnd/channels/backup`
Fazer backup de canais.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "chanBackups": [
      {
        "chanPoint": {
          "fundingTxidBytes": "abc123...",
          "fundingTxidStr": "abc123...",
          "outputIndex": 0
        },
        "chanBackup": "abc123..."
      }
    ]
  }
}
```

#### `POST /api/lnd/channels/restore`
Restaurar canais do backup.

**Parâmetros:**
```json
{
  "chanBackups": [
    {
      "chanPoint": {
        "fundingTxidBytes": "abc123...",
        "fundingTxidStr": "abc123...",
        "outputIndex": 0
      },
      "chanBackup": "abc123..."
    }
  ]
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "message": "Channels restored successfully"
  }
}
```

### 👥 **Gerenciamento de Peers**

#### `GET /api/lnd/peers`
Lista peers conectados.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "peers": [
      {
        "pubKey": "03def456...",
        "address": "192.168.1.100:9735",
        "bytesSent": 1024000,
        "bytesRecv": 2048000,
        "satSent": 50000,
        "satRecv": 100000,
        "inbound": false,
        "pingTime": 25,
        "syncType": "ACTIVE_SYNC",
        "features": {},
        "errors": [],
        "flapCount": 0,
        "lastFlapNs": 0,
        "lastPingPayload": "abc123..."
      }
    ]
  }
}
```

#### `POST /api/lnd/peers/connect`
Conectar a peer.

**Parâmetros:**
```json
{
  "addr": {
    "pubkey": "03def456...",
    "host": "192.168.1.100:9735"
  },
  "perm": false,
  "timeout": 60
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "message": "Peer connected successfully"
  }
}
```

#### `DELETE /api/lnd/peers/:pubkey/disconnect`
Desconectar peer.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "message": "Peer disconnected successfully"
  }
}
```

### 🔗 **Transações On-Chain**

#### `GET /api/lnd/onchain/address`
Gerar novo endereço.

**Query Parameters:**
- `type` (string): Tipo de endereço (`p2wkh`, `np2wkh`, `p2tr`) (default: `p2wkh`)
- `account` (string): Conta (default: `default`)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "address": "tb1qabc123...",
    "addressType": "WITNESS_PUBKEY_HASH"
  }
}
```

#### `POST /api/lnd/onchain/send`
Enviar transação on-chain.

**Parâmetros:**
```json
{
  "addr": "tb1qdef456...",
  "amount": 50000,
  "targetConf": 6,
  "satPerVbyte": 10,
  "sendAll": false,
  "label": "Test transaction"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "txid": "abc123...",
    "txidBytes": "abc123..."
  }
}
```

#### `POST /api/lnd/onchain/send-many`
Enviar múltiplas transações.

**Parâmetros:**
```json
{
  "AddrToAmount": {
    "tb1qabc123...": 25000,
    "tb1qdef456...": 25000
  },
  "targetConf": 6,
  "satPerVbyte": 10,
  "sendAll": false,
  "label": "Batch transaction"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "txid": "abc123...",
    "txidBytes": "abc123..."
  }
}
```

#### `GET /api/lnd/onchain/transactions`
Lista transações on-chain.

**Query Parameters:**
- `startHeight` (number): Altura inicial (default: -1)
- `endHeight` (number): Altura final (default: -1)
- `account` (string): Conta (default: `default`)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "txHash": "abc123...",
        "amount": 100000,
        "numConfirmations": 6,
        "blockHash": "def456...",
        "blockHeight": 2500000,
        "timeStamp": 1736515800,
        "totalFees": 1500,
        "destAddresses": ["tb1qabc123..."],
        "rawTxHex": "0200000001...",
        "label": "Test transaction"
      }
    ]
  }
}
```

#### `GET /api/lnd/onchain/transactions/:txid`
Obter transação específica.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "txHash": "abc123...",
    "amount": 100000,
    "numConfirmations": 6,
    "blockHash": "def456...",
    "blockHeight": 2500000,
    "timeStamp": 1736515800,
    "totalFees": 1500,
    "destAddresses": ["tb1qabc123..."],
    "rawTxHex": "0200000001...",
    "label": "Test transaction"
  }
}
```

## 🔄 **Sincronização**

#### `GET /api/lnd-sync/sync-progress`
Progresso da sincronização LND.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "synced": true,
    "progress": 100,
    "currentHeight": 2500000,
    "targetHeight": 2500000,
    "estimatedTimeRemaining": 0,
    "syncType": "FULL_SYNC",
    "lastUpdate": "2025-10-11T15:30:00Z"
  }
}
```

## 📝 **Códigos de Erro**

### Erros Comuns

| Código | Descrição | Solução |
|--------|-----------|---------|
| `400` | Bad Request | Verificar parâmetros da requisição |
| `401` | Unauthorized | Verificar autenticação LND |
| `403` | Forbidden | Verificar permissões |
| `404` | Not Found | Recurso não encontrado |
| `500` | Internal Server Error | Erro interno do LND |
| `503` | Service Unavailable | LND não disponível |

### Erros Específicos LND

| Código | Descrição | Solução |
|--------|-----------|---------|
| `WALLET_NOT_UNLOCKED` | Carteira bloqueada | Desbloquear carteira |
| `INSUFFICIENT_BALANCE` | Saldo insuficiente | Verificar saldo disponível |
| `CHANNEL_NOT_FOUND` | Canal não encontrado | Verificar canal existe |
| `PEER_NOT_CONNECTED` | Peer desconectado | Conectar ao peer |
| `INVOICE_EXPIRED` | Invoice expirado | Criar novo invoice |
| `PAYMENT_FAILED` | Pagamento falhou | Verificar rota/peer |

## 🔧 **Exemplos de Uso**

### Criar Invoice e Receber Pagamento
```bash
# 1. Criar invoice
curl -X POST http://localhost:13010/api/lnd/invoices \
  -H "Content-Type: application/json" \
  -d '{"memo": "Test payment", "value": 10000}'

# 2. Verificar invoice criado
curl -s http://localhost:13010/api/lnd/invoices | jq '.data.invoices[0]'

# 3. Verificar quando foi pago
curl -s http://localhost:13010/api/lnd/invoices | jq '.data.invoices[0].settleDate'
```

### Verificar Saldo e Canais
```bash
# 1. Saldo total
curl -s http://localhost:13010/api/lnd/wallet/balance

# 2. Canais ativos
curl -s http://localhost:13010/api/lnd/wallet/channels

# 3. Peers conectados
curl -s http://localhost:13010/api/lnd/peers
```

### Gerenciar Canais
```bash
# 1. Listar canais
curl -s http://localhost:13010/api/lnd/channels

# 2. Abrir canal
curl -X POST http://localhost:13010/api/lnd/channels/open \
  -H "Content-Type: application/json" \
  -d '{"nodePubkeyString": "03def456...", "localFundingAmount": 100000}'

# 3. Fechar canal
curl -X POST http://localhost:13010/api/lnd/channels/abc123:0/close \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```

## 📊 **Rate Limiting**

- **Endpoints públicos**: 100 requests/minuto
- **Endpoints autenticados**: 60 requests/minuto
- **Operações de wallet**: 30 requests/minuto
- **Operações de canal**: 20 requests/minuto

## 🔐 **Autenticação**

Todos os endpoints LND requerem autenticação via:
- **TLS Certificate**: Para conexão segura
- **Macaroon**: Para autorização de operações

## 📈 **Monitoramento**

- **Health Check**: `GET /api/lnd/info`
- **Métricas**: `GET /api/lnd/metrics`
- **Sincronização**: `GET /api/lnd-sync/sync-progress`
- **Logs**: Verificar logs do container LND
