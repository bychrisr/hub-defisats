import { PrismaClient } from '@prisma/client';
export declare class TwoFactorService {
    private prisma;
    constructor(prisma: PrismaClient);
    generateSecret(userId: string, email: string): Promise<{
        secret: string;
        qrCodeUrl: string;
        backupCodes: string[];
    }>;
    verifyToken(userId: string, token: string): Promise<boolean>;
    verifyBackupCode(userId: string, code: string): Promise<boolean>;
    enable2FA(userId: string, token: string): Promise<boolean>;
    disable2FA(userId: string, token: string): Promise<boolean>;
    is2FAEnabled(userId: string): Promise<boolean>;
    generateNewBackupCodes(userId: string): Promise<string[]>;
    getBackupCodesCount(userId: string): Promise<number>;
    private generateBackupCodes;
    validate2FAForAdmin(userId: string, token: string): Promise<boolean>;
}
//# sourceMappingURL=two-factor.service.d.ts.map