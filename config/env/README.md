# 🔧 Configuração de Ambiente

## 📁 Estrutura de Arquivos

```
config/env/
├── .env.development     # Variáveis para desenvolvimento
├── .env.production      # Variáveis para produção (NÃO COMMITAR)
├── .env.staging         # Variáveis para staging
├── env.production.example # Template para produção
└── README.md           # Este arquivo
```

## 🚀 Setup Rápido

### 1. Configurar Ambiente de Produção
```bash
# Executar script de setup
./scripts/setup-env.sh

# Ou manualmente
cp config/env/env.production.example config/env/.env.production
nano config/env/.env.production
```

### 2. Configurar Ambiente de Staging
```bash
# Copiar template de staging
cp config/env/.env.staging config/env/.env.staging.local
nano config/env/.env.staging.local
```

## 📋 Variáveis Obrigatórias

### Produção
```bash
# Database
POSTGRES_PASSWORD=your_secure_database_password
DATABASE_URL=postgresql://user:pass@postgres:5432/db

# Security
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum
ENCRYPTION_KEY=your_secure_encryption_key_32_chars

# CORS
CORS_ORIGIN=https://your_domain.com
VITE_API_URL=https://your_domain.com/api
```

### Desenvolvimento
```bash
# Database
DATABASE_URL=postgresql://axisor:password@localhost:5432/axisor_dev

# Security
JWT_SECRET=dev_jwt_secret_32_chars_minimum
ENCRYPTION_KEY=dev_encryption_key_32_chars

# CORS
CORS_ORIGIN=http://localhost:13000
VITE_API_URL=http://localhost:13010/api
```

## 🔒 Segurança

### ⚠️ IMPORTANTE
- **NUNCA** commite arquivos `.env.production` ou `.env.staging`
- Use senhas fortes e únicas para produção
- Gere chaves de criptografia seguras
- Mantenha backups seguros das configurações

### 🔑 Gerando Chaves Seguras
```bash
# JWT Secret (32+ caracteres)
openssl rand -base64 32

# Encryption Key (32 caracteres exatos)
openssl rand -hex 16

# Database Password
openssl rand -base64 24
```

## 🐳 Docker Compose

### Desenvolvimento
```bash
# Usa .env.development automaticamente
docker compose -f docker-compose.dev.yml up -d
```

### Produção
```bash
# Usa .env.production
docker compose -f docker-compose.prod.yml up -d
```

### Staging
```bash
# Usa .env.staging
docker compose -f docker-compose.staging.yml up -d
```

## 🚀 Deploy

### 1. Configurar Ambiente
```bash
./scripts/setup-env.sh
```

### 2. Deploy Produção
```bash
./scripts/deploy/deploy-prod.sh
```

### 3. Deploy Staging
```bash
./scripts/deploy/setup-staging.sh
```

## 🔍 Troubleshooting

### Erro: "File not found"
```bash
# Verificar se arquivo existe
ls -la config/env/.env.production

# Criar se não existir
./scripts/setup-env.sh
```

### Erro: "Missing required variables"
```bash
# Verificar variáveis
grep -E "POSTGRES_PASSWORD|JWT_SECRET|ENCRYPTION_KEY" config/env/.env.production
```

### Erro: "Permission denied"
```bash
# Dar permissão de execução
chmod +x scripts/setup-env.sh
chmod +x scripts/deploy/deploy-prod.sh
```

## 📚 Documentação Relacionada

- [Deploy Guide](../README_MARGIN_GUARD.md)
- [API Documentation](../MARGIN_GUARD_API_DOCS.md)
- [Quick Start Guide](../MARGIN_GUARD_QUICK_START.md)
- [Technical Documentation](../MARGIN_GUARD_DOCUMENTATION.md)

---

*Última atualização: 19 de Setembro de 2025*
