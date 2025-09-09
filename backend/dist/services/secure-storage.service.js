"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureStorage = exports.SecureStorageService = void 0;
const crypto_1 = require("crypto");
const util_1 = require("util");
const env_1 = require("@/config/env");
const scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
class SecureStorageService {
    algorithm = 'aes-256-gcm';
    keyLength = 32;
    ivLength = 16;
    tagLength = 16;
    async generateKey() {
        const salt = Buffer.from(env_1.config.security.encryption.key, 'hex');
        return (await scryptAsync(salt, 'hub-defisats-salt', this.keyLength));
    }
    async encryptCredentials(credentials) {
        try {
            const key = await this.generateKey();
            const iv = (0, crypto_1.randomBytes)(this.ivLength);
            const cipher = (0, crypto_1.createCipheriv)(this.algorithm, key, iv);
            const data = JSON.stringify(credentials);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            const result = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
            return result;
        }
        catch (error) {
            console.error('Error encrypting credentials:', error);
            throw new Error('Failed to encrypt credentials');
        }
    }
    async decryptCredentials(encryptedData) {
        try {
            const key = await this.generateKey();
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const tag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            const decipher = (0, crypto_1.createDecipheriv)(this.algorithm, key, iv);
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        }
        catch (error) {
            console.error('Error decrypting credentials:', error);
            throw new Error('Failed to decrypt credentials');
        }
    }
    async generateSecureHash(data) {
        const key = await this.generateKey();
        const hash = (0, crypto_1.createCipheriv)('aes-256-cbc', key, Buffer.alloc(16))
            .update(data, 'utf8', 'hex')
            .final('hex');
        return hash;
    }
    async validateEncryptedData(encryptedData) {
        try {
            await this.decryptCredentials(encryptedData);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.SecureStorageService = SecureStorageService;
exports.secureStorage = new SecureStorageService();
//# sourceMappingURL=secure-storage.service.js.map