---
title: "Authentication Issues Troubleshooting"
category: troubleshooting
subcategory: authentication
tags: [authentication, email-verification, magic-link, otp, troubleshooting]
priority: high
status: active
last_updated: 2025-01-22
version: "1.0"
authors: ["Axisor Team"]
reviewers: ["DevOps Team", "Security Team"]
---

# Authentication Issues Troubleshooting

## Summary

Comprehensive troubleshooting guide for authentication and email verification issues in the Axisor platform. This document covers common problems, debugging steps, and solutions for Magic Link, OTP verification, and related authentication flows.

## Common Issues

### 1. Magic Link Token Not Found

**Symptoms**: User clicks magic link, sees "invalid token" error or redirects to error page.

**Root Cause**: Token hash mismatch in database or token truncation in URL.

**Debug Steps**:
1. Check token length in email (should be 64 characters)
2. Verify token is not truncated in URL
3. Check database for SHA256 hash (64 hex characters)
4. Verify backend hashes received token before comparison

**Solution**:
```typescript
// Ensure token generation uses SHA256
const token = crypto.randomBytes(32).toString('hex'); // 64 chars
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

// Verify token comparison
const receivedTokenHash = crypto.createHash('sha256').update(receivedToken).digest('hex');
const isValid = receivedTokenHash === storedTokenHash;
```

**Prevention**:
- Always use SHA256 hashing for token storage
- Implement proper URL encoding for magic links
- Add token length validation

### 2. OTP Validation Failed

**Symptoms**: User enters OTP code, gets "INVALID_CODE" error consistently.

**Root Cause**: OTP not stored correctly or hash comparison failing.

**Debug Steps**:
1. Check if OTP was generated and stored in database
2. Verify OTP hash comparison logic
3. Check expiration time (10 minutes)
4. Verify rate limiting not blocking requests

**Solution**:
```typescript
// Ensure OTP is stored with bcrypt
const otp = Math.floor(100000 + Math.random() * 900000).toString();
const otpHash = await bcrypt.hash(otp, 10);

// Store in separate field to avoid conflicts
await prisma.user.update({
  where: { id: userId },
  data: {
    password_reset_token: otpHash, // Temporary storage
    password_reset_expires: new Date(Date.now() + 10 * 60 * 1000)
  }
});
```

### 3. Email Not Delivered

**Symptoms**: User doesn't receive verification email after registration.

**Root Cause**: SMTP configuration, DNS records, or email service issues.

**Debug Steps**:
1. Check MailHog logs (development): http://localhost:8025
2. Verify SMTP configuration in environment variables
3. Check DNS records (SPF, DKIM, DMARC)
4. Monitor bounce rates and delivery statistics

**Solution**:
```bash
# Check MailHog for development
curl http://localhost:8025/api/v1/messages

# Verify SMTP configuration
echo $SMTP_HOST
echo $SMTP_PORT
echo $SMTP_USER
```

**Prevention**:
- Use reputable email service (SendGrid, AWS SES, etc.)
- Configure proper DNS records
- Monitor deliverability rates

### 4. Rate Limiting Issues

**Symptoms**: Users get "RATE_LIMIT_EXCEEDED" errors when trying to verify.

**Root Cause**: Rate limiting configuration too strict or Redis connection issues.

**Debug Steps**:
1. Check Redis connection status
2. Verify rate limiting configuration
3. Check if legitimate users are being blocked
4. Monitor rate limit metrics

**Solution**:
```typescript
// Check rate limiting configuration
export const otpRateLimit = rateLimit({
  max: 5, // 5 attempts
  timeWindow: '15 minutes',
  keyGenerator: (request) => {
    const { email } = request.body as { email: string };
    return `${request.ip}-${email}`;
  }
});
```

### 5. JWT Payload Inconsistency (RESOLVED)

**Symptoms**: After successful email verification, users redirected to login page with "Invalid session" error. Backend logs showed:
```
🔍 VALIDATE SESSION - JWT decoded successfully: {
  sub: undefined,  // ❌ PROBLEMA AQUI!
  email: 'user@example.com',
  email_verified: undefined
}
❌ VALIDATE SESSION - No user ID in JWT payload
```

**Root Cause**: **Inconsistency between JWT generation and validation:**
- **JWT Generation**: Used `userId` in payload
- **JWT Validation**: Expected `sub` in payload

**Solution**:
**Fixed JWT generation to use standard `sub` field:**

```typescript
// ❌ ANTES (INCORRETO)
return this.fastify.jwt.sign({
  userId: user.id,  // ❌ Campo não padrão
  email: user.email,
  planType: user.plan_type,
});

// ✅ DEPOIS (CORRETO)
return this.fastify.jwt.sign({
  sub: user.id,  // ✅ Campo padrão JWT
  email: user.email,
  planType: user.plan_type,
});
```

**Files Modified**:
- `backend/src/services/auth.service.ts`:
  - `generateAccessToken()`: Changed `userId` → `sub`
  - `generateRefreshToken()`: Changed `userId` → `sub`
  - `refreshToken()`: Changed `decoded.userId` → `decoded.sub`

**Verification**:
After fix, JWT payload now contains:
```json
{
  "sub": "user-id-here",
  "email": "user@example.com",
  "planType": "free",
  "iat": 1761186344,
  "exp": 1761193544
}
```

**Status**: ✅ **RESOLVED** - Magic Link and OTP verification now work correctly

### 6. Coupon Plan Assignment Bug (RESOLVED)

**Problem**: Users registering with 100% discount coupons (e.g., "BETATESTER") were incorrectly assigned the "Free" plan instead of the coupon's specified plan (e.g., "Lifetime").

**Symptoms**:
- User registers with coupon "BETATESTER" (100% OFF + Lifetime)
- User gets `plan_type: 'free'` instead of `plan_type: 'lifetime'`
- Dashboard shows "Free" plan instead of "Lifetime"
- Features remain locked despite having valid coupon

**Root Cause**: The registration flow was not checking for 100% discount coupons during user creation, defaulting to `plan_type: 'free'` regardless of coupon benefits.

**Solution**: Updated `backend/src/services/registration.service.ts` to check for 100% discount coupons during `savePersonalData`:

```typescript
// Check if user has a 100% discount coupon with plan_type
let userPlanType = 'free'; // Default plan
let couponData = null;

if (data.couponCode) {
  const coupon = await this.prisma.coupon.findUnique({
    where: { code: data.couponCode },
    select: {
      id: true,
      code: true,
      value_type: true,
      value_amount: true,
      plan_type: true,
      is_active: true,
      expires_at: true
    }
  });
  
  if (coupon && coupon.is_active && (!coupon.expires_at || coupon.expires_at > new Date())) {
    // If coupon has 100% discount + plan_type, use coupon's plan
    if (coupon.value_type === 'percentage' && coupon.value_amount === 100 && coupon.plan_type) {
      userPlanType = coupon.plan_type;
      couponData = {
        code: coupon.code,
        value_type: coupon.value_type,
        value_amount: coupon.value_amount,
        plan_type: coupon.plan_type
      };
    }
  }
}

// Create user with correct plan
const user = await this.prisma.user.create({
  data: {
    // ... other fields
    plan_type: userPlanType, // Use coupon plan if applicable
  }
});
```

**Files Modified**:
- `backend/src/services/registration.service.ts` - `savePersonalData()` method

**Verification**:
After the fix, users with 100% discount coupons are automatically assigned the coupon's plan type and skip the plan selection step.

**Status**: ✅ **RESOLVED** - Coupon plan assignment now works correctly

### 7. Redirect Loop After Verification

**Symptoms**: User verifies email but gets stuck in redirect loop (Dashboard → Login → Dashboard).

**Root Cause**: Authentication guards not recognizing JWT cookie or session state issues.

**Debug Steps**:
1. Check if JWT cookie is being set correctly
2. Verify cookie attributes (HttpOnly, Secure, SameSite)
3. Check authentication guard logic
4. Verify session state management

**Solution**:
```typescript
// Ensure proper cookie configuration
reply.setCookie('access_token', jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 // 7 days
});

// Redirect to login instead of dashboard
return reply.redirect(`${process.env.FRONTEND_URL}/login?verified=true&message=account_created&email=${encodeURIComponent(user.email)}`);
```

### 7. Database Connection Issues

**Symptoms**: Prisma migration fails with authentication errors.

**Root Cause**: Database credentials or connection configuration issues.

**Debug Steps**:
1. Verify database credentials in environment variables
2. Check database server status
3. Verify network connectivity
4. Check Prisma configuration

**Solution**:
```bash
# Check database connection
npx prisma db pull

# Verify environment variables
echo $DATABASE_URL

# Test connection
npx prisma db push
```

## Debugging Tools

### 1. Log Analysis

**Backend Logs**:
```bash
# Check backend logs
docker logs axisor-backend

# Filter authentication logs
docker logs axisor-backend | grep -i "auth\|verification\|token"
```

**Frontend Logs**:
```bash
# Check browser console for errors
# Look for network requests to /api/auth/verify-email
```

### 2. Database Inspection

**Check User Records**:
```sql
-- Check user verification status
SELECT email, email_verified, account_status, email_verification_token 
FROM "User" 
WHERE email = 'user@example.com';

-- Check token length and format
SELECT 
  email,
  LENGTH(email_verification_token) as token_length,
  email_verification_expires
FROM "User" 
WHERE email_verification_token IS NOT NULL;
```

**Check Rate Limiting**:
```bash
# Check Redis for rate limiting keys
redis-cli
> KEYS "*rate*"
> KEYS "*otp*"
```

### 3. Email Testing

**Development Environment**:
```bash
# Check MailHog
curl http://localhost:8025/api/v1/messages

# Test email endpoint
curl -X POST http://localhost:13010/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

**Production Environment**:
- Check email service dashboard (SendGrid, AWS SES, etc.)
- Monitor bounce rates and delivery statistics
- Check spam folder and email client compatibility

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Email Deliverability**: >98% delivery rate
2. **Verification Success Rate**: >95% verify within 24h
3. **Rate Limit Effectiveness**: <0.1% false positives
4. **Error Rates**: <0.5% verification failures
5. **Token Generation**: 100% success rate

### Alert Conditions

```yaml
# Example alerting rules
alerts:
  - name: "Email Delivery Rate Low"
    condition: "email_delivery_rate < 0.95"
    severity: "warning"
    
  - name: "Verification Success Rate Low"
    condition: "verification_success_rate < 0.90"
    severity: "critical"
    
  - name: "Rate Limit False Positives High"
    condition: "rate_limit_false_positives > 0.01"
    severity: "warning"
```

## Prevention Strategies

### 1. Token Security

- Use SHA256 hashing for Magic Link tokens
- Implement proper token expiration
- Store tokens securely in database
- Use separate fields for different token types

### 2. Rate Limiting

- Configure appropriate limits for different endpoints
- Use IP + email combination for key generation
- Monitor false positive rates
- Implement progressive delays for repeated failures

### 3. Email Deliverability

- Use reputable email service providers
- Configure proper DNS records (SPF, DKIM, DMARC)
- Monitor bounce rates and spam complaints
- Implement email authentication best practices

### 4. Error Handling

- Provide clear error messages to users
- Log detailed information for debugging
- Implement proper fallback mechanisms
- Use structured logging for better analysis

## Related Documentation

- [Email Verification Security](../security/authentication/email-verification.md)
- [Registration Flow](../features/registration-verification-flow.md)
- [API Documentation](../api/authentication-endpoints.md)
- [Security Best Practices](../security/security-best-practices.md)

---

## How to Use This Document

• **For Developers**: Use as reference for debugging authentication issues and understanding common problems.

• **For DevOps**: Use to understand monitoring requirements, alerting conditions, and infrastructure considerations.

• **For Support**: Use to help users resolve authentication and verification issues.

• **For Security Team**: Use to understand potential security issues and prevention strategies.


---

## Conteúdo Adicional

# 🔍 **GUIA DE DEBUG PARA PROBLEMA DE CREDENCIAIS**

## 📋 **DIAGNÓSTICO CONFIRMADO**

✅ **Backend está funcionando perfeitamente**
- Endpoints de credenciais funcionando
- Autenticação funcionando
- Salvamento de credenciais funcionando
- LN Markets exchange configurada corretamente

❌ **Problema está no frontend**
- Usuário pode não estar autenticado
- Token pode não estar sendo enviado
- Erro na implementação do frontend

---

## 🛠️ **PASSOS PARA DEBUGGING**

### **1. Verificar Autenticação no Frontend**

1. Abra o navegador em `http://localhost:13000`
2. Faça login com `brainoschris@gmail.com` / `TestPassword123!`
3. Abra o Console do navegador (F12 > Console)
4. Verifique se há erros de autenticação

### **2. Verificar Token JWT**

No console do navegador, execute:
```javascript
// Verificar se o token existe
console.log('Token:', localStorage.getItem('access_token'));

// Verificar se o token é válido
const token = localStorage.getItem('access_token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Token expira em:', new Date(payload.exp * 1000));
  } catch (e) {
    console.error('Token inválido:', e);
  }
}
```

### **3. Verificar Requisições de Credenciais**

1. Vá para Profile Settings > Account Security
2. Tente salvar credenciais
3. No Console, procure por:
   - Requisições para `/api/exchanges`
   - Requisições para `/api/user/exchange-credentials`
   - Erros de autenticação (401)
   - Erros de validação (400)

### **4. Verificar Logs do Backend**

Em outro terminal, monitore os logs:
```bash
docker logs axisor-backend --tail 20 -f
```

Procure por:
- Requisições de credenciais
- Erros de autenticação
- Erros de validação

### **5. Testar Manualmente**

No console do navegador, execute:
```javascript
// Testar salvamento de credenciais manualmente
async function testCredentials() {
  try {
    const response = await fetch('/api/user/exchange-credentials', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        exchange_id: '715d4e53-08ac-46a2-98e6-6c689c838af0',
        credentials: {
          api_key: 'test-key',
          api_secret: 'test-secret',
          passphrase: 'test-passphrase'
        }
      })
    });
    
    const result = await response.json();
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Erro:', error);
  }
}

testCredentials();
```

---

## 🎯 **POSSÍVEIS CAUSAS**

### **1. Usuário Não Autenticado**
- Token expirado
- Token inválido
- Usuário não fez login

### **2. Token Não Enviado**
- Interceptor do Axios não funcionando
- Token não salvo no localStorage
- Problema com o interceptor

### **3. Erro na Implementação**
- ExchangeCredentialsService não sendo chamado
- Erro na lógica do frontend
- Problema com o formulário

### **4. Problema de CORS**
- Requisições bloqueadas
- Headers não enviados
- Problema de proxy

---

## 🔧 **SOLUÇÕES POSSÍVEIS**

### **1. Se Token Expirado**
```javascript
// Limpar tokens e fazer login novamente
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
window.location.href = '/login';
```

### **2. Se Token Não Enviado**
- Verificar interceptor do Axios
- Verificar se o token está sendo salvo
- Verificar se o interceptor está funcionando

### **3. Se Erro na Implementação**
- Verificar se ExchangeCredentialsService está sendo chamado
- Verificar se o formulário está funcionando
- Verificar se há erros no console

### **4. Se Problema de CORS**
- Verificar configuração do proxy
- Verificar headers da requisição
- Verificar se o backend está acessível

---

## 📞 **PRÓXIMOS PASSOS**

1. **Execute os testes acima**
2. **Verifique os logs do backend**
3. **Verifique o console do navegador**
4. **Reporte os erros encontrados**

---

## 🎉 **CONFIRMAÇÃO**

O backend está funcionando perfeitamente. O problema está no frontend e pode ser resolvido seguindo os passos acima.

