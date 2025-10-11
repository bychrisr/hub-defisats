# LND Implementation Brainstorm - Critical Information

**Data**: 2025-10-11  
**Fase**: Implementação LND Testnet  
**Status**: Em progresso - Problemas de conectividade resolvidos

## 🔧 Problemas Críticos Identificados e Soluções

### 1. Problema de Conectividade Neutrino (RESOLVIDO ✅)

**Problema**: LND testnet não conseguia conectar aos nós Neutrino
- Erro: `unable to lookup IP for testnet1-btcd.zaphq.io: lookup testnet1-btcd.zaphq.io on 127.0.0.11:53: no such host`
- Comando travava no terminal (timeout infinito)

**Solução Encontrada**:
```bash
# Configuração INCORRETA (não funciona):
[Neutrino]
neutrino.connect=testnet1-btcd.zaphq.io
neutrino.connect=testnet2-btcd.zaphq.io

# Configuração CORRETA (funciona):
[Neutrino]
neutrino.addpeer=faucet.lightning.community
neutrino.addpeer=btcd-testnet.lightning.computer
```

**Docker Compose**:
```yaml
environment:
  - LND_NEUTRINO_ADDPEER=faucet.lightning.community
  - LND_NEUTRINO_ADDPEER=btcd-testnet.lightning.computer
```

### 2. Problema de Configuração Bitcoin (RESOLVIDO ✅)

**Problema**: `ValidateConfig: either bitcoin.active or litecoin.active must be set to 1 (true)`

**Solução**:
```ini
[Bitcoin]
bitcoin.active=1
bitcoin.testnet=1
bitcoin.node=neutrino
```

### 3. Problema de Wallet Bloqueada (RESOLVIDO ✅)

**Problema**: Wallet criada mas bloqueada após restart
**Solução**: Usar REST API para desbloquear
```bash
curl -k -X POST "https://localhost:18080/v1/unlockwallet" \
  -H "Content-Type: application/json" \
  -d '{"wallet_password": "axisor-testnet-password-2025"}'
```

### 4. API de Monitoramento LND Sync (IMPLEMENTADO ✅)

**Problema**: Precisávamos de uma forma de acompanhar o progresso da sincronização em tempo real
**Solução**: Criada API e página de monitoramento

**API Endpoints**:
```bash
# API funcional (simplificada)
GET /api/lnd-sync-simple/sync-progress

# Resposta:
{
  "success": true,
  "data": {
    "currentBlock": 3808000,
    "currentTestnetBlock": 4736659,
    "percentage": 80.39421879430206,
    "syncedToChain": false,
    "syncedToGraph": false,
    "numPeers": 0,
    "version": "0.17.0-beta",
    "alias": "Axisor-Testnet-Node",
    "color": "#ff6b35",
    "timestamp": "2025-10-11T14:47:45.639Z"
  }
}
```

**Frontend**: Página `/lnd-sync-monitor` com:
- ✅ Progress bar em tempo real
- ✅ Auto refresh a cada 5 segundos
- ✅ Informações detalhadas do nó
- ✅ Explicação simples para usuários
- ✅ Controles de refresh manual

### 5. Sistema de Criação de Posições (IMPLEMENTADO ✅)

**Problema**: Precisávamos de uma forma rápida de criar posições para teste
**Solução**: Sistema completo de criação com modal e auto-fill

**Componentes Criados**:
- `PositionCreationModal`: Modal completo para criar posições individuais
- `PositionTestManager`: Gerador de múltiplas posições com templates
- `usePositionCreation`: Hook para gerenciar criação de posições

**Funcionalidades**:
- ✅ Modal de criação individual com validação
- ✅ Templates automáticos (Conservative, Aggressive, Scalping, Swing)
- ✅ Análise Risk/Reward em tempo real
- ✅ Gerador de conjuntos predefinidos (5, 6, 8 posições)
- ✅ Geração rápida de 5 posições de teste
- ✅ Integração com página de posições existente

**Localização**: Página `/positions` - botões "Nova Posição" e "Gerar Posições de Teste"

**Melhorias Implementadas (V2)**:
- ✅ **Tema Dark Completo**: Todos os campos agora visíveis no tema escuro
- ✅ **Integração Preço Real BTC**: Templates usam preço atual da LN Markets
- ✅ **Hook useBitcoinPrice**: Busca preço em tempo real a cada 30s
- ✅ **Botão "Usar Preço Atual"**: Campo de entrada com preenchimento automático
- ✅ **Templates Dinâmicos**: Stop Loss e Take Profit calculados baseados no preço real
- ✅ **Indicador de Preço**: Card mostrando preço atual do BTC no modal
- ✅ **Fallback Inteligente**: Sistema de fallback para preços quando API falha

**Arquivos Criados/Atualizados**:
- `useBitcoinPrice.ts`: Hook para buscar preço real do BTC
- `PositionCreationModal.tsx`: Modal com tema dark e preços reais
- `PositionTestManager.tsx`: Gerador com preços dinâmicos
- `positions/index.tsx`: Integração dos novos componentes

**Correções Críticas (V3)**:
- ✅ **Erro API Corrigido**: `lnMarketsData.data.find is not a function` - API retorna objeto, não array
- ✅ **Estrutura de Dados**: Preço BTC em `data.index`, variação em `data.index24hChange`
- ✅ **Dialog Warnings**: Adicionado `DialogDescription` para eliminar warnings
- ✅ **Variação Real**: Usando `changePercent24h` real da API em vez de valor mock
- ✅ **Fallback Simplificado**: Removido código redundante, mantido apenas fallback essencial

**Estrutura da API LN Markets**:
```json
{
  "success": true,
  "data": {
    "index": 112214,           // Preço atual do BTC
    "index24hChange": -6.739,  // Variação 24h em %
    "tradingFees": 0.1,
    "nextFunding": "53m 45s",
    "rate": 0.00006,
    "timestamp": "2025-10-11T15:07:15.943Z",
    "source": "lnmarkets"
  }
}
```

### 5. Problema de Comandos lncli Travados (IDENTIFICADO ⚠️)

**Problema**: Comandos `lncli` travam no terminal
- `lncli addinvoice` trava indefinidamente
- `lncli create` trava com input interativo

**Solução Alternativa**: Usar REST API diretamente
```bash
# Em vez de lncli (travado):
docker exec axisor-lnd-testnet lncli addinvoice --amt=1000000

# Usar REST API (funciona):
curl -k -X POST "https://localhost:18080/v1/invoices" \
  -H "Grpc-Metadata-macaroon: $(docker exec axisor-lnd-testnet xxd -p -c 1000 /root/.lnd/data/chain/bitcoin/testnet/admin.macaroon | tr -d '\n')" \
  -H "Content-Type: application/json" \
  -d '{"value": 1000000, "memo": "Test invoice"}'
```

## 🔐 Credenciais e Informações Sensíveis

### Wallet LND Testnet
- **Senha**: `axisor-testnet-password-2025`
- **Mnemonic**: (documentado em `.system/docs/LND-WALLET-INFO.md`)
- **Container**: `axisor-lnd-testnet`
- **Network**: Bitcoin Testnet

### Endpoints Funcionais
- **REST API**: `https://localhost:18080`
- **gRPC**: `localhost:20009`
- **P2P**: `localhost:19735`

### Macaroon Path
- **Admin Macaroon**: `/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon`

## 🚀 Processo de Inicialização Bem-Sucedido

### 1. Criar Wallet
```bash
curl -k -X POST "https://localhost:18080/v1/initwallet" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_password": "axisor-testnet-password-2025",
    "cipher_seed_mnemonic": [
      "absent", "direct", "drum", "session", "border", "tuition", "smooth", "battle",
      "know", "bean", "shaft", "lazy", "grain", "clump", "agree", "tornado",
      "vault", "motor", "arrange", "way", "blood", "indicate", "exercise", "milk"
    ],
    "aezeed_passphrase": ""
  }'
```

### 2. Desbloquear Wallet
```bash
curl -k -X POST "https://localhost:18080/v1/unlockwallet" \
  -H "Content-Type: application/json" \
  -d '{"wallet_password": "axisor-testnet-password-2025"}'
```

### 3. Verificar Status
```bash
curl -k -s "https://localhost:18080/v1/getinfo" \
  -H "Grpc-Metadata-macaroon: $(docker exec axisor-lnd-testnet xxd -p -c 1000 /root/.lnd/data/chain/bitcoin/testnet/admin.macaroon | tr -d '\n')"
```

## 🔍 Comandos de Debug Úteis

### Verificar Logs
```bash
docker logs axisor-lnd-testnet --tail=20
```

### Verificar Sincronização
```bash
curl -k -s "https://localhost:18080/v1/getinfo" \
  -H "Grpc-Metadata-macaroon: $(docker exec axisor-lnd-testnet xxd -p -c 1000 /root/.lnd/data/chain/bitcoin/testnet/admin.macaroon | tr -d '\n')" | jq '.synced_to_chain'
```

### Verificar Arquivos
```bash
docker exec axisor-lnd-testnet ls -la /root/.lnd/data/chain/bitcoin/testnet/
```

## ⚠️ Problemas Pendentes

### 1. Backend LNDService Integration
- **Problema**: Backend não consegue conectar ao LND
- **Erro**: `❌ No LND client available for network: testnet`
- **Status**: Investigando - certificados/macaroons podem estar com problema de acesso

### 2. Sincronização Bitcoin Testnet
- **Status**: Em progresso (bloco 3,808,000 - 80.4% completo)
- **Bloqueio**: Não consegue criar invoices até `synced_to_chain: true`
- **Progresso**: Sincronizando ativamente
- **Estimativa**: Cerca de 20% restante (928,659 blocos)
- **API Monitor**: Criada página `/lnd-sync-monitor` para acompanhamento em tempo real

## 📋 Próximos Passos

1. ✅ Resolver conectividade Neutrino
2. ✅ Criar e desbloquear wallet
3. ⏳ Aguardar sincronização completa
4. 🔄 Criar invoice de 1M sats
5. 🔄 Usar faucet público para pagar
6. 🔄 Implementar funding interno
7. 🔄 Criar 20 posições de teste
8. 🔄 Documentação completa (30+ arquivos)

## 🔗 Links e Referências Úteis

- **Documentação Oficial LND**: https://dev.lightning.community/guides/installation/
- **Nós Neutrino Confiáveis**: 
  - `faucet.lightning.community`
  - `btcd-testnet.lightning.computer`
- **Faucets Lightning Testnet**:
  - https://testnet.help/en/bitcoincoinfaucet/testnet/
  - https://faucet.lightning.community/
  - https://testnet-faucet.mempool.co/

---

**Nota**: Este arquivo será atualizado continuamente durante a implementação para capturar todas as informações críticas descobertas.
