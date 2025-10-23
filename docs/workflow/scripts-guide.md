---
title: "Guia de Scripts do Projeto"
description: "Documentação completa dos scripts disponíveis no projeto Axisor"
version: "1.0.0"
created: "2025-10-23"
updated: "2025-10-23"
author: "Documentation Sync Agent"
status: "active"
last_synced: "2025-10-23T12:30:00Z"
source_of_truth: "/docs"
tags: ["scripts", "automation", "development", "operations"]
---

# Guia de Scripts do Projeto

Este documento fornece uma visão completa de todos os scripts disponíveis no projeto Axisor, organizados por categoria e funcionalidade.

## Índice

- [Scripts de Desenvolvimento](#scripts-de-desenvolvimento)
- [Scripts Operacionais](#scripts-operacionais)
- [Scripts de Teste](#scripts-de-teste)
- [Dependências e Requisitos](#dependências-e-requisitos)
- [Troubleshooting](#troubleshooting)

## Scripts de Desenvolvimento

Scripts relacionados ao ambiente de desenvolvimento e setup local.

### setup-dev.sh

**Caminho:** `scripts/dev/setup-dev.sh`  
**Propósito:** Configuração completa do ambiente de desenvolvimento local  
**Uso:** `bash scripts/dev/setup-dev.sh [--skip-docker] [--verbose]`  
**Flags:**
- `--skip-docker`: Pula a verificação e setup do Docker
- `--verbose`: Exibe logs detalhados durante a execução

**Variáveis de ambiente:**
- `NODE_ENV`: Define o ambiente (development/production)
- `DATABASE_URL`: URL de conexão com o banco de dados
- `REDIS_URL`: URL de conexão com Redis

**Exit codes:**
- `0`: Sucesso
- `1`: Erro de dependências
- `2`: Erro de Docker
- `3`: Erro de permissões

**Exemplo:**
```bash
# Setup básico
bash scripts/dev/setup-dev.sh

# Setup sem Docker
bash scripts/dev/setup-dev.sh --skip-docker

# Setup com logs detalhados
bash scripts/dev/setup-dev.sh --verbose
```

### create-test-user.sh

**Caminho:** `scripts/dev/create-test-user.sh`  
**Propósito:** Criação de usuário de teste para desenvolvimento  
**Uso:** `bash scripts/dev/create-test-user.sh [--admin] [--email=EMAIL]`  
**Flags:**
- `--admin`: Cria usuário com privilégios de administrador
- `--email=EMAIL`: Define email específico para o usuário

**Variáveis de ambiente:**
- `TEST_USER_EMAIL`: Email padrão para usuário de teste
- `TEST_USER_PASSWORD`: Senha padrão para usuário de teste

**Exit codes:**
- `0`: Usuário criado com sucesso
- `1`: Erro de conexão com banco
- `2`: Usuário já existe
- `3`: Erro de validação

**Exemplo:**
```bash
# Criar usuário básico
bash scripts/dev/create-test-user.sh

# Criar usuário admin
bash scripts/dev/create-test-user.sh --admin

# Criar usuário com email específico
bash scripts/dev/create-test-user.sh --email=test@example.com
```

### simple-backend.js

**Caminho:** `scripts/dev/simple-backend.js`  
**Propósito:** Backend simples para testes e desenvolvimento  
**Uso:** `node scripts/dev/simple-backend.js [--port=PORT]`  
**Flags:**
- `--port=PORT`: Define a porta do servidor (padrão: 3000)

**Variáveis de ambiente:**
- `PORT`: Porta do servidor
- `NODE_ENV`: Ambiente de execução

**Exit codes:**
- `0`: Servidor iniciado com sucesso
- `1`: Erro de porta em uso
- `2`: Erro de dependências

**Exemplo:**
```bash
# Iniciar servidor na porta padrão
node scripts/dev/simple-backend.js

# Iniciar servidor na porta 8080
node scripts/dev/simple-backend.js --port=8080
```

## Scripts Operacionais

Scripts para operações de manutenção, deploy e configuração.

### clean-var.sh

**Caminho:** `scripts/ops/clean-var.sh`  
**Propósito:** Limpeza de variáveis de ambiente e cache  
**Uso:** `bash scripts/ops/clean-var.sh [--force] [--backup]`  
**Flags:**
- `--force`: Força limpeza sem confirmação
- `--backup`: Cria backup antes da limpeza

**Variáveis de ambiente:**
- `CLEAN_BACKUP_DIR`: Diretório para backup
- `CLEAN_FORCE`: Força limpeza sem confirmação

**Exit codes:**
- `0`: Limpeza realizada com sucesso
- `1`: Erro de permissões
- `2`: Erro de backup

**Exemplo:**
```bash
# Limpeza com confirmação
bash scripts/ops/clean-var.sh

# Limpeza forçada
bash scripts/ops/clean-var.sh --force

# Limpeza com backup
bash scripts/ops/clean-var.sh --backup
```

### fix-nginx-config.sh

**Caminho:** `scripts/ops/fix-nginx-config.sh`  
**Propósito:** Correção automática de configuração Nginx  
**Uso:** `bash scripts/ops/fix-nginx-config.sh [--test] [--reload]`  
**Flags:**
- `--test`: Apenas testa a configuração sem aplicar
- `--reload`: Recarrega Nginx após correção

**Variáveis de ambiente:**
- `NGINX_CONFIG_PATH`: Caminho para arquivo de configuração
- `NGINX_TEST_ONLY`: Apenas testa configuração

**Exit codes:**
- `0`: Configuração corrigida com sucesso
- `1`: Erro de sintaxe na configuração
- `2`: Erro de permissões
- `3`: Erro de reload do Nginx

**Exemplo:**
```bash
# Testar configuração
bash scripts/ops/fix-nginx-config.sh --test

# Corrigir e recarregar
bash scripts/ops/fix-nginx-config.sh --reload
```

### update-version.sh

**Caminho:** `scripts/ops/update-version.sh`  
**Propósito:** Atualização de versão do projeto  
**Uso:** `bash scripts/ops/update-version.sh [--version=VERSION] [--commit]`  
**Flags:**
- `--version=VERSION`: Define versão específica
- `--commit`: Cria commit automático

**Variáveis de ambiente:**
- `NEW_VERSION`: Nova versão a ser definida
- `AUTO_COMMIT`: Cria commit automático

**Exit codes:**
- `0`: Versão atualizada com sucesso
- `1`: Erro de validação de versão
- `2`: Erro de Git
- `3`: Erro de permissões

**Exemplo:**
```bash
# Atualizar para próxima versão patch
bash scripts/ops/update-version.sh

# Atualizar para versão específica
bash scripts/ops/update-version.sh --version=1.2.3

# Atualizar e criar commit
bash scripts/ops/update-version.sh --commit
```

## Scripts de Teste

Scripts para testes de performance e validação.

### load-test.js

**Caminho:** `scripts/test/load-test.js`  
**Propósito:** Teste de carga e performance da aplicação  
**Uso:** `node scripts/test/load-test.js [--concurrent=CONCURRENT] [--duration=DURATION]`  
**Flags:**
- `--concurrent=CONCURRENT`: Número de requisições concorrentes
- `--duration=DURATION`: Duração do teste em segundos

**Variáveis de ambiente:**
- `LOAD_TEST_URL`: URL base para teste
- `LOAD_TEST_CONCURRENT`: Requisições concorrentes
- `LOAD_TEST_DURATION`: Duração em segundos

**Exit codes:**
- `0`: Teste concluído com sucesso
- `1`: Erro de conexão
- `2`: Timeout
- `3`: Erro de configuração

**Exemplo:**
```bash
# Teste básico
node scripts/test/load-test.js

# Teste com 10 requisições concorrentes por 60 segundos
node scripts/test/load-test.js --concurrent=10 --duration=60
```

## Dependências e Requisitos

### Requisitos do Sistema

- **Node.js:** >= 18.0.0
- **npm:** >= 8.0.0
- **Docker:** >= 20.0.0 (para scripts de desenvolvimento)
- **Git:** >= 2.30.0 (para scripts de versionamento)

### Dependências NPM

```json
{
  "dependencies": {
    "axios": "^1.0.0",
    "commander": "^9.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "artillery": "^2.0.0",
    "autocannon": "^7.0.0"
  }
}
```

### Permissões Necessárias

```bash
# Tornar scripts executáveis
chmod +x scripts/dev/*.sh
chmod +x scripts/ops/*.sh

# Ou usar Git para gerenciar permissões
git update-index --chmod=+x scripts/dev/*.sh scripts/ops/*.sh
```

## Troubleshooting

### Problemas Comuns

#### Script não executa
```bash
# Verificar permissões
ls -la scripts/dev/setup-dev.sh

# Corrigir permissões
chmod +x scripts/dev/setup-dev.sh
```

#### Erro de "command not found"
```bash
# Verificar shebang
head -1 scripts/dev/setup-dev.sh

# Deve retornar: #!/bin/bash
```

#### Problemas de variáveis de ambiente
```bash
# Verificar variáveis carregadas
env | grep NODE_ENV

# Carregar arquivo .env
source .env
```

#### Scripts de teste falhando
```bash
# Verificar dependências
npm list artillery autocannon

# Instalar dependências de teste
npm install --save-dev artillery autocannon
```

### Logs e Debug

#### Habilitar logs detalhados
```bash
# Para scripts shell
bash scripts/dev/setup-dev.sh --verbose

# Para scripts Node.js
DEBUG=* node scripts/test/load-test.js
```

#### Verificar logs do sistema
```bash
# Logs do Docker
docker logs axisor-backend

# Logs do Nginx
tail -f /var/log/nginx/error.log
```

### Suporte

Para problemas específicos ou dúvidas sobre os scripts:

1. Verifique este guia primeiro
2. Consulte os logs de erro
3. Verifique as dependências e requisitos
4. Abra uma issue no repositório com detalhes do erro

---

**Última atualização:** 2025-10-23  
**Versão do guia:** 1.0.0
