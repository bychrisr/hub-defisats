export interface SecureCredentials {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
}
export declare class SecureStorageService {
    private algorithm;
    private keyLength;
    private ivLength;
    private tagLength;
    private generateKey;
    encryptCredentials(credentials: SecureCredentials): Promise<string>;
    decryptCredentials(encryptedData: string): Promise<SecureCredentials>;
    generateSecureHash(data: string): Promise<string>;
    validateEncryptedData(encryptedData: string): Promise<boolean>;
}
export declare const secureStorage: SecureStorageService;
//# sourceMappingURL=secure-storage.service.d.ts.map