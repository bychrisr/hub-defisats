# Templates de Email

## Estrutura

```
backend/src/templates/
├── emails/
│   ├── verification.hbs         # Link de verificação de email
│   ├── verification-code.hbs    # Código de 6 dígitos
│   ├── coupon-confirmation.hbs  # Confirmação de cupom
│   ├── password-reset.hbs       # Link de reset de senha
│   ├── margin-alert.hbs         # Alerta de margem crítica
│   └── daily-report.hbs         # Relatório diário
└── layouts/
    └── base.hbs                 # Layout reutilizável (futuro)
```

---

## Templates Disponíveis

### 1. Verification (Verificação de Email)

**Quando usar**: Após registro inicial

**Variáveis:**
- `userName`: Nome do usuário (derivado do email)
- `verificationUrl`: Link para verificar email (Magic Link)
- `otp`: Código OTP de 6 dígitos (opcional)
- `frontendUrl`: URL do frontend

**Template Structure:**
```handlebars
{{#if otp}}
<div class="otp-section">
  <p><strong>Use este código de verificação:</strong></p>
  <div class="otp-code">{{otp}}</div>
  <p class="expiry">Código expira em 10 minutos</p>
</div>

<div class="separator">- OU -</div>
{{/if}}

<div class="magic-link-section">
  <a href="{{verificationUrl}}" class="button">
    ✅ Verificar Meu Email
  </a>
  <p class="expiry">Link expira em 24 horas</p>
</div>
```

**Exemplo de uso:**
```typescript
await emailService.sendVerificationEmail(
  'user@example.com',
  'abc123xyz456token',
  '123456' // OTP opcional
);
```

---

### 2. Verification Code (Código de 6 Dígitos)

**Quando usar**: Registro com cupom 100% desconto (medium risk) - DEPRECATED

**Nota**: Este template foi substituído pelo template de verificação unificado que inclui tanto Magic Link quanto OTP.

**Variáveis:**
- `userName`: Nome do usuário
- `code`: Código de 6 dígitos
- `expiresIn`: Tempo de expiração em minutos (5)

**Exemplo de uso:**
```typescript
// DEPRECATED - Use sendVerificationEmail instead
await emailService.sendVerificationCodeEmail(
  'user@example.com',
  '123456'
);
```

---

### 3. Coupon Confirmation

**Quando usar**: Após aplicar cupom com sucesso

**Variáveis:**
- `userName`: Nome do usuário
- `couponCode`: Código do cupom
- `discount`: Valor do desconto
- `discountType`: 'percentage' | 'fixed'
- `planName`: Nome do plano

---

### 4. Password Reset

**Quando usar**: Usuário solicita recuperação de senha

**Variáveis:**
- `userName`: Nome do usuário
- `resetUrl`: Link para redefinir senha

---

### 5. Margin Alert

**Quando usar**: Margem abaixo do threshold

**Variáveis:**
- `userName`: Nome do usuário
- `currentMargin`: Margem atual (%)
- `threshold`: Threshold configurado (%)
- `positionDetails`: Objeto com detalhes da posição
- `dashboardUrl`: Link para o dashboard

---

### 6. Daily Report

**Quando usar**: Relatório diário automático

**Variáveis:**
- `userName`: Nome do usuário
- `today`: Data formatada
- `totalPL`: P&L total
- `totalTrades`: Número de trades
- `winRate`: Taxa de acerto (%)
- `roi`: Return on Investment (%)
- `dashboardUrl`: Link para o dashboard

---

## Design Guidelines

### Cores

**Gradientes principais:**
- Primary: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Success: `linear-gradient(135deg, #11998e 0%, #38ef7d 100%)`
- Warning: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
- Error: `linear-gradient(135deg, #dc3545 0%, #c82333 100%)`

### Typography

- Headings: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`
- Body: `line-height: 1.6, color: #333`
- Buttons: `font-weight: 600, border-radius: 8px`

### Responsividade

Todos os templates são responsivos e otimizados para:
- Desktop (Outlook, Gmail, Apple Mail)
- Mobile (Gmail app, iOS Mail, Android Mail)
- Dark mode (preserva legibilidade)

---

## Como Criar Novo Template

### 1. Criar arquivo .hbs

`backend/src/templates/emails/welcome.hbs`:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    /* Seu CSS aqui */
  </style>
</head>
<body>
  <div class="container">
    <h1>Olá, {{userName}}!</h1>
    <p>{{customMessage}}</p>
  </div>
</body>
</html>
```

### 2. Adicionar método no EmailService

`backend/src/services/email.service.ts`:
```typescript
async sendWelcomeEmail(to: string, customMessage: string) {
  const html = await this.renderTemplate('welcome', {
    userName: to.split('@')[0],
    customMessage,
  });

  await this.transporter.sendMail({
    from: emailFrom,
    to,
    subject: 'Bem-vindo ao Axisor!',
    html,
  });
}
```

### 3. Testar

```bash
curl -X POST http://localhost:13010/api/email/test-welcome \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

---

## Boas Práticas

### Do's ✅

- Use HTML inline CSS (compatibilidade)
- Teste em múltiplos clientes de email
- Inclua versão text/plain (fallback)
- Use imagens hospedadas (não anexos)
- Otimize para preview (primeiras 100 chars)

### Don'ts ❌

- Evite JavaScript (não funciona)
- Evite CSS externo (bloqueado)
- Evite fontes web externas
- Evite vídeos ou áudio
- Evite formulários complexos

---

## Ferramentas de Teste

### Desenvolvimento

- **MailHog**: http://localhost:8025 (captura emails)
- **Litmus**: Teste em 90+ clientes (pago)
- **Email on Acid**: Similar ao Litmus

### Análise de Spam

- **Mail Tester**: https://www.mail-tester.com
- **GlockApps**: Teste de deliverability
- **Postmark Spam Check**: Análise gratuita

---

**Criado em**: 2025-10-22  
**Autor**: Sistema Axisor

