# Development Setup

## Overview

This document provides a comprehensive guide to setting up the Axisor development environment. It covers prerequisites, installation steps, configuration, and troubleshooting to help developers get started quickly and efficiently.

## Prerequisites

### System Requirements

#### Operating System
- **Linux**: Ubuntu 20.04+ or CentOS 8+
- **macOS**: macOS 10.15+ (Catalina or later)
- **Windows**: Windows 10+ with WSL2 or native development

#### Hardware Requirements
```typescript
// Minimum Hardware Requirements
interface HardwareRequirements {
  cpu: {
    minimum: "4 cores, 2.0 GHz";
    recommended: "8 cores, 3.0 GHz";
    purpose: "Compilation and development tools";
  };
  memory: {
    minimum: "8 GB RAM";
    recommended: "16 GB RAM";
    purpose: "Node.js, databases, and development tools";
  };
  storage: {
    minimum: "50 GB free space";
    recommended: "100 GB free space";
    purpose: "Code, dependencies, and databases";
  };
  network: {
    minimum: "10 Mbps internet";
    recommended: "50 Mbps internet";
    purpose: "Package downloads and API access";
  };
}
```

#### Software Requirements
- **Node.js**: Version 18.0+ (LTS recommended)
- **npm**: Version 8.0+ (comes with Node.js)
- **Git**: Version 2.30+
- **Docker**: Version 20.10+ (for containerized development)
- **Docker Compose**: Version 2.0+

### Development Tools

#### Essential Tools
```bash
# Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git
sudo apt-get install git

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Recommended IDE/Editors
- **VS Code**: Primary recommended editor
- **WebStorm**: Alternative IDE for JavaScript/TypeScript
- **Vim/Neovim**: For terminal-based development
- **Sublime Text**: Lightweight alternative

#### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "ms-vscode.vscode-git",
    "ms-vscode.vscode-github-actions"
  ]
}
```

## Installation Guide

### Step 1: Clone Repository

#### Repository Setup
```bash
# Clone the repository
git clone https://github.com/your-org/axisor.git
cd axisor

# Verify repository structure
ls -la
# Should see: backend/, frontend/, docs/, scripts/, etc.
```

#### Branch Setup
```bash
# Create development branch
git checkout -b feature/your-feature-name

# Set up upstream tracking
git remote add upstream https://github.com/your-org/axisor.git
git fetch upstream
```

### Step 2: Backend Setup

#### Install Dependencies
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env.development

# Edit environment variables
nano .env.development
```

#### Environment Variables
```typescript
// Backend Environment Variables
interface BackendEnvironment {
  database: {
    DATABASE_URL: "postgresql://user:password@localhost:5432/axisor_dev";
    DB_HOST: "localhost";
    DB_PORT: "5432";
    DB_NAME: "axisor_dev";
    DB_USER: "axisor_user";
    DB_PASSWORD: "secure_password";
  };
  redis: {
    REDIS_HOST: "localhost";
    REDIS_PORT: "6379";
    REDIS_PASSWORD: "redis_password";
  };
  auth: {
    JWT_SECRET: "your-jwt-secret-key";
    JWT_REFRESH_SECRET: "your-refresh-secret-key";
    JWT_EXPIRES_IN: "15m";
    JWT_REFRESH_EXPIRES_IN: "7d";
  };
  external: {
    LNMARKETS_API_URL: "https://api.lnmarkets.com";
    LNMARKETS_API_KEY: "your-api-key";
    LNMARKETS_API_SECRET: "your-api-secret";
  };
}
```

#### Database Setup
```bash
# Start PostgreSQL (using Docker)
docker run --name axisor-postgres \
  -e POSTGRES_DB=axisor_dev \
  -e POSTGRES_USER=axisor_user \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -d postgres:15

# Run database migrations
npx prisma migrate dev

# Seed database with initial data
npx prisma db seed
```

#### Redis Setup
```bash
# Start Redis (using Docker)
docker run --name axisor-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# Verify Redis connection
redis-cli ping
# Should return: PONG
```

### Step 3: Frontend Setup

#### Install Dependencies
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env.development

# Edit environment variables
nano .env.development
```

#### Environment Variables
```typescript
// Frontend Environment Variables
interface FrontendEnvironment {
  api: {
    VITE_API_URL: "http://localhost:3000/api";
    VITE_WS_URL: "ws://localhost:3000";
  };
  features: {
    VITE_ENABLE_ANALYTICS: "true";
    VITE_ENABLE_DEBUG: "true";
    VITE_ENABLE_MOCK_DATA: "false";
  };
  external: {
    VITE_TRADINGVIEW_CHARTING_LIBRARY_URL: "https://s3.tradingview.com/tv.js";
    VITE_SENTRY_DSN: "your-sentry-dsn";
  };
}
```

### Step 4: Development Services

#### Docker Compose Setup
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: axisor_dev
      POSTGRES_USER: axisor_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
```

#### Start Development Services
```bash
# Start all development services
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps
```

## Development Workflow

### Daily Development Process

#### Morning Setup
```bash
# Pull latest changes
git pull origin main

# Update dependencies
cd backend && npm update
cd ../frontend && npm update

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Start backend development server
cd backend && npm run dev

# Start frontend development server (new terminal)
cd frontend && npm run dev
```

#### Development Commands
```bash
# Backend development
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking

# Frontend development
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking
```

#### Database Operations
```bash
# Database migrations
npx prisma migrate dev --name your_migration_name
npx prisma migrate deploy
npx prisma migrate reset

# Database seeding
npx prisma db seed

# Database introspection
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Database studio
npx prisma studio
```

### Code Quality Tools

#### Linting and Formatting
```bash
# Backend linting
cd backend
npm run lint                    # ESLint
npm run lint:fix               # Fix ESLint issues
npm run format                 # Prettier formatting
npm run format:check           # Check Prettier formatting

# Frontend linting
cd frontend
npm run lint                    # ESLint
npm run lint:fix               # Fix ESLint issues
npm run format                 # Prettier formatting
npm run format:check           # Check Prettier formatting
```

#### Type Checking
```bash
# Backend type checking
cd backend
npm run type-check             # TypeScript compilation
npm run type-check:watch       # Watch mode

# Frontend type checking
cd frontend
npm run type-check             # TypeScript compilation
npm run type-check:watch       # Watch mode
```

#### Testing
```bash
# Backend testing
cd backend
npm run test                   # Run all tests
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm run test:e2e               # End-to-end tests
npm run test:coverage          # Test coverage report

# Frontend testing
cd frontend
npm run test                   # Run all tests
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm run test:e2e               # End-to-end tests
npm run test:coverage          # Test coverage report
```

## Configuration Files

### Backend Configuration

#### Package.json Scripts
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,json}",
    "format:check": "prettier --check src/**/*.{ts,tsx,json}",
    "type-check": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:reset": "prisma migrate reset",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
```

#### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/controllers/*": ["controllers/*"],
      "@/services/*": ["services/*"],
      "@/middleware/*": ["middleware/*"],
      "@/utils/*": ["utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Frontend Configuration

#### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

#### Tailwind Configuration
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

## Troubleshooting

### Common Issues

#### Node.js Version Issues
```bash
# Check Node.js version
node --version
# Should be 18.0+

# Use Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker ps | grep postgres

# Check database connection
psql -h localhost -p 5432 -U axisor_user -d axisor_dev

# Reset database
docker-compose -f docker-compose.dev.yml down
docker volume rm axisor_postgres_data
docker-compose -f docker-compose.dev.yml up -d
```

#### Port Conflicts
```bash
# Check port usage
lsof -i :3000  # Backend port
lsof -i :3001  # Frontend port
lsof -i :5432  # PostgreSQL port
lsof -i :6379  # Redis port

# Kill processes using ports
sudo kill -9 $(lsof -t -i:3000)
sudo kill -9 $(lsof -t -i:3001)
```

#### Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Update dependencies
npm update
```

### Performance Optimization

#### Development Performance
```bash
# Use faster package manager
npm install -g pnpm
pnpm install

# Enable TypeScript incremental compilation
# Add to tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

#### Database Performance
```bash
# Optimize PostgreSQL for development
# Add to postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

## Best Practices

### Development Best Practices

#### Code Organization
- **Modular Structure**: Keep related code together
- **Clear Naming**: Use descriptive variable and function names
- **Consistent Formatting**: Use Prettier for code formatting
- **Type Safety**: Use TypeScript strict mode

#### Git Workflow
- **Feature Branches**: Create branches for each feature
- **Commit Messages**: Use conventional commit format
- **Code Reviews**: Always review code before merging
- **Clean History**: Keep commit history clean and meaningful

#### Testing Strategy
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Test Coverage**: Maintain high test coverage

### Environment Management

#### Environment Separation
- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment
- **Testing**: Automated testing environment

#### Configuration Management
- **Environment Variables**: Use environment variables for configuration
- **Secrets Management**: Never commit secrets to version control
- **Configuration Validation**: Validate configuration on startup
- **Documentation**: Document all configuration options

## Conclusion

This development setup guide provides everything needed to start developing with the Axisor platform. Follow the steps carefully, and refer to the troubleshooting section if you encounter any issues.

Key takeaways:
- **Prerequisites**: Ensure all system requirements are met
- **Installation**: Follow the step-by-step installation guide
- **Configuration**: Properly configure all environment variables
- **Development**: Use the recommended development workflow
- **Troubleshooting**: Refer to common issues and solutions

For additional help, consult the project documentation or reach out to the development team.
