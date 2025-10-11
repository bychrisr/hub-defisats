#!/usr/bin/env ts-node

/**
 * Script para inicializar wallet LND testnet
 * 
 * Este script cria uma nova wallet LND para o ambiente testnet
 * e define uma senha padrão para desenvolvimento.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const LND_CONTAINER = 'axisor-lnd-testnet';
const WALLET_PASSWORD = 'axisor-testnet-2025-secure';
const MNEMONIC_FILE = '/tmp/lnd-mnemonic.txt';

async function initLNDWallet() {
  console.log('🚀 LND Wallet Initialization Script');
  console.log('=====================================');
  
  try {
    // 1. Verificar se o container LND está rodando
    console.log('📋 Checking LND container status...');
    const containerStatus = execSync(`docker ps --filter "name=${LND_CONTAINER}" --format "table {{.Names}}\\t{{.Status}}"`, 
      { encoding: 'utf-8' });
    
    if (!containerStatus.includes(LND_CONTAINER)) {
      throw new Error(`LND container ${LND_CONTAINER} is not running`);
    }
    
    console.log('✅ LND container is running');
    
    // 2. Verificar se já existe uma wallet
    console.log('📋 Checking if wallet already exists...');
    try {
      const walletCheck = execSync(`docker exec ${LND_CONTAINER} lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon getinfo`, 
        { encoding: 'utf-8', stdio: 'pipe' });
      
      console.log('⚠️  Wallet already exists and is unlocked');
      console.log('ℹ️  Wallet info:', JSON.parse(walletCheck));
      return;
    } catch (error) {
      console.log('✅ No existing wallet found, proceeding with creation...');
    }
    
    // 3. Criar nova wallet
    console.log('🔐 Creating new LND wallet...');
    
    // Criar arquivo temporário com a senha
    fs.writeFileSync(MNEMONIC_FILE, WALLET_PASSWORD);
    
    try {
      const createWalletCmd = `docker exec -i ${LND_CONTAINER} lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert create`;
      const createWalletResult = execSync(createWalletCmd, {
        input: `${WALLET_PASSWORD}\n${WALLET_PASSWORD}\n`,
        encoding: 'utf-8'
      });
      
      console.log('✅ Wallet created successfully!');
      console.log('📝 Creation result:', createWalletResult);
      
      // 4. Salvar informações da wallet em arquivo seguro
      const walletInfo = {
        password: WALLET_PASSWORD,
        created_at: new Date().toISOString(),
        network: 'testnet',
        container: LND_CONTAINER
      };
      
      const walletInfoFile = path.join(__dirname, '../../config/lnd/wallet-info.json');
      fs.writeFileSync(walletInfoFile, JSON.stringify(walletInfo, null, 2));
      
      console.log('💾 Wallet info saved to:', walletInfoFile);
      
      // 5. Verificar status da wallet
      console.log('📋 Verifying wallet status...');
      const walletStatus = execSync(`docker exec ${LND_CONTAINER} lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon getinfo`, 
        { encoding: 'utf-8' });
      
      console.log('✅ Wallet is ready!');
      console.log('📊 Wallet status:', JSON.parse(walletStatus));
      
    } catch (error: any) {
      if (error.message.includes('wallet already exists')) {
        console.log('⚠️  Wallet already exists, attempting to unlock...');
        
        // Tentar desbloquear a wallet
        const unlockResult = execSync(`docker exec -i ${LND_CONTAINER} lncli --network=testnet --tlscertpath=/lnd/tls.cert unlock`, {
          input: `${WALLET_PASSWORD}\n`,
          encoding: 'utf-8'
        });
        
        console.log('✅ Wallet unlocked successfully!');
        console.log('📝 Unlock result:', unlockResult);
        
      } else {
        throw error;
      }
    }
    
    // 6. Limpar arquivo temporário
    if (fs.existsSync(MNEMONIC_FILE)) {
      fs.unlinkSync(MNEMONIC_FILE);
    }
    
    console.log('🎉 LND wallet initialization completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Wait for LND to sync with Bitcoin testnet');
    console.log('2. Use the testnet faucet to receive sats');
    console.log('3. Create invoices and test Lightning payments');
    
  } catch (error: any) {
    console.error('❌ Error initializing LND wallet:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initLNDWallet().catch(console.error);
}

export { initLNDWallet };