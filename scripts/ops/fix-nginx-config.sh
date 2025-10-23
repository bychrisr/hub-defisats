#!/bin/bash

# Script para corrigir a configuração do Nginx
echo "🔧 Corrigindo configuração do Nginx..."

# Parar o container do Nginx
echo "⏹️ Parando container do Nginx..."
docker stop global-nginx-proxy

# Criar nova configuração
echo "📝 Criando nova configuração..."
cat > /tmp/defisats.conf << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name defisats.site www.defisats.site api.defisats.site;
    
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

    # API routes - proxy to backend
    location /api/ {
        proxy_pass http://172.18.0.2:3010;
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
        
        # CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept";
        
        # Handle preflight requests
        if ($request_method = "OPTIONS") {
            return 204;
        }
    }

    # Proxy to frontend
    location / {
        proxy_pass http://172.18.0.3:80;
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

    # Rate limiting
    limit_req zone=api burst=20 nodelay;

    # Proxy to backend
    location / {
        proxy_pass http://172.18.0.2:3010;
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

# Copiar configuração para o container
echo "📋 Copiando configuração para o container..."
docker cp /tmp/defisats.conf global-nginx-proxy:/etc/nginx/conf.d/defisats.conf

# Iniciar o container do Nginx
echo "▶️ Iniciando container do Nginx..."
docker start global-nginx-proxy

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

# Testar configuração
echo "🧪 Testando configuração..."
curl -X POST "https://defisats.site/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@axisor.com","password":"password"}'

echo "✅ Configuração do Nginx corrigida!"

