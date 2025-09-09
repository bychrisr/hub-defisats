"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("@/config/env");
const crypto_1 = __importDefault(require("crypto"));
class EmailService {
    transporter;
    constructor() {
        this.transporter = nodemailer_1.default.createTransporter({
            host: env_1.config.notification.email.host,
            port: env_1.config.notification.email.port,
            secure: env_1.config.notification.email.port === 465,
            auth: {
                user: env_1.config.notification.email.user,
                pass: env_1.config.notification.email.pass,
            },
        });
    }
    async sendEmailVerification(email, token) {
        const verificationUrl = `${env_1.config.env.CORS_ORIGIN}/verify-email?token=${token}`;
        const mailOptions = {
            from: `"Hub-defisats" <${env_1.config.notification.email.user}>`,
            to: email,
            subject: 'Verify your email address',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Hub-defisats!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
          <p>This link will expire in 2 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
        };
        await this.transporter.sendMail(mailOptions);
    }
    async sendPasswordReset(email, token) {
        const resetUrl = `${env_1.config.env.CORS_ORIGIN}/reset-password?token=${token}`;
        const mailOptions = {
            from: `"Hub-defisats" <${env_1.config.notification.email.user}>`,
            to: email,
            subject: 'Reset your password',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
        };
        await this.transporter.sendMail(mailOptions);
    }
    generateEmailToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    generatePasswordResetToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=email.service.js.map