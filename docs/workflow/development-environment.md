# Development Environment

## Overview

This document outlines the development environment setup and configuration for the Axisor project. It covers environment setup, tooling, configuration, and best practices to ensure consistent and efficient development across the team.

## Environment Setup

### Prerequisites

#### System Requirements
```typescript
// System Requirements
interface SystemRequirements {
  operating_system: {
    linux: "Ubuntu 20.04+ or CentOS 8+";
    macos: "macOS 10.15+ (Catalina or later)";
    windows: "Windows 10+ with WSL2 or native development";
  };
  hardware: {
    cpu: "4 cores minimum, 8 cores recommended";
    memory: "8 GB RAM minimum, 16 GB recommended";
    storage: "50 GB free space minimum, 100 GB recommended";
    network: "10 Mbps internet minimum, 50 Mbps recommended";
  };
  software: {
    nodejs: "Node.js 18.0+ (LTS recommended)";
    npm: "npm 8.0+ (comes with Node.js)";
    git: "Git 2.30+";
    docker: "Docker 20.10+";
    docker_compose: "Docker Compose 2.0+";
  };
}
```

#### Development Tools
```typescript
// Development Tools
interface DevelopmentTools {
  essential: {
    nodejs: "Node.js and npm";
    git: "Git version control";
    docker: "Docker for containerization";
    vscode: "VS Code editor";
  };
  recommended: {
    postman: "API testing and development";
    insomnia: "API client and testing";
    docker_desktop: "Docker Desktop for GUI";
    github_cli: "GitHub CLI for Git operations";
  };
  optional: {
    webstorm: "WebStorm IDE";
    datagrip: "Database management";
    redis_commander: "Redis management";
    pgadmin: "PostgreSQL management";
  };
}
```

### Environment Configuration

#### Node.js Configuration
```bash
# Node.js Configuration
# Install Node.js using Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version
npm --version
```

#### Git Configuration
```bash
# Git Configuration
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global push.default simple
git config --global core.autocrlf input
git config --global core.safecrlf true
git config --global core.ignorecase false
git config --global core.precomposeunicode true
```

#### Docker Configuration
```bash
# Docker Configuration
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Development Tools

### IDE Configuration

#### VS Code Setup
```json
// VS Code Settings
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

#### VS Code Extensions
```json
// VS Code Extensions
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
    "ms-vscode.vscode-github-actions",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Development Scripts

#### Package.json Scripts
```json
// Package.json Scripts
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm run test",
    "test:frontend": "cd frontend && npm run test",
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "cd backend && npm run lint",
    "lint:frontend": "cd frontend && npm run lint",
    "format": "npm run format:backend && npm run format:frontend",
    "format:backend": "cd backend && npm run format",
    "format:frontend": "cd frontend && npm run format",
    "type-check": "npm run type-check:backend && npm run type-check:frontend",
    "type-check:backend": "cd backend && npm run type-check",
    "type-check:frontend": "cd frontend && npm run type-check",
    "db:migrate": "cd backend && npm run db:migrate",
    "db:seed": "cd backend && npm run db:seed",
    "db:reset": "cd backend && npm run db:reset",
    "db:studio": "cd backend && npm run db:studio",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "docker:build": "docker-compose build",
    "docker:clean": "docker-compose down -v --remove-orphans"
  }
}
```

#### Development Commands
```bash
# Development Commands
npm run dev                    # Start development servers
npm run build                  # Build for production
npm run test                   # Run all tests
npm run lint                   # Run linting
npm run format                 # Format code
npm run type-check             # Type checking
npm run db:migrate             # Run database migrations
npm run db:seed                # Seed database
npm run db:reset               # Reset database
npm run db:studio              # Open Prisma Studio
npm run docker:up              # Start Docker services
npm run docker:down            # Stop Docker services
npm run docker:logs            # View Docker logs
npm run docker:build          # Build Docker images
npm run docker:clean           # Clean Docker resources
```

## Environment Variables

### Environment Configuration

#### Backend Environment
```bash
# Backend Environment Variables
# .env.development
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://axisor_user:secure_password@localhost:5432/axisor_dev"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=axisor_dev
DB_USER=axisor_user
DB_PASSWORD=secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# External APIs
LNMARKETS_API_URL=https://api.lnmarkets.com
LNMARKETS_API_KEY=your-api-key
LNMARKETS_API_SECRET=your-api-secret

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASSWORD=test
SMTP_FROM=noreply@axisor.com

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

#### Frontend Environment
```bash
# Frontend Environment Variables
# .env.development
VITE_NODE_ENV=development
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false
VITE_TRADINGVIEW_CHARTING_LIBRARY_URL=https://s3.tradingview.com/tv.js
VITE_SENTRY_DSN=your-sentry-dsn
```

### Environment Management

#### Environment Files
```typescript
// Environment Management
interface EnvironmentManagement {
  development: {
    file: ".env.development";
    purpose: "Local development environment";
    database: "Local PostgreSQL instance";
    redis: "Local Redis instance";
    external_apis: "Development API endpoints";
  };
  staging: {
    file: ".env.staging";
    purpose: "Staging environment for testing";
    database: "Staging PostgreSQL instance";
    redis: "Staging Redis instance";
    external_apis: "Staging API endpoints";
  };
  production: {
    file: ".env.production";
    purpose: "Production environment";
    database: "Production PostgreSQL instance";
    redis: "Production Redis instance";
    external_apis: "Production API endpoints";
  };
}
```

#### Environment Validation
```typescript
// Environment Validation
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  LNMARKETS_API_URL: Joi.string().uri().required(),
  LNMARKETS_API_KEY: Joi.string().required(),
  LNMARKETS_API_SECRET: Joi.string().required(),
}).unknown();

const { error, value } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const env = value;
```

## Database Setup

### Database Configuration

#### PostgreSQL Setup
```bash
# PostgreSQL Setup
# Start PostgreSQL using Docker
docker run --name axisor-postgres \
  -e POSTGRES_DB=axisor_dev \
  -e POSTGRES_USER=axisor_user \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -d postgres:15

# Connect to database
psql -h localhost -p 5432 -U axisor_user -d axisor_dev

# Run migrations
cd backend
npx prisma migrate dev

# Seed database
npx prisma db seed
```

#### Redis Setup
```bash
# Redis Setup
# Start Redis using Docker
docker run --name axisor-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# Connect to Redis
redis-cli -h localhost -p 6379

# Test connection
redis-cli ping
# Should return: PONG
```

### Database Management

#### Prisma Configuration
```typescript
// Prisma Configuration
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String
  lastName  String
  password  String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}
```

#### Database Scripts
```bash
# Database Scripts
npm run db:migrate              # Run migrations
npm run db:seed                 # Seed database
npm run db:reset                # Reset database
npm run db:studio               # Open Prisma Studio
npm run db:generate             # Generate Prisma client
npm run db:push                 # Push schema changes
npm run db:pull                 # Pull schema from database
```

## Docker Configuration

### Docker Setup

#### Docker Compose
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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U axisor_user -d axisor_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
```

#### Docker Commands
```bash
# Docker Commands
docker-compose -f docker-compose.dev.yml up -d    # Start services
docker-compose -f docker-compose.dev.yml down     # Stop services
docker-compose -f docker-compose.dev.yml logs -f  # View logs
docker-compose -f docker-compose.dev.yml build   # Build images
docker-compose -f docker-compose.dev.yml clean   # Clean resources
```

### Docker Development

#### Development Dockerfile
```dockerfile
# backend/Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

#### Docker Development Scripts
```bash
# Docker Development Scripts
docker-compose -f docker-compose.dev.yml up -d postgres redis
docker-compose -f docker-compose.dev.yml up -d mailhog
docker-compose -f docker-compose.dev.yml logs -f postgres
docker-compose -f docker-compose.dev.yml logs -f redis
docker-compose -f docker-compose.dev.yml logs -f mailhog
```

## Development Workflow

### Daily Development Process

#### Morning Setup
```bash
# Morning Setup
git pull origin develop                    # Pull latest changes
npm install                                # Update dependencies
npm run docker:up                         # Start Docker services
npm run db:migrate                        # Run database migrations
npm run dev                               # Start development servers
```

#### Development Commands
```bash
# Development Commands
npm run dev                               # Start development servers
npm run build                             # Build for production
npm run test                              # Run tests
npm run lint                              # Run linting
npm run format                            # Format code
npm run type-check                        # Type checking
npm run db:migrate                        # Run database migrations
npm run db:seed                           # Seed database
npm run db:reset                          # Reset database
npm run db:studio                         # Open Prisma Studio
```

#### End of Day
```bash
# End of Day
git add .                                 # Stage changes
git commit -m "feat: add new feature"     # Commit changes
git push origin feature-branch            # Push changes
npm run docker:down                       # Stop Docker services
```

### Development Best Practices

#### Code Quality
```typescript
// Development Best Practices
interface DevelopmentBestPractices {
  code_quality: {
    linting: "Run linting before committing";
    formatting: "Format code consistently";
    type_checking: "Run type checking";
    testing: "Write and run tests";
  };
  git_workflow: {
    atomic_commits: "Make atomic commits";
    descriptive_messages: "Write descriptive commit messages";
    regular_pushes: "Push changes regularly";
    branch_management: "Manage branches effectively";
  };
  environment: {
    consistent_setup: "Maintain consistent environment";
    dependency_management: "Manage dependencies properly";
    configuration: "Keep configuration up to date";
    documentation: "Document environment setup";
  };
}
```

#### Development Tools
```typescript
// Development Tools
interface DevelopmentTools {
  code_editors: {
    vscode: "VS Code with extensions";
    webstorm: "WebStorm IDE";
    vim: "Vim/Neovim for terminal";
    sublime: "Sublime Text";
  };
  debugging: {
    chrome_devtools: "Chrome DevTools";
    node_debugger: "Node.js debugger";
    vscode_debugger: "VS Code debugger";
    postman: "API testing and debugging";
  };
  database: {
    prisma_studio: "Prisma Studio";
    pgadmin: "pgAdmin for PostgreSQL";
    redis_commander: "Redis Commander";
    datagrip: "DataGrip for database management";
  };
}
```

## Troubleshooting

### Common Issues

#### Environment Issues
```bash
# Common Environment Issues

# Node.js version issues
node --version
nvm use 18

# Docker issues
docker --version
docker-compose --version
sudo systemctl start docker

# Database connection issues
psql -h localhost -p 5432 -U axisor_user -d axisor_dev
redis-cli -h localhost -p 6379 ping

# Port conflicts
lsof -i :3000
lsof -i :5432
lsof -i :6379
```

#### Development Issues
```bash
# Development Issues

# Dependency issues
rm -rf node_modules package-lock.json
npm install

# Database issues
npm run db:reset
npm run db:migrate
npm run db:seed

# Docker issues
docker-compose down -v
docker-compose up -d

# Cache issues
npm cache clean --force
docker system prune -a
```

### Performance Optimization

#### Development Performance
```typescript
// Development Performance
interface DevelopmentPerformance {
  build_optimization: {
    incremental_builds: "Use incremental builds";
    caching: "Implement build caching";
    parallel_execution: "Use parallel execution";
    watch_mode: "Use watch mode for development";
  };
  database_optimization: {
    connection_pooling: "Use connection pooling";
    query_optimization: "Optimize database queries";
    indexing: "Proper database indexing";
    caching: "Implement database caching";
  };
  development_tools: {
    fast_reload: "Fast reload and hot reload";
    efficient_debugging: "Efficient debugging tools";
    performance_monitoring: "Performance monitoring";
    resource_optimization: "Resource optimization";
  };
}
```

## Conclusion

This development environment guide provides a comprehensive approach to setting up and maintaining a consistent development environment for the Axisor project. By following the guidelines and best practices outlined in this document, the team can ensure efficient and productive development.

Key principles for effective development environment:
- **Consistency**: Maintain consistent environment across team
- **Automation**: Use automation for setup and maintenance
- **Documentation**: Document environment setup and changes
- **Performance**: Optimize development performance
- **Troubleshooting**: Be prepared to troubleshoot issues

Remember that a well-configured development environment is essential for productive development and team collaboration.
