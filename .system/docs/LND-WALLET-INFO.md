# LND Wallet Information

## 🔐 Informações da Carteira LND Testnet

### Credenciais da Wallet

**Container**: `axisor-lnd-testnet`  
**Network**: Bitcoin Testnet  
**Senha da Wallet**: `axisor-testnet-password-2025`

### Mnemonic da Carteira

⚠️ **IMPORTANTE**: Esta é a seed phrase da carteira LND testnet. **MANTENHA EM SEGURANÇA**!

```
---------------BEGIN LND CIPHER SEED---------------
 1. absent   2. direct     3. drum       4. session
 5. border   6. tuition    7. smooth     8. battle 
 9. know    10. bean      11. shaft     12. lazy   
13. grain   14. clump     15. agree     16. tornado
17. vault   18. motor     19. arrange   20. way    
21. blood   22. indicate  23. exercise  24. milk   
---------------END LND CIPHER SEED-----------------
```

### Configurações de Acesso

#### Certificados e Macaroons
- **TLS Certificate**: `/lnd/tls.cert`
- **Admin Macaroon**: `/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon`
- **Container**: `axisor-lnd-testnet`

#### Portas de Acesso
- **REST API**: `localhost:18080`
- **gRPC**: `localhost:20009`
- **P2P Lightning**: `localhost:19735`

### Comandos de Acesso

#### Verificar Status da Wallet
```bash
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon getinfo
```

#### Desbloquear Wallet (se necessário)
```bash
echo "axisor-testnet-password-2025" | docker exec -i axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert unlock
```

#### Criar Invoice Lightning
```bash
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon addinvoice --amt=1000000 --memo="Test Invoice"
```

#### Verificar Balance da Wallet
```bash
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance
```

#### Listar Invoices
```bash
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon listinvoices
```

### Informações Técnicas

#### Configuração da Wallet
- **Bitcoin Network**: Testnet
- **Node Mode**: Neutrino (Light Client)
- **Database**: BoltDB
- **Wallet Type**: HD Wallet (BIP32/BIP44)
- **Seed Generation**: BIP39 (24 words)

#### Status Atual
- **Wallet Status**: ✅ Criada e Funcionando
- **Sync Status**: ⚠️ Sincronizando com Bitcoin Testnet
- **Channels**: 0 (aguardando sincronização)
- **Peers**: 0 (aguardando sincronização)
- **Balance**: 0 sats (aguardando funding)

### Segurança

#### ⚠️ Avisos Importantes
1. **Esta é uma carteira TESTNET** - não use em mainnet
2. **A senha está hardcoded** - apenas para desenvolvimento
3. **O mnemonic está documentado** - apenas para testes
4. **Nunca use estas credenciais em produção**

#### Para Produção
- Gere nova senha aleatória
- Gere novo mnemonic offline
- Armazene credenciais em vault seguro
- Use hardware wallet se possível

### Backup e Recovery

#### Backup da Wallet
```bash
# Backup do diretório completo
docker cp axisor-lnd-testnet:/lnd ./lnd-backup

# Backup específico dos macaroons
docker cp axisor-lnd-testnet:/root/.lnd/data/chain/bitcoin/testnet/ ./lnd-macaroons-backup
```

#### Recovery da Wallet
```bash
# Restaurar dados da wallet
docker cp ./lnd-backup axisor-lnd-testnet:/lnd

# Restaurar macaroons
docker cp ./lnd-macaroons-backup axisor-lnd-testnet:/root/.lnd/data/chain/bitcoin/testnet/
```

### Integração com Sistema

#### API REST Endpoints
- **Base URL**: `http://localhost:13010/api/lnd`
- **Authentication**: Bearer token (mesmo sistema de auth do Axisor)
- **Endpoints Disponíveis**: info, wallet, invoices, payments, channels, peers, onchain

#### Frontend Integration
- **Testnet Faucet**: `/testnet-faucet`
- **Hook**: `useTestnetFaucet`
- **Component**: `TestnetFaucet`

### Troubleshooting

#### Problemas Comuns

1. **Wallet não desbloqueia**
   - Verificar senha: `axisor-testnet-password-2025`
   - Verificar se container está rodando
   - Verificar certificados TLS

2. **Não consegue conectar à rede**
   - Aguardar sincronização Neutrino
   - Verificar DNS do container
   - Verificar conectividade de rede

3. **Certificados não encontrados**
   - Verificar se LND inicializou completamente
   - Aguardar geração de certificados
   - Verificar permissões de arquivo

#### Logs Úteis
```bash
# Ver logs do LND
docker logs axisor-lnd-testnet --tail=50

# Ver logs em tempo real
docker logs -f axisor-lnd-testnet

# Ver logs específicos de erro
docker logs axisor-lnd-testnet 2>&1 | grep -i error
```

### Próximos Passos

1. **Aguardar Sincronização**: LND sincronizar com Bitcoin testnet
2. **Funding**: Receber sats via faucet Lightning
3. **Channels**: Abrir canais para liquidity
4. **Testing**: Testar pagamentos Lightning
5. **Integration**: Integrar com LN Markets testnet

---

**Última Atualização**: 2025-01-10  
**Versão**: v2.6.0  
**Status**: Wallet criada e funcionando ✅
