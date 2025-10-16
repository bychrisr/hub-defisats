# Guia de Acesso ao Servidor de Produção - Hub-defisats

## 📋 Informações do Servidor

### **Servidor Principal**
- **Hostname**: `defisats.site`
- **IP**: `3.143.248.70`
- **Sistema**: Ubuntu 24.04.3 LTS (AWS)
- **Usuário**: `ubuntu`
- **Chave SSH**: `~/.ssh/debian.pem`

### **Comando de Acesso**
```bash
ssh -i ~/.ssh/debian.pem ubuntu@defisats.site
```

## 🗂️ Estrutura de Diretórios

### **Localização do Projeto**
```
/home/ubuntu/apps/axisor/
```

### **Estrutura Completa**
```
/home/ubuntu/
├── apps/
│   └── axisor/                    # Projeto principal
│       ├── backend/                     # Backend Node.js
│       ├── frontend/                    # Frontend React
│       ├── docker-compose.prod.yml      # Configuração Docker
│       ├── .env.production              # Variáveis de ambiente
│       └── infra/                       # Configurações de infraestrutura
├── proxy/                               # Proxy reverso global
│   ├── docker-compose.yml
│   ├── nginx.conf
│   ├── conf.d/
│   │   └── defisats.conf
│   ├── certs/                           # Certificados SSL
│   ├── logs/                            # Logs do nginx
│   └── start-proxy.sh                   # Script de gerenciamento
└── .ssh/                                # Chaves SSH
    └── debian.pem                       # Chave de acesso
```

## 🐳 Configuração Docker

### **Containers da Aplicação**
```bash
# Localização
cd /home/ubuntu/apps/axisor

# Comandos principais
docker compose -f docker-compose.prod.yml ps          # Status
docker compose -f docker-compose.prod.yml logs        # Logs
docker compose -f docker-compose.prod.yml down        # Parar
docker compose -f docker-compose.prod.yml up -d       # Iniciar
```

### **Containers Ativos**
| Container | Status | Função |
|-----------|--------|--------|
| `axisor-backend-prod` | ✅ Healthy | API Backend |
| `axisor-frontend-prod` | ✅ Running | Frontend React |
| `axisor-nginx-prod` | ✅ Running | Nginx interno |
| `axisor-postgres-prod` | ✅ Healthy | Banco de dados |
| `axisor-redis-prod` | ✅ Healthy | Cache Redis |
| `axisor-margin-monitor-prod` | ⚠️ Restarting | Worker |
| `axisor-automation-executor-prod` | ⚠️ Restarting | Worker |
| `axisor-notification-worker-prod` | ⚠️ Restarting | Worker |
| `axisor-payment-validator-prod` | ⚠️ Restarting | Worker |

### **Proxy Global**
```bash
# Localização
cd ~/proxy

# Comandos principais
./start-proxy.sh start     # Iniciar
./start-proxy.sh stop      # Parar
./start-proxy.sh restart   # Reiniciar
./start-proxy.sh status    # Status
./start-proxy.sh logs      # Logs
```

## 🌐 Redes Docker

### **Rede Principal da Aplicação**
- **Nome**: `axisor_axisor-network`
- **Subnet**: `172.21.0.0/16`
- **Gateway**: `172.21.0.1`

### **Rede do Proxy Global**
- **Nome**: `proxy-network`
- **Subnet**: `172.20.0.0/16`
- **Gateway**: `172.20.0.1`

### **Conectividade**
- **Proxy Global** → **Nginx da Aplicação**: `http://axisor-nginx-prod:80`
- **Nginx da Aplicação** → **Backend**: `http://backend:3000`
- **Nginx da Aplicação** → **Frontend**: `http://frontend:80`

## 🔧 Comandos de Diagnóstico

### **Verificar Status Geral**
```bash
# Containers da aplicação
docker ps | grep axisor

# Proxy global
docker ps | grep global-nginx-proxy

# Redes Docker
docker network ls
```

### **Testar Conectividade**
```bash
# Frontend
curl -I https://defisats.site

# API
curl -I https://api.defisats.site/health

# Conectividade interna
docker exec global-nginx-proxy curl -s http://axisor-nginx-prod:80
```

### **Verificar Logs**
```bash
# Logs da aplicação
docker compose -f docker-compose.prod.yml logs nginx
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# Logs do proxy global
docker logs global-nginx-proxy
```

## 🚨 Troubleshooting

### **Problema: Erro 502 Bad Gateway**
**Causa**: Nginx da aplicação não consegue conectar ao backend/frontend

**Solução**:
```bash
cd /home/ubuntu/apps/axisor
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### **Problema: Workers Restarting**
**Causa**: Workers falhando por problemas de configuração

**Solução**:
```bash
# Verificar logs específicos
docker compose -f docker-compose.prod.yml logs margin-monitor
docker compose -f docker-compose.prod.yml logs automation-executor

# Reiniciar workers específicos
docker compose -f docker-compose.prod.yml restart margin-monitor
```

### **Problema: Rede Docker Quebrada**
**Causa**: Containers em redes diferentes

**Solução**:
```bash
# Recriar rede proxy
docker network rm proxy-network
docker network create proxy-network

# Reiniciar proxy global
cd ~/proxy
./start-proxy.sh restart

# Reiniciar aplicação
cd /home/ubuntu/apps/axisor
docker compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoramento

### **Health Checks**
- **Backend**: `http://backend:3000/health`
- **API**: `https://api.defisats.site/health`
- **Frontend**: `https://defisats.site`

### **Métricas do Sistema**
```bash
# Uso de recursos
htop
df -h
free -h

# Logs do sistema
journalctl -f
```

## 🔐 Segurança

### **Certificados SSL**
- **Localização**: `~/proxy/certs/`
- **Arquivos**: `defisats.site.crt`, `defisats.site.key`

### **Firewall**
- **Portas abertas**: 80 (HTTP), 443 (HTTPS)
- **Portas internas**: 3000 (Backend), 80 (Frontend)

## 📝 Logs Importantes

### **Localização dos Logs**
```
~/proxy/logs/                    # Logs do proxy global
/var/log/nginx/                  # Logs do nginx (sistema)
docker logs <container>          # Logs dos containers
```

### **Rotação de Logs**
```bash
# Configurar rotação automática
sudo logrotate -f /etc/logrotate.d/nginx
```

## 🚀 Deploy e Atualizações

### **Processo de Deploy**
1. **Acessar servidor**: `ssh -i ~/.ssh/debian.pem ubuntu@defisats.site`
2. **Navegar para projeto**: `cd /home/ubuntu/apps/axisor`
3. **Atualizar código**: `git pull origin main`
4. **Reiniciar containers**: `docker compose -f docker-compose.prod.yml up -d --build`
5. **Verificar status**: `docker compose -f docker-compose.prod.yml ps`

### **Backup**
```bash
# Backup do banco de dados
docker exec axisor-postgres-prod pg_dump -U axisor_prod axisor_prod > backup.sql

# Backup das configurações
tar -czf config-backup.tar.gz ~/proxy/conf.d/ ~/proxy/certs/
```

## 📞 Contato e Suporte

### **Informações de Acesso**
- **Servidor**: defisats.site (3.143.248.70)
- **Usuário**: ubuntu
- **Chave SSH**: ~/.ssh/debian.pem
- **Projeto**: /home/ubuntu/apps/axisor/

### **Comandos de Emergência**
```bash
# Parar tudo
docker compose -f docker-compose.prod.yml down
cd ~/proxy && ./start-proxy.sh stop

# Iniciar tudo
cd ~/proxy && ./start-proxy.sh start
cd /home/ubuntu/apps/axisor && docker compose -f docker-compose.prod.yml up -d
```

---

**Documento criado em**: 14 de Setembro de 2025  
**Versão**: 1.0  
**Status**: ✅ Aplicação funcionando perfeitamente
