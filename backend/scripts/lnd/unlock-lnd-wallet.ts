#!/usr/bin/env ts-node

/**
 * LND Wallet Unlock Script
 * 
 * This script unlocks an existing LND wallet using the stored password.
 * It's useful for unlocking the wallet after LND restarts.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface LNDConfig {
  network: 'testnet' | 'mainnet';
  dataDir: string;
  rpcHost: string;
  rpcPort: number;
  restHost: string;
  restPort: number;
  macaroonPath: string;
  tlsCertPath: string;
}

class LNDWalletUnlocker {
  private config: LNDConfig;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.config = this.getConfig(network);
  }

  private getConfig(network: 'testnet' | 'mainnet'): LNDConfig {
    if (network === 'testnet') {
      return {
        network: 'testnet',
        dataDir: '/lnd/data/chain/bitcoin/testnet',
        rpcHost: 'lnd-testnet',
        rpcPort: 10009,
        restHost: 'lnd-testnet',
        restPort: 8080,
        macaroonPath: '/lnd/data/chain/bitcoin/testnet/admin.macaroon',
        tlsCertPath: '/lnd/tls.cert'
      };
    } else {
      return {
        network: 'mainnet',
        dataDir: '/lnd/data/chain/bitcoin/mainnet',
        rpcHost: 'lnd-mainnet',
        rpcPort: 10010,
        restHost: 'lnd-mainnet',
        restPort: 8081,
        macaroonPath: '/lnd/data/chain/bitcoin/mainnet/admin.macaroon',
        tlsCertPath: '/lnd/tls.cert'
      };
    }
  }

  /**
   * Read wallet password from file
   */
  private readWalletPassword(): string {
    const passwordPath = path.join(this.config.dataDir, 'wallet_password.txt');
    
    try {
      if (!fs.existsSync(passwordPath)) {
        throw new Error(`Wallet password file not found at: ${passwordPath}`);
      }
      
      const password = fs.readFileSync(passwordPath, 'utf-8').trim();
      console.log(`✅ Wallet password loaded from: ${passwordPath}`);
      return password;
      
    } catch (error) {
      console.error(`❌ Failed to read wallet password:`, error);
      throw error;
    }
  }

  /**
   * Check if wallet is already unlocked
   */
  private async isWalletUnlocked(): Promise<boolean> {
    try {
      const infoCommand = `lncli --network=${this.config.network} --rpcserver=${this.config.rpcHost}:${this.config.rpcPort} --macaroonpath=${this.config.macaroonPath} --tlscertpath=${this.config.tlsCertPath} getinfo`;
      
      execSync(infoCommand, { encoding: 'utf-8', stdio: 'pipe' });
      return true;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Unlock wallet using lncli
   */
  private async unlockWallet(password: string): Promise<void> {
    console.log(`🔓 Unlocking LND wallet for ${this.config.network}...`);
    
    try {
      const unlockCommand = `echo "${password}" | lncli --network=${this.config.network} --rpcserver=${this.config.rpcHost}:${this.config.rpcPort} --macaroonpath=${this.config.macaroonPath} --tlscertpath=${this.config.tlsCertPath} unlock`;
      
      execSync(unlockCommand, { encoding: 'utf-8' });
      console.log('✅ Wallet unlocked successfully');
      
    } catch (error) {
      console.error(`❌ Failed to unlock wallet:`, error);
      throw error;
    }
  }

  /**
   * Verify wallet is accessible after unlock
   */
  private async verifyWallet(): Promise<void> {
    console.log('🔍 Verifying wallet access...');
    
    try {
      const infoCommand = `lncli --network=${this.config.network} --rpcserver=${this.config.rpcHost}:${this.config.rpcPort} --macaroonpath=${this.config.macaroonPath} --tlscertpath=${this.config.tlsCertPath} getinfo`;
      
      const info = execSync(infoCommand, { encoding: 'utf-8' });
      console.log('✅ Wallet verification successful');
      
      // Parse and display key information
      try {
        const infoObj = JSON.parse(info);
        console.log(`📊 Node ID: ${infoObj.identity_pubkey}`);
        console.log(`🌐 Network: ${infoObj.chains?.[0]?.network || this.config.network}`);
        console.log(`📈 Block height: ${infoObj.block_height}`);
        console.log(`🔗 Block hash: ${infoObj.block_hash}`);
        console.log(`📅 Best header timestamp: ${new Date(infoObj.best_header_timestamp * 1000).toISOString()}`);
      } catch (parseError) {
        console.log('📊 Node info (raw):', info);
      }
      
    } catch (error) {
      console.error(`❌ Wallet verification failed:`, error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  private async getWalletBalance(): Promise<void> {
    try {
      const balanceCommand = `lncli --network=${this.config.network} --rpcserver=${this.config.rpcHost}:${this.config.rpcPort} --macaroonpath=${this.config.macaroonPath} --tlscertpath=${this.config.tlsCertPath} walletbalance`;
      
      const balance = execSync(balanceCommand, { encoding: 'utf-8' });
      console.log('💰 Wallet balance:', balance);
      
    } catch (error) {
      console.warn('⚠️ Could not retrieve wallet balance:', error);
    }
  }

  /**
   * Main unlock process
   */
  public async unlock(): Promise<void> {
    console.log(`🚀 Starting LND wallet unlock for ${this.config.network.toUpperCase()}`);
    console.log(`📁 Data directory: ${this.config.dataDir}`);
    console.log(`🔗 RPC endpoint: ${this.config.rpcHost}:${this.config.rpcPort}`);
    
    try {
      // Check if wallet is already unlocked
      const isUnlocked = await this.isWalletUnlocked();
      if (isUnlocked) {
        console.log('✅ Wallet is already unlocked');
        await this.verifyWallet();
        await this.getWalletBalance();
        return;
      }
      
      // Read wallet password
      const password = this.readWalletPassword();
      
      // Unlock wallet
      await this.unlockWallet(password);
      
      // Verify wallet
      await this.verifyWallet();
      
      // Get balance
      await this.getWalletBalance();
      
      console.log('🎉 LND wallet unlocked successfully!');
      
    } catch (error) {
      console.error('💥 LND wallet unlock failed:', error);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const network = process.argv[2] as 'testnet' | 'mainnet' || 'testnet';
  
  if (!['testnet', 'mainnet'].includes(network)) {
    console.error('❌ Invalid network. Use "testnet" or "mainnet"');
    process.exit(1);
  }
  
  const unlocker = new LNDWalletUnlocker(network);
  unlocker.unlock().catch(console.error);
}

export { LNDWalletUnlocker };
