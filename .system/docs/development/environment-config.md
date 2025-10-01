# 🔧 Hub DefiSats - Configuração de Ambiente

## 📋 Pré-requisitos

### Sistema Operacional
- **Ubuntu 20.04+** (recomendado)
- **Docker 20.10+**
- **Docker Compose 2.0+**
- **Git**

### Recursos Mínimos
- **CPU:** 2 cores
- **RAM:** 4GB
- **Disco:** 20GB livres
- **Rede:** Acesso à internet

## 🚀 Instalação Inicial

### 1. Instalar Docker
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar sessão
newgrp docker
```

### 2. Instalar Docker Compose
```bash
# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Tornar executável
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker-compose --version
```

### 3. Instalar Git
```bash
sudo apt install -y git
```

## 📁 Configuração do Projeto

### 1. Clonar Repositório
```bash
# Criar diretório
mkdir -p /home/$USER/projects
cd /home/$USER/projects

# Clonar repositório
git clone https://github.com/seu-usuario/hub-defisats.git
cd hub-defisats
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp config/env/env.production.example config/env/.env.production

# Editar variáveis
nano config/env/.env.production
```

### 3. Configurar Nginx
```bash
# Instalar Nginx
sudo apt install -y nginx

# Copiar configuração
sudo cp nginx/nginx.conf /etc/nginx/sites-available/defisats
sudo ln -s /etc/nginx/sites-available/defisats /etc/nginx/sites-enabled/

# Remover configuração padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 4. Configurar SSL (Let's Encrypt)
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d defisats.site

# Verificar renovação automática
sudo certbot renew --dry-run
```

## 🔐 Configuração de Segurança

### 1. Firewall
```bash
# Instalar UFW
sudo apt install -y ufw

# Configurar regras
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Ativar firewall
sudo ufw enable
```

### 2. SSH
```bash
# Editar configuração SSH
sudo nano /etc/ssh/sshd_config

# Configurações recomendadas
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Reiniciar SSH
sudo systemctl restart ssh
```

### 3. Fail2Ban
```bash
# Instalar Fail2Ban
sudo apt install -y fail2ban

# Configurar
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
```

## 🐳 Configuração Docker

### 1. Configurar Docker Compose
```bash
# Criar rede externa
docker network create proxy-network

# Verificar configuração
docker-compose -f docker-compose.prod.yml config
```

### 2. Configurar Volumes
```bash
# Criar diretórios para volumes
sudo mkdir -p /var/lib/docker/volumes/hub-defisats_postgres_data/_data
sudo mkdir -p /var/lib/docker/volumes/hub-defisats_redis_data/_data

# Configurar permissões
sudo chown -R 999:999 /var/lib/docker/volumes/hub-defisats_postgres_data/_data
sudo chown -R 999:999 /var/lib/docker/volumes/hub-defisats_redis_data/_data
```

## 🚀 Deploy Inicial

### 1. Deploy Automático
```bash
# Tornar scripts executáveis
chmod +x scripts/deploy/*.sh
chmod +x scripts/admin/*.sh

# Executar deploy
./scripts/deploy/deploy-prod-enhanced.sh
```

### 2. Deploy Manual
```bash
# 1. Build das imagens
docker-compose -f docker-compose.prod.yml build

# 2. Iniciar serviços
docker-compose -f docker-compose.prod.yml up -d

# 3. Aguardar inicialização
sleep 30

# 4. Executar migrações
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 5. Criar super admin
./scripts/admin/create-super-admin.sh admin@defisats.com admin password
```

## ✅ Verificação da Instalação

### 1. Verificar Serviços
```bash
# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Health checks
curl http://localhost:13010/health
curl http://localhost/health
```

### 2. Verificar Logs
```bash
# Logs do backend
docker-compose -f docker-compose.prod.yml logs backend --tail=50

# Logs do banco
docker-compose -f docker-compose.prod.yml logs postgres --tail=50
```

### 3. Testar Aplicação
```bash
# Testar login
curl -X POST "https://defisats.site/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@defisats.com","password":"password"}'

# Testar endpoints públicos
curl -X GET "https://defisats.site/api/cards-with-tooltips"
curl -X GET "https://defisats.site/api/market/index/public"
```

## 🔧 Configurações Avançadas

### 1. Monitoramento
```bash
# Instalar Prometheus
docker run -d --name prometheus -p 9090:9090 prom/prometheus

# Instalar Grafana
docker run -d --name grafana -p 3000:3000 grafana/grafana
```

### 2. Backup Automático
```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-defisats.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# Backup do banco
docker exec hub-defisats-postgres-prod pg_dump -U hubdefisats_prod hubdefisats_prod > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos volumes
docker run --rm -v hub-defisats_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/volumes_backup_$DATE.tar.gz -C /data .

# Limpar backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/backup-defisats.sh

# Configurar cron (backup diário às 2h)
echo "0 2 * * * /usr/local/bin/backup-defisats.sh" | sudo crontab -
```

### 3. Log Rotation
```bash
# Configurar rotação de logs
sudo nano /etc/logrotate.d/docker
```

```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Docker não inicia
```bash
# Verificar status
sudo systemctl status docker

# Reiniciar Docker
sudo systemctl restart docker

# Verificar logs
sudo journalctl -u docker.service
```

#### 2. Containers não iniciam
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs

# Verificar recursos
docker stats

# Verificar espaço em disco
df -h
```

#### 3. Problemas de rede
```bash
# Verificar portas
netstat -tlnp | grep -E "(80|443|13010|5432|6379)"

# Verificar firewall
sudo ufw status

# Verificar DNS
nslookup defisats.site
```

#### 4. Problemas de banco
```bash
# Verificar conectividade
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U hubdefisats_prod

# Verificar logs do banco
docker-compose -f docker-compose.prod.yml logs postgres

# Verificar espaço em disco
docker-compose -f docker-compose.prod.yml exec postgres df -h
```

## 📊 Monitoramento

### 1. Métricas do Sistema
```bash
# CPU e memória
htop

# Espaço em disco
df -h

# Uso de rede
iftop

# Processos Docker
docker stats
```

### 2. Logs
```bash
# Logs do sistema
sudo journalctl -f

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs dos containers
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Alertas
```bash
# Configurar alertas por email
sudo apt install -y mailutils

# Configurar notificações
echo "Subject: Hub DefiSats Alert" | sudo tee /usr/local/bin/alert.sh
```

## 🔄 Manutenção

### 1. Atualizações
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Atualizar Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Atualizar aplicação
git pull origin main
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Limpeza
```bash
# Limpar containers parados
docker container prune

# Limpar imagens não utilizadas
docker image prune

# Limpar volumes não utilizados
docker volume prune

# Limpeza completa
docker system prune -a
```

### 3. Backup
```bash
# Backup manual
/usr/local/bin/backup-defisats.sh

# Verificar backups
ls -la /backups/
```

## 🛠️ Ambiente de Desenvolvimento

### Configuração Docker Compose Dev
```bash
# Navegar para o diretório de configuração Docker
cd config/docker

# Iniciar ambiente de desenvolvimento
docker compose -f docker-compose.dev.yml up -d

# Verificar status dos serviços
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Portas do Ambiente de Desenvolvimento
- **Frontend**: `http://localhost:13000`
- **Backend**: `http://localhost:13010`
- **PostgreSQL**: `localhost:15432`
- **Redis**: `localhost:16379`

### Credenciais de Desenvolvimento
```
Email/Username: admin@hub-defisats.com
Password: Admin123!@#
```

### Scripts Úteis para Desenvolvimento
```bash
# Verificar exchanges no banco
cd backend && npx tsx scripts/check-exchanges.ts

# Migrar credenciais existentes
cd backend && npx tsx scripts/migrate-credentials.ts

# Executar seeder de exchanges
cd backend && npm run seed:exchanges
```

### Sistema de Exchanges Escalável
- **Exchange**: LN Markets configurada por padrão
- **ExchangeCredentialType**: API Key, Secret, Passphrase
- **UserExchangeCredentials**: Credenciais dos usuários migradas

---

**📝 Nota:** Esta configuração é para um ambiente de produção. Para desenvolvimento, use os arquivos `docker-compose.dev.yml` e configure as variáveis de ambiente apropriadas.

**⚠️ Importante:** Sempre faça backup antes de fazer alterações significativas no sistema.

**🔒 Segurança:** Mantenha as chaves e senhas seguras. Use um gerenciador de senhas e nunca commite credenciais no Git.
