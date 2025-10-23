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

### 5. Redirect Loop After Verification

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

### 6. Database Connection Issues

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
