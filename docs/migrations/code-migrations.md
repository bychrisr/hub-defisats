---
title: Code Migrations
category: migrations
subcategory: code-migrations
tags: [code-migration, refactoring, typescript, javascript, api-changes, breaking-changes]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team", "Frontend Team"]
---

# Code Migrations

## Summary

Comprehensive guide to code migrations and refactoring in the Axisor platform. This document covers strategies for migrating code between versions, handling breaking changes, API migrations, and maintaining backward compatibility during major updates.

## Migration Strategy

### 1. Migration Types

**API Migrations**
- Endpoint changes
- Request/response format changes
- Authentication method changes
- Rate limiting changes
- Error handling changes

**Code Structure Migrations**
- File structure changes
- Module reorganization
- Dependency updates
- Configuration changes
- Environment variable changes

**Breaking Changes**
- Function signature changes
- Class structure changes
- Interface modifications
- Type definition changes
- Database schema changes

### 2. Migration Workflow

**Planning Phase**
1. Identify breaking changes
2. Plan backward compatibility
3. Create migration timeline
4. Design deprecation strategy
5. Plan testing strategy

**Implementation Phase**
1. Implement new code alongside old
2. Add deprecation warnings
3. Update documentation
4. Create migration guides
5. Test compatibility

**Deployment Phase**
1. Deploy with feature flags
2. Monitor usage metrics
3. Gradual rollout
4. Collect feedback
5. Plan removal timeline

## API Migrations

### 1. Endpoint Migrations

**Example: User API Migration**
```typescript
// Old API (v1)
// GET /api/v1/users/:id
export interface UserV1Response {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// New API (v2)
// GET /api/v2/users/:id
export interface UserV2Response {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    displayName: string;
  };
  preferences: {
    theme: string;
    language: string;
    notifications: NotificationSettings;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
  };
  status: {
    isActive: boolean;
    isVerified: boolean;
    role: UserRole;
  };
}
```

**Migration Implementation**
```typescript
// backend/src/routes/users.v2.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserV1Response, UserV2Response } from '../types/user.types';

export async function userRoutes(fastify: FastifyInstance) {
  // V1 endpoint (deprecated)
  fastify.get('/api/v1/users/:id', {
    schema: {
      deprecated: true,
      description: 'Deprecated: Use /api/v2/users/:id instead'
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = await fastify.userService.getUserById(request.params.id);
    
    // Transform to V1 format
    const v1Response: UserV1Response = {
      id: user.id,
      email: user.email,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      created_at: user.timestamps.createdAt
    };
    
    return reply.send(v1Response);
  });
  
  // V2 endpoint (current)
  fastify.get('/api/v2/users/:id', {
    schema: {
      description: 'Get user by ID with enhanced profile information'
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = await fastify.userService.getUserById(request.params.id);
    
    // Transform to V2 format
    const v2Response: UserV2Response = {
      id: user.id,
      email: user.email,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName
      },
      preferences: {
        theme: user.preferences.theme,
        language: user.preferences.language,
        notifications: user.preferences.notifications
      },
      timestamps: {
        createdAt: user.timestamps.createdAt,
        updatedAt: user.timestamps.updatedAt,
        lastLoginAt: user.timestamps.lastLoginAt
      },
      status: {
        isActive: user.status.isActive,
        isVerified: user.status.isVerified,
        role: user.status.role
      }
    };
    
    return reply.send(v2Response);
  });
}
```

### 2. Request/Response Format Migrations

**Example: Authentication API Migration**
```typescript
// Old authentication format
export interface AuthV1Request {
  email: string;
  password: string;
}

export interface AuthV1Response {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// New authentication format
export interface AuthV2Request {
  email: string;
  password: string;
  deviceInfo?: {
    deviceId: string;
    deviceType: string;
    userAgent: string;
  };
  securityOptions?: {
    twoFactorCode?: string;
    rememberDevice: boolean;
  };
}

export interface AuthV2Response {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    id: string;
    email: string;
    profile: UserProfile;
    preferences: UserPreferences;
    status: UserStatus;
  };
  session: {
    id: string;
    deviceId: string;
    expiresAt: string;
    lastActivity: string;
  };
}
```

**Migration Adapter**
```typescript
// backend/src/adapters/auth-migration.adapter.ts
export class AuthMigrationAdapter {
  static adaptV1ToV2(v1Request: AuthV1Request): AuthV2Request {
    return {
      email: v1Request.email,
      password: v1Request.password,
      deviceInfo: {
        deviceId: 'legacy-device',
        deviceType: 'unknown',
        userAgent: 'legacy-client'
      },
      securityOptions: {
        rememberDevice: false
      }
    };
  }
  
  static adaptV2ToV1(v2Response: AuthV2Response): AuthV1Response {
    return {
      token: v2Response.accessToken,
      user: {
        id: v2Response.user.id,
        email: v2Response.user.email,
        name: `${v2Response.user.profile.firstName} ${v2Response.user.profile.lastName}`
      }
    };
  }
}
```

### 3. Error Handling Migrations

**Example: Error Response Format Migration**
```typescript
// Old error format
export interface ErrorV1Response {
  error: string;
  message: string;
  code: number;
}

// New error format
export interface ErrorV2Response {
  error: {
    code: string;
    message: string;
    details?: {
      field?: string;
      value?: any;
      constraint?: string;
    };
    timestamp: string;
    requestId: string;
    category: 'VALIDATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'BUSINESS' | 'SYSTEM';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    retryable: boolean;
    retryAfter?: number;
  };
  metadata: {
    version: string;
    environment: string;
    traceId: string;
  };
}
```

**Error Migration Handler**
```typescript
// backend/src/middleware/error-migration.middleware.ts
export class ErrorMigrationMiddleware {
  static handleV1Error(error: any, request: FastifyRequest, reply: FastifyReply) {
    const v1Response: ErrorV1Response = {
      error: error.name || 'Error',
      message: error.message || 'An error occurred',
      code: error.statusCode || 500
    };
    
    return reply.status(error.statusCode || 500).send(v1Response);
  }
  
  static handleV2Error(error: any, request: FastifyRequest, reply: FastifyReply) {
    const v2Response: ErrorV2Response = {
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An error occurred',
        details: error.details,
        timestamp: new Date().toISOString(),
        requestId: request.id,
        category: error.category || 'SYSTEM',
        severity: error.severity || 'MEDIUM',
        retryable: error.retryable || false,
        retryAfter: error.retryAfter
      },
      metadata: {
        version: process.env.API_VERSION || '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        traceId: request.id
      }
    };
    
    return reply.status(error.statusCode || 500).send(v2Response);
  }
}
```

## Code Structure Migrations

### 1. File Structure Migrations

**Example: Service Layer Migration**
```typescript
// Old structure: backend/src/services/user.service.ts
export class UserService {
  async getUserById(id: string) {
    // Implementation
  }
  
  async createUser(userData: any) {
    // Implementation
  }
  
  async updateUser(id: string, userData: any) {
    // Implementation
  }
  
  async deleteUser(id: string) {
    // Implementation
  }
}

// New structure: backend/src/services/user/
// ├── user.service.ts
// ├── user.repository.ts
// ├── user.validator.ts
// ├── user.transformer.ts
// └── user.types.ts

// user.service.ts
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private userValidator: UserValidator,
    private userTransformer: UserTransformer
  ) {}
  
  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    return this.userTransformer.toResponse(user);
  }
  
  async createUser(userData: CreateUserRequest) {
    const validatedData = await this.userValidator.validateCreate(userData);
    const user = await this.userRepository.create(validatedData);
    return this.userTransformer.toResponse(user);
  }
}

// user.repository.ts
export class UserRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  
  async create(data: CreateUserData) {
    return this.prisma.user.create({ data });
  }
}

// user.validator.ts
export class UserValidator {
  async validateCreate(data: CreateUserRequest) {
    // Validation logic
    return validatedData;
  }
}

// user.transformer.ts
export class UserTransformer {
  toResponse(user: User): UserResponse {
    // Transformation logic
    return transformedUser;
  }
}
```

### 2. Module Reorganization

**Example: Frontend Component Migration**
```typescript
// Old structure: frontend/src/components/UserProfile.tsx
export function UserProfile({ user }: { user: User }) {
  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// New structure: frontend/src/components/user/
// ├── UserProfile.tsx
// ├── UserProfileHeader.tsx
// ├── UserProfileDetails.tsx
// ├── UserProfileActions.tsx
// ├── UserProfile.types.ts
// └── UserProfile.styles.ts

// UserProfile.tsx
export function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="user-profile">
      <UserProfileHeader user={user} />
      <UserProfileDetails user={user} />
      <UserProfileActions user={user} />
    </div>
  );
}

// UserProfileHeader.tsx
export function UserProfileHeader({ user }: UserProfileHeaderProps) {
  return (
    <div className="user-profile-header">
      <h1>{user.profile.displayName}</h1>
      <UserStatus status={user.status} />
    </div>
  );
}

// UserProfileDetails.tsx
export function UserProfileDetails({ user }: UserProfileDetailsProps) {
  return (
    <div className="user-profile-details">
      <UserContactInfo user={user} />
      <UserPreferences preferences={user.preferences} />
    </div>
  );
}
```

### 3. Dependency Updates

**Example: Package Migration**
```json
// package.json - Old dependencies
{
  "dependencies": {
    "axios": "^0.21.1",
    "lodash": "^4.17.20",
    "moment": "^2.29.1"
  }
}

// package.json - New dependencies
{
  "dependencies": {
    "axios": "^1.6.0",
    "lodash": "^4.17.21",
    "date-fns": "^2.30.0"
  }
}
```

**Migration Script**
```typescript
// scripts/migrate-dependencies.ts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function migrateDependencies() {
  console.log('Starting dependency migration...');
  
  try {
    // Update axios
    console.log('Updating axios...');
    execSync('npm install axios@^1.6.0', { stdio: 'inherit' });
    
    // Update lodash
    console.log('Updating lodash...');
    execSync('npm install lodash@^4.17.21', { stdio: 'inherit' });
    
    // Replace moment with date-fns
    console.log('Replacing moment with date-fns...');
    execSync('npm uninstall moment', { stdio: 'inherit' });
    execSync('npm install date-fns@^2.30.0', { stdio: 'inherit' });
    
    // Update import statements
    await updateImportStatements();
    
    console.log('Dependency migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function updateImportStatements() {
  const files = [
    'backend/src/services/date.service.ts',
    'frontend/src/utils/date.utils.ts'
  ];
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Replace moment imports with date-fns
      content = content.replace(
        /import \* as moment from 'moment';/g,
        "import { format, parseISO, addDays, subDays } from 'date-fns';"
      );
      
      // Replace moment usage with date-fns
      content = content.replace(/moment\(\)\.format\(/g, 'format(');
      content = content.replace(/moment\(/g, 'parseISO(');
      
      fs.writeFileSync(file, content);
      console.log(`Updated imports in ${file}`);
    }
  }
}

migrateDependencies();
```

## Breaking Changes Management

### 1. Deprecation Strategy

**Example: Function Deprecation**
```typescript
// backend/src/services/user.service.ts
export class UserService {
  // Deprecated method
  /**
   * @deprecated Use getUserById instead. This method will be removed in v3.0.0
   */
  async getUser(id: string) {
    console.warn('getUser is deprecated. Use getUserById instead.');
    return this.getUserById(id);
  }
  
  // New method
  async getUserById(id: string) {
    // Implementation
  }
}
```

**Deprecation Warnings**
```typescript
// backend/src/utils/deprecation.ts
export class DeprecationManager {
  private static warnings = new Set<string>();
  
  static warn(method: string, replacement: string, version: string) {
    const key = `${method}-${replacement}`;
    
    if (!this.warnings.has(key)) {
      console.warn(
        `⚠️  DEPRECATION WARNING: ${method} is deprecated. ` +
        `Use ${replacement} instead. This will be removed in ${version}.`
      );
      this.warnings.add(key);
    }
  }
  
  static error(method: string, version: string) {
    throw new Error(
      `❌ REMOVED: ${method} has been removed in ${version}. ` +
      `Please update your code to use the new API.`
    );
  }
}
```

### 2. Version Compatibility

**Example: API Versioning**
```typescript
// backend/src/middleware/api-version.middleware.ts
export async function apiVersionMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const version = request.headers['api-version'] || '1.0';
  const supportedVersions = ['1.0', '2.0'];
  
  if (!supportedVersions.includes(version)) {
    return reply.status(400).send({
      error: 'Unsupported API version',
      supportedVersions,
      requestedVersion: version
    });
  }
  
  request.apiVersion = version;
}
```

**Version-Specific Routes**
```typescript
// backend/src/routes/users.ts
export async function userRoutes(fastify: FastifyInstance) {
  // V1 routes
  fastify.get('/api/v1/users/:id', {
    schema: {
      deprecated: true,
      description: 'Deprecated: Use /api/v2/users/:id instead'
    }
  }, async (request, reply) => {
    // V1 implementation
  });
  
  // V2 routes
  fastify.get('/api/v2/users/:id', async (request, reply) => {
    // V2 implementation
  });
}
```

### 3. Migration Tools

**Example: Code Migration Tool**
```typescript
// scripts/migrate-code.ts
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface MigrationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const migrationRules: MigrationRule[] = [
  {
    pattern: /import \* as moment from 'moment';/g,
    replacement: "import { format, parseISO } from 'date-fns';",
    description: 'Replace moment imports with date-fns'
  },
  {
    pattern: /moment\(\)\.format\(/g,
    replacement: 'format(',
    description: 'Replace moment().format() with date-fns format()'
  },
  {
    pattern: /moment\(/g,
    replacement: 'parseISO(',
    description: 'Replace moment() with date-fns parseISO()'
  }
];

async function migrateCode() {
  console.log('Starting code migration...');
  
  try {
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', 'dist/**', 'build/**']
    });
    
    for (const file of files) {
      await migrateFile(file);
    }
    
    console.log('Code migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function migrateFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const rule of migrationRules) {
    if (rule.pattern.test(content)) {
      content = content.replace(rule.pattern, rule.replacement);
      modified = true;
      console.log(`Applied rule: ${rule.description} in ${filePath}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated file: ${filePath}`);
  }
}

migrateCode();
```

## Testing Migrations

### 1. Migration Testing

**Example: API Migration Tests**
```typescript
// tests/migrations/api-migration.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';

describe('API Migration Tests', () => {
  let app: FastifyInstance;
  
  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('User API Migration', () => {
    it('should support V1 API format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/test-user-id'
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        name: expect.any(String),
        created_at: expect.any(String)
      });
    });
    
    it('should support V2 API format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v2/users/test-user-id'
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        profile: {
          firstName: expect.any(String),
          lastName: expect.any(String),
          displayName: expect.any(String)
        },
        preferences: {
          theme: expect.any(String),
          language: expect.any(String),
          notifications: expect.any(Object)
        },
        timestamps: {
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          lastLoginAt: expect.any(String)
        },
        status: {
          isActive: expect.any(Boolean),
          isVerified: expect.any(Boolean),
          role: expect.any(String)
        }
      });
    });
    
    it('should maintain backward compatibility', async () => {
      const v1Response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/test-user-id'
      });
      
      const v2Response = await app.inject({
        method: 'GET',
        url: '/api/v2/users/test-user-id'
      });
      
      expect(v1Response.json().id).toBe(v2Response.json().id);
      expect(v1Response.json().email).toBe(v2Response.json().email);
    });
  });
});
```

### 2. Compatibility Testing

**Example: Frontend Migration Tests**
```typescript
// tests/migrations/frontend-migration.test.ts
import { render, screen } from '@testing-library/react';
import { UserProfile } from '../../src/components/user/UserProfile';
import { UserProfileV1 } from '../../src/components/user/UserProfileV1';

describe('Frontend Migration Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe'
    },
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {}
    },
    timestamps: {
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      lastLoginAt: '2023-01-01T00:00:00Z'
    },
    status: {
      isActive: true,
      isVerified: true,
      role: 'USER'
    }
  };
  
  it('should render V1 component correctly', () => {
    render(<UserProfileV1 user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
  
  it('should render V2 component correctly', () => {
    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Light Theme')).toBeInTheDocument();
  });
  
  it('should maintain visual consistency', () => {
    const { container: v1Container } = render(<UserProfileV1 user={mockUser} />);
    const { container: v2Container } = render(<UserProfile user={mockUser} />);
    
    // Compare key elements
    expect(v1Container.querySelector('.user-name')).toBeTruthy();
    expect(v2Container.querySelector('.user-name')).toBeTruthy();
  });
});
```

## Migration Documentation

### 1. Migration Guides

**Example: User API Migration Guide**
```markdown
# User API Migration Guide

## Overview
This guide helps you migrate from User API v1 to v2.

## Breaking Changes

### Request Format Changes
- **Old**: `GET /api/v1/users/:id`
- **New**: `GET /api/v2/users/:id`

### Response Format Changes
- **Old**: Simple user object
- **New**: Enhanced user object with profile, preferences, and status

## Migration Steps

### 1. Update API Endpoints
```typescript
// Old
const response = await fetch('/api/v1/users/123');

// New
const response = await fetch('/api/v2/users/123');
```

### 2. Update Response Handling
```typescript
// Old
const user = await response.json();
console.log(user.name); // "John Doe"

// New
const user = await response.json();
console.log(user.profile.displayName); // "John Doe"
```

### 3. Update Type Definitions
```typescript
// Old
interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// New
interface User {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    displayName: string;
  };
  preferences: {
    theme: string;
    language: string;
    notifications: NotificationSettings;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
  };
  status: {
    isActive: boolean;
    isVerified: boolean;
    role: UserRole;
  };
}
```

## Timeline
- **v1 Deprecated**: 2024-01-01
- **v1 Removed**: 2024-07-01
- **v2 Stable**: 2024-01-01
```

### 2. Migration Checklist

**Pre-Migration Checklist**
- [ ] Review breaking changes
- [ ] Update type definitions
- [ ] Update API endpoints
- [ ] Update response handling
- [ ] Test in development
- [ ] Update documentation
- [ ] Plan deployment strategy

**Post-Migration Checklist**
- [ ] Verify functionality
- [ ] Monitor error rates
- [ ] Update client libraries
- [ ] Remove old code
- [ ] Update tests
- [ ] Update documentation
- [ ] Notify users

## Checklist

### Pre-Migration
- [ ] Identify breaking changes
- [ ] Plan backward compatibility
- [ ] Create migration timeline
- [ ] Design deprecation strategy
- [ ] Plan testing strategy
- [ ] Update documentation
- [ ] Notify users

### Migration Execution
- [ ] Implement new code
- [ ] Add deprecation warnings
- [ ] Test compatibility
- [ ] Deploy with feature flags
- [ ] Monitor usage metrics
- [ ] Collect feedback
- [ ] Plan removal timeline

### Post-Migration
- [ ] Verify functionality
- [ ] Monitor system health
- [ ] Update client libraries
- [ ] Remove old code
- [ ] Update tests
- [ ] Update documentation
- [ ] Notify users
