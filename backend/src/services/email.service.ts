import nodemailer from 'nodemailer';
import { config } from '@/config/env';
import crypto from 'crypto';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: config.notification.email.host,
      port: config.notification.email.port,
      secure: config.notification.email.port === 465,
      auth: {
        user: config.notification.email.user,
        pass: config.notification.email.pass,
      },
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verificationUrl = `${config.env.CORS_ORIGIN}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Hub-defisats" <${config.notification.email.user}>`,
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

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${config.env.CORS_ORIGIN}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Hub-defisats" <${config.notification.email.user}>`,
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

  /**
   * Generate email verification token
   */
  generateEmailToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
