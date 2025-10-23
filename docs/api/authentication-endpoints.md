---
title: "Authentication API Endpoints"
category: api
subcategory: authentication
tags: [api, authentication, email-verification, magic-link, otp, endpoints]
priority: high
status: active
last_updated: 2025-01-22
version: "1.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team", "Security Team"]
---

# Authentication API Endpoints

## Summary

Complete API documentation for authentication and email verification endpoints in the Axisor platform. This document covers all authentication-related endpoints, including Magic Link verification, OTP validation, and related authentication flows.

## Base URL

```
Development: http://localhost:13010/api
Production: https://api.axisor.com/api
```

## Authentication Endpoints

### 1. Magic Link Email Verification

#### GET /api/auth/verify-email/:token

Verifies email via magic link token.

**Parameters**:
- `token` (path, required): 64-character hex string

**Request Example**:
```bash
curl -X GET "http://localhost:13010/api/auth/verify-email/abc123def456..."
```

**Success Response**:
- Status: `302 Found`
- Headers:
  - `Set-Cookie`: `access_token=<JWT>; HttpOnly; Secure; SameSite=Lax`
  - `Location`: `/login?verified=true&message=account_created&email=user@example.com`

**Error Response**:
- Status: `302 Found`
- Headers:
  - `Location`: `/verify-email?status=error&message=invalid_token`

**Implementation Details**:
```typescript
// Token validation with SHA256 hashing
const receivedTokenHash = crypto.createHash('sha256').update(token).digest('hex');
const user = await prisma.user.findFirst({
  where: {
    email_verification_token: receivedTokenHash,
    email_verification_expires: { gt: new Date() }
  }
});
```

### 2. OTP Email Verification

#### POST /api/auth/verify-email/otp

Verifies email via OTP code.

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Request Example**:
```bash
curl -X POST "http://localhost:13010/api/auth/verify-email/otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

**Success Response**:
```json
{
  "success": true,
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "email_verified": true
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "INVALID_CODE",
  "message": "Código de verificação inválido ou expirado"
}
```

**Rate Limiting**:
- 5 attempts per 15 minutes per IP+email combination
- Returns `429 Too Many Requests` when limit exceeded

### 3. Generate OTP

#### POST /api/auth/generate-otp

Generates a new OTP code for email verification.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Request Example**:
```bash
curl -X POST "http://localhost:13010/api/auth/generate-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Success Response**:
```json
{
  "success": true,
  "message": "OTP enviado por email"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "USER_NOT_FOUND",
  "message": "Usuário não encontrado"
}
```

**Rate Limiting**:
- 3 requests per hour per IP+email combination

### 4. Check Verification Status

#### GET /api/auth/verification-status

Checks if user's email is verified.

**Query Parameters**:
- `email` (required): User's email address

**Request Example**:
```bash
curl -X GET "http://localhost:13010/api/auth/verification-status?email=user@example.com"
```

**Success Response**:
```json
{
  "verified": true,
  "email": "user@example.com",
  "account_status": "active"
}
```

**Unverified Response**:
```json
{
  "verified": false,
  "email": "user@example.com",
  "account_status": "pending_verification"
}
```

### 5. Resend Verification Email

#### POST /api/auth/resend-verification

Resends verification email with new Magic Link and OTP.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Request Example**:
```bash
curl -X POST "http://localhost:13010/api/auth/resend-verification" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Success Response**:
```json
{
  "success": true,
  "message": "Email de verificação reenviado"
}
```

**Rate Limiting**:
- 3 resends per hour per IP+email combination

## User Authentication Endpoints

### 6. User Login

#### POST /api/auth/login

Authenticates user with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Success Response**:
```json
{
  "success": true,
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "email_verified": true,
    "account_status": "active"
  }
}
```

### 7. User Registration

#### POST /api/registration/personal-data

Registers new user with personal data.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "password": "securepassword",
  "emailMarketingConsent": true
}
```

**Success Response**:
```json
{
  "success": true,
  "userId": "user_123",
  "nextStep": "plan_selection",
  "message": "Personal data saved successfully. Please check your email to verify your account."
}
```

## Entitlements Endpoints

### 8. Get User Entitlements

#### GET /api/me/entitlements

Gets user's current entitlements and plan information.

**Headers**:
- `Authorization`: `Bearer <JWT>` (required)

**Request Example**:
```bash
curl -X GET "http://localhost:13010/api/me/entitlements" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response**:
```json
{
  "entitlements": [
    {
      "id": "ent_123",
      "plan_type": "free",
      "features": ["dashboard", "demo_mode"],
      "expires_at": null,
      "is_active": true
    }
  ],
  "plan": {
    "type": "free",
    "name": "Free Plan",
    "features": ["Dashboard", "Demo Mode", "Basic Support"]
  }
}
```

### 9. Choose Plan

#### POST /api/plans/choose

Selects a plan for the user.

**Headers**:
- `Authorization`: `Bearer <JWT>` (required)

**Request Body**:
```json
{
  "plan_type": "pro",
  "coupon_code": "WELCOME20"
}
```

**Success Response**:
```json
{
  "success": true,
  "entitlements": [
    {
      "id": "ent_456",
      "plan_type": "pro",
      "features": ["dashboard", "trading", "analytics"],
      "expires_at": "2025-02-22T00:00:00Z",
      "is_active": true
    }
  ]
}
```

## Error Codes

### Common Error Responses

| Code | Error | Description |
|------|-------|-------------|
| 400 | `INVALID_REQUEST` | Invalid request body or parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

### Authentication-Specific Errors

| Code | Error | Description |
|------|-------|-------------|
| `INVALID_TOKEN` | Magic link token is invalid or expired |
| `INVALID_CODE` | OTP code is invalid or expired |
| `USER_NOT_FOUND` | User with specified email not found |
| `EMAIL_ALREADY_VERIFIED` | Email is already verified |
| `ACCOUNT_SUSPENDED` | Account is suspended or inactive |

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `/verify-email/otp` | 5 attempts | 15 minutes | IP + email |
| `/generate-otp` | 3 requests | 1 hour | IP + email |
| `/resend-verification` | 3 requests | 1 hour | IP + email |
| `/login` | 10 attempts | 15 minutes | IP + email |

### Rate Limit Headers

When rate limit is exceeded:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 900
```

## Security Considerations

### Token Security
- Magic Link tokens use SHA256 hashing for secure storage
- Tokens are single-use and invalidated after verification
- 24-hour expiration for Magic Link tokens
- 10-minute expiration for OTP codes

### Cookie Security
- JWT tokens stored in HttpOnly cookies
- Secure flag in production environments
- SameSite=Lax for CSRF protection
- 7-day expiration

### Rate Limiting
- IP + email combination for key generation
- Progressive delays for repeated failures
- Redis-based storage for distributed systems

## Testing

### Development Environment

**MailHog Integration**:
```bash
# Check captured emails
curl http://localhost:8025/api/v1/messages

# Test email endpoint
curl -X POST http://localhost:13010/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

**Database Inspection**:
```sql
-- Check user verification status
SELECT email, email_verified, account_status, email_verification_token 
FROM "User" 
WHERE email = 'test@example.com';

-- Check token format
SELECT 
  email,
  LENGTH(email_verification_token) as token_length,
  email_verification_expires
FROM "User" 
WHERE email_verification_token IS NOT NULL;
```

### Production Testing

**Health Check**:
```bash
curl -X GET "https://api.axisor.com/api/health"
```

**Verification Flow Test**:
```bash
# 1. Register user
curl -X POST "https://api.axisor.com/api/registration/personal-data" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"testpass123"}'

# 2. Check verification status
curl -X GET "https://api.axisor.com/api/auth/verification-status?email=test@example.com"

# 3. Generate OTP
curl -X POST "https://api.axisor.com/api/auth/generate-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 4. Verify with OTP
curl -X POST "https://api.axisor.com/api/auth/verify-email/otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

## Related Documentation

- [Email Verification Security](../security/authentication/email-verification.md)
- [Registration Flow](../features/registration-verification-flow.md)
- [Troubleshooting Guide](../troubleshooting/authentication-issues.md)
- [Security Best Practices](../security/security-best-practices.md)

---

## How to Use This Document

• **For Frontend Developers**: Use as reference for implementing authentication flows and handling API responses.

• **For Backend Developers**: Use to understand endpoint requirements, error handling, and security considerations.

• **For QA Engineers**: Use to understand test scenarios, expected responses, and edge cases for authentication endpoints.

• **For DevOps**: Use to understand rate limiting, monitoring requirements, and infrastructure considerations.
