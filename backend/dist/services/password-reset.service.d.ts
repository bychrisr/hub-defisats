import { PrismaClient } from '@prisma/client';
export declare class PasswordResetService {
    private prisma;
    private redis;
    private emailService;
    private hibpService;
    constructor(prisma: PrismaClient);
    requestPasswordReset(email: string, ipAddress?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(token: string, newPassword: string, ipAddress?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    validateResetToken(token: string): Promise<{
        valid: boolean;
        email?: string;
        message?: string;
    }>;
    private logPasswordResetAttempt;
    private logPasswordReset;
    getPasswordResetLogs(limit?: number): Promise<any[]>;
}
//# sourceMappingURL=password-reset.service.d.ts.map