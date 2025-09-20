import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { config } from '../config/env';

const scryptAsync = promisify(scrypt);

export interface SecureCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
}

export class SecureStorageService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;
  private ivLength = 16;
  // private tagLength = 16; // Unused variable

  /**
   * Gerar chave de criptografia a partir da chave de ambiente
   */
  private async generateKey(): Promise<Buffer> {
    const salt = Buffer.from(config.security.encryption.key, 'hex');
    return (await scryptAsync(
      salt,
      'hub-defisats-salt',
      this.keyLength
    )) as Buffer;
  }

  /**
   * Criptografar credenciais
   */
  async encryptCredentials(credentials: SecureCredentials): Promise<string> {
    try {
      const key = await this.generateKey();
      const iv = randomBytes(this.ivLength);
      const cipher = createCipheriv(this.algorithm, key, iv);

      // Serializar credenciais
      const data = JSON.stringify(credentials);

      // Criptografar
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Obter tag de autenticação
      const tag = (cipher as any).getAuthTag();

      // Combinar IV + tag + dados criptografados
      const result =
        iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;

      return result;
    } catch (error) {
      console.error('Error encrypting credentials:', error);
      throw new Error('Failed to encrypt credentials');
    }
  }

  /**
   * Descriptografar credenciais
   */
  async decryptCredentials(encryptedData: string): Promise<SecureCredentials> {
    try {
      const key = await this.generateKey();
      const parts = encryptedData.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0] || '', 'hex');
      const tag = Buffer.from(parts[1] || '', 'hex');
      const encrypted = parts[2];

      const decipher = createDecipheriv(this.algorithm, key, iv);
      (decipher as any).setAuthTag(tag);

      let decrypted = decipher.update(encrypted || '', 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting credentials:', error);
      throw new Error('Failed to decrypt credentials');
    }
  }

  /**
   * Gerar hash seguro para identificação
   */
  async generateSecureHash(data: string): Promise<string> {
    const key = await this.generateKey();
    const cipher = createCipheriv('aes-256-cbc', key, Buffer.alloc(16));
    const hash = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    return hash;
  }

  /**
   * Validar integridade dos dados criptografados
   */
  async validateEncryptedData(encryptedData: string): Promise<boolean> {
    try {
      await this.decryptCredentials(encryptedData);
      return true;
    } catch {
      return false;
    }
  }
}

// Instância singleton
export const secureStorage = new SecureStorageService();
