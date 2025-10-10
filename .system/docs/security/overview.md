# Segurança do Sistema

## Visão Geral

O Hub-defisats implementa múltiplas camadas de segurança para proteger dados financeiros sensíveis, credenciais de trading e informações pessoais dos usuários. Este documento descreve as medidas de segurança implementadas e as práticas recomendadas.

## Princípios de Segurança

### 1. Defense in Depth
- Múltiplas camadas de proteção
- Redundância de controles de segurança
- Detecção e resposta a ameaças
- Recuperação de incidentes

### 2. Zero Trust
- Verificação contínua de identidade
- Acesso baseado em contexto
- Monitoramento de atividades
- Princípio do menor privilégio

### 3. Privacy by Design
- Proteção de dados desde o design
- Minimização de dados coletados
- Transparência com usuários
- Controle de dados pessoais

## Autenticação e Autorização

### 1. Autenticação Multi-Fator

#### JWT + Refresh Tokens
```typescript
// Estrutura do JWT
{
  "sub": "user_id",
  "email": "user@example.com",
  "plan_type": "pro",
  "is_admin": false,
  "iat": 1642234567,
  "exp": 1642238167
}

// Refresh Token (HTTP-only cookie)
{
  "token": "refresh_token_hash",
  "user_id": "user_id",
  "expires_at": "2025-01-22T10:00:00Z"
}
```

#### 2FA para Administradores
- Google Authenticator obrigatório
- Backup codes para recuperação
- QR code para configuração inicial
- Re-autenticação para ações críticas

### 2. Controle de Acesso

#### Roles e Permissões
```typescript
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

enum Permission {
  READ_AUTOMATIONS = 'read:automations',
  WRITE_AUTOMATIONS = 'write:automations',
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  READ_LOGS = 'read:logs',
  WRITE_SYSTEM = 'write:system'
}
```

#### Middleware de Autorização
```typescript
// Verificação de permissões
const requirePermission = (permission: Permission) => {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user.permissions.includes(permission)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  };
};
```

## Criptografia e Proteção de Dados

### 1. Criptografia de Dados Sensíveis

#### Keys LN Markets
```typescript
// Criptografia AES-256
const encryptLNMarketsKeys = (apiKey: string, secret: string, passphrase: string) => {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const encrypted = {
    apiKey: encrypt(apiKey, key, iv),
    secret: encrypt(secret, key, iv),
    passphrase: encrypt(passphrase, key, iv),
    key: key.toString('hex'),
    iv: iv.toString('hex')
  };
  
  return encrypted;
};
```

#### Senhas
```typescript
// Hash bcrypt com salt rounds 12
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

// Verificação de senha
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
```

### 2. Validação de Senhas

#### Requisitos Mínimos
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

#### Verificação HIBP
```typescript
// Verificação contra vazamentos
const checkPasswordBreach = async (password: string): Promise<boolean> => {
  const hash = crypto.createHash('sha1').update(password).digest('hex');
  const prefix = hash.substring(0, 5);
  const suffix = hash.substring(5);
  
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const data = await response.text();
  
  return data.includes(suffix.toUpperCase());
};
```

## Proteção contra Ataques

### 1. Rate Limiting

#### Configuração por Endpoint
```typescript
// Rate limiting configurado
const rateLimitConfig = {
  '/api/auth/login': { max: 5, windowMs: 15 * 60 * 1000 }, // 5 tentativas/15min
  '/api/auth/register': { max: 3, windowMs: 60 * 60 * 1000 }, // 3 tentativas/1h
  '/api/automations': { max: 100, windowMs: 60 * 1000 }, // 100 requests/min
  '/api/simulations': { max: 10, windowMs: 60 * 1000 } // 10 simulações/min
};
```

#### Implementação Redis
```typescript
// Rate limiting distribuído
const rateLimit = async (key: string, limit: number, windowMs: number) => {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000));
  }
  return current <= limit;
};
```

### 2. CAPTCHA

#### reCAPTCHA v3
```typescript
// Verificação de CAPTCHA
const verifyCaptcha = async (token: string, action: string): Promise<boolean> => {
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${RECAPTCHA_SECRET}&response=${token}`
  });
  
  const data = await response.json();
  return data.success && data.action === action && data.score >= 0.5;
};
```

#### hCaptcha Fallback
```typescript
// Fallback para hCaptcha
const verifyHCaptcha = async (token: string): Promise<boolean> => {
  const response = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${HCAPTCHA_SECRET}&response=${token}`
  });
  
  const data = await response.json();
  return data.success;
};
```

### 3. Proteção CSRF

#### Tokens CSRF
```typescript
// Geração de token CSRF
const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Verificação de token CSRF
const verifyCSRFToken = (token: string, sessionToken: string): boolean => {
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(sessionToken, 'hex')
  );
};
```

### 4. Prevenção XSS

#### Sanitização de Input
```typescript
// Sanitização com DOMPurify
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};
```

#### Headers de Segurança
```typescript
// Configuração de headers
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

## Segurança de API

### 1. Validação de Entrada

#### Schemas Zod
```typescript
// Validação de dados de entrada
const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/)
});

const validateInput = (data: unknown) => {
  return userSchema.parse(data);
};
```

#### Sanitização SQL
```typescript
// Uso do Prisma ORM (proteção contra SQL injection)
const getUser = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, username: true }
  });
};
```

### 2. Autenticação de API

#### HMAC-SHA256 para LN Markets
```typescript
// Assinatura HMAC para LN Markets
const generateSignature = (method: string, path: string, body: string, timestamp: string) => {
  const message = `${timestamp}${method}${path}${body}`;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');
  return signature;
};
```

### 3. Rate Limiting de API

#### Limites por Usuário
```typescript
// Rate limiting por usuário
const userRateLimit = {
  'margin-check': { max: 60, windowMs: 60 * 1000 }, // 60 checks/min
  'simulation': { max: 5, windowMs: 60 * 1000 }, // 5 simulações/min
  'trading': { max: 10, windowMs: 60 * 1000 } // 10 trades/min
};
```

## Monitoramento de Segurança

### 1. Logs de Segurança

#### Estrutura de Logs
```typescript
// Log de segurança estruturado
const securityLog = {
  timestamp: new Date().toISOString(),
  level: 'security',
  event: 'failed_login',
  user_id: 'user_id',
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  details: {
    email: 'user@example.com',
    attempt_count: 3,
    blocked: true
  }
};
```

#### Alertas Automáticos
```typescript
// Alertas de segurança
const securityAlerts = {
  'multiple_failed_logins': {
    threshold: 5,
    window: '15m',
    action: 'block_ip'
  },
  'suspicious_activity': {
    threshold: 10,
    window: '1h',
    action: 'notify_admin'
  },
  'admin_access': {
    threshold: 1,
    window: '1m',
    action: 'log_and_alert'
  }
};
```

### 2. Detecção de Intrusão

#### Análise de Padrões
```typescript
// Detecção de atividades suspeitas
const detectSuspiciousActivity = (user: User, activity: Activity) => {
  const patterns = [
    'unusual_login_time',
    'multiple_failed_attempts',
    'rapid_api_calls',
    'unusual_geographic_location'
  ];
  
  return patterns.some(pattern => 
    checkPattern(user, activity, pattern)
  );
};
```

### 3. Auditoria

#### Logs de Auditoria
```typescript
// Log de auditoria para ações críticas
const auditLog = {
  timestamp: new Date().toISOString(),
  user_id: 'user_id',
  action: 'automation_created',
  resource: 'automation_id',
  details: {
    type: 'margin_guard',
    config: { threshold: 0.8 },
    ip_address: '192.168.1.1'
  }
};
```

## Backup e Recuperação

### 1. Backup de Dados

#### Estratégia de Backup
```yaml
# Configuração de backup
backup:
  database:
    frequency: "0 2 * * *"  # Diário às 2h
    retention: "30d"
    encryption: true
  files:
    frequency: "0 3 * * *"  # Diário às 3h
    retention: "7d"
    encryption: true
  keys:
    frequency: "0 4 * * *"  # Diário às 4h
    retention: "365d"
    encryption: true
```

#### Criptografia de Backup
```typescript
// Criptografia de backups
const encryptBackup = (data: Buffer, key: string): Buffer => {
  const cipher = crypto.createCipher('aes-256-gcm', key);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return encrypted;
};
```

### 2. Disaster Recovery

#### Plano de Recuperação
```yaml
# RTO e RPO
disaster_recovery:
  rto: "4h"  # Recovery Time Objective
  rpo: "1h"  # Recovery Point Objective
  procedures:
    - "Restore database from backup"
    - "Restore application from backup"
    - "Verify data integrity"
    - "Test critical functions"
    - "Notify stakeholders"
```

## Compliance e Regulamentações

### 1. GDPR

#### Direitos do Usuário
```typescript
// Implementação de direitos GDPR
const gdprRights = {
  'right_to_access': async (userId: string) => {
    return await getUserData(userId);
  },
  'right_to_rectification': async (userId: string, data: any) => {
    return await updateUserData(userId, data);
  },
  'right_to_erasure': async (userId: string) => {
    return await deleteUserData(userId);
  },
  'right_to_portability': async (userId: string) => {
    return await exportUserData(userId);
  }
};
```

#### Consentimento
```typescript
// Gerenciamento de consentimento
const consentManagement = {
  'marketing': false,
  'analytics': true,
  'cookies': true,
  'data_processing': true,
  'updated_at': '2025-01-15T10:00:00Z'
};
```

### 2. Auditoria de Segurança

#### Checklist de Segurança
```yaml
# Checklist de segurança
security_checklist:
  authentication:
    - "JWT tokens implementados"
    - "2FA para admins"
    - "Rate limiting ativo"
    - "Password policy enforced"
  data_protection:
    - "Dados sensíveis criptografados"
    - "Backup criptografado"
    - "Logs de auditoria"
    - "Retenção de dados configurada"
  network_security:
    - "HTTPS obrigatório"
    - "Headers de segurança"
    - "CORS configurado"
    - "Firewall ativo"
  monitoring:
    - "Logs de segurança"
    - "Alertas configurados"
    - "Métricas de segurança"
    - "Incident response plan"
```

## Incident Response

### 1. Plano de Resposta

#### Fases de Resposta
```yaml
# Plano de resposta a incidentes
incident_response:
  phases:
    - "Detection and Analysis"
    - "Containment"
    - "Eradication"
    - "Recovery"
    - "Lessons Learned"
  team:
    - "Security Lead"
    - "Technical Lead"
    - "Communications Lead"
    - "Legal Counsel"
  procedures:
    - "Isolate affected systems"
    - "Preserve evidence"
    - "Notify stakeholders"
    - "Implement fixes"
    - "Monitor for recurrence"
```

### 2. Comunicação

#### Notificações
```typescript
// Notificações de incidente
const incidentNotifications = {
  'internal': ['security@axisor.com'],
  'external': ['users@axisor.com'],
  'regulatory': ['compliance@axisor.com'],
  'public': ['status.axisor.com']
};
```

## Treinamento e Conscientização

### 1. Desenvolvedores

#### Práticas Seguras
- Validação de entrada
- Sanitização de dados
- Uso de bibliotecas seguras
- Testes de segurança

### 2. Usuários

#### Educação de Segurança
- Senhas seguras
- 2FA obrigatório
- Phishing awareness
- Reportar atividades suspeitas

---

**Documento**: Segurança do Sistema  
**Versão**: 1.3.0  
**Última Atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento
