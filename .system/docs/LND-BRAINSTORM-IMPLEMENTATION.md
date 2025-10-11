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

### 4. Status da Sincronização LND (COMPLETO ✅)

**Status Atual**: LND 100% SINCRONIZADO com Bitcoin testnet
- **Bloco Atual**: 4,736,661 (100% completo)
- **Status**: "Fully caught up with cfheaders at height 4736661, waiting at tip for new blocks"
- **Última Atualização**: 2025-10-11T15:16:00.984Z
- **Problema Identificado**: Monitor usando dados antigos do getinfo (cache)
- **Solução**: LND está funcionando perfeitamente, apenas o monitor precisa ser corrigido

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

## ✅ Wallet LND Criada com Sucesso

**Data**: 2025-10-11 15:57  
**Status**: Wallet criada e funcionando  
**Senha**: `axisor-testnet-2025-secure`  
**Mnemonic**: Gerado pelo LND (ver LND-WALLET-INFO.md)

### Processo de Criação
1. LND sincronizado 100%
2. Usado endpoint REST API: `/v1/initwallet`
3. Mnemonic gerado automaticamente pelo LND
4. Wallet desbloqueada e funcionando

### Comandos Funcionais
```bash
# Status da wallet
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon getinfo

# Criar invoice
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon addinvoice --amt=1000000

# Verificar saldo
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance
```

## ✅ Invoice Lightning Criado

**Data**: 2025-10-11 16:00  
**Valor**: 1,000,000 sats  
**Hash**: `12c96b91481cd59e52b2f17647a6b11d9059d30e34e1c22489e880a1cda82a7e`  
**Invoice**: `lntb10m1p5w5lkrpp5ztykhy2grn2eu54j79my0f43rkg9n5cwxnsuyfyfazq2rndg9flqdp523jhxarwv46zqenpw43k2apqve6kuerfdenjqtfqx9xjqumpw3escqzzsxqyz5vqsp5g7fefkzh0jucxage2d0f3fvug2sqmw40kcv5s5ul6xvjupjkn9zq9qyyssqznmezdhv99l7mh0nrasehwznsg3wd3q3tkxxgux9telq0g3yjmn9w79xfp5z0pl2k2tnzhkz84ve5ch7vpm4uj63el8cz4p4h4s36kgpxj7ha2`

### Próximos Passos
1. ~~Usar faucet: https://faucet.lightning.community/~~ (INACESSÍVEL ❌)
2. **ALTERNATIVAS ENCONTRADAS**:
   - **Bitcoin On-Chain Faucets** (Recomendado):
     - https://testnet-faucet.mempool.co/
     - https://testnet.help/en/bitcoincoinfaucet/testnet/ ✅ **FUNCIONOU!**
     - https://coinfaucet.eu/en/btc-testnet/
     - https://bitcoinfaucet.uo1.net/ ✅ **TESTADO (aguardando confirmação)**
   - **Endereço Bitcoin Testnet**: `tb1q3mu9j99d06edl8t7pxxgmwurrsgnwnqwemfhjj`
3. ✅ Monitorar pagamento via script
4. ✅ Verificar saldo após recebimento
5. Integrar com aplicação

## ✅ Bitcoin Testnet Recebido com Sucesso

**Data**: 2025-10-11 16:25  
**Status**: ✅ **SALDO RECEBIDO!**  
**Valor Total**: **20,000 sats** (0.0002 BTC testnet)  
**Saldo atual**: 20,000 sats confirmados

### Transação 1 - testnet.help
- **TxID**: `d044c9963d2e97c27e47a7ee842dc5d1fae4135a2525155a75e5852d24ae0185`
- **Bloco**: 4736666
- **Valor**: 10,000 sats
- **Faucet**: https://testnet.help/en/bitcoincoinfaucet/testnet/
- **Status**: ✅ Confirmada (2 confirmações)

### Transação 2 - bitcoinfaucet.uo1.net
- **TxID**: `cf5d07ca16eb9ef9591669e7f431d93d7a72bba77c549ff72bdbfb5adf1c683e`
- **Bloco**: 4736667
- **Valor**: 10,000 sats
- **Faucet**: https://bitcoinfaucet.uo1.net/
- **Status**: ✅ Confirmada (1 confirmação)

### Detalhes Gerais
- **Endereço**: `tb1q3mu9j99d06edl8t7pxxgmwurrsgnwnqwemfhjj`
- **Tempo de confirmação**: ~5 minutos cada
- **Status**: Ambas confirmadas e visíveis no LND

### Faucets Testados
1. ✅ **testnet.help** - FUNCIONOU (10,000 sats recebidos)
2. ✅ **bitcoinfaucet.uo1.net** - FUNCIONOU (10,000 sats recebidos)
3. ❌ **faucet.lightning.community** - INACESSÍVEL

### Scripts Criados
- `./scripts/get-testnet-bitcoin.sh` - Guia de faucets
- `./scripts/check-onchain-balance.sh` - Verificação de saldo
- `./scripts/monitor-transaction.sh` - Monitor de transações
- `./scripts/test-faucets-alternatives.sh` - Lista de alternativas

## 📋 Status Atualizado

1. ✅ Resolver conectividade Neutrino
2. ✅ Criar e desbloquear wallet
3. ✅ Aguardar sincronização completa
4. ✅ Criar invoice de 1M sats
5. ✅ **Receber Bitcoin testnet via faucet público**
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
