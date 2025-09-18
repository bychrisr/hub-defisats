import sodium from 'libsodium-wrappers';
import { Logger } from 'winston';

export interface EncryptionResult {
  ciphertext: string;
  nonce: string;
  tag: string;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export class AdvancedCryptoService {
  private logger: Logger;
  private masterKey: Uint8Array;

  constructor(logger: Logger, masterKeyHex: string) {
    this.logger = logger;
    this.masterKey = sodium.from_hex(masterKeyHex);
  }

  /**
   * Initialize libsodium
   */
  async initialize(): Promise<void> {
    await sodium.ready;
    this.logger.info('Advanced crypto service initialized with libsodium');
  }

  /**
   * Encrypt data using XChaCha20-Poly1305
   */
  async encrypt(data: string): Promise<EncryptionResult> {
    try {
      await sodium.ready;
      
      const dataBytes = sodium.from_string(data);
      const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
      
      const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        dataBytes,
        null, // No additional data
        null, // No additional data
        nonce,
        this.masterKey
      );

      return {
        ciphertext: sodium.to_base64(ciphertext),
        nonce: sodium.to_base64(nonce),
        tag: sodium.to_base64(ciphertext.slice(-sodium.crypto_aead_xchacha20poly1305_ietf_ABYTES))
      };
    } catch (error) {
      this.logger.error('Encryption failed', { error: (error as Error).message });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using XChaCha20-Poly1305
   */
  async decrypt(encryptionResult: EncryptionResult): Promise<string> {
    try {
      await sodium.ready;
      
      const ciphertext = sodium.from_base64(encryptionResult.ciphertext);
      const nonce = sodium.from_base64(encryptionResult.nonce);
      
      const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        ciphertext,
        null, // No additional data
        null, // No additional data
        nonce,
        this.masterKey
      );

      return sodium.to_string(plaintext);
    } catch (error) {
      this.logger.error('Decryption failed', { error: (error as Error).message });
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate a new key pair for asymmetric encryption
   */
  async generateKeyPair(): Promise<KeyPair> {
    try {
      await sodium.ready;
      
      const keyPair = sodium.crypto_box_keypair();
      
      return {
        publicKey: sodium.to_base64(keyPair.publicKey),
        privateKey: sodium.to_base64(keyPair.privateKey)
      };
    } catch (error) {
      this.logger.error('Key pair generation failed', { error: (error as Error).message });
      throw new Error('Key pair generation failed');
    }
  }

  /**
   * Encrypt data with a specific public key
   */
  async encryptWithPublicKey(data: string, publicKey: string): Promise<EncryptionResult> {
    try {
      await sodium.ready;
      
      const dataBytes = sodium.from_string(data);
      const publicKeyBytes = sodium.from_base64(publicKey);
      const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
      
      const ciphertext = sodium.crypto_box_easy(
        dataBytes,
        nonce,
        publicKeyBytes,
        this.masterKey // Using master key as private key for simplicity
      );

      return {
        ciphertext: sodium.to_base64(ciphertext),
        nonce: sodium.to_base64(nonce),
        tag: '' // Not used in box encryption
      };
    } catch (error) {
      this.logger.error('Public key encryption failed', { error: (error as Error).message });
      throw new Error('Public key encryption failed');
    }
  }

  /**
   * Decrypt data with a specific private key
   */
  async decryptWithPrivateKey(encryptionResult: EncryptionResult, privateKey: string): Promise<string> {
    try {
      await sodium.ready;
      
      const ciphertext = sodium.from_base64(encryptionResult.ciphertext);
      const nonce = sodium.from_base64(encryptionResult.nonce);
      const privateKeyBytes = sodium.from_base64(privateKey);
      
      const plaintext = sodium.crypto_box_open_easy(
        ciphertext,
        nonce,
        this.masterKey, // Using master key as public key for simplicity
        privateKeyBytes
      );

      return sodium.to_string(plaintext);
    } catch (error) {
      this.logger.error('Private key decryption failed', { error: (error as Error).message });
      throw new Error('Private key decryption failed');
    }
  }

  /**
   * Generate a secure random password
   */
  async generateSecurePassword(length: number = 32): Promise<string> {
    try {
      await sodium.ready;
      
      const passwordBytes = sodium.randombytes_buf(length);
      return sodium.to_base64(passwordBytes);
    } catch (error) {
      this.logger.error('Password generation failed', { error: (error as Error).message });
      throw new Error('Password generation failed');
    }
  }

  /**
   * Hash password with Argon2id
   */
  async hashPassword(password: string): Promise<string> {
    try {
      await sodium.ready;
      
      const passwordBytes = sodium.from_string(password);
      const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
      
      const hash = sodium.crypto_pwhash(
        sodium.crypto_pwhash_STRBYTES,
        passwordBytes,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      return sodium.to_base64(hash);
    } catch (error) {
      this.logger.error('Password hashing failed', { error: (error as Error).message });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      await sodium.ready;
      
      const passwordBytes = sodium.from_string(password);
      const hashBytes = sodium.from_base64(hash);
      
      return sodium.crypto_pwhash_str_verify(hashBytes, passwordBytes);
    } catch (error) {
      this.logger.error('Password verification failed', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Generate a secure random token
   */
  async generateSecureToken(length: number = 32): Promise<string> {
    try {
      await sodium.ready;
      
      const tokenBytes = sodium.randombytes_buf(length);
      return sodium.to_base64(tokenBytes);
    } catch (error) {
      this.logger.error('Token generation failed', { error: (error as Error).message });
      throw new Error('Token generation failed');
    }
  }

  /**
   * Sign data with Ed25519
   */
  async sign(data: string, privateKey: string): Promise<string> {
    try {
      await sodium.ready;
      
      const dataBytes = sodium.from_string(data);
      const privateKeyBytes = sodium.from_base64(privateKey);
      
      const signature = sodium.crypto_sign_detached(dataBytes, privateKeyBytes);
      return sodium.to_base64(signature);
    } catch (error) {
      this.logger.error('Signing failed', { error: (error as Error).message });
      throw new Error('Signing failed');
    }
  }

  /**
   * Verify signature with Ed25519
   */
  async verify(data: string, signature: string, publicKey: string): Promise<boolean> {
    try {
      await sodium.ready;
      
      const dataBytes = sodium.from_string(data);
      const signatureBytes = sodium.from_base64(signature);
      const publicKeyBytes = sodium.from_base64(publicKey);
      
      return sodium.crypto_sign_verify_detached(signatureBytes, dataBytes, publicKeyBytes);
    } catch (error) {
      this.logger.error('Signature verification failed', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Generate a secure random salt
   */
  async generateSalt(): Promise<string> {
    try {
      await sodium.ready;
      
      const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
      return sodium.to_base64(salt);
    } catch (error) {
      this.logger.error('Salt generation failed', { error: (error as Error).message });
      throw new Error('Salt generation failed');
    }
  }

  /**
   * Derive key from password using Argon2id
   */
  async deriveKey(password: string, salt: string): Promise<string> {
    try {
      await sodium.ready;
      
      const passwordBytes = sodium.from_string(password);
      const saltBytes = sodium.from_base64(salt);
      
      const key = sodium.crypto_pwhash(
        sodium.crypto_secretbox_KEYBYTES,
        passwordBytes,
        saltBytes,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      return sodium.to_base64(key);
    } catch (error) {
      this.logger.error('Key derivation failed', { error: (error as Error).message });
      throw new Error('Key derivation failed');
    }
  }

  /**
   * Get crypto service status
   */
  async getStatus(): Promise<{
    initialized: boolean;
    algorithm: string;
    keyLength: number;
    nonceLength: number;
  }> {
    try {
      await sodium.ready;
      
      return {
        initialized: true,
        algorithm: 'XChaCha20-Poly1305',
        keyLength: sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
        nonceLength: sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
      };
    } catch (error) {
      this.logger.error('Status check failed', { error: (error as Error).message });
      return {
        initialized: false,
        algorithm: 'Unknown',
        keyLength: 0,
        nonceLength: 0
      };
    }
  }
}