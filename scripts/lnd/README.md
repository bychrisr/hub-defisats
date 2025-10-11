# LND Scripts Collection

**Data de Atualização**: 2025-10-11  
**Versão**: 1.0.0

## 📋 Visão Geral

Esta coleção de scripts automatiza todas as operações relacionadas ao LND (Lightning Network Daemon) no sistema Axisor, desde deploy até monitoramento e troubleshooting.

## 🗂️ Estrutura de Scripts

### 📁 **deployment/** - Scripts de Deploy
- **`deploy-lnd.sh`** - Deploy completo da infraestrutura LND
- **`init-lnd-wallet.sh`** - Inicialização da carteira LND
- **`fund-lnd-testnet.sh`** - Funding da carteira testnet via faucets

### 📁 **monitoring/** - Scripts de Monitoramento
- **`monitor-lnd-sync.sh`** - Monitoramento da sincronização LND
- **`monitor-lnd-resources.sh`** - Monitoramento de recursos e performance

### 📁 **testing/** - Scripts de Teste
- **`test-lnd-functionality.sh`** - Testes completos de funcionalidade LND

### 📁 **backup/** - Scripts de Backup
- **`backup-lnd.sh`** - Backup completo dos dados LND

### 📁 **diagnostics/** - Scripts de Diagnóstico
- **`diagnose-lnd.sh`** - Diagnóstico completo e troubleshooting

## 🚀 Quick Start

### 1. **Deploy Completo**
```bash
# Deploy da infraestrutura LND
./scripts/lnd/deployment/deploy-lnd.sh

# Inicializar carteira
./scripts/lnd/deployment/init-lnd-wallet.sh

# Monitorar sincronização
./scripts/lnd/monitoring/monitor-lnd-sync.sh
```

### 2. **Funding Testnet**
```bash
# Funding via faucets
./scripts/lnd/deployment/fund-lnd-testnet.sh
```

### 3. **Testes e Monitoramento**
```bash
# Testar funcionalidade
./scripts/lnd/testing/test-lnd-functionality.sh

# Monitorar recursos
./scripts/lnd/monitoring/monitor-lnd-resources.sh
```

## 📊 Scripts Detalhados

### 🚀 **Deploy Scripts**

#### `deploy-lnd.sh`
**Propósito**: Deploy completo da infraestrutura LND
**Funcionalidades**:
- Verificação de pré-requisitos (Docker, Docker Compose)
- Criação de diretórios necessários
- Criação de rede Docker
- Build e start dos serviços
- Verificação de saúde dos serviços
- Testes de conectividade

**Uso**:
```bash
./scripts/lnd/deployment/deploy-lnd.sh
```

#### `init-lnd-wallet.sh`
**Propósito**: Inicialização da carteira LND
**Funcionalidades**:
- Verificação se LND está rodando
- Verificação se carteira já existe
- Criação de nova carteira
- Desbloqueio da carteira
- Verificação do status

**Uso**:
```bash
./scripts/lnd/deployment/init-lnd-wallet.sh
```

#### `fund-lnd-testnet.sh`
**Propósito**: Funding da carteira testnet via faucets
**Funcionalidades**:
- Geração de novo endereço
- Lista de faucets disponíveis
- Monitoramento de funding
- Verificação de transações
- Exibição de UTXOs

**Uso**:
```bash
./scripts/lnd/deployment/fund-lnd-testnet.sh
```

### 📊 **Monitoramento Scripts**

#### `monitor-lnd-sync.sh`
**Propósito**: Monitoramento da sincronização LND
**Funcionalidades**:
- Verificação contínua do status de sync
- Exibição de informações do nó
- Monitoramento de altura do bloco
- Relatório final de status

**Uso**:
```bash
./scripts/lnd/monitoring/monitor-lnd-sync.sh
```

#### `monitor-lnd-resources.sh`
**Propósito**: Monitoramento de recursos e performance
**Funcionalidades**:
- Monitoramento de uso de CPU e memória
- Informações do nó LND
- Saldo da carteira
- Informações de canais
- Uso de disco
- Logs recentes

**Uso**:
```bash
./scripts/lnd/monitoring/monitor-lnd-resources.sh
```

### 🧪 **Testing Scripts**

#### `test-lnd-functionality.sh`
**Propósito**: Testes completos de funcionalidade LND
**Funcionalidades**:
- Teste de conectividade básica
- Teste de status de sincronização
- Teste de saldo da carteira
- Teste de criação de invoice
- Teste de listagem de invoices
- Teste de listagem de canais
- Teste de listagem de peers
- Teste de geração de endereço
- Teste de conectividade da API backend
- Teste de métricas LND

**Uso**:
```bash
./scripts/lnd/testing/test-lnd-functionality.sh
```

### 💾 **Backup Scripts**

#### `backup-lnd.sh`
**Propósito**: Backup completo dos dados LND
**Funcionalidades**:
- Backup dos dados LND testnet
- Backup dos dados LND produção
- Backup das configurações
- Backup dos logs
- Backup dos arquivos Docker Compose
- Criação de manifest de backup

**Uso**:
```bash
./scripts/lnd/backup/backup-lnd.sh
```

### 🔍 **Diagnostics Scripts**

#### `diagnose-lnd.sh`
**Propósito**: Diagnóstico completo e troubleshooting
**Funcionalidades**:
- Verificação do ambiente Docker
- Verificação de containers
- Verificação de portas
- Verificação de conectividade LND
- Verificação de status LND
- Verificação de conectividade backend
- Verificação de permissões e volumes
- Análise de logs
- Verificação de uso de recursos
- Verificação de conectividade de rede
- Verificação de recursos do sistema

**Uso**:
```bash
./scripts/lnd/diagnostics/diagnose-lnd.sh
```

## 🔧 Configuração

### Pré-requisitos
- Docker e Docker Compose instalados
- jq para processamento JSON
- curl para testes de conectividade
- Acesso aos arquivos de configuração

### Permissões
```bash
# Tornar scripts executáveis
chmod +x scripts/lnd/**/*.sh
```

### Variáveis de Ambiente
Os scripts usam as seguintes variáveis de ambiente:
- `LND_TESTNET_BASE_URL`
- `LND_TESTNET_TLS_CERT`
- `LND_TESTNET_MACAROON`

## 📋 Workflows Comuns

### 1. **Setup Inicial Completo**
```bash
# 1. Deploy da infraestrutura
./scripts/lnd/deployment/deploy-lnd.sh

# 2. Inicializar carteira
./scripts/lnd/deployment/init-lnd-wallet.sh

# 3. Monitorar sincronização
./scripts/lnd/monitoring/monitor-lnd-sync.sh

# 4. Testar funcionalidade
./scripts/lnd/testing/test-lnd-functionality.sh

# 5. Funding testnet
./scripts/lnd/deployment/fund-lnd-testnet.sh
```

### 2. **Monitoramento Contínuo**
```bash
# Monitorar sincronização (até completar)
./scripts/lnd/monitoring/monitor-lnd-sync.sh

# Monitorar recursos (contínuo)
./scripts/lnd/monitoring/monitor-lnd-resources.sh
```

### 3. **Troubleshooting**
```bash
# Diagnóstico completo
./scripts/lnd/diagnostics/diagnose-lnd.sh

# Testes de funcionalidade
./scripts/lnd/testing/test-lnd-functionality.sh
```

### 4. **Backup e Restore**
```bash
# Backup completo
./scripts/lnd/backup/backup-lnd.sh

# Restore (quando implementado)
./scripts/lnd/backup/restore-lnd.sh <backup-dir>
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. **Script não executa**
```bash
# Verificar permissões
ls -la scripts/lnd/deployment/deploy-lnd.sh

# Corrigir permissões
chmod +x scripts/lnd/deployment/deploy-lnd.sh
```

#### 2. **Docker não encontrado**
```bash
# Verificar instalação Docker
docker --version
docker-compose --version

# Instalar se necessário
sudo apt-get update && sudo apt-get install -y docker.io docker-compose
```

#### 3. **jq não encontrado**
```bash
# Instalar jq
sudo apt-get install -y jq
```

#### 4. **LND não responde**
```bash
# Verificar status do container
docker-compose -f config/docker/docker-compose.dev.yml ps

# Verificar logs
docker-compose -f config/docker/docker-compose.dev.yml logs lnd-testnet
```

## 📊 Logs e Output

### Formato de Output
Todos os scripts usam cores para facilitar a leitura:
- 🔵 **Azul**: Informações gerais
- 🟢 **Verde**: Sucessos
- 🟡 **Amarelo**: Avisos
- 🔴 **Vermelho**: Erros

### Logs
- Scripts de monitoramento mostram logs em tempo real
- Scripts de diagnóstico analisam logs recentes
- Todos os scripts fornecem output estruturado

## 🔗 Referências

- **LND Documentation**: https://docs.lightning.engineering/lightning-network-tools/lnd
- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Lightning Network**: https://lightning.network/

## 📝 Notas

- Todos os scripts são idempotentes (podem ser executados múltiplas vezes)
- Scripts de monitoramento podem ser interrompidos com Ctrl+C
- Logs são mantidos em `logs/lnd/` para análise posterior
- Backups são criados em `backups/lnd-<timestamp>/`
