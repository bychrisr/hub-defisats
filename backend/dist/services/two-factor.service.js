"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
class TwoFactorService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateSecret(userId, email) {
        const secret = speakeasy_1.default.generateSecret({
            name: `Hub-defisats (${email})`,
            issuer: 'Hub-defisats',
            length: 32,
        });
        const backupCodes = this.generateBackupCodes();
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                two_factor_secret: secret.base32,
                two_factor_backup_codes: backupCodes,
                two_factor_enabled: false,
            },
        });
        const qrCodeUrl = await qrcode_1.default.toDataURL(secret.otpauth_url);
        return {
            secret: secret.base32,
            qrCodeUrl,
            backupCodes,
        };
    }
    async verifyToken(userId, token) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { two_factor_secret: true },
        });
        if (!user?.two_factor_secret) {
            return false;
        }
        const verified = speakeasy_1.default.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token,
            window: 1,
        });
        return verified;
    }
    async verifyBackupCode(userId, code) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { two_factor_backup_codes: true },
        });
        if (!user?.two_factor_backup_codes) {
            return false;
        }
        const backupCodes = user.two_factor_backup_codes;
        const index = backupCodes.indexOf(code);
        if (index === -1) {
            return false;
        }
        backupCodes.splice(index, 1);
        await this.prisma.user.update({
            where: { id: userId },
            data: { two_factor_backup_codes: backupCodes },
        });
        return true;
    }
    async enable2FA(userId, token) {
        const isValid = await this.verifyToken(userId, token);
        if (!isValid) {
            return false;
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { two_factor_enabled: true },
        });
        return true;
    }
    async disable2FA(userId, token) {
        const isValid = await this.verifyToken(userId, token);
        if (!isValid) {
            return false;
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                two_factor_enabled: false,
                two_factor_secret: null,
                two_factor_backup_codes: null,
            },
        });
        return true;
    }
    async is2FAEnabled(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { two_factor_enabled: true },
        });
        return user?.two_factor_enabled || false;
    }
    async generateNewBackupCodes(userId) {
        const backupCodes = this.generateBackupCodes();
        await this.prisma.user.update({
            where: { id: userId },
            data: { two_factor_backup_codes: backupCodes },
        });
        return backupCodes;
    }
    async getBackupCodesCount(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { two_factor_backup_codes: true },
        });
        if (!user?.two_factor_backup_codes) {
            return 0;
        }
        return user.two_factor_backup_codes.length;
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    async validate2FAForAdmin(userId, token) {
        const adminUser = await this.prisma.adminUser.findUnique({
            where: { user_id: userId },
        });
        if (!adminUser) {
            return false;
        }
        const isEnabled = await this.is2FAEnabled(userId);
        if (!isEnabled) {
            return false;
        }
        return await this.verifyToken(userId, token);
    }
}
exports.TwoFactorService = TwoFactorService;
//# sourceMappingURL=two-factor.service.js.map