#!/usr/bin/env ts-node

/**
 * LND Data Restore Script
 * 
 * This script restores LND data from a backup including:
 * - Wallet files
 * - Channel database
 * - Configuration files
 * - Macaroons and TLS certificates
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

interface BackupInfo {
  timestamp: string;
  network: string;
  files: string[];
  checksums: Record<string, string>;
  size: number;
}

interface LNDConfig {
  network: 'testnet' | 'mainnet';
  dataDir: string;
  configDir: string;
}

class LNDDataRestore {
  private config: LNDConfig;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.config = this.getConfig(network);
  }

  private getConfig(network: 'testnet' | 'mainnet'): LNDConfig {
    return {
      network,
      dataDir: `/lnd/data/chain/bitcoin/${network}`,
      configDir: '/lnd'
    };
  }

  /**
   * Validate backup file exists
   */
  private validateBackupFile(backupPath: string): void {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    const stats = fs.statSync(backupPath);
    if (stats.size === 0) {
      throw new Error(`Backup file is empty: ${backupPath}`);
    }
    
    console.log(`✅ Backup file validated: ${backupPath}`);
    console.log(`📦 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }

  /**
   * Extract compressed backup
   */
  private extractBackup(backupPath: string): string {
    console.log('📦 Extracting backup...');
    
    const extractDir = `/tmp/lnd-restore-${Date.now()}`;
    
    try {
      // Create extraction directory
      fs.mkdirSync(extractDir, { recursive: true });
      
      // Extract backup
      const tarCommand = `tar -xzf "${backupPath}" -C "${extractDir}"`;
      execSync(tarCommand);
      
      // Find the extracted directory
      const extractedDirs = fs.readdirSync(extractDir);
      const backupDir = path.join(extractDir, extractedDirs[0]);
      
      console.log(`✅ Backup extracted to: ${backupDir}`);
      return backupDir;
      
    } catch (error) {
      console.error(`❌ Failed to extract backup:`, error);
      throw error;
    }
  }

  /**
   * Read backup manifest
   */
  private readBackupManifest(backupDir: string): BackupInfo {
    const manifestPath = path.join(backupDir, 'backup-manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Backup manifest not found: ${manifestPath}`);
    }
    
    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest: BackupInfo = JSON.parse(manifestContent);
      
      console.log(`✅ Backup manifest loaded: ${manifest.network} - ${manifest.timestamp}`);
      console.log(`📊 Files in backup: ${manifest.files.length}`);
      
      return manifest;
    } catch (error) {
      console.error(`❌ Failed to read backup manifest:`, error);
      throw error;
    }
  }

  /**
   * Verify file checksums
   */
  private verifyChecksums(backupDir: string, manifest: BackupInfo): void {
    console.log('🔍 Verifying file checksums...');
    
    let verifiedFiles = 0;
    let failedFiles = 0;
    
    manifest.files.forEach(fileName => {
      const filePath = path.join(backupDir, fileName);
      const expectedChecksum = manifest.checksums[fileName];
      
      if (!expectedChecksum) {
        console.warn(`⚠️ No checksum found for ${fileName}`);
        return;
      }
      
      try {
        const actualChecksum = this.calculateChecksum(filePath);
        
        if (actualChecksum === expectedChecksum) {
          console.log(`✅ ${fileName} - checksum verified`);
          verifiedFiles++;
        } else {
          console.error(`❌ ${fileName} - checksum mismatch`);
          failedFiles++;
        }
      } catch (error) {
        console.error(`❌ ${fileName} - could not verify checksum:`, error);
        failedFiles++;
      }
    });
    
    console.log(`📊 Checksum verification: ${verifiedFiles} verified, ${failedFiles} failed`);
    
    if (failedFiles > 0) {
      throw new Error(`Checksum verification failed for ${failedFiles} files`);
    }
  }

  /**
   * Calculate file checksum
   */
  private calculateChecksum(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Stop LND service (if running)
   */
  private async stopLNDService(): Promise<void> {
    console.log('⏹️ Stopping LND service...');
    
    try {
      execSync('docker stop axisor-lnd-testnet || true', { stdio: 'pipe' });
      execSync('docker stop axisor-lnd-mainnet || true', { stdio: 'pipe' });
      console.log('✅ LND service stopped');
    } catch (error) {
      console.warn('⚠️ Could not stop LND service (may not be running):', error);
    }
  }

  /**
   * Create backup of current data (if exists)
   */
  private async backupCurrentData(): Promise<void> {
    console.log('💾 Creating backup of current data...');
    
    const currentBackupDir = `/lnd/backups/pre-restore-${this.config.network}-${Date.now()}`;
    
    try {
      if (fs.existsSync(this.config.dataDir)) {
        fs.mkdirSync(currentBackupDir, { recursive: true });
        
        const backupCommand = `cp -r "${this.config.dataDir}"/* "${currentBackupDir}/" 2>/dev/null || true`;
        execSync(backupCommand);
        
        console.log(`✅ Current data backed up to: ${currentBackupDir}`);
      } else {
        console.log('ℹ️ No existing data found to backup');
      }
    } catch (error) {
      console.warn('⚠️ Could not backup current data:', error);
    }
  }

  /**
   * Restore wallet files
   */
  private restoreWalletFiles(backupDir: string): void {
    console.log('💾 Restoring wallet files...');
    
    const backupWalletPath = path.join(backupDir, 'wallet.db');
    const restoreWalletPath = path.join(this.config.dataDir, 'wallet.db');
    
    try {
      if (fs.existsSync(backupWalletPath)) {
        // Ensure data directory exists
        fs.mkdirSync(this.config.dataDir, { recursive: true });
        
        fs.copyFileSync(backupWalletPath, restoreWalletPath);
        console.log(`✅ Wallet database restored: ${restoreWalletPath}`);
      } else {
        console.warn(`⚠️ Wallet database not found in backup: ${backupWalletPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to restore wallet files:`, error);
      throw error;
    }
  }

  /**
   * Restore channel files
   */
  private restoreChannelFiles(backupDir: string): void {
    console.log('💾 Restoring channel files...');
    
    const backupChannelPath = path.join(backupDir, 'channel.db');
    const restoreChannelPath = path.join(this.config.dataDir, 'channel.db');
    
    try {
      if (fs.existsSync(backupChannelPath)) {
        fs.copyFileSync(backupChannelPath, restoreChannelPath);
        console.log(`✅ Channel database restored: ${restoreChannelPath}`);
      } else {
        console.warn(`⚠️ Channel database not found in backup: ${backupChannelPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to restore channel files:`, error);
      throw error;
    }
  }

  /**
   * Restore macaroons
   */
  private restoreMacaroons(backupDir: string): void {
    console.log('💾 Restoring macaroons...');
    
    const backupMacaroonPath = path.join(backupDir, 'admin.macaroon');
    const restoreMacaroonPath = path.join(this.config.dataDir, 'admin.macaroon');
    
    try {
      if (fs.existsSync(backupMacaroonPath)) {
        fs.copyFileSync(backupMacaroonPath, restoreMacaroonPath);
        console.log(`✅ Admin macaroon restored: ${restoreMacaroonPath}`);
      } else {
        console.warn(`⚠️ Admin macaroon not found in backup: ${backupMacaroonPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to restore macaroons:`, error);
      throw error;
    }
  }

  /**
   * Restore TLS certificates
   */
  private restoreTLSCertificates(backupDir: string): void {
    console.log('💾 Restoring TLS certificates...');
    
    const backupCertPath = path.join(backupDir, 'tls.cert');
    const backupKeyPath = path.join(backupDir, 'tls.key');
    const restoreCertPath = path.join(this.config.configDir, 'tls.cert');
    const restoreKeyPath = path.join(this.config.configDir, 'tls.key');
    
    try {
      if (fs.existsSync(backupCertPath)) {
        fs.copyFileSync(backupCertPath, restoreCertPath);
        console.log(`✅ TLS certificate restored: ${restoreCertPath}`);
      } else {
        console.warn(`⚠️ TLS certificate not found in backup: ${backupCertPath}`);
      }
      
      if (fs.existsSync(backupKeyPath)) {
        fs.copyFileSync(backupKeyPath, restoreKeyPath);
        console.log(`✅ TLS key restored: ${restoreKeyPath}`);
      } else {
        console.warn(`⚠️ TLS key not found in backup: ${backupKeyPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to restore TLS certificates:`, error);
      throw error;
    }
  }

  /**
   * Restore configuration files
   */
  private restoreConfiguration(backupDir: string): void {
    console.log('💾 Restoring configuration files...');
    
    const backupConfigPath = path.join(backupDir, 'lnd.conf');
    const restoreConfigPath = path.join(this.config.configDir, `lnd-${this.config.network}.conf`);
    
    try {
      if (fs.existsSync(backupConfigPath)) {
        fs.copyFileSync(backupConfigPath, restoreConfigPath);
        console.log(`✅ Configuration restored: ${restoreConfigPath}`);
      } else {
        console.warn(`⚠️ Configuration file not found in backup: ${backupConfigPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to restore configuration:`, error);
      throw error;
    }
  }

  /**
   * Set proper file permissions
   */
  private setFilePermissions(): void {
    console.log('🔒 Setting file permissions...');
    
    try {
      // Set permissions for data directory
      execSync(`chmod -R 600 "${this.config.dataDir}"`);
      execSync(`chmod 700 "${this.config.dataDir}"`);
      
      // Set permissions for config directory
      execSync(`chmod 600 "${this.config.configDir}/tls.cert" "${this.config.configDir}/tls.key"`);
      
      console.log('✅ File permissions set');
    } catch (error) {
      console.warn('⚠️ Could not set file permissions:', error);
    }
  }

  /**
   * Clean up temporary files
   */
  private cleanup(extractDir: string): void {
    try {
      execSync(`rm -rf "${extractDir}"`);
      console.log('🧹 Cleaned up temporary files');
    } catch (error) {
      console.warn('⚠️ Failed to cleanup temporary files:', error);
    }
  }

  /**
   * Main restore process
   */
  public async restore(backupPath: string): Promise<void> {
    console.log(`🚀 Starting LND data restore for ${this.config.network.toUpperCase()}`);
    console.log(`📦 Backup file: ${backupPath}`);
    console.log(`📁 Restore directory: ${this.config.dataDir}`);
    
    let extractDir = '';
    
    try {
      // Validate backup file
      this.validateBackupFile(backupPath);
      
      // Stop LND service
      await this.stopLNDService();
      
      // Backup current data
      await this.backupCurrentData();
      
      // Extract backup
      extractDir = this.extractBackup(backupPath);
      
      // Read and validate manifest
      const manifest = this.readBackupManifest(extractDir);
      
      // Verify network match
      if (manifest.network !== this.config.network) {
        throw new Error(`Network mismatch: backup is ${manifest.network}, expected ${this.config.network}`);
      }
      
      // Verify checksums
      this.verifyChecksums(extractDir, manifest);
      
      // Restore all components
      this.restoreWalletFiles(extractDir);
      this.restoreChannelFiles(extractDir);
      this.restoreMacaroons(extractDir);
      this.restoreTLSCertificates(extractDir);
      this.restoreConfiguration(extractDir);
      
      // Set file permissions
      this.setFilePermissions();
      
      console.log('🎉 LND data restore completed successfully!');
      console.log('⚠️ Important: Restart LND service to apply changes');
      
    } catch (error) {
      console.error('💥 LND data restore failed:', error);
      process.exit(1);
    } finally {
      // Clean up
      if (extractDir) {
        this.cleanup(extractDir);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const network = process.argv[2] as 'testnet' | 'mainnet' || 'testnet';
  const backupPath = process.argv[3];
  
  if (!['testnet', 'mainnet'].includes(network)) {
    console.error('❌ Invalid network. Use "testnet" or "mainnet"');
    process.exit(1);
  }
  
  if (!backupPath) {
    console.error('❌ Backup path required. Usage: restore-lnd-data.ts <network> <backup-path>');
    process.exit(1);
  }
  
  const restore = new LNDDataRestore(network);
  restore.restore(backupPath).catch(console.error);
}

export { LNDDataRestore };
