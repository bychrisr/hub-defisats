# Configuração do Sistema de Emails

## Instalação

### Dependências

```bash
cd backend
npm install nodemailer @types/nodemailer handlebars mjml
```

**Versões:**
- nodemailer: ^6.9.0
- handlebars: ^4.7.8
- mjml: ^4.14.1

---

## Desenvolvimento Local

### 1. Subir MailHog

```bash
docker-compose -f config/docker/docker-compose.dev.yml up -d mailhog
```

**Acessar interface**: http://localhost:8025

### 2. Configuração de Ambiente

Arquivo: `config/env/.env.development`

```bash
# Email Configuration (MailHog)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@axisor.local
EMAIL_FROM_NAME=Axisor Platform
FRONTEND_URL=http://localhost:13000
```

### 3. Testar Conexão

```bash
curl http://localhost:13010/api/email/test-connection
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Email service is working correctly",
  "config": {
    "host": "mailhog",
    "port": "1025",
    "from": "noreply@axisor.local"
  }
}
```

### 4. Enviar Email de Teste

```bash
curl -X POST http://localhost:13010/api/email/test-send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

Verifique em: http://localhost:8025

---

## Produção

### Opção 1: AWS SES (Recomendada)

#### Passo 1: Criar conta AWS e configurar SES

1. Acesse: https://console.aws.amazon.com/ses
2. Clique em "Verify a New Domain"
3. Adicione seu domínio (ex: axisor.com)
4. Configure DNS records (verificação completa em 24-72h)

#### Passo 2: Criar credenciais IAM

1. Acesse IAM Console
2. Crie novo usuário: "axisor-smtp-user"
3. Anexe policy: `AmazonSESFullAccess`
4. Gere SMTP credentials

#### Passo 3: Configurar Variáveis de Produção

```bash
# .env.production
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EMAIL_FROM=noreply@axisor.com
EMAIL_FROM_NAME=Axisor Platform
FRONTEND_URL=https://axisor.com
```

#### Passo 4: Configurar DNS (SPF, DKIM, DMARC)

**SPF Record:**
```
v=spf1 include:amazonses.com ~all
```

**DKIM**: AWS SES gera automaticamente  
**DMARC**:
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@axisor.com
```

### Opção 2: SendGrid

```bash
# .env.production
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=apikey
SMTP_PASS=SG.sua_api_key_aqui
EMAIL_FROM=noreply@axisor.com
EMAIL_FROM_NAME=Axisor Platform
```

### Opção 3: Resend

```bash
# .env.production
# Resend usa API HTTP, não SMTP
# Implementação diferente necessária
RESEND_API_KEY=re_123456789
EMAIL_FROM=noreply@axisor.com
```

---

## Troubleshooting

### Emails não aparecem no MailHog

**Verificar:**
1. Container rodando: `docker ps | grep mailhog`
2. Logs: `docker logs axisor-mailhog`
3. Conexão: `curl localhost:8025`

### Erro "Connection refused"

**Causa**: Backend não consegue conectar ao MailHog  
**Solução**: Verificar se ambos estão na mesma rede Docker

```bash
docker network inspect axisor-network
```

### Emails vão para spam (produção)

**Soluções:**
1. Configurar SPF, DKIM, DMARC
2. Aquecer IP (enviar poucos emails primeiro)
3. Evitar palavras spam (FREE, URGENT, WINNER)
4. Usar domínio verificado
5. Incluir link de unsubscribe

---

**Criado em**: 2025-10-22  
**Autor**: Sistema Axisor


