---
title: "JWT Implementation - Security"
version: "1.0.0"
created: "2025-01-26"
updated: "2025-01-26"
author: "Documentation Agent"
status: "active"
tags: ["security", "authentication", "jwt", "tokens"]
---

# JWT Implementation - Security

> **Status**: Active  
> **Última Atualização**: 2025-01-26  
> **Versão**: 1.0.0  
> **Responsável**: Axisor Security Team  

## Índice

- [Visão Geral](#visão-geral)
- [Implementação JWT](#implementação-jwt)
- [Token Management](#token-management)
- [Security Best Practices](#security-best-practices)
- [Refresh Token Strategy](#refresh-token-strategy)
- [Token Validation](#token-validation)
- [Security Headers](#security-headers)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

## Visão Geral

O sistema Axisor implementa autenticação baseada em JWT (JSON Web Tokens) com refresh tokens para garantir segurança e escalabilidade. A implementação segue as melhores práticas de segurança com tokens de curta duração e rotação automática.

## Implementação JWT

### JWT Service

```typescript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface JWTPayload {
  userId: string;
  email: string;
  planType: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
  iss?: string;
}

class JWTService {
  private readonly secret: string;
  private readonly expiresIn: string;
  private readonly issuer: string;
  private readonly algorithm: jwt.Algorithm = 'HS256';

  constructor() {
    this.secret = process.env.JWT_SECRET!;
    this.expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.issuer = 'axisor-api';
    
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  async generateToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss'>): Promise<string> {
    const tokenPayload: JWTPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.getExpirationSeconds(),
      iss: this.issuer
    };

    return jwt.sign(tokenPayload, this.secret, {
      algorithm: this.algorithm,
      issuer: this.issuer
    });
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        algorithms: [this.algorithm]
      }) as JWTPayload;

      // Verificar se o usuário ainda está ativo
      const user = await this.userService.findById(decoded.userId);
      if (!user || !user.is_active) {
        throw new Error('User inactive');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenData = await this.refreshTokenService.validateRefreshToken(refreshToken);
    
    if (!tokenData) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await this.userService.findById(tokenData.userId);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User inactive');
    }

    // Gerar novo access token
    const newAccessToken = await this.generateToken({
      userId: user.id,
      email: user.email,
      planType: user.plan_type,
      isAdmin: user.is_admin
    });

    // Rotacionar refresh token
    const newRefreshToken = await this.refreshTokenService.rotateToken(refreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  private getExpirationSeconds(): number {
    const timeValue = parseInt(this.expiresIn);
    const timeUnit = this.expiresIn.slice(-1);
    
    switch (timeUnit) {
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 3600;
      case 'd': return timeValue * 86400;
      default: return 900; // 15 minutes default
    }
  }
}
```

## Token Management

### Token Generation

```typescript
class TokenGenerationService {
  async generateTokenPair(user: User): Promise<TokenPair> {
    // Gerar access token
    const accessToken = await this.jwtService.generateToken({
      userId: user.id,
      email: user.email,
      planType: user.plan_type,
      isAdmin: user.is_admin
    });

    // Gerar refresh token
    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user.id,
      this.getDeviceInfo()
    );

    // Armazenar tokens no cache
    await this.cacheService.cacheTokens(user.id, {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer'
    };
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: request.headers['user-agent'] || 'unknown',
      ipAddress: request.ip || 'unknown',
      platform: this.detectPlatform(request.headers['user-agent']),
      timestamp: new Date().toISOString()
    };
  }
}
```

### Token Revocation

```typescript
class TokenRevocationService {
  async revokeToken(token: string, reason: string = 'user_logout'): Promise<void> {
    try {
      const decoded = this.jwtService.decodeToken(token);
      
      // Adicionar token à blacklist
      await this.blacklistService.addToken(token, decoded.exp);
      
      // Revogar refresh token associado
      await this.refreshTokenService.revokeUserTokens(decoded.userId);
      
      // Log da revogação
      await this.auditService.logTokenRevocation(decoded.userId, reason);
      
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    // Revogar todos os refresh tokens do usuário
    await this.refreshTokenService.revokeAllUserTokens(userId);
    
    // Limpar cache de tokens
    await this.cacheService.clearUserTokens(userId);
    
    // Log da revogação em massa
    await this.auditService.logMassTokenRevocation(userId);
  }
}
```

## Security Best Practices

### Token Security

```typescript
class TokenSecurityService {
  // Validação de token com múltiplas verificações
  async validateTokenSecurity(token: string, request: FastifyRequest): Promise<boolean> {
    try {
      // 1. Verificar se token não está na blacklist
      if (await this.blacklistService.isTokenBlacklisted(token)) {
        return false;
      }

      // 2. Verificar assinatura e expiração
      const decoded = await this.jwtService.verifyToken(token);

      // 3. Verificar se usuário ainda está ativo
      const user = await this.userService.findById(decoded.userId);
      if (!user || !user.is_active) {
        return false;
      }

      // 4. Verificar IP e User-Agent (opcional, para maior segurança)
      if (this.isStrictMode()) {
        const tokenMetadata = await this.getTokenMetadata(token);
        if (tokenMetadata.ipAddress !== request.ip) {
          await this.auditService.logSuspiciousActivity(decoded.userId, 'IP_MISMATCH');
          return false;
        }
      }

      // 5. Verificar rate limiting por usuário
      const rateLimitKey = `auth:${decoded.userId}`;
      const attempts = await this.redis.incr(rateLimitKey);
      
      if (attempts === 1) {
        await this.redis.expire(rateLimitKey, 3600); // 1 hour
      }
      
      if (attempts > 1000) { // Max 1000 requests per hour per user
        await this.auditService.logSuspiciousActivity(decoded.userId, 'RATE_LIMIT_EXCEEDED');
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private isStrictMode(): boolean {
    return process.env.NODE_ENV === 'production' && process.env.JWT_STRICT_MODE === 'true';
  }
}
```

### Secure Headers

```typescript
// Configuração de headers de segurança
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self';
    font-src 'self';
  `.replace(/\s+/g, ' ').trim()
};

// Middleware para aplicar headers
export const securityHeadersMiddleware = (request: FastifyRequest, reply: FastifyReply) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    reply.header(key, value);
  });
};
```

## Refresh Token Strategy

### Refresh Token Service

```typescript
class RefreshTokenService {
  private readonly tokenLength = 64;
  private readonly ttl = 7 * 24 * 60 * 60; // 7 days

  async generateRefreshToken(userId: string, deviceInfo: DeviceInfo): Promise<string> {
    const token = this.generateSecureToken();
    const key = this.getTokenKey(token);
    
    const tokenData = {
      userId,
      deviceInfo,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.ttl * 1000).toISOString()
    };

    // Armazenar no Redis
    await this.redis.setex(key, this.ttl, JSON.stringify(tokenData));
    
    // Armazenar no banco para auditoria
    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token: token,
        expires_at: new Date(Date.now() + this.ttl * 1000),
        device_info: deviceInfo
      }
    });

    return token;
  }

  async validateRefreshToken(token: string): Promise<RefreshTokenData | null> {
    const key = this.getTokenKey(token);
    const tokenData = await this.redis.get(key);
    
    if (!tokenData) {
      return null;
    }

    const parsed = JSON.parse(tokenData);
    
    // Verificar se o token não expirou
    if (new Date(parsed.expiresAt) < new Date()) {
      await this.revokeToken(token);
      return null;
    }

    return parsed;
  }

  async rotateToken(oldToken: string): Promise<string> {
    const tokenData = await this.validateRefreshToken(oldToken);
    
    if (!tokenData) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Revogar token antigo
    await this.revokeToken(oldToken);

    // Gerar novo token
    return await this.generateRefreshToken(tokenData.userId, tokenData.deviceInfo);
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(this.tokenLength).toString('hex');
  }

  private getTokenKey(token: string): string {
    return `refresh_token:${token}`;
  }
}
```

## Token Validation

### Middleware de Autenticação

```typescript
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = extractTokenFromHeader(request);
    
    if (!token) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Authorization header is required'
      });
    }

    // Validar token
    const isValid = await tokenSecurityService.validateTokenSecurity(token, request);
    
    if (!isValid) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      });
    }

    // Decodificar token e adicionar ao request
    const decoded = await jwtService.verifyToken(token);
    request.user = decoded;

  } catch (error) {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Token validation failed'
    });
  }
};

function extractTokenFromHeader(request: FastifyRequest): string | null {
  const authorization = request.headers.authorization;
  
  if (!authorization) {
    return null;
  }

  const parts = authorization.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
```

## Security Headers

### Helmet Configuration

```typescript
import helmet from '@fastify/helmet';

// Configuração do Helmet para segurança
await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" }
});
```

## Troubleshooting

### Common Issues

#### Token Expired

```typescript
// Debug token expiration
function debugTokenExpiration(token: string): void {
  try {
    const decoded = jwt.decode(token) as any;
    const now = Math.floor(Date.now() / 1000);
    const expires = decoded.exp;
    const timeLeft = expires - now;
    
    console.log(`Token expires in: ${timeLeft} seconds`);
    console.log(`Token expires at: ${new Date(expires * 1000).toISOString()}`);
  } catch (error) {
    console.error('Error decoding token:', error);
  }
}
```

#### Invalid Token

```typescript
// Debug invalid token
async function debugInvalidToken(token: string): Promise<void> {
  try {
    // Tentar decodificar sem verificação
    const decoded = jwt.decode(token);
    console.log('Token decoded:', decoded);
    
    // Verificar se está na blacklist
    const isBlacklisted = await blacklistService.isTokenBlacklisted(token);
    console.log('Is blacklisted:', isBlacklisted);
    
    // Verificar usuário
    if (decoded?.userId) {
      const user = await userService.findById(decoded.userId);
      console.log('User active:', user?.is_active);
    }
  } catch (error) {
    console.error('Token debug failed:', error);
  }
}
```

## Referências

- [Authentication Service](../../architecture/microservices/authentication-service.md)
- [Security Overview](./security-overview.md)
- [Rate Limiting](./rate-limiting.md)
- [Audit Logging](./audit-logging.md)

## Como Usar Este Documento

• **Para Desenvolvedores**: Use como referência para implementar autenticação JWT segura seguindo as melhores práticas.

• **Para DevOps**: Utilize para configurar e monitorar a segurança de tokens em produção.

• **Para Security**: Use para entender as medidas de segurança implementadas e identificar pontos de melhoria.
