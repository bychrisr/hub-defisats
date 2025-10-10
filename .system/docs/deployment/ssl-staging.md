# 🔐 DOCUMENTAÇÃO SSL - AMBIENTE DE STAGING

## 📍 Visão Geral

Este documento fornece instruções completas para configurar SSL/TLS para o ambiente de staging do Axisor, incluindo certificados Let's Encrypt (produção) e certificados auto-assinados (desenvolvimento).

---

## 🌐 URLs com SSL

- **Frontend Staging**: `https://staging.defisats.site`
- **API Staging**: `https://api-staging.defisats.site`
- **Health Check**: `https://api-staging.defisats.site/health`

---

## 🚀 CONFIGURAÇÃO SSL

### Opção 1: Let's Encrypt (Recomendado para Produção)

#### 1.1 Pré-requisitos
- DNS configurado e propagado
- Portas 80 e 443 abertas no firewall
- Domínios apontando para o servidor

#### 1.2 Executar Script
```bash
cd /home/bychrisr/projects/axisor
sudo ./scripts/setup-ssl-staging.sh
```

#### 1.3 O que o script faz:
1. ✅ Instala Certbot se necessário
2. ✅ Para o proxy global temporariamente
3. ✅ Configura Nginx temporário para validação
4. ✅ Obtém certificados Let's Encrypt
5. ✅ Copia certificados para o diretório do proxy
6. ✅ Atualiza configuração do proxy com SSL
7. ✅ Configura renovação automática
8. ✅ Reinicia o proxy global
9. ✅ Testa a configuração

### Opção 2: Certificados Auto-assinados (Desenvolvimento)

#### 2.1 Para uso em desenvolvimento/testes
```bash
cd /home/bychrisr/projects/axisor
sudo ./scripts/setup-ssl-self-signed.sh
```

#### 2.2 O que o script faz:
1. ✅ Para o proxy global
2. ✅ Gera certificados auto-assinados
3. ✅ Atualiza configuração do proxy
4. ✅ Reinicia o proxy global
5. ✅ Testa a configuração

---

## 📁 ESTRUTURA DE CERTIFICADOS

```
/home/bychrisr/proxy/certs/
├── defisats.site.crt          # Certificado principal (produção)
├── defisats.site.key          # Chave principal (produção)
├── staging.defisats.site.crt  # Certificado staging
├── staging.defisats.site.key  # Chave staging
├── api-staging.defisats.site.crt  # Certificado API staging
└── api-staging.defisats.site.key  # Chave API staging
```

---

## ⚙️ CONFIGURAÇÃO DO NGINX

### Configuração SSL Completa

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name defisats.site www.defisats.site api.defisats.site staging.defisats.site api-staging.defisats.site;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
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
```

---

## 🔧 COMANDOS DE GERENCIAMENTO

### 1. Verificar Certificados
```bash
# Listar certificados
ls -la /home/bychrisr/proxy/certs/

# Verificar certificado Let's Encrypt
sudo certbot certificates

# Verificar validade do certificado
openssl x509 -in /home/bychrisr/proxy/certs/staging.defisats.site.crt -text -noout | grep -A 2 "Validity"
```

### 2. Renovação de Certificados
```bash
# Renovar certificados Let's Encrypt
sudo certbot renew

# Testar renovação (dry run)
sudo certbot renew --dry-run

# Renovar e recarregar nginx
sudo certbot renew --post-hook "systemctl reload nginx"
```

### 3. Gerenciar Proxy
```bash
# Reiniciar proxy
cd /home/bychrisr/proxy
./start-proxy.sh restart

# Ver logs do proxy
docker logs global-nginx-proxy

# Testar configuração nginx
docker exec global-nginx-proxy nginx -t
```

---

## 🧪 TESTES DE SSL

### 1. Testes Básicos
```bash
# Testar frontend staging
curl -I https://staging.defisats.site

# Testar API staging
curl -I https://api-staging.defisats.site/health

# Testar com certificados auto-assinados (usar -k)
curl -k -I https://staging.defisats.site
curl -k -I https://api-staging.defisats.site/health
```

### 2. Testes de SSL
```bash
# Verificar certificado SSL
openssl s_client -connect staging.defisats.site:443 -servername staging.defisats.site

# Verificar ciphers suportados
nmap --script ssl-enum-ciphers -p 443 staging.defisats.site

# Testar SSL Labs (online)
# https://www.ssllabs.com/ssltest/analyze.html?d=staging.defisats.site
```

### 3. Testes de Performance
```bash
# Teste de carga SSL
ab -n 100 -c 10 https://staging.defisats.site/

# Teste de latência
curl -w "@curl-format.txt" -o /dev/null -s https://staging.defisats.site/
```

---

## 🔄 RENOVAÇÃO AUTOMÁTICA

### 1. Cron Job (Let's Encrypt)
```bash
# Verificar cron job
sudo crontab -l | grep certbot

# Editar cron job
sudo crontab -e

# Adicionar linha:
# 0 12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### 2. Systemd Timer (Alternativa)
```bash
# Criar timer
sudo systemctl edit --full certbot-renewal.timer

# Conteúdo:
[Unit]
Description=Renew Let's Encrypt certificates
Requires=certbot.service

[Timer]
OnCalendar=*-*-* 12:00:00
Persistent=true

[Install]
WantedBy=timers.target

# Ativar timer
sudo systemctl enable certbot-renewal.timer
sudo systemctl start certbot-renewal.timer
```

---

## 🚨 TROUBLESHOOTING

### 1. Problemas Comuns

#### 1.1 Certificado não é confiável
```bash
# Verificar se é certificado auto-assinado
openssl x509 -in /home/bychrisr/proxy/certs/staging.defisats.site.crt -text -noout | grep "Issuer"

# Para certificados auto-assinados, usar -k no curl
curl -k -I https://staging.defisats.site
```

#### 1.2 Certificado expirado
```bash
# Verificar data de expiração
openssl x509 -in /home/bychrisr/proxy/certs/staging.defisats.site.crt -text -noout | grep "Not After"

# Renovar certificado Let's Encrypt
sudo certbot renew --force-renewal
```

#### 1.3 Erro de validação Let's Encrypt
```bash
# Verificar se domínio está acessível
curl -I http://staging.defisats.site

# Verificar logs do certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Testar validação manual
sudo certbot certonly --webroot -w /var/www/html -d staging.defisats.site --dry-run
```

#### 1.4 Nginx não inicia
```bash
# Testar configuração
docker exec global-nginx-proxy nginx -t

# Ver logs de erro
docker logs global-nginx-proxy

# Verificar permissões dos certificados
ls -la /home/bychrisr/proxy/certs/
```

### 2. Verificações de Saúde

#### 2.1 Status dos Serviços
```bash
# Verificar proxy
docker ps | grep global-nginx-proxy

# Verificar staging
docker ps | grep staging

# Verificar nginx
docker exec global-nginx-proxy nginx -t
```

#### 2.2 Conectividade
```bash
# Testar conectividade interna
docker exec global-nginx-proxy curl -s http://axisor-backend-staging:3010/health

# Testar conectividade externa
curl -I https://staging.defisats.site
```

---

## 📊 MONITORAMENTO

### 1. Logs de SSL
```bash
# Logs do nginx
docker logs global-nginx-proxy | grep -i ssl

# Logs do certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Logs de acesso
docker exec global-nginx-proxy tail -f /var/log/nginx/access.log
```

### 2. Métricas de SSL
```bash
# Verificar uso de certificados
openssl s_client -connect staging.defisats.site:443 -servername staging.defisats.site < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Verificar ciphers
nmap --script ssl-enum-ciphers -p 443 staging.defisats.site
```

---

## 🔐 SEGURANÇA

### 1. Headers de Segurança
```nginx
# Headers configurados
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options SAMEORIGIN always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 2. Configurações SSL
```nginx
# Protocolos suportados
ssl_protocols TLSv1.2 TLSv1.3;

# Ciphers seguros
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;

# Preferir ciphers do servidor
ssl_prefer_server_ciphers off;

# Cache de sessão
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

---

## 📝 NOTAS IMPORTANTES

### 1. Let's Encrypt
- ✅ Certificados gratuitos e confiáveis
- ✅ Renovação automática
- ✅ Validação via HTTP (porta 80)
- ⚠️ Limite de 5 certificados por domínio por semana
- ⚠️ Requer domínio público e acessível

### 2. Certificados Auto-assinados
- ✅ Funcionam para desenvolvimento
- ✅ Não requerem validação externa
- ⚠️ Navegadores mostram aviso de segurança
- ⚠️ Não são confiáveis para produção

### 3. Renovação
- ✅ Let's Encrypt: automática via cron
- ✅ Auto-assinados: válidos por 1 ano
- ⚠️ Verificar logs de renovação regularmente

---

## 📞 COMANDOS RÁPIDOS

### Verificação Rápida
```bash
# Status geral
docker ps | grep -E "(global-nginx|staging)"

# Teste de conectividade
curl -I https://staging.defisats.site
curl -I https://api-staging.defisats.site/health

# Logs recentes
docker logs --tail 10 global-nginx-proxy
```

### Renovação Rápida
```bash
# Renovar certificados
sudo certbot renew --post-hook "cd /home/bychrisr/proxy && ./start-proxy.sh restart"

# Reiniciar proxy
cd /home/bychrisr/proxy && ./start-proxy.sh restart
```

---

*Documentação criada em: 22 de Setembro de 2024*
*Versão: 1.0*
*Ambiente: SSL Staging - Axisor*
