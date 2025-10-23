# 📧 Guia Completo - Sistema de Emails

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Desenvolvimento Local](#desenvolvimento-local)
3. [Produção](#produção)
4. [Implementação](#implementação)
5. [Templates de Email](#templates-de-email)
6. [Testes](#testes)

---

## 🎯 Visão Geral

O sistema de emails do Axisor é responsável por:
- ✉️ Verificação de email (registro)
- 🎫 Confirmação de cupom aplicado
- 🔐 Recuperação de senha
- 🔔 Notificações de automação
- 💰 Alertas de margem
- 📊 Relatórios diários/semanais

---

## 🏠 Desenvolvimento Local

### **Opção 1: MailHog (Recomendada)**

**O que é?**
- Servidor SMTP falso que captura todos os emails
- Interface web para visualizar emails enviados
- **Nenhum email real é enviado** (perfeito para testes)

**Configuração no Docker Compose:**

```yaml
# Adicionar ao docker-compose.dev.yml
mailhog:
  image: mailhog/mailhog:latest
  container_name: axisor-mailhog
  ports:
    - "1025:1025"   # SMTP
    - "8025:8025"   # Web UI
  networks:
    - axisor-network
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:8025"]
    interval: 10s
    timeout: 5s
    retries: 3
```

**Variáveis de Ambiente (.env.development):**

```bash
# Email Configuration (MailHog)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@axisor.local
EMAIL_FROM_NAME=Axisor Platform
```

**Como usar:**
1. Subir containers: `docker-compose -f config/docker/docker-compose.dev.yml up -d`
2. Acessar UI: http://localhost:8025
3. Enviar emails normalmente - eles aparecerão na interface

---

### **Opção 2: Mailtrap (Cloud Development)**

**O que é?**
- Serviço cloud para teste de emails
- Simula comportamento real de provedores
- Análise de spam score

**Configuração:**

```bash
# .env.development
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=seu_usuario_mailtrap
SMTP_PASS=sua_senha_mailtrap
EMAIL_FROM=noreply@axisor.local
EMAIL_FROM_NAME=Axisor Platform
```

**Vantagens:**
- ✅ Testa renderização em diferentes clientes
- ✅ Verifica spam score
- ✅ Analisa links e imagens
- ✅ Múltiplos membros da equipe podem acessar

---

## 🚀 Produção

### **Opção 1: AWS SES (Recomendada para produção)**

**Por que AWS SES?**
- 💰 **Custo**: $0.10 por 1.000 emails
- 🚀 **Performance**: Alta entrega e velocidade
- 📊 **Analytics**: Métricas detalhadas
- 🔐 **Segurança**: SPF, DKIM, DMARC automáticos
- 📧 **Volume**: Até 62.000 emails/dia (free tier)

**Setup:**

1. **Criar conta AWS e verificar domínio**
2. **Configurar credenciais IAM**
3. **Variáveis de ambiente:**

```bash
# .env.production
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=AKIAIOSFODNN7EXAMPLE  # IAM Access Key
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # IAM Secret
EMAIL_FROM=noreply@axisor.com
EMAIL_FROM_NAME=Axisor Platform
```

**Custo Estimado:**
- 10.000 emails/mês = $1.00
- 50.000 emails/mês = $5.00
- 100.000 emails/mês = $10.00

---

### **Opção 2: SendGrid**

**Vantagens:**
- 🎁 100 emails/dia grátis
- 📊 Dashboard intuitivo
- 🎨 Editor de templates visual

**Setup:**

```bash
# .env.production
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=apikey
SMTP_PASS=SG.sua_api_key_aqui
EMAIL_FROM=noreply@axisor.com
EMAIL_FROM_NAME=Axisor Platform
```

**Custo:**
- Free: 100 emails/dia
- Essentials ($19.95/mês): 50.000 emails/mês
- Pro ($89.95/mês): 100.000 emails/mês

---

### **Opção 3: Resend (Moderna e Developer-Friendly)**

**Por que Resend?**
- 🎨 Templates em React
- 📊 Analytics em tempo real
- 🚀 API moderna
- 💰 3.000 emails/mês grátis

**Setup:**

```bash
# .env.production
RESEND_API_KEY=re_123456789
EMAIL_FROM=noreply@axisor.com
EMAIL_FROM_NAME=Axisor Platform
```

**Custo:**
- Free: 3.000 emails/mês + 100/dia
- Pro ($20/mês): 50.000 emails/mês
- Business ($90/mês): 200.000 emails/mês

---

## 💻 Implementação

### **1. Instalar Dependências**

```bash
cd backend
npm install nodemailer @types/nodemailer
# Para templates mais bonitos
npm install handlebars mjml
```

### **2. Criar Serviço de Email**

**Estrutura de arquivos:**
```
backend/src/
├── services/
│   └── email.service.ts
├── templates/
│   ├── emails/
│   │   ├── verification.hbs
│   │   ├── coupon-confirmation.hbs
│   │   ├── password-reset.hbs
│   │   ├── margin-alert.hbs
│   │   └── daily-report.hbs
│   └── layouts/
│       └── base.hbs
└── config/
    └── email.config.ts
```

### **3. Configuração Base**

```typescript
// backend/src/config/email.config.ts
import nodemailer from 'nodemailer';

export const emailConfig = {
  host: process.env.SMTP_HOST || 'mailhog',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
};

export const createTransporter = () => {
  return nodemailer.createTransport(emailConfig);
};
```

### **4. Serviço de Email**

```typescript
// backend/src/services/email.service.ts
import { createTransporter } from '../config/email.config';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

export class EmailService {
  private transporter;
  private templatesDir: string;

  constructor() {
    this.transporter = createTransporter();
    this.templatesDir = path.join(__dirname, '../templates/emails');
  }

  /**
   * Renderiza template de email
   */
  private async renderTemplate(
    templateName: string,
    data: Record<string, any>
  ): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    return template(data);
  }

  /**
   * Envia email de verificação
   */
  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = await this.renderTemplate('verification', {
      verificationUrl,
      userName: to.split('@')[0],
    });

    await this.transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Axisor Platform',
        address: process.env.EMAIL_FROM || 'noreply@axisor.local',
      },
      to,
      subject: '✅ Verifique seu email - Axisor',
      html,
    });

    console.log(`📧 Verification email sent to ${to}`);
  }

  /**
   * Envia email de confirmação de cupom
   */
  async sendCouponConfirmationEmail(
    to: string,
    couponCode: string,
    discount: number,
    planName: string
  ) {
    const html = await this.renderTemplate('coupon-confirmation', {
      couponCode,
      discount,
      planName,
      userName: to.split('@')[0],
    });

    await this.transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Axisor Platform',
        address: process.env.EMAIL_FROM || 'noreply@axisor.local',
      },
      to,
      subject: `🎫 Cupom ${couponCode} aplicado com sucesso!`,
      html,
    });

    console.log(`📧 Coupon confirmation email sent to ${to}`);
  }

  /**
   * Envia email de recuperação de senha
   */
  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = await this.renderTemplate('password-reset', {
      resetUrl,
      userName: to.split('@')[0],
    });

    await this.transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Axisor Platform',
        address: process.env.EMAIL_FROM || 'noreply@axisor.local',
      },
      to,
      subject: '🔐 Recuperação de Senha - Axisor',
      html,
    });

    console.log(`📧 Password reset email sent to ${to}`);
  }

  /**
   * Envia alerta de margem
   */
  async sendMarginAlertEmail(
    to: string,
    currentMargin: number,
    threshold: number,
    positionDetails: any
  ) {
    const html = await this.renderTemplate('margin-alert', {
      currentMargin,
      threshold,
      positionDetails,
      userName: to.split('@')[0],
    });

    await this.transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Axisor Platform',
        address: process.env.EMAIL_FROM || 'noreply@axisor.local',
      },
      to,
      subject: '⚠️ Alerta de Margem - Ação Necessária',
      html,
      priority: 'high',
    });

    console.log(`📧 Margin alert email sent to ${to}`);
  }

  /**
   * Envia relatório diário
   */
  async sendDailyReportEmail(to: string, reportData: any) {
    const html = await this.renderTemplate('daily-report', {
      ...reportData,
      userName: to.split('@')[0],
    });

    await this.transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Axisor Platform',
        address: process.env.EMAIL_FROM || 'noreply@axisor.local',
      },
      to,
      subject: `📊 Relatório Diário - ${new Date().toLocaleDateString('pt-BR')}`,
      html,
    });

    console.log(`📧 Daily report email sent to ${to}`);
  }

  /**
   * Testa conexão SMTP
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error);
      return false;
    }
  }
}
```

---

## 🎨 Templates de Email

### **Template Base (Handlebars)**

```handlebars
<!-- backend/src/templates/emails/verification.hbs -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background: #f8f8f8;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Axisor Platform</h1>
    </div>
    <div class="content">
      <h2>Olá, {{userName}}!</h2>
      <p>Obrigado por se registrar no Axisor. Para completar seu cadastro, precisamos verificar seu email.</p>
      <p>Clique no botão abaixo para verificar sua conta:</p>
      <center>
        <a href="{{verificationUrl}}" class="button">✅ Verificar Email</a>
      </center>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Se você não criou uma conta, pode ignorar este email.
      </p>
      <p style="color: #666; font-size: 14px;">
        Este link expira em 24 horas.
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Axisor Platform. Todos os direitos reservados.</p>
      <p>Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
```

---

## 🧪 Testes

### **Endpoint de Teste**

```typescript
// backend/src/routes/email.routes.ts
import { FastifyInstance } from 'fastify';
import { EmailService } from '../services/email.service';

export async function emailRoutes(fastify: FastifyInstance) {
  const emailService = new EmailService();

  // Testar conexão SMTP
  fastify.get('/api/email/test-connection', async (request, reply) => {
    const isConnected = await emailService.testConnection();
    return {
      success: isConnected,
      message: isConnected ? 'Email service is working' : 'Email service failed',
    };
  });

  // Enviar email de teste
  fastify.post('/api/email/test-send', async (request, reply) => {
    const { to } = request.body as { to: string };
    
    try {
      await emailService.sendVerificationEmail(to, 'test-token-123');
      return {
        success: true,
        message: `Test email sent to ${to}`,
      };
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  });
}
```

---

## 📊 Comparação de Provedores

| Provedor | Free Tier | Custo (10k/mês) | Custo (100k/mês) | Recursos | Recomendado |
|----------|-----------|-----------------|------------------|----------|-------------|
| **AWS SES** | 62k/dia | $1 | $10 | Analytics, SPF/DKIM | ✅ Produção |
| **SendGrid** | 100/dia | $19.95 | $89.95 | Templates, API | Médio Porte |
| **Resend** | 3k/mês | $20 | $90 | React Templates | Startups |
| **MailHog** | Ilimitado | Grátis | Grátis | UI Local | ✅ Desenvolvimento |
| **Mailtrap** | 500/mês | $15 | $100 | Testing Tools | Desenvolvimento |

---

## 🚀 Próximos Passos

1. ✅ Adicionar MailHog ao docker-compose.dev.yml
2. ✅ Criar EmailService
3. ✅ Criar templates base
4. ⏳ Integrar com fluxo de registro
5. ⏳ Adicionar fila de emails (BullMQ)
6. ⏳ Configurar AWS SES para produção
7. ⏳ Implementar tracking de emails

---

## 🔧 Troubleshooting

### Emails não chegam (Development)
- Verifique se MailHog está rodando: `docker ps | grep mailhog`
- Acesse UI: http://localhost:8025
- Verifique variáveis de ambiente

### Emails vão para spam (Production)
- Configure SPF record
- Configure DKIM
- Configure DMARC
- Use domínio verificado
- Evite palavras spam (FREE, URGENT, etc)

### Performance lenta
- Use fila de emails (BullMQ)
- Implemente retry logic
- Use templates pré-compilados
- Considere serviço dedicado

---

**Criado em**: 2025-10-16  
**Última atualização**: 2025-10-16  
**Autor**: Sistema Axisor


