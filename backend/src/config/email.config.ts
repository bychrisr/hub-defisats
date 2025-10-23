import nodemailer from 'nodemailer';

/**
 * Configuração de Email
 * Suporta MailHog (dev) e AWS SES/SendGrid/Resend (prod)
 */

export const emailConfig = {
  host: process.env.SMTP_HOST || 'mailhog',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outros
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
  // Configurações adicionais para produção
  pool: process.env.NODE_ENV === 'production', // Usar pool de conexões em produção
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 10, // 10 emails por segundo
};

export const emailFrom = {
  name: process.env.EMAIL_FROM_NAME || 'Axisor Platform',
  address: process.env.EMAIL_FROM || 'noreply@axisor.local',
};

export const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:13000';

/**
 * Cria transporter do Nodemailer
 */
export function createTransporter() {
  return nodemailer.createTransport(emailConfig);
}

/**
 * Verifica se o serviço de email está funcionando
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
}


