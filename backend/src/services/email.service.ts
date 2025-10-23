import { createTransporter, emailFrom, frontendUrl } from '../config/email.config';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

/**
 * Email Service
 * Gerencia envio de todos os tipos de email do sistema
 */
export class EmailService {
  private transporter;
  private templatesDir: string;

  constructor() {
    this.transporter = createTransporter();
    this.templatesDir = path.join(__dirname, '../templates/emails');
  }

  /**
   * Renderiza template de email usando Handlebars
   */
  private async renderTemplate(
    templateName: string,
    data: Record<string, any>
  ): Promise<string> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
      const templateSource = await fs.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);
      return template(data);
    } catch (error) {
      console.error(`❌ Error rendering template ${templateName}:`, error);
      throw new Error(`Failed to render email template: ${templateName}`);
    }
  }

  /**
   * Envia email de verificação de conta
   */
  async sendVerificationEmail(to: string, token: string, otp?: string): Promise<void> {
    try {
      // URL deve apontar para o BACKEND, não para o frontend
      // Em desenvolvimento, usar porta 13010 (externa do Docker)
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:13010';
      const verificationUrl = `${backendUrl}/api/auth/verify-email/${token}`;
      const userName = to.split('@')[0];

      const html = await this.renderTemplate('verification', {
        verificationUrl,
        userName,
        frontendUrl,
        otp, // Incluir OTP no template se fornecido
      });

      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject: '✅ Verifique seu email - Axisor',
        html,
      });

      console.log(`📧 Verification email sent to ${to}`);
    } catch (error) {
      console.error(`❌ Error sending verification email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envia código de 6 dígitos para validação de cupom
   */
  async sendVerificationCodeEmail(to: string, code: string): Promise<void> {
    try {
      const userName = to.split('@')[0];

      const html = await this.renderTemplate('verification-code', {
        code,
        userName,
        expiresIn: 5, // minutos
      });

      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject: '🔐 Seu código de verificação - Axisor',
        html,
      });

      console.log(`📧 Verification code email sent to ${to}`);
    } catch (error) {
      console.error(`❌ Error sending verification code to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envia email de teste (desenvolvimento)
   */
  async sendTestEmail(to: string, subject: string, message: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>🧪 Email de Teste - Axisor</h2>
            <p>${message}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Enviado em: ${new Date().toLocaleString('pt-BR')}<br>
              Ambiente: ${process.env.NODE_ENV || 'development'}
            </p>
          </div>
        `,
      });

      console.log(`📧 Test email sent to ${to}`);
    } catch (error) {
      console.error(`❌ Error sending test email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envia email de confirmação de cupom aplicado
   */
  async sendCouponConfirmationEmail(
    to: string,
    couponCode: string,
    discount: number,
    discountType: 'percentage' | 'fixed',
    planName: string
  ): Promise<void> {
    try {
      const userName = to.split('@')[0];

      const html = await this.renderTemplate('coupon-confirmation', {
        couponCode,
        discount,
        discountType,
        planName,
        userName,
      });

      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject: `🎫 Cupom ${couponCode} aplicado com sucesso!`,
        html,
      });

      console.log(`📧 Coupon confirmation email sent to ${to}`);
    } catch (error) {
      console.error(`❌ Error sending coupon confirmation to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envia email de recuperação de senha
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    try {
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      const userName = to.split('@')[0];

      const html = await this.renderTemplate('password-reset', {
        resetUrl,
        userName,
      });

      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject: '🔐 Recuperação de Senha - Axisor',
        html,
      });

      console.log(`📧 Password reset email sent to ${to}`);
    } catch (error) {
      console.error(`❌ Error sending password reset to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envia alerta de margem crítica
   */
  async sendMarginAlertEmail(
    to: string,
    currentMargin: number,
    threshold: number,
    positionDetails: any
  ): Promise<void> {
    try {
      const userName = to.split('@')[0];

      const html = await this.renderTemplate('margin-alert', {
        currentMargin,
        threshold,
        positionDetails,
        userName,
        dashboardUrl: `${frontendUrl}/dashboard`,
      });

      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject: '⚠️ Alerta de Margem - Ação Necessária',
        html,
        priority: 'high',
      });

      console.log(`📧 Margin alert email sent to ${to}`);
    } catch (error) {
      console.error(`❌ Error sending margin alert to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envia relatório diário
   */
  async sendDailyReportEmail(to: string, reportData: any): Promise<void> {
    try {
      const userName = to.split('@')[0];
      const today = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const html = await this.renderTemplate('daily-report', {
        ...reportData,
        userName,
        today,
        dashboardUrl: `${frontendUrl}/dashboard`,
      });

      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject: `📊 Relatório Diário - ${new Date().toLocaleDateString('pt-BR')}`,
        html,
      });

      console.log(`📧 Daily report email sent to ${to}`);
    } catch (error) {
      console.error(`❌ Error sending daily report to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envia email de teste
   */
  async sendTestEmail(to: string): Promise<void> {
    try {
      const html = `
        <h1>Email de Teste - Axisor</h1>
        <p>Este é um email de teste enviado em ${new Date().toISOString()}</p>
        <p>Se você recebeu este email, o sistema de emails está funcionando corretamente!</p>
      `;

      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject: '🧪 Email de Teste - Axisor',
        html,
      });

      console.log(`📧 Test email sent to ${to}`);
    } catch (error) {
      console.error(`❌ Error sending test email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Verifica se o transporter está funcionando
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}
