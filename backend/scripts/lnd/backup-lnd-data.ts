#!/usr/bin/env ts-node

/**
 * LND Data Backup Script
 * 
 * This script creates a backup of LND data including:
 * - Wallet files
 * - Channel database
 * - Configuration files
 * - Macaroons and TLS certificates
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

interface LNDConfig {
  network: 'testnet' | 'mainnet';
  dataDir: string;
  configDir: string;
  backupDir: string;
}

interface BackupInfo {
  timestamp: string;
  network: string;
  files: string[];
  checksums: Record<string, string>;
  size: number;
}

class LNDDataBackup {
  private config: LNDConfig;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.config = this.getConfig(network);
  }

  private getConfig(network: 'testnet' | 'mainnet'): LNDConfig {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `/lnd/backups/${network}-${timestamp}`;
    
    return {
      network,
      dataDir: `/lnd/data/chain/bitcoin/${network}`,
      configDir: '/lnd',
      backupDir
    };
  }

  /**
   * Create backup directory
   */
  private createBackupDirectory(): void {
    try {
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true });
        console.log(`✅ Created backup directory: ${this.config.backupDir}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create backup directory:`, error);
      throw error;
    }
  }

  /**
   * Calculate file checksum
   */
  private calculateChecksum(filePath: string): string {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      console.warn(`⚠️ Could not calculate checksum for ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Backup wallet files
   */
  private backupWalletFiles(): string[] {
    console.log('💾 Backing up wallet files...');
    const walletFiles = [];
    
    const walletDir = path.join(this.config.dataDir, 'wallet.db');
    const backupWalletPath = path.join(this.config.backupDir, 'wallet.db');
    
    try {
      if (fs.existsSync(walletDir)) {
        fs.copyFileSync(walletDir, backupWalletPath);
        walletFiles.push(backupWalletPath);
        console.log(`✅ Backed up wallet database: ${backupWalletPath}`);
      } else {
        console.warn(`⚠️ Wallet database not found: ${walletDir}`);
      }
    } catch (error) {
      console.error(`❌ Failed to backup wallet files:`, error);
      throw error;
    }
    
    return walletFiles;
  }

  /**
   * Backup channel database
   */
  private backupChannelFiles(): string[] {
    console.log('💾 Backing up channel files...');
    const channelFiles = [];
    
    const channelDir = path.join(this.config.dataDir, 'channel.db');
    const backupChannelPath = path.join(this.config.backupDir, 'channel.db');
    
    try {
      if (fs.existsSync(channelDir)) {
        fs.copyFileSync(channelDir, backupChannelPath);
        channelFiles.push(backupChannelPath);
        console.log(`✅ Backed up channel database: ${backupChannelPath}`);
      } else {
        console.warn(`⚠️ Channel database not found: ${channelDir}`);
      }
    } catch (error) {
      console.error(`❌ Failed to backup channel files:`, error);
      throw error;
    }
    
    return channelFiles;
  }

  /**
   * Backup macaroons
   */
  private backupMacaroons(): string[] {
    console.log('💾 Backing up macaroons...');
    const macaroonFiles = [];
    
    const macaroonDir = path.join(this.config.dataDir, 'admin.macaroon');
    const backupMacaroonPath = path.join(this.config.backupDir, 'admin.macaroon');
    
    try {
      if (fs.existsSync(macaroonDir)) {
        fs.copyFileSync(macaroonDir, backupMacaroonPath);
        macaroonFiles.push(backupMacaroonPath);
        console.log(`✅ Backed up admin macaroon: ${backupMacaroonPath}`);
      } else {
        console.warn(`⚠️ Admin macaroon not found: ${macaroonDir}`);
      }
    } catch (error) {
      console.error(`❌ Failed to backup macaroons:`, error);
      throw error;
    }
    
    return macaroonFiles;
  }

  /**
   * Backup TLS certificates
   */
  private backupTLSCertificates(): string[] {
    console.log('💾 Backing up TLS certificates...');
    const tlsFiles = [];
    
    const tlsCertPath = '/lnd/tls.cert';
    const tlsKeyPath = '/lnd/tls.key';
    const backupCertPath = path.join(this.config.backupDir, 'tls.cert');
    const backupKeyPath = path.join(this.config.backupDir, 'tls.key');
    
    try {
      if (fs.existsSync(tlsCertPath)) {
        fs.copyFileSync(tlsCertPath, backupCertPath);
        tlsFiles.push(backupCertPath);
        console.log(`✅ Backed up TLS certificate: ${backupCertPath}`);
      } else {
        console.warn(`⚠️ TLS certificate not found: ${tlsCertPath}`);
      }
      
      if (fs.existsSync(tlsKeyPath)) {
        fs.copyFileSync(tlsKeyPath, backupKeyPath);
        tlsFiles.push(backupKeyPath);
        console.log(`✅ Backed up TLS key: ${backupKeyPath}`);
      } else {
        console.warn(`⚠️ TLS key not found: ${tlsKeyPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to backup TLS certificates:`, error);
      throw error;
    }
    
    return tlsFiles;
  }

  /**
   * Backup configuration files
   */
  private backupConfiguration(): string[] {
    console.log('💾 Backing up configuration files...');
    const configFiles = [];
    
    const configPath = path.join(this.config.configDir, `lnd-${this.config.network}.conf`);
    const backupConfigPath = path.join(this.config.backupDir, 'lnd.conf');
    
    try {
      if (fs.existsSync(configPath)) {
        fs.copyFileSync(configPath, backupConfigPath);
        configFiles.push(backupConfigPath);
        console.log(`✅ Backed up configuration: ${backupConfigPath}`);
      } else {
        console.warn(`⚠️ Configuration file not found: ${configPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to backup configuration:`, error);
      throw error;
    }
    
    return configFiles;
  }

  /**
   * Create backup manifest
   */
  private createBackupManifest(files: string[]): BackupInfo {
    console.log('📋 Creating backup manifest...');
    
    const checksums: Record<string, string> = {};
    let totalSize = 0;
    
    files.forEach(filePath => {
      try {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        checksums[path.basename(filePath)] = this.calculateChecksum(filePath);
      } catch (error) {
        console.warn(`⚠️ Could not process file ${filePath}:`, error);
      }
    });
    
    const manifest: BackupInfo = {
      timestamp: new Date().toISOString(),
      network: this.config.network,
      files: files.map(f => path.basename(f)),
      checksums,
      size: totalSize
    };
    
    const manifestPath = path.join(this.config.backupDir, 'backup-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Backup manifest created: ${manifestPath}`);
    return manifest;
  }

  /**
   * Compress backup directory
   */
  private compressBackup(): string {
    console.log('🗜️ Compressing backup...');
    
    const backupName = `lnd-${this.config.network}-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.tar.gz`;
    const backupPath = path.join('/lnd/backups', backupName);
    
    try {
      const tarCommand = `tar -czf "${backupPath}" -C "${path.dirname(this.config.backupDir)}" "${path.basename(this.config.backupDir)}"`;
      execSync(tarCommand);
      
      console.log(`✅ Backup compressed: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error(`❌ Failed to compress backup:`, error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  private cleanup(): void {
    try {
      execSync(`rm -rf "${this.config.backupDir}"`);
      console.log('🧹 Cleaned up temporary files');
    } catch (error) {
      console.warn('⚠️ Failed to cleanup temporary files:', error);
    }
  }

  /**
   * Main backup process
   */
  public async backup(compress: boolean = true): Promise<string> {
    console.log(`🚀 Starting LND data backup for ${this.config.network.toUpperCase()}`);
    console.log(`📁 Data directory: ${this.config.dataDir}`);
    console.log(`💾 Backup directory: ${this.config.backupDir}`);
    
    try {
      // Create backup directory
      this.createBackupDirectory();
      
      // Backup all components
      const allFiles = [
        ...this.backupWalletFiles(),
        ...this.backupChannelFiles(),
        ...this.backupMacaroons(),
        ...this.backupTLSCertificates(),
        ...this.backupConfiguration()
      ];
      
      // Create manifest
      const manifest = this.createBackupManifest(allFiles);
      
      // Display backup info
      console.log('\n📊 Backup Summary:');
      console.log(`   Network: ${manifest.network}`);
      console.log(`   Timestamp: ${manifest.timestamp}`);
      console.log(`   Files: ${manifest.files.length}`);
      console.log(`   Total Size: ${(manifest.size / 1024 / 1024).toFixed(2)} MB`);
      
      let finalBackupPath = this.config.backupDir;
      
      // Compress if requested
      if (compress) {
        finalBackupPath = this.compressBackup();
        this.cleanup();
      }
      
      console.log('🎉 LND data backup completed successfully!');
      console.log(`📦 Backup location: ${finalBackupPath}`);
      
      return finalBackupPath;
      
    } catch (error) {
      console.error('💥 LND data backup failed:', error);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const network = process.argv[2] as 'testnet' | 'mainnet' || 'testnet';
  const compress = process.argv[3] !== '--no-compress';
  
  if (!['testnet', 'mainnet'].includes(network)) {
    console.error('❌ Invalid network. Use "testnet" or "mainnet"');
    process.exit(1);
  }
  
  const backup = new LNDDataBackup(network);
  backup.backup(compress).catch(console.error);
}

export { LNDDataBackup };
