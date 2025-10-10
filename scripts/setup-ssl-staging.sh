#!/bin/bash

# Script para configurar SSL para ambiente de staging
# Subdomínios: staging.defisats.site e api-staging.defisats.site

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se está rodando como root ou com sudo
if [[ $EUID -ne 0 ]]; then
   error "Este script precisa ser executado com sudo"
   exit 1
fi

log "🔐 Configurando SSL para ambiente de staging..."

# 1. Instalar Certbot se não estiver instalado
if ! command -v certbot &> /dev/null; then
    log "📦 Instalando Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
    success "Certbot instalado com sucesso"
else
    log "✅ Certbot já está instalado"
fi

# 2. Parar o proxy global temporariamente
log "🛑 Parando proxy global temporariamente..."
cd /home/bychrisr/proxy
./start-proxy.sh stop

# 3. Configurar Nginx temporário para validação
log "⚙️ Configurando Nginx temporário para validação..."
cat > /etc/nginx/sites-available/staging-validation << 'EOF'
server {
    listen 80;
    server_name staging.defisats.site api-staging.defisats.site;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

# Criar diretório para validação
mkdir -p /var/www/html

# Habilitar site temporário
ln -sf /etc/nginx/sites-available/staging-validation /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx

# 4. Obter certificados SSL
log "🔐 Obtendo certificados SSL para staging..."

# Certificado para staging.defisats.site
log "📜 Obtendo certificado para staging.defisats.site..."
certbot certonly --webroot -w /var/www/html -d staging.defisats.site --non-interactive --agree-tos --email admin@defisats.site

# Certificado para api-staging.defisats.site
log "📜 Obtendo certificado para api-staging.defisats.site..."
certbot certonly --webroot -w /var/www/html -d api-staging.defisats.site --non-interactive --agree-tos --email admin@defisats.site

success "Certificados SSL obtidos com sucesso"

# 5. Copiar certificados para o diretório do proxy
log "📋 Copiando certificados para o diretório do proxy..."

# Criar diretório de certificados se não existir
mkdir -p /home/bychrisr/proxy/certs

# Copiar certificados
cp /etc/letsencrypt/live/staging.defisats.site/fullchain.pem /home/bychrisr/proxy/certs/staging.defisats.site.crt
cp /etc/letsencrypt/live/staging.defisats.site/privkey.pem /home/bychrisr/proxy/certs/staging.defisats.site.key

# Copiar certificados para api-staging (usar o mesmo certificado)
cp /etc/letsencrypt/live/api-staging.defisats.site/fullchain.pem /home/bychrisr/proxy/certs/api-staging.defisats.site.crt
cp /etc/letsencrypt/live/api-staging.defisats.site/privkey.pem /home/bychrisr/proxy/certs/api-staging.defisats.site.key

# Ajustar permissões
chown bychrisr:bychrisr /home/bychrisr/proxy/certs/*.crt
chown bychrisr:bychrisr /home/bychrisr/proxy/certs/*.key
chmod 644 /home/bychrisr/proxy/certs/*.crt
chmod 600 /home/bychrisr/proxy/certs/*.key

success "Certificados copiados para o diretório do proxy"

# 6. Atualizar configuração do proxy com SSL
log "⚙️ Atualizando configuração do proxy com SSL..."

cat > /home/bychrisr/proxy/conf.d/defisats.conf << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name defisats.site www.defisats.site api.defisats.site staging.defisats.site api-staging.defisats.site;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# Frontend - defisats.site
server {
    listen 443 ssl http2;
    server_name defisats.site www.defisats.site;

    # SSL Configuration
    ssl_certificate /etc/nginx/certs/defisats.site.crt;
    ssl_certificate_key /etc/nginx/certs/defisats.site.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to frontend
    location / {
        proxy_pass http://axisor-frontend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}

# API - api.defisats.site
server {
    listen 443 ssl http2;
    server_name api.defisats.site;

    # SSL Configuration
    ssl_certificate /etc/nginx/certs/defisats.site.crt;
    ssl_certificate_key /etc/nginx/certs/defisats.site.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to backend
    location / {
        proxy_pass http://axisor-backend:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}

# Staging Frontend - staging.defisats.site
server {
    listen 443 ssl http2;
    server_name staging.defisats.site;

    # SSL Configuration
    ssl_certificate /etc/nginx/certs/staging.defisats.site.crt;
    ssl_certificate_key /etc/nginx/certs/staging.defisats.site.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Environment "staging" always;

    # Proxy to frontend staging
    location / {
        proxy_pass http://axisor-frontend-staging:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}

# Staging API - api-staging.defisats.site
server {
    listen 443 ssl http2;
    server_name api-staging.defisats.site;

    # SSL Configuration
    ssl_certificate /etc/nginx/certs/api-staging.defisats.site.crt;
    ssl_certificate_key /etc/nginx/certs/api-staging.defisats.site.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Environment "staging" always;

    # Proxy to backend staging
    location / {
        proxy_pass http://axisor-backend-staging:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
EOF

success "Configuração do proxy atualizada com SSL"

# 7. Limpar configuração temporária
log "🧹 Limpando configuração temporária..."
rm -f /etc/nginx/sites-enabled/staging-validation
rm -f /etc/nginx/sites-available/staging-validation
systemctl reload nginx

# 8. Reiniciar proxy global
log "🚀 Reiniciando proxy global..."
cd /home/bychrisr/proxy
./start-proxy.sh start

# 9. Configurar renovação automática
log "🔄 Configurando renovação automática..."
cat > /etc/cron.d/certbot-renewal << 'EOF'
# Renew Let's Encrypt certificates twice daily
0 12 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
0 0 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

# 10. Testar SSL
log "🧪 Testando configuração SSL..."

# Aguardar proxy inicializar
sleep 10

# Testar staging
if curl -s -I https://staging.defisats.site | grep -q "200 OK"; then
    success "✅ staging.defisats.site está funcionando com SSL"
else
    warning "⚠️ staging.defisats.site pode não estar funcionando ainda"
fi

# Testar api-staging
if curl -s -I https://api-staging.defisats.site/health | grep -q "200 OK"; then
    success "✅ api-staging.defisats.site está funcionando com SSL"
else
    warning "⚠️ api-staging.defisats.site pode não estar funcionando ainda"
fi

echo ""
success "🎉 Configuração SSL para staging concluída!"
echo ""
echo "📋 URLs configuradas:"
echo "   • Frontend: https://staging.defisats.site"
echo "   • API: https://api-staging.defisats.site"
echo "   • Health Check: https://api-staging.defisats.site/health"
echo ""
echo "🔄 Renovação automática configurada para rodar 2x por dia"
echo "📁 Certificados salvos em: /home/bychrisr/proxy/certs/"
echo ""
echo "🧪 Para testar:"
echo "   curl -I https://staging.defisats.site"
echo "   curl -I https://api-staging.defisats.site/health"
