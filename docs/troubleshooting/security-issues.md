---
title: Security Issues Troubleshooting
category: troubleshooting
subcategory: security-issues
tags: [security, authentication, authorization, data-protection, api-security, troubleshooting, vulnerabilities]
priority: critical
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Security Team", "Backend Team"]
---

# Security Issues Troubleshooting

## Summary

Comprehensive guide to troubleshooting security-related issues within the Axisor platform. This document covers common problems in authentication, authorization, data protection, and API security, offering diagnostic steps and solutions to address vulnerabilities and misconfigurations.

## Authentication Issues

### 1. Invalid or Expired JWT Tokens

**Symptoms:**
- Users are frequently logged out
- API requests return `401 Unauthorized` with messages like "Invalid authorization token" or "Session expired"
- `authMiddleware` or `authenticateAdmin` in `backend/src/middleware/auth.middleware.ts` fail

**Root Causes:**
- Expired JWT `exp` claim has passed
- Invalid signature: Token tampered with or signed with a wrong secret
- Revoked tokens: Token explicitly revoked (e.g., on logout or password change)
- Missing token: `Authorization` header is missing or malformed

**Solutions:**

```bash
# 1. Check JWT token validity
kubectl exec -n axisor <backend-pod> -- node -e "
const jwt = require('jsonwebtoken');

async function checkJWTToken() {
  const token = process.env.JWT_SECRET || 'your-jwt-secret';
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Replace with actual token
  
  try {
    const decoded = jwt.verify(testToken, token);
    console.log('Token is valid:', decoded);
    console.log('Expires at:', new Date(decoded.exp * 1000));
    console.log('Time until expiration:', Math.floor((decoded.exp * 1000 - Date.now()) / 1000), 'seconds');
  } catch (error) {
    console.error('Token validation failed:', error.message);
  }
}

checkJWTToken();
"

# 2. Check JWT secret configuration
kubectl exec -n axisor <backend-pod> -- node -e "
console.log('JWT Secret configured:', !!process.env.JWT_SECRET);
console.log('JWT Secret length:', process.env.JWT_SECRET?.length || 0);
console.log('JWT Expiration time:', process.env.JWT_EXPIRATION_TIME || 'Not set');
"

# 3. Verify session in database
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserSessions() {
  const sessions = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      session_expires_at: true,
      last_login: true
    },
    where: {
      session_expires_at: {
        not: null
      }
    },
    orderBy: {
      last_login: 'desc'
    },
    take: 10
  });
  
  console.log('Active user sessions:');
  sessions.forEach(session => {
    const isExpired = session.session_expires_at < new Date();
    console.log(`${session.email}: expires ${session.session_expires_at}, expired: ${isExpired}`);
  });
}

checkUserSessions();
"

# 4. Check refresh token status
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRefreshTokens() {
  const refreshTokens = await prisma.refreshToken.findMany({
    select: {
      id: true,
      user_id: true,
      expires_at: true,
      is_revoked: true,
      created_at: true
    },
    where: {
      expires_at: {
        gte: new Date()
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 10
  });
  
  console.log('Active refresh tokens:');
  refreshTokens.forEach(token => {
    const isExpired = token.expires_at < new Date();
    console.log(`Token ${token.id}: expires ${token.expires_at}, expired: ${isExpired}, revoked: ${token.is_revoked}`);
  });
}

checkRefreshTokens();
"
```

**JWT Token Debugging Service**
```typescript
export class JWTTokenDebugger {
  private jwt: any;
  private prisma: PrismaClient;
  private logger: Logger;
  
  constructor(jwt: any, prisma: PrismaClient, logger: Logger) {
    this.jwt = jwt;
    this.prisma = prisma;
    this.logger = logger;
  }
  
  async debugToken(token: string): Promise<TokenDebugInfo> {
    const debugInfo: TokenDebugInfo = {
      token,
      timestamp: new Date().toISOString(),
      tests: [],
      issues: [],
      recommendations: []
    };
    
    try {
      // Test 1: Token format validation
      const formatTest = this.testTokenFormat(token);
      debugInfo.tests.push(formatTest);
      
      if (!formatTest.success) {
        debugInfo.issues.push('Invalid token format');
        debugInfo.recommendations.push('Check token format and structure');
        return debugInfo;
      }
      
      // Test 2: Token signature verification
      const signatureTest = await this.testTokenSignature(token);
      debugInfo.tests.push(signatureTest);
      
      if (!signatureTest.success) {
        debugInfo.issues.push('Invalid token signature');
        debugInfo.recommendations.push('Verify JWT secret and token integrity');
        return debugInfo;
      }
      
      // Test 3: Token expiration check
      const expirationTest = this.testTokenExpiration(token);
      debugInfo.tests.push(expirationTest);
      
      if (!expirationTest.success) {
        debugInfo.issues.push('Token has expired');
        debugInfo.recommendations.push('Refresh token or re-authenticate');
        return debugInfo;
      }
      
      // Test 4: User session validation
      const sessionTest = await this.testUserSession(token);
      debugInfo.tests.push(sessionTest);
      
      if (!sessionTest.success) {
        debugInfo.issues.push('User session is invalid');
        debugInfo.recommendations.push('Check user session status and permissions');
        return debugInfo;
      }
      
      return debugInfo;
    } catch (error) {
      debugInfo.issues.push(`Debug error: ${error.message}`);
      return debugInfo;
    }
  }
  
  private testTokenFormat(token: string): APITestResult {
    try {
      const parts = token.split('.');
      const isValidFormat = parts.length === 3 && parts.every(part => part.length > 0);
      
      return {
        name: 'Token Format Test',
        success: isValidFormat,
        details: `Parts: ${parts.length}, Valid: ${isValidFormat}`
      };
    } catch (error) {
      return {
        name: 'Token Format Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testTokenSignature(token: string): Promise<APITestResult> {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return {
          name: 'Token Signature Test',
          success: false,
          details: 'JWT_SECRET not configured'
        };
      }
      
      const decoded = this.jwt.verify(token, secret);
      
      return {
        name: 'Token Signature Test',
        success: true,
        details: `Decoded: ${JSON.stringify(decoded)}`
      };
    } catch (error) {
      return {
        name: 'Token Signature Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private testTokenExpiration(token: string): APITestResult {
    try {
      const decoded = this.jwt.decode(token);
      const now = Math.floor(Date.now() / 1000);
      const isExpired = decoded.exp < now;
      
      return {
        name: 'Token Expiration Test',
        success: !isExpired,
        details: `Expires: ${new Date(decoded.exp * 1000)}, Expired: ${isExpired}`
      };
    } catch (error) {
      return {
        name: 'Token Expiration Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testUserSession(token: string): Promise<APITestResult> {
    try {
      const decoded = this.jwt.decode(token);
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, session_expires_at: true, is_active: true }
      });
      
      if (!user) {
        return {
          name: 'User Session Test',
          success: false,
          details: 'User not found'
        };
      }
      
      if (!user.is_active) {
        return {
          name: 'User Session Test',
          success: false,
          details: 'User account is inactive'
        };
      }
      
      if (user.session_expires_at && user.session_expires_at < new Date()) {
        return {
          name: 'User Session Test',
          success: false,
          details: 'User session has expired'
        };
      }
      
      return {
        name: 'User Session Test',
        success: true,
        details: `User: ${user.email}, Active: ${user.is_active}`
      };
    } catch (error) {
      return {
        name: 'User Session Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
}
```

### 2. Two-Factor Authentication (2FA) Failures

**Symptoms:**
- Users cannot complete 2FA verification
- "Invalid 2FA code" errors
- 2FA setup failures

**Root Causes:**
- Time skew: User's device time is out of sync with the server
- Incorrect secret: 2FA secret stored or used is incorrect
- Rate limiting: Too many failed attempts triggering rate limits
- QR code generation issues

**Solutions:**

```bash
# 1. Check 2FA configuration
kubectl exec -n axisor <backend-pod> -- node -e "
console.log('2FA configuration:');
console.log('2FA enabled:', process.env.ENABLE_2FA === 'true');
console.log('2FA issuer:', process.env.TOTP_ISSUER || 'Not set');
console.log('2FA window:', process.env.TOTP_WINDOW || 'Not set');
"

# 2. Check 2FA secrets
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check2FASecrets() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      two_factor_secret: true,
      two_factor_enabled: true,
      two_factor_backup_codes: true
    },
    where: {
      two_factor_enabled: true
    }
  });
  
  console.log('Users with 2FA enabled:');
  users.forEach(user => {
    console.log(`${user.email}: secret configured: ${!!user.two_factor_secret}, backup codes: ${!!user.two_factor_backup_codes}`);
  });
}

check2FASecrets();
"

# 3. Test 2FA time synchronization
kubectl exec -n axisor <backend-pod> -- node -e "
const { authenticator } = require('otplib');

async function test2FATimeSync() {
  const secret = 'JBSWY3DPEHPK3PXP'; // Test secret
  const token = authenticator.generate(secret);
  const isValid = authenticator.verify({ token, secret });
  
  console.log('2FA time sync test:');
  console.log('Generated token:', token);
  console.log('Token valid:', isValid);
  console.log('Time window:', authenticator.options.window);
}

test2FATimeSync();
"

# 4. Check 2FA rate limiting
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check2FARateLimiting() {
  const recentAttempts = await prisma.twoFactorAttempt.findMany({
    select: {
      user_id: true,
      success: true,
      created_at: true
    },
    where: {
      created_at: {
        gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });
  
  console.log('2FA attempts in last hour:');
  const attemptsByUser = {};
  recentAttempts.forEach(attempt => {
    if (!attemptsByUser[attempt.user_id]) {
      attemptsByUser[attempt.user_id] = { total: 0, failed: 0 };
    }
    attemptsByUser[attempt.user_id].total++;
    if (!attempt.success) {
      attemptsByUser[attempt.user_id].failed++;
    }
  });
  
  Object.entries(attemptsByUser).forEach(([userId, stats]) => {
    console.log(`User ${userId}: ${stats.total} attempts, ${stats.failed} failed`);
  });
}

check2FARateLimiting();
"
```

## Authorization Issues

### 1. Permission Denied Errors

**Symptoms:**
- API requests return `403 Forbidden`
- Users cannot access certain features
- Admin panel access denied
- Resource access restrictions

**Root Causes:**
- Insufficient user permissions
- Incorrect role assignments
- Resource ownership validation failures
- IDOR (Insecure Direct Object Reference) issues

**Solutions:**

```bash
# 1. Check user roles and permissions
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserRoles() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      plan: true,
      is_active: true,
      permissions: true
    },
    where: {
      is_active: true
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 20
  });
  
  console.log('User roles and permissions:');
  users.forEach(user => {
    console.log(`${user.email}: role=${user.role}, plan=${user.plan}, active=${user.is_active}`);
    if (user.permissions) {
      console.log(`  Permissions: ${JSON.stringify(user.permissions)}`);
    }
  });
}

checkUserRoles();
"

# 2. Check admin user status
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminUsers() {
  const adminUsers = await prisma.adminUser.findMany({
    select: {
      id: true,
      user_id: true,
      role: true,
      permissions: true,
      is_active: true,
      created_at: true,
      user: {
        select: {
          email: true,
          is_active: true
        }
      }
    },
    where: {
      is_active: true
    }
  });
  
  console.log('Admin users:');
  adminUsers.forEach(admin => {
    console.log(`${admin.user.email}: role=${admin.role}, active=${admin.is_active}`);
    console.log(`  Permissions: ${JSON.stringify(admin.permissions)}`);
  });
}

checkAdminUsers();
"

# 3. Check resource access logs
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkResourceAccessLogs() {
  const accessLogs = await prisma.resourceAccessLog.findMany({
    select: {
      id: true,
      user_id: true,
      resource_type: true,
      resource_id: true,
      action: true,
      success: true,
      created_at: true,
      user: {
        select: {
          email: true
        }
      }
    },
    where: {
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      },
      success: false
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 20
  });
  
  console.log('Failed resource access attempts in last 24 hours:');
  accessLogs.forEach(log => {
    console.log(`${log.user.email}: ${log.action} ${log.resource_type}:${log.resource_id} - ${log.success ? 'SUCCESS' : 'FAILED'}`);
  });
}

checkResourceAccessLogs();
"

# 4. Test permission validation
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPermissionValidation() {
  // Test user permission validation
  const testUser = await prisma.user.findFirst({
    where: {
      role: 'USER'
    }
  });
  
  if (testUser) {
    console.log('Testing user permissions for:', testUser.email);
    
    // Check if user can access their own resources
    const ownResources = await prisma.tradeLog.findMany({
      where: {
        user_id: testUser.id
      },
      select: {
        id: true,
        user_id: true
      },
      take: 5
    });
    
    console.log('User can access own resources:', ownResources.length > 0);
    
    // Check if user can access other users' resources (should be false)
    const otherResources = await prisma.tradeLog.findMany({
      where: {
        user_id: {
          not: testUser.id
        }
      },
      select: {
        id: true,
        user_id: true
      },
      take: 5
    });
    
    console.log('User can access other users\' resources:', otherResources.length > 0);
  }
}

testPermissionValidation();
"
```

**Authorization Debugging Service**
```typescript
export class AuthorizationDebugger {
  private prisma: PrismaClient;
  private logger: Logger;
  
  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }
  
  async debugUserAccess(userId: string, resourceType: string, resourceId: string, action: string): Promise<AccessDebugInfo> {
    const debugInfo: AccessDebugInfo = {
      userId,
      resourceType,
      resourceId,
      action,
      timestamp: new Date().toISOString(),
      tests: [],
      issues: [],
      recommendations: []
    };
    
    try {
      // Test 1: User existence and status
      const userTest = await this.testUserStatus(userId);
      debugInfo.tests.push(userTest);
      
      if (!userTest.success) {
        debugInfo.issues.push('User not found or inactive');
        debugInfo.recommendations.push('Verify user account status');
        return debugInfo;
      }
      
      // Test 2: User role and permissions
      const roleTest = await this.testUserRole(userId);
      debugInfo.tests.push(roleTest);
      
      if (!roleTest.success) {
        debugInfo.issues.push('User role validation failed');
        debugInfo.recommendations.push('Check user role and permissions');
        return debugInfo;
      }
      
      // Test 3: Resource ownership
      const ownershipTest = await this.testResourceOwnership(userId, resourceType, resourceId);
      debugInfo.tests.push(ownershipTest);
      
      if (!ownershipTest.success) {
        debugInfo.issues.push('Resource ownership validation failed');
        debugInfo.recommendations.push('Verify resource ownership or admin permissions');
        return debugInfo;
      }
      
      // Test 4: Action permissions
      const actionTest = await this.testActionPermissions(userId, resourceType, action);
      debugInfo.tests.push(actionTest);
      
      if (!actionTest.success) {
        debugInfo.issues.push('Action permission validation failed');
        debugInfo.recommendations.push('Check user permissions for the requested action');
        return debugInfo;
      }
      
      return debugInfo;
    } catch (error) {
      debugInfo.issues.push(`Debug error: ${error.message}`);
      return debugInfo;
    }
  }
  
  private async testUserStatus(userId: string): Promise<APITestResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, is_active: true, role: true }
      });
      
      if (!user) {
        return {
          name: 'User Status Test',
          success: false,
          details: 'User not found'
        };
      }
      
      if (!user.is_active) {
        return {
          name: 'User Status Test',
          success: false,
          details: 'User account is inactive'
        };
      }
      
      return {
        name: 'User Status Test',
        success: true,
        details: `User: ${user.email}, Role: ${user.role}, Active: ${user.is_active}`
      };
    } catch (error) {
      return {
        name: 'User Status Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testUserRole(userId: string): Promise<APITestResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, permissions: true }
      });
      
      if (!user) {
        return {
          name: 'User Role Test',
          success: false,
          details: 'User not found'
        };
      }
      
      const validRoles = ['USER', 'ADMIN', 'SUPER_ADMIN'];
      const isValidRole = validRoles.includes(user.role);
      
      return {
        name: 'User Role Test',
        success: isValidRole,
        details: `Role: ${user.role}, Valid: ${isValidRole}, Permissions: ${JSON.stringify(user.permissions)}`
      };
    } catch (error) {
      return {
        name: 'User Role Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testResourceOwnership(userId: string, resourceType: string, resourceId: string): Promise<APITestResult> {
    try {
      // Check if user is admin (admins can access all resources)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        return {
          name: 'Resource Ownership Test',
          success: true,
          details: 'Admin user - access granted'
        };
      }
      
      // Check resource ownership based on type
      let isOwner = false;
      
      switch (resourceType) {
        case 'TradeLog':
          const tradeLog = await this.prisma.tradeLog.findUnique({
            where: { id: resourceId },
            select: { user_id: true }
          });
          isOwner = tradeLog?.user_id === userId;
          break;
          
        case 'Automation':
          const automation = await this.prisma.automation.findUnique({
            where: { id: resourceId },
            select: { user_id: true }
          });
          isOwner = automation?.user_id === userId;
          break;
          
        case 'User':
          isOwner = resourceId === userId;
          break;
          
        default:
          return {
            name: 'Resource Ownership Test',
            success: false,
            details: `Unknown resource type: ${resourceType}`
          };
      }
      
      return {
        name: 'Resource Ownership Test',
        success: isOwner,
        details: `Resource type: ${resourceType}, Owner: ${isOwner}`
      };
    } catch (error) {
      return {
        name: 'Resource Ownership Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testActionPermissions(userId: string, resourceType: string, action: string): Promise<APITestResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, permissions: true }
      });
      
      if (!user) {
        return {
          name: 'Action Permissions Test',
          success: false,
          details: 'User not found'
        };
      }
      
      // Check role-based permissions
      const rolePermissions = this.getRolePermissions(user.role);
      const hasPermission = rolePermissions.includes(action) || 
                           rolePermissions.includes(`${resourceType}:${action}`) ||
                           rolePermissions.includes('*');
      
      return {
        name: 'Action Permissions Test',
        success: hasPermission,
        details: `Action: ${action}, Resource: ${resourceType}, Role: ${user.role}, Has permission: ${hasPermission}`
      };
    } catch (error) {
      return {
        name: 'Action Permissions Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private getRolePermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'USER': ['read:own', 'create:own', 'update:own', 'delete:own'],
      'ADMIN': ['read:*', 'create:*', 'update:*', 'delete:*', 'admin:*'],
      'SUPER_ADMIN': ['*']
    };
    
    return rolePermissions[role] || [];
  }
}
```

## Data Protection Issues

### 1. Encryption/Decryption Failures

**Symptoms:**
- Data cannot be decrypted
- Encryption key errors
- Sensitive data exposure
- Data corruption

**Root Causes:**
- Incorrect encryption keys
- Corrupted encrypted data
- Key rotation issues
- Algorithm mismatches

**Solutions:**

```bash
# 1. Check encryption configuration
kubectl exec -n axisor <backend-pod> -- node -e "
console.log('Encryption configuration:');
console.log('ENCRYPTION_KEY configured:', !!process.env.ENCRYPTION_KEY);
console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY?.length || 0);
console.log('ENCRYPTION_ALGORITHM:', process.env.ENCRYPTION_ALGORITHM || 'Not set');
console.log('ENCRYPTION_IV_LENGTH:', process.env.ENCRYPTION_IV_LENGTH || 'Not set');
"

# 2. Test encryption/decryption
kubectl exec -n axisor <backend-pod> -- node -e "
const crypto = require('crypto');

async function testEncryption() {
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const testData = 'Sensitive test data';
  
  try {
    // Encrypt
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(testData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    console.log('Encryption test:');
    console.log('Original data:', testData);
    console.log('Encrypted data:', encrypted);
    
    // Decrypt
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log('Decrypted data:', decrypted);
    console.log('Encryption/decryption successful:', testData === decrypted);
  } catch (error) {
    console.error('Encryption test failed:', error.message);
  }
}

testEncryption();
"

# 3. Check encrypted data integrity
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEncryptedDataIntegrity() {
  // Check user exchange credentials
  const credentials = await prisma.userExchangeCredentials.findMany({
    select: {
      id: true,
      user_id: true,
      exchange: true,
      encrypted_credentials: true,
      created_at: true
    },
    take: 10
  });
  
  console.log('Encrypted credentials check:');
  credentials.forEach(cred => {
    const hasEncryptedData = !!cred.encrypted_credentials;
    console.log(`Credential ${cred.id}: exchange=${cred.exchange}, encrypted=${hasEncryptedData}`);
  });
}

checkEncryptedDataIntegrity();
"

# 4. Test key rotation
kubectl exec -n axisor <backend-pod> -- node -e "
const crypto = require('crypto');

async function testKeyRotation() {
  const oldKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  const newKey = crypto.randomBytes(32);
  
  const testData = 'Test data for key rotation';
  
  try {
    // Encrypt with old key
    const cipher = crypto.createCipher('aes-256-cbc', oldKey);
    let encrypted = cipher.update(testData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    console.log('Key rotation test:');
    console.log('Encrypted with old key:', encrypted);
    
    // Try to decrypt with new key (should fail)
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', newKey);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      console.log('Decryption with new key succeeded (unexpected):', decrypted);
    } catch (error) {
      console.log('Decryption with new key failed (expected):', error.message);
    }
    
    // Decrypt with old key (should succeed)
    const decipher = crypto.createDecipher('aes-256-cbc', oldKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    console.log('Decryption with old key succeeded:', decrypted);
    
  } catch (error) {
    console.error('Key rotation test failed:', error.message);
  }
}

testKeyRotation();
"
```

### 2. Data Leakage and Exposure

**Symptoms:**
- Sensitive data in logs
- Unencrypted data transmission
- Data exposure in error messages
- Unauthorized data access

**Root Causes:**
- Logging sensitive information
- Missing data encryption
- Insecure data transmission
- Inadequate access controls

**Solutions:**

```bash
# 1. Check for sensitive data in logs
kubectl logs -n axisor <backend-pod> | grep -E "(password|secret|token|key|credit|ssn)" | head -20

# 2. Check data transmission security
kubectl exec -n axisor <backend-pod> -- node -e "
console.log('Data transmission security:');
console.log('HTTPS enforced:', process.env.FORCE_HTTPS === 'true');
console.log('CORS origin:', process.env.CORS_ORIGIN || 'Not set');
console.log('Security headers:', process.env.ENABLE_SECURITY_HEADERS === 'true');
"

# 3. Check data access logs
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDataAccessLogs() {
  const accessLogs = await prisma.dataAccessLog.findMany({
    select: {
      id: true,
      user_id: true,
      data_type: true,
      action: true,
      ip_address: true,
      user_agent: true,
      created_at: true,
      user: {
        select: {
          email: true
        }
      }
    },
    where: {
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 20
  });
  
  console.log('Data access logs in last 24 hours:');
  accessLogs.forEach(log => {
    console.log(`${log.user.email}: ${log.action} ${log.data_type} from ${log.ip_address}`);
  });
}

checkDataAccessLogs();
"

# 4. Check for data exposure in error responses
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkErrorResponses() {
  const errorLogs = await prisma.errorLog.findMany({
    select: {
      id: true,
      error_type: true,
      message: true,
      stack_trace: true,
      user_id: true,
      created_at: true
    },
    where: {
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      },
      message: {
        contains: 'password'
      }
    },
    take: 10
  });
  
  console.log('Error logs containing sensitive data:');
  errorLogs.forEach(log => {
    console.log(`Error ${log.id}: ${log.error_type} - ${log.message}`);
  });
}

checkErrorResponses();
"
```

## API Security Issues

### 1. Rate Limiting and DDoS Protection

**Symptoms:**
- API endpoints overwhelmed
- High response times
- Service unavailability
- Resource exhaustion

**Root Causes:**
- Inadequate rate limiting
- Missing DDoS protection
- Resource limits exceeded
- Bot traffic

**Solutions:**

```bash
# 1. Check rate limiting configuration
kubectl exec -n axisor <backend-pod> -- node -e "
console.log('Rate limiting configuration:');
console.log('Rate limit enabled:', process.env.ENABLE_RATE_LIMITING === 'true');
console.log('Rate limit window:', process.env.RATE_LIMIT_WINDOW || 'Not set');
console.log('Rate limit max requests:', process.env.RATE_LIMIT_MAX_REQUESTS || 'Not set');
console.log('Rate limit skip successful:', process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true');
"

# 2. Check current rate limiting status
kubectl exec -n axisor <backend-pod> -- node -e "
const redis = require('ioredis');
const client = new redis(process.env.REDIS_URL);

async function checkRateLimitingStatus() {
  const keys = await client.keys('rate_limit:*');
  console.log('Rate limiting keys:', keys.length);
  
  for (const key of keys.slice(0, 10)) {
    const value = await client.get(key);
    const ttl = await client.ttl(key);
    console.log(`${key}: ${value} (TTL: ${ttl}s)`);
  }
}

checkRateLimitingStatus();
"

# 3. Check for suspicious activity
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSuspiciousActivity() {
  const suspiciousLogs = await prisma.securityAuditLog.findMany({
    select: {
      id: true,
      user_id: true,
      action: true,
      ip_address: true,
      user_agent: true,
      created_at: true,
      user: {
        select: {
          email: true
        }
      }
    },
    where: {
      created_at: {
        gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
      },
      action: {
        in: ['RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_ACTIVITY', 'DDOS_ATTEMPT']
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 20
  });
  
  console.log('Suspicious activity in last hour:');
  suspiciousLogs.forEach(log => {
    console.log(`${log.user.email}: ${log.action} from ${log.ip_address}`);
  });
}

checkSuspiciousActivity();
"

# 4. Check resource usage
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkResourceUsage() {
  // Check database connections
  const dbStats = await prisma.$queryRaw`
    SELECT 
      count(*) as total_connections,
      count(*) FILTER (WHERE state = 'active') as active_connections,
      count(*) FILTER (WHERE state = 'idle') as idle_connections
    FROM pg_stat_activity 
    WHERE datname = current_database()
  `;
  
  console.log('Database connection stats:', dbStats);
  
  // Check API request volume
  const apiStats = await prisma.apiRequestLog.findMany({
    select: {
      endpoint: true,
      method: true,
      status_code: true,
      created_at: true
    },
    where: {
      created_at: {
        gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
      }
    }
  });
  
  const endpointCounts = {};
  apiStats.forEach(req => {
    const key = `${req.method} ${req.endpoint}`;
    endpointCounts[key] = (endpointCounts[key] || 0) + 1;
  });
  
  console.log('API request volume by endpoint:');
  Object.entries(endpointCounts).forEach(([endpoint, count]) => {
    console.log(`${endpoint}: ${count} requests`);
  });
}

checkResourceUsage();
"
```

### 2. Input Validation and Sanitization

**Symptoms:**
- SQL injection attempts
- XSS attacks
- Data validation errors
- Malformed requests

**Root Causes:**
- Missing input validation
- Inadequate sanitization
- Weak parameter validation
- Insufficient data type checking

**Solutions:**

```bash
# 1. Check input validation configuration
kubectl exec -n axisor <backend-pod> -- node -e "
console.log('Input validation configuration:');
console.log('Validation enabled:', process.env.ENABLE_INPUT_VALIDATION === 'true');
console.log('Sanitization enabled:', process.env.ENABLE_INPUT_SANITIZATION === 'true');
console.log('Max request size:', process.env.MAX_REQUEST_SIZE || 'Not set');
console.log('Max file upload size:', process.env.MAX_FILE_UPLOAD_SIZE || 'Not set');
"

# 2. Check for validation errors
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkValidationErrors() {
  const validationErrors = await prisma.validationErrorLog.findMany({
    select: {
      id: true,
      field: true,
      value: true,
      error_type: true,
      endpoint: true,
      user_id: true,
      created_at: true,
      user: {
        select: {
          email: true
        }
      }
    },
    where: {
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 20
  });
  
  console.log('Validation errors in last 24 hours:');
  validationErrors.forEach(error => {
    console.log(`${error.user.email}: ${error.error_type} on ${error.field} at ${error.endpoint}`);
  });
}

checkValidationErrors();
"

# 3. Check for potential security threats
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSecurityThreats() {
  const threats = await prisma.securityThreatLog.findMany({
    select: {
      id: true,
      threat_type: true,
      severity: true,
      source_ip: true,
      user_agent: true,
      endpoint: true,
      payload: true,
      created_at: true
    },
    where: {
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 20
  });
  
  console.log('Security threats in last 24 hours:');
  threats.forEach(threat => {
    console.log(`${threat.threat_type} (${threat.severity}): ${threat.source_ip} -> ${threat.endpoint}`);
  });
}

checkSecurityThreats();
"

# 4. Test input validation
kubectl exec -n axisor <backend-pod> -- node -e "
const axios = require('axios');

async function testInputValidation() {
  const baseURL = 'http://localhost:3000/api';
  
  const testCases = [
    {
      name: 'SQL Injection Test',
      endpoint: '/users',
      data: { email: "'; DROP TABLE users; --" }
    },
    {
      name: 'XSS Test',
      endpoint: '/users',
      data: { name: '<script>alert("XSS")</script>' }
    },
    {
      name: 'Invalid Email Test',
      endpoint: '/users',
      data: { email: 'invalid-email' }
    },
    {
      name: 'Oversized Input Test',
      endpoint: '/users',
      data: { name: 'A'.repeat(10000) }
    }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await axios.post(`${baseURL}${testCase.endpoint}`, testCase.data);
      console.log(`${testCase.name}: ${response.status} (unexpected success)`);
    } catch (error) {
      const status = error.response?.status || 'Network Error';
      console.log(`${testCase.name}: ${status} (expected failure)`);
    }
  }
}

testInputValidation();
"
```

## Security Monitoring and Alerting

### 1. Security Event Monitoring

**Security Event Monitor**
```typescript
export class SecurityEventMonitor {
  private logger: Logger;
  private notificationService: NotificationService;
  private prisma: PrismaClient;
  
  constructor(logger: Logger, notificationService: NotificationService, prisma: PrismaClient) {
    this.logger = logger;
    this.notificationService = notificationService;
    this.prisma = prisma;
  }
  
  async monitorSecurityEvents(): Promise<void> {
    const events = await this.getRecentSecurityEvents();
    
    for (const event of events) {
      await this.analyzeSecurityEvent(event);
    }
  }
  
  private async getRecentSecurityEvents(): Promise<SecurityEvent[]> {
    return await this.prisma.securityAuditLog.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }
  
  private async analyzeSecurityEvent(event: SecurityEvent): Promise<void> {
    const severity = this.determineEventSeverity(event);
    
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      await this.sendSecurityAlert(event, severity);
    }
    
    // Log the event
    this.logger.warn('Security event detected', {
      event,
      severity
    });
  }
  
  private determineEventSeverity(event: SecurityEvent): string {
    const criticalActions = [
      'ADMIN_ACCESS_GRANTED',
      'SENSITIVE_DATA_ACCESSED',
      'AUTHENTICATION_BYPASSED',
      'PRIVILEGE_ESCALATION'
    ];
    
    const highActions = [
      'MULTIPLE_FAILED_LOGINS',
      'RATE_LIMIT_EXCEEDED',
      'SUSPICIOUS_ACTIVITY',
      'DATA_EXPORT_REQUESTED'
    ];
    
    if (criticalActions.includes(event.action)) {
      return 'CRITICAL';
    } else if (highActions.includes(event.action)) {
      return 'HIGH';
    } else {
      return 'MEDIUM';
    }
  }
  
  private async sendSecurityAlert(event: SecurityEvent, severity: string): Promise<void> {
    const alert = {
      type: 'SECURITY_ALERT',
      severity,
      title: `Security Alert: ${event.action}`,
      message: `Security event detected: ${event.action}`,
      details: {
        event,
        severity,
        timestamp: new Date().toISOString()
      }
    };
    
    // Send to multiple channels
    await Promise.all([
      this.notificationService.sendSlackAlert(alert),
      this.notificationService.sendEmailAlert(alert),
      this.notificationService.sendPagerDutyAlert(alert)
    ]);
  }
}
```

### 2. Security Dashboard

**Security Dashboard Configuration**
```yaml
# Grafana dashboard configuration for security monitoring
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-dashboard
  namespace: axisor
data:
  dashboard.json: |
    {
      "dashboard": {
        "title": "Security Monitoring",
        "panels": [
          {
            "title": "Security Events",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(security_events_total[5m])",
                "legendFormat": "{{action}} - {{severity}}"
              }
            ]
          },
          {
            "title": "Failed Login Attempts",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(failed_logins_total[5m])",
                "legendFormat": "Failed logins"
              }
            ]
          },
          {
            "title": "Rate Limiting",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(rate_limit_exceeded_total[5m])",
                "legendFormat": "Rate limit exceeded"
              }
            ]
          },
          {
            "title": "Security Threats",
            "type": "table",
            "targets": [
              {
                "expr": "security_threats_total",
                "legendFormat": "{{threat_type}} - {{severity}}"
              }
            ]
          }
        ]
      }
    }
```

## Troubleshooting Commands

### 1. Security Analysis Commands

```bash
# Check security configuration
kubectl exec -n axisor <backend-pod> -- node -e "
console.log('Security configuration check:');
console.log('HTTPS enforced:', process.env.FORCE_HTTPS === 'true');
console.log('CORS enabled:', process.env.ENABLE_CORS === 'true');
console.log('Rate limiting:', process.env.ENABLE_RATE_LIMITING === 'true');
console.log('Input validation:', process.env.ENABLE_INPUT_VALIDATION === 'true');
console.log('Security headers:', process.env.ENABLE_SECURITY_HEADERS === 'true');
"

# Check security audit logs
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSecurityAuditLogs() {
  const logs = await prisma.securityAuditLog.findMany({
    select: {
      id: true,
      user_id: true,
      action: true,
      ip_address: true,
      user_agent: true,
      created_at: true,
      user: {
        select: {
          email: true
        }
      }
    },
    where: {
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 20
  });
  
  console.log('Security audit logs in last 24 hours:');
  logs.forEach(log => {
    console.log(`${log.user.email}: ${log.action} from ${log.ip_address}`);
  });
}

checkSecurityAuditLogs();
"

# Check for security vulnerabilities
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSecurityVulnerabilities() {
  const vulnerabilities = await prisma.securityVulnerabilityLog.findMany({
    select: {
      id: true,
      vulnerability_type: true,
      severity: true,
      description: true,
      affected_component: true,
      created_at: true,
      resolved: true
    },
    where: {
      resolved: false
    },
    orderBy: {
      severity: 'desc'
    }
  });
  
  console.log('Unresolved security vulnerabilities:');
  vulnerabilities.forEach(vuln => {
    console.log(`${vuln.vulnerability_type} (${vuln.severity}): ${vuln.description}`);
  });
}

checkSecurityVulnerabilities();
"
```

### 2. Security Recovery Commands

```bash
# Reset user session
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetUserSession(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      session_expires_at: null,
      last_login: null
    }
  });
  
  await prisma.refreshToken.deleteMany({
    where: { user_id: userId }
  });
  
  console.log(`Session reset for user: ${userId}`);
}

resetUserSession('user-id-here');
"

# Block suspicious IP
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function blockSuspiciousIP(ipAddress) {
  await prisma.blockedIP.create({
    data: {
      ip_address: ipAddress,
      reason: 'Suspicious activity',
      blocked_at: new Date(),
      blocked_by: 'system'
    }
  });
  
  console.log(`IP blocked: ${ipAddress}`);
}

blockSuspiciousIP('192.168.1.100');
"

# Revoke user access
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function revokeUserAccess(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      is_active: false,
      session_expires_at: null,
      last_login: null
    }
  });
  
  await prisma.refreshToken.deleteMany({
    where: { user_id: userId }
  });
  
  console.log(`Access revoked for user: ${userId}`);
}

revokeUserAccess('user-id-here');
"
```

## Checklist

### Authentication Security
- [ ] Verify JWT token configuration
- [ ] Check session management
- [ ] Validate 2FA implementation
- [ ] Test password policies
- [ ] Monitor login attempts
- [ ] Check token expiration
- [ ] Validate refresh tokens
- [ ] Test authentication flows

### Authorization Security
- [ ] Verify user roles and permissions
- [ ] Check resource access controls
- [ ] Test admin panel access
- [ ] Validate IDOR protections
- [ ] Check permission inheritance
- [ ] Test role-based access
- [ ] Validate resource ownership
- [ ] Check action permissions

### Data Protection
- [ ] Verify encryption configuration
- [ ] Test data encryption/decryption
- [ ] Check key management
- [ ] Validate data transmission
- [ ] Test data sanitization
- [ ] Check data access logs
- [ ] Validate data retention
- [ ] Test data backup security

### API Security
- [ ] Configure rate limiting
- [ ] Test input validation
- [ ] Check output sanitization
- [ ] Validate CORS settings
- [ ] Test security headers
- [ ] Check error handling
- [ ] Validate request size limits
- [ ] Test file upload security

### Security Monitoring
- [ ] Set up security event monitoring
- [ ] Configure security alerts
- [ ] Monitor failed login attempts
- [ ] Track suspicious activity
- [ ] Check security audit logs
- [ ] Monitor rate limiting
- [ ] Track data access patterns
- [ ] Review security metrics