---
title: LND API Reference
category: integrations
subcategory: external-apis
tags: [lnd, lightning-network, api-reference, rest-api, grpc]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team"]
---

# LND API Reference

## Summary

Comprehensive API reference for LND (Lightning Network Daemon) REST API integration, covering all endpoint categories including info, wallet, invoice, channel, peer, and onchain operations with detailed request/response schemas and usage examples.

## Architecture

```mermaid
graph TB
    A[LND REST API] --> B[Info Endpoints]
    A --> C[Wallet Endpoints]
    A --> D[Invoice Endpoints]
    A --> E[Channel Endpoints]
    A --> F[Peer Endpoints]
    A --> G[Onchain Endpoints]
    
    B --> B1[GET /v1/getinfo]
    B --> B2[GET /v1/getnetworkinfo]
    B --> B3[GET /v1/getmetrics]
    
    C --> C1[GET /v1/balance/blockchain]
    C --> C2[GET /v1/balance/channels]
    C --> C3[GET /v1/balance/total]
    C --> C4[GET /v1/utxos]
    
    D --> D1[POST /v1/invoices]
    D --> D2[GET /v1/invoices]
    D --> D3[GET /v1/invoices/{payment_hash}]
    D --> D4[POST /v1/invoices/{payment_hash}/settle]
    
    E --> E1[GET /v1/channels]
    E --> E2[POST /v1/channels]
    E --> E3[DELETE /v1/channels/{funding_txid}/{output_index}]
    E --> E4[GET /v1/channels/pending]
    
    F --> F1[GET /v1/peers]
    F --> F2[POST /v1/peers]
    F --> F3[DELETE /v1/peers/{pub_key}]
    
    G --> G1[GET /v1/transactions]
    G --> G2[POST /v1/transactions]
    G --> G3[GET /v1/addresses]
    G --> G4[POST /v1/addresses]
```

## Authentication

### Macaroon Authentication

```typescript
// LND uses macaroon-based authentication
interface LNDCredentials {
  macaroon: string;  // Base64 encoded admin.macaroon
  tlsCert: string;   // Base64 encoded tls.cert
}

// Request headers
const headers = {
  'Grpc-Metadata-macaroon': credentials.macaroon,
  'Content-Type': 'application/json'
};
```

### TLS Configuration

```typescript
// TLS certificate validation
const httpsAgent = new https.Agent({
  ca: Buffer.from(credentials.tlsCert, 'base64'),
  rejectUnauthorized: true
});

const axiosConfig = {
  httpsAgent,
  headers
};
```

## Info Endpoints

### GET /v1/getinfo
**Description**: Get node information and status
**Authentication**: Required

```typescript
// Request
const info = await lndService.info.getInfo();

// Response
interface LNDInfo {
  version: string;
  commit_hash: string;
  identity_pubkey: string;
  alias: string;
  color: string;
  num_pending_channels: number;
  num_active_channels: number;
  num_inactive_channels: number;
  num_peers: number;
  block_height: number;
  block_hash: string;
  best_header_timestamp: string;
  synced_to_chain: boolean;
  synced_to_graph: boolean;
  testnet: boolean;
  chains: Array<{
    chain: string;
    network: string;
  }>;
  uris: string[];
  features: Record<string, any>;
}

// Example response
{
  "version": "0.17.4-beta commit=v0.17.4-beta",
  "commit_hash": "abc123def456",
  "identity_pubkey": "02a1b2c3d4e5f6...",
  "alias": "Axisor-LND-Node",
  "color": "#68F0AE",
  "num_pending_channels": 0,
  "num_active_channels": 5,
  "num_inactive_channels": 1,
  "num_peers": 3,
  "block_height": 2500000,
  "block_hash": "0000000000000000000...",
  "best_header_timestamp": "1704547200",
  "synced_to_chain": true,
  "synced_to_graph": true,
  "testnet": true,
  "chains": [
    {
      "chain": "bitcoin",
      "network": "testnet"
    }
  ],
  "uris": [
    "02a1b2c3d4e5f6...@your-node.com:9735"
  ]
}
```

### GET /v1/getnetworkinfo
**Description**: Get network topology information
**Authentication**: Required

```typescript
// Request
const networkInfo = await lndService.info.getNetworkInfo();

// Response
interface LNDNetworkInfo {
  graph_diameter: number;
  avg_out_degree: number;
  max_out_degree: number;
  num_nodes: number;
  num_channels: number;
  total_network_capacity: string;
  avg_channel_size: number;
  min_channel_size: string;
  max_channel_size: string;
  median_channel_size_sat: string;
  num_zombie_chans: string;
}

// Example response
{
  "graph_diameter": 6,
  "avg_out_degree": 2.5,
  "max_out_degree": 50,
  "num_nodes": 15000,
  "num_channels": 75000,
  "total_network_capacity": "5000000000000",
  "avg_channel_size": 66666666,
  "min_channel_size": "1000",
  "max_channel_size": "16777216",
  "median_channel_size_sat": "2000000",
  "num_zombie_chans": "1000"
}
```

### GET /v1/getmetrics
**Description**: Get node performance metrics
**Authentication**: Required

```typescript
// Request
const metrics = await lndService.info.getMetrics();

// Response
interface LNDMetrics {
  num_nodes: number;
  num_channels: number;
  num_zombie_chans: string;
  num_edges: number;
  avg_channel_size: number;
  min_channel_size: string;
  max_channel_size: string;
  median_channel_size_sat: string;
  num_nodes_up: number;
  num_channels_open: number;
  num_channels_closed: number;
  total_network_capacity: string;
  avg_out_degree: number;
  max_out_degree: number;
  graph_diameter: number;
}
```

## Wallet Endpoints

### GET /v1/balance/blockchain
**Description**: Get on-chain wallet balance
**Authentication**: Required

```typescript
// Request
const onchainBalance = await lndService.wallet.getOnchainBalance();

// Response
interface LNDOnchainBalance {
  total_balance: string;
  confirmed_balance: string;
  unconfirmed_balance: string;
}

// Example response
{
  "total_balance": "1000000",
  "confirmed_balance": "950000",
  "unconfirmed_balance": "50000"
}
```

### GET /v1/balance/channels
**Description**: Get channel balance
**Authentication**: Required

```typescript
// Request
const channelBalance = await lndService.wallet.getChannelBalance();

// Response
interface LNDChannelBalance {
  balance: string;
  pending_open_balance: string;
}

// Example response
{
  "balance": "5000000",
  "pending_open_balance": "100000"
}
```

### GET /v1/balance/total
**Description**: Get total wallet balance (on-chain + channels)
**Authentication**: Required

```typescript
// Request
const totalBalance = await lndService.wallet.getTotalBalance();

// Response
interface LNDTotalBalance {
  total_balance: string;
  confirmed_balance: string;
  unconfirmed_balance: string;
  locked_balance: string;
  reserved_balance_anchor_chan: string;
  account_balance: Record<string, string>;
}

// Example response
{
  "total_balance": "6000000",
  "confirmed_balance": "950000",
  "unconfirmed_balance": "50000",
  "locked_balance": "0",
  "reserved_balance_anchor_chan": "0",
  "account_balance": {
    "default": "6000000"
  }
}
```

### GET /v1/utxos
**Description**: List unspent transaction outputs
**Authentication**: Required

```typescript
// Request
const utxos = await lndService.wallet.getUTXOs({
  min_confs: 1,
  max_confs: 1000000
});

// Response
interface LNDUTXO {
  address_type: string;
  address: string;
  amount_sat: string;
  pk_script: string;
  outpoint: {
    txid_bytes: string;
    txid_str: string;
    output_index: number;
  };
  confirmations: number;
}

// Example response
{
  "utxos": [
    {
      "address_type": "WITNESS_PUBKEY_HASH",
      "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "amount_sat": "100000",
      "pk_script": "0014...",
      "outpoint": {
        "txid_bytes": "abc123...",
        "txid_str": "abc123def456...",
        "output_index": 0
      },
      "confirmations": 6
    }
  ]
}
```

## Invoice Endpoints

### POST /v1/invoices
**Description**: Create new invoice
**Authentication**: Required

```typescript
// Request
const invoice = await lndService.invoice.createInvoice({
  value: 1000,                    // Satoshis
  memo: "Payment for services",    // Optional memo
  expiry: 3600,                   // Expiry in seconds (1 hour)
  private: true,                  // Route hints
  is_amp: false                   // AMP invoice
});

// Response
interface LNDInvoice {
  payment_request: string;
  add_index: string;
  payment_addr: string;
  r_hash: string;
}

// Example response
{
  "payment_request": "lnbc10u1p3abc123...",
  "add_index": "1",
  "payment_addr": "abc123def456...",
  "r_hash": "def456abc789..."
}
```

### GET /v1/invoices
**Description**: List invoices
**Authentication**: Required

```typescript
// Request
const invoices = await lndService.invoice.listInvoices({
  pending_only: false,
  index_offset: 0,
  num_max_invoices: 100,
  reversed: false
});

// Response
interface LNDInvoiceList {
  invoices: LNDInvoiceDetail[];
  last_index_offset: string;
  first_index_offset: string;
}

interface LNDInvoiceDetail {
  payment_request: string;
  hash: string;
  preimage: string;
  value: string;
  value_msat: string;
  creation_date: string;
  expiry: string;
  settled: boolean;
  payment_addr: string;
  description_hash: string;
  fallback_addr: string;
  cltv_expiry: string;
  route_hints: Array<any>;
  private: boolean;
  add_index: string;
  settle_index: string;
  amt_paid: string;
  amt_paid_sat: string;
  amt_paid_msat: string;
  state: string;
  htlcs: Array<any>;
  features: Record<string, any>;
  is_keysend: boolean;
  payment_addr: string;
  is_amp: boolean;
  amp_invoice_state: Record<string, any>;
}

// Example response
{
  "invoices": [
    {
      "payment_request": "lnbc10u1p3abc123...",
      "hash": "def456abc789...",
      "preimage": "ghi789def012...",
      "value": "1000",
      "value_msat": "1000000",
      "creation_date": "1704547200",
      "expiry": "3600",
      "settled": true,
      "payment_addr": "abc123...",
      "description_hash": "",
      "fallback_addr": "",
      "cltv_expiry": "144",
      "route_hints": [],
      "private": false,
      "add_index": "1",
      "settle_index": "1",
      "amt_paid": "1000",
      "amt_paid_sat": "1000",
      "amt_paid_msat": "1000000",
      "state": "SETTLED",
      "htlcs": [],
      "features": {},
      "is_keysend": false,
      "payment_addr": "abc123...",
      "is_amp": false,
      "amp_invoice_state": {}
    }
  ],
  "last_index_offset": "1",
  "first_index_offset": "0"
}
```

### GET /v1/invoices/{payment_hash}
**Description**: Get specific invoice details
**Authentication**: Required

```typescript
// Request
const invoice = await lndService.invoice.getInvoice({
  payment_hash: "def456abc789..."
});

// Response
// Returns LNDInvoiceDetail object (same as in list)
```

### POST /v1/invoices/{payment_hash}/settle
**Description**: Settle hold invoice
**Authentication**: Required

```typescript
// Request
const result = await lndService.invoice.settleInvoice({
  payment_hash: "def456abc789..."
});

// Response
{
  "preimage": "ghi789def012..."
}
```

## Channel Endpoints

### GET /v1/channels
**Description**: List active channels
**Authentication**: Required

```typescript
// Request
const channels = await lndService.channel.listChannels({
  active_only: false,
  inactive_only: false,
  public_only: false,
  private_only: false,
  peer: "",  // Filter by peer pubkey
});

// Response
interface LNDChannelList {
  channels: LNDChannel[];
}

interface LNDChannel {
  active: boolean;
  remote_pubkey: string;
  channel_point: string;
  chan_id: string;
  capacity: string;
  local_balance: string;
  remote_balance: string;
  commit_fee: string;
  commit_weight: string;
  fee_per_kw: string;
  unsettled_balance: string;
  total_satoshis_sent: string;
  total_satoshis_received: string;
  num_updates: string;
  pending_htlcs: Array<any>;
  csv_delay: number;
  private: boolean;
  initiator: boolean;
  chan_status_flags: string;
  local_chan_reserve_sat: string;
  remote_chan_reserve_sat: string;
  static_remote_key: boolean;
  commitment_type: string;
  lifetime: string;
  uptime: string;
  close_address: string;
  push_amount_sat: string;
  thaw_height: number;
  local_constraints: {
    csv_delay: number;
    chan_reserve_sat: string;
    dust_limit_sat: string;
    max_pending_amt_msat: string;
    min_htlc_msat: string;
    max_accepted_htlcs: number;
  };
  remote_constraints: {
    csv_delay: number;
    chan_reserve_sat: string;
    dust_limit_sat: string;
    max_pending_amt_msat: string;
    min_htlc_msat: string;
    max_accepted_htlcs: number;
  };
}

// Example response
{
  "channels": [
    {
      "active": true,
      "remote_pubkey": "02b1c2d3e4f5...",
      "channel_point": "abc123...:0",
      "chan_id": "123456789",
      "capacity": "10000000",
      "local_balance": "5000000",
      "remote_balance": "5000000",
      "commit_fee": "1000",
      "commit_weight": "600",
      "fee_per_kw": "250",
      "unsettled_balance": "0",
      "total_satoshis_sent": "1000000",
      "total_satoshis_received": "500000",
      "num_updates": "25",
      "pending_htlcs": [],
      "csv_delay": 144,
      "private": false,
      "initiator": true,
      "chan_status_flags": "ChanStatusDefault",
      "local_chan_reserve_sat": "100000",
      "remote_chan_reserve_sat": "100000",
      "static_remote_key": false,
      "commitment_type": "LEGACY",
      "lifetime": "86400",
      "uptime": "86400",
      "close_address": "",
      "push_amount_sat": "0",
      "thaw_height": 0,
      "local_constraints": {
        "csv_delay": 144,
        "chan_reserve_sat": "100000",
        "dust_limit_sat": "573",
        "max_pending_amt_msat": "1000000000",
        "min_htlc_msat": "1",
        "max_accepted_htlcs": 483
      },
      "remote_constraints": {
        "csv_delay": 144,
        "chan_reserve_sat": "100000",
        "dust_limit_sat": "573",
        "max_pending_amt_msat": "1000000000",
        "min_htlc_msat": "1",
        "max_accepted_htlcs": 483
      }
    }
  ]
}
```

### POST /v1/channels
**Description**: Open new channel
**Authentication**: Required

```typescript
// Request
const channel = await lndService.channel.openChannel({
  node_pubkey_string: "02b1c2d3e4f5...",
  node_pubkey: "02b1c2d3e4f5...",
  local_funding_amount: "1000000",
  push_sat: "0",
  target_conf: 6,
  sat_per_vbyte: 10,
  private: false,
  min_htlc_msat: "1000",
  remote_csv_delay: 144,
  min_confs: 1,
  spend_unconfirmed: false,
  close_address: "",
  funding_shim: null,
  remote_max_value_in_flight_msat: "1000000000",
  remote_max_htlcs: 483,
  max_local_csv: 1008,
  commitment_type: "LEGACY"
});

// Response
interface LNDChannelOpenResponse {
  funding_txid_bytes: string;
  funding_txid_str: string;
  output_index: number;
}

// Example response
{
  "funding_txid_bytes": "abc123def456...",
  "funding_txid_str": "abc123def456...",
  "output_index": 0
}
```

### DELETE /v1/channels/{funding_txid}/{output_index}
**Description**: Close channel
**Authentication**: Required

```typescript
// Request
const result = await lndService.channel.closeChannel({
  channel_point: {
    funding_txid_str: "abc123def456...",
    output_index: 0
  },
  force: false,
  target_conf: 6,
  sat_per_vbyte: 10,
  delivery_address: "",
  sat_per_byte: 0
});

// Response
{
  "closing_txid": "def456abc789..."
}
```

### GET /v1/channels/pending
**Description**: List pending channels
**Authentication**: Required

```typescript
// Request
const pendingChannels = await lndService.channel.getPendingChannels();

// Response
interface LNDPendingChannels {
  total_limbo_balance: string;
  pending_open_channels: Array<{
    channel: LNDChannel;
    confirmation_height: number;
    commit_fee: string;
    commit_weight: string;
    fee_per_kw: string;
  }>;
  pending_closing_channels: Array<{
    channel: LNDChannel;
    closing_txid: string;
  }>;
  pending_force_closing_channels: Array<{
    channel: LNDChannel;
    closing_txid: string;
    limbo_balance: string;
    maturity_height: number;
    blocks_til_maturity: number;
    recovered_balance: string;
    pending_htlcs: Array<any>;
  }>;
  waiting_close_channels: Array<{
    channel: LNDChannel;
    limbo_balance: string;
    commitments: {
      local_txid: string;
      remote_txid: string;
      remote_pending_txid: string;
      local_commit_fee_sat: string;
      remote_commit_fee_sat: string;
      remote_pending_commit_fee_sat: string;
    };
  }>;
}
```

## Peer Endpoints

### GET /v1/peers
**Description**: List connected peers
**Authentication**: Required

```typescript
// Request
const peers = await lndService.peer.listPeers();

// Response
interface LNDPeerList {
  peers: LNDPeer[];
}

interface LNDPeer {
  pub_key: string;
  address: string;
  bytes_sent: string;
  bytes_recv: string;
  sat_sent: string;
  sat_recv: string;
  inbound: boolean;
  ping_time: string;
  sync_type: string;
  features: Record<string, any>;
  errors: Array<{
    timestamp: string;
    error: string;
  }>;
}

// Example response
{
  "peers": [
    {
      "pub_key": "02b1c2d3e4f5...",
      "address": "192.168.1.100:9735",
      "bytes_sent": "1000000",
      "bytes_recv": "950000",
      "sat_sent": "500000",
      "sat_recv": "250000",
      "inbound": false,
      "ping_time": "50",
      "sync_type": "ACTIVE_SYNC",
      "features": {},
      "errors": []
    }
  ]
}
```

### POST /v1/peers
**Description**: Connect to peer
**Authentication**: Required

```typescript
// Request
const peer = await lndService.peer.connectPeer({
  addr: {
    pubkey: "02b1c2d3e4f5...",
    host: "192.168.1.100:9735"
  },
  perm: false,
  timeout: 30
});

// Response
// Empty response on success
```

### DELETE /v1/peers/{pub_key}
**Description**: Disconnect from peer
**Authentication**: Required

```typescript
// Request
const result = await lndService.peer.disconnectPeer({
  pub_key: "02b1c2d3e4f5..."
});

// Response
// Empty response on success
```

## Onchain Endpoints

### GET /v1/transactions
**Description**: List on-chain transactions
**Authentication**: Required

```typescript
// Request
const transactions = await lndService.onchain.getTransactions({
  start_height: 0,
  end_height: -1,
  account: ""
});

// Response
interface LNDTransactionList {
  transactions: LNDTransaction[];
}

interface LNDTransaction {
  tx_hash: string;
  amount: string;
  num_confirmations: number;
  block_hash: string;
  block_height: number;
  time_stamp: string;
  total_fees: string;
  dest_addresses: string[];
  raw_tx_hex: string;
  label: string;
}

// Example response
{
  "transactions": [
    {
      "tx_hash": "abc123def456...",
      "amount": "100000",
      "num_confirmations": 6,
      "block_hash": "def456abc789...",
      "block_height": 2500000,
      "time_stamp": "1704547200",
      "total_fees": "1000",
      "dest_addresses": ["bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"],
      "raw_tx_hex": "0200000001...",
      "label": ""
    }
  ]
}
```

### POST /v1/transactions
**Description**: Send on-chain transaction
**Authentication**: Required

```typescript
// Request
const transaction = await lndService.onchain.sendCoins({
  addr: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  amount: "100000",
  target_conf: 6,
  sat_per_vbyte: 10,
  send_all: false,
  label: "Payment to user",
  min_confs: 1,
  spend_unconfirmed: false
});

// Response
{
  "txid": "abc123def456...",
  "send_coins_response": {
    "txid": "abc123def456..."
  }
}
```

### GET /v1/addresses
**Description**: List wallet addresses
**Authentication**: Required

```typescript
// Request
const addresses = await lndService.onchain.getAddresses();

// Response
interface LNDAddressList {
  addresses: LNDAddress[];
}

interface LNDAddress {
  address: string;
  type: string;
  balance: string;
  label: string;
}

// Example response
{
  "addresses": [
    {
      "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "type": "WITNESS_PUBKEY_HASH",
      "balance": "100000",
      "label": "Default address"
    }
  ]
}
```

### POST /v1/addresses
**Description**: Generate new address
**Authentication**: Required

```typescript
// Request
const address = await lndService.onchain.newAddress({
  type: "WITNESS_PUBKEY_HASH",
  account: "",
  address: ""
});

// Response
{
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
}
```

## Error Handling

### Common Error Responses

```typescript
// 400 Bad Request
{
  "error": "invalid payment hash",
  "code": 2,
  "message": "invalid payment hash",
  "details": []
}

// 401 Unauthorized
{
  "error": "authentication failed",
  "code": 16,
  "message": "authentication failed",
  "details": []
}

// 403 Forbidden
{
  "error": "permission denied",
  "code": 7,
  "message": "permission denied",
  "details": []
}

// 404 Not Found
{
  "error": "invoice not found",
  "code": 5,
  "message": "invoice not found",
  "details": []
}

// 500 Internal Server Error
{
  "error": "internal server error",
  "code": 13,
  "message": "internal server error",
  "details": []
}
```

### Error Code Reference

| Code | Name | Description |
|------|------|-------------|
| 0 | OK | Success |
| 1 | CANCELLED | Operation cancelled |
| 2 | UNKNOWN | Unknown error |
| 3 | INVALID_ARGUMENT | Invalid argument |
| 4 | DEADLINE_EXCEEDED | Deadline exceeded |
| 5 | NOT_FOUND | Resource not found |
| 6 | ALREADY_EXISTS | Resource already exists |
| 7 | PERMISSION_DENIED | Permission denied |
| 8 | RESOURCE_EXHAUSTED | Resource exhausted |
| 9 | FAILED_PRECONDITION | Failed precondition |
| 10 | ABORTED | Operation aborted |
| 11 | OUT_OF_RANGE | Out of range |
| 12 | UNIMPLEMENTED | Not implemented |
| 13 | INTERNAL | Internal error |
| 14 | UNAVAILABLE | Service unavailable |
| 15 | DATA_LOSS | Data loss |
| 16 | UNAUTHENTICATED | Authentication required |

## Usage Examples

### Complete Invoice Flow

```typescript
async function invoiceFlow() {
  try {
    // 1. Create invoice
    const invoice = await lndService.invoice.createInvoice({
      value: 1000,
      memo: "Payment for Axisor subscription",
      expiry: 3600
    });
    
    console.log('Invoice created:', invoice.payment_request);
    
    // 2. Monitor invoice status
    const checkInvoice = async () => {
      const invoiceDetails = await lndService.invoice.getInvoice({
        payment_hash: invoice.r_hash
      });
      
      if (invoiceDetails.settled) {
        console.log('Invoice settled!');
        return true;
      }
      
      return false;
    };
    
    // 3. Poll for settlement
    const interval = setInterval(async () => {
      const settled = await checkInvoice();
      if (settled) {
        clearInterval(interval);
      }
    }, 5000);
    
  } catch (error) {
    console.error('Invoice flow error:', error);
  }
}
```

### Channel Management

```typescript
async function channelManagement() {
  try {
    // 1. List current channels
    const channels = await lndService.channel.listChannels();
    console.log('Active channels:', channels.channels.length);
    
    // 2. Open new channel
    const newChannel = await lndService.channel.openChannel({
      node_pubkey_string: "02b1c2d3e4f5...",
      local_funding_amount: "1000000",
      target_conf: 6,
      private: false
    });
    
    console.log('Channel opening:', newChannel.funding_txid_str);
    
    // 3. Monitor pending channels
    const pendingChannels = await lndService.channel.getPendingChannels();
    console.log('Pending channels:', pendingChannels.pending_open_channels.length);
    
  } catch (error) {
    console.error('Channel management error:', error);
  }
}
```

### Wallet Operations

```typescript
async function walletOperations() {
  try {
    // 1. Get wallet balances
    const [totalBalance, onchainBalance, channelBalance] = await Promise.all([
      lndService.wallet.getTotalBalance(),
      lndService.wallet.getOnchainBalance(),
      lndService.wallet.getChannelBalance()
    ]);
    
    console.log('Total balance:', totalBalance.total_balance);
    console.log('On-chain balance:', onchainBalance.total_balance);
    console.log('Channel balance:', channelBalance.balance);
    
    // 2. Generate new address
    const newAddress = await lndService.onchain.newAddress({
      type: "WITNESS_PUBKEY_HASH"
    });
    
    console.log('New address:', newAddress.address);
    
    // 3. Send coins
    const tx = await lndService.onchain.sendCoins({
      addr: newAddress.address,
      amount: "100000",
      target_conf: 6
    });
    
    console.log('Transaction sent:', tx.txid);
    
  } catch (error) {
    console.error('Wallet operations error:', error);
  }
}
```

## Rate Limiting

### LND Rate Limits

- **REST API**: No built-in rate limiting
- **gRPC API**: No built-in rate limiting
- **Recommendation**: Implement client-side rate limiting

### Client-Side Rate Limiting

```typescript
class LNDRateLimiter {
  private requests: number[] = [];
  private maxRequests = 10;
  private windowMs = 1000; // 1 second
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now();
    
    // Remove old requests
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    // Check if we can make a request
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Record this request
    this.requests.push(now);
    
    // Execute the operation
    return operation();
  }
}
```

## Best Practices

### 1. Error Handling

- Always check for errors in responses
- Implement retry logic for transient errors
- Log errors with context for debugging
- Handle rate limiting gracefully

### 2. Security

- Use TLS certificates for all connections
- Rotate macaroons regularly
- Monitor for unauthorized access
- Implement proper authentication

### 3. Performance

- Use connection pooling
- Implement request caching where appropriate
- Monitor API response times
- Use async/await for better error handling

## How to Use This Document

- **For API Integration**: Reference endpoint details and request/response schemas
- **For Error Handling**: Use error codes and response patterns
- **For Examples**: Follow usage examples for common operations
- **For Troubleshooting**: Reference error handling and best practices sections

