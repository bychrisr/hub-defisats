# LND Authentication & Security - Documentação Completa

**Data de Atualização**: 2025-10-11  
**Versão**: 1.0.0

## 📋 Visão Geral

Esta documentação cobre todos os aspectos de autenticação e segurança para a integração LND no sistema Axisor, incluindo TLS, Macaroons, e melhores práticas de segurança.

## 🔐 Modelo de Autenticação LND

### Componentes Principais

1. **TLS Certificate** - Certificado para conexão segura
2. **Macaroon** - Token de autorização para operações específicas
3. **Node Identity** - Chave pública do nó LND

## 🔒 Configuração TLS

### Certificado TLS

O LND gera automaticamente um certificado TLS para comunicação segura.

**Localização dos Arquivos:**
```
# Testnet
~/.lnd/tls.cert          # Certificado público
~/.lnd/tls.key           # Chave privada

# Production
~/.lnd/tls.cert          # Certificado público
~/.lnd/tls.key           # Chave privada
```

### Configuração no Sistema

**Variáveis de Ambiente:**
```env
# LND Testnet
LND_TESTNET_BASE_URL=https://localhost:18080
LND_TESTNET_TLS_CERT=/path/to/tls.cert
LND_TESTNET_MACAROON=/path/to/admin.macaroon

# LND Production
LND_PRODUCTION_BASE_URL=https://localhost:8080
LND_PRODUCTION_TLS_CERT=/path/to/tls.cert
LND_PRODUCTION_MACAROON=/path/to/admin.macaroon
```

### Verificação de Certificado

```bash
# Verificar certificado TLS
openssl x509 -in ~/.lnd/tls.cert -text -noout

# Verificar validade
openssl x509 -in ~/.lnd/tls.cert -dates -noout

# Verificar fingerprint
openssl x509 -in ~/.lnd/tls.cert -fingerprint -noout
```

## 🎫 Sistema de Macaroons

### Tipos de Macaroons

#### 1. **Admin Macaroon** (Acesso Total)
- **Arquivo**: `admin.macaroon`
- **Permissões**: Todas as operações
- **Uso**: Aplicações administrativas

#### 2. **Read-Only Macaroon** (Somente Leitura)
- **Arquivo**: `readonly.macaroon`
- **Permissões**: Apenas leitura
- **Uso**: Monitoramento e dashboards

#### 3. **Invoice Macaroon** (Criação de Invoices)
- **Arquivo**: `invoice.macaroon`
- **Permissões**: Criar invoices, verificar pagamentos
- **Uso**: Aplicações de pagamento

#### 4. **Custom Macaroons** (Permissões Específicas)
- **Criados sob demanda**
- **Permissões**: Definidas conforme necessidade
- **Uso**: APIs específicas

### Estrutura do Macaroon

```json
{
  "version": 1,
  "location": "localhost:18080",
  "identifier": "admin",
  "caveats": [
    {
      "type": "time",
      "value": "2025-12-31T23:59:59Z"
    }
  ],
  "signature": "abc123..."
}
```

### Criação de Macaroons Customizados

```bash
# Criar macaroon com permissões específicas
lncli bakemacaroon \
  --save_to=~/.lnd/custom.macaroon \
  uri:/lnrpc.Lightning/GetInfo \
  uri:/lnrpc.Lightning/ListChannels \
  uri:/lnrpc.Lightning/ListInvoices
```

## 🔧 Implementação no Código

### Configuração do Cliente LND

```typescript
// backend/src/services/lnd/LNDService.ts
export class LNDService {
  private client: any;
  private credentials: LNDCredentials;

  constructor(config: LNDConfig, logger: Logger) {
    this.credentials = {
      host: config.testnet.baseURL,
      port: config.testnet.port,
      cert: fs.readFileSync(config.testnet.tlsCert),
      macaroon: fs.readFileSync(config.testnet.macaroon)
    };

    this.client = new LNDClient(this.credentials);
  }

  private createAuthenticatedRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    // Adicionar certificado TLS
    config.httpsAgent = new https.Agent({
      cert: this.credentials.cert,
      rejectUnauthorized: false // Para desenvolvimento
    });

    // Adicionar macaroon no header
    config.headers = {
      ...config.headers,
      'Grpc-Metadata-macaroon': this.credentials.macaroon.toString('hex')
    };

    return config;
  }
}
```

### Middleware de Autenticação

```typescript
// backend/src/middleware/lnd-auth.middleware.ts
export async function lndAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verificar se LND está disponível
    const lndInfo = await lndService.getInfo();
    
    if (!lndInfo) {
      return reply.status(503).send({
        success: false,
        error: 'LND service unavailable'
      });
    }

    // Adicionar informações LND ao contexto
    request.lnd = {
      info: lndInfo,
      authenticated: true
    };

  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'LND authentication failed'
    });
  }
}
```

## 🛡️ Melhores Práticas de Segurança

### 1. **Gerenciamento de Credenciais**

```typescript
// Usar variáveis de ambiente
const lndConfig = {
  testnet: {
    baseURL: process.env.LND_TESTNET_BASE_URL,
    tlsCert: process.env.LND_TESTNET_TLS_CERT,
    macaroon: process.env.LND_TESTNET_MACAROON
  }
};

// Validar credenciais na inicialização
private validateCredentials(): void {
  if (!this.credentials.host || !this.credentials.cert || !this.credentials.macaroon) {
    throw new Error('LND credentials not properly configured');
  }
}
```

### 2. **Rotação de Macaroons**

```typescript
// Implementar rotação automática
export class MacaroonRotationService {
  async rotateMacaroons(): Promise<void> {
    // Criar novos macaroons
    const newMacaroons = await this.createNewMacaroons();
    
    // Atualizar configuração
    await this.updateMacaroonConfig(newMacaroons);
    
    // Invalidar macaroons antigos
    await this.invalidateOldMacaroons();
  }
}
```

### 3. **Logging de Segurança**

```typescript
// Log todas as operações sensíveis
this.logger.info('🔐 LND Authentication', {
  operation: 'createInvoice',
  nodeId: this.credentials.nodeId,
  timestamp: new Date().toISOString(),
  ip: request.ip
});
```

### 4. **Rate Limiting por Macaroon**

```typescript
// Implementar rate limiting baseado no macaroon
export class MacaroonRateLimitService {
  private limits = new Map<string, { count: number; resetTime: number }>();

  async checkRateLimit(macaroonHash: string, operation: string): Promise<boolean> {
    const key = `${macaroonHash}:${operation}`;
    const limit = this.limits.get(key);

    if (!limit || Date.now() > limit.resetTime) {
      this.limits.set(key, { count: 1, resetTime: Date.now() + 60000 });
      return true;
    }

    if (limit.count >= this.getLimitForOperation(operation)) {
      return false;
    }

    limit.count++;
    return true;
  }
}
```

## 🔍 Validação e Verificação

### Verificar Conectividade LND

```bash
# Testar conexão básica
curl -k https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon

# Verificar via lncli
lncli --network=testnet getinfo
```

### Verificar Permissões do Macaroon

```bash
# Listar permissões do macaroon
lncli bakemacaroon \
  --list_permissions \
  --macaroon_file=~/.lnd/admin.macaroon
```

### Testar Operações Específicas

```bash
# Testar criação de invoice
curl -k -X POST https://localhost:18080/v1/invoices \
  -H "Grpc-Metadata-macaroon: $(xxd -ps -u -c 1000 ~/.lnd/admin.macaroon)" \
  -d '{"memo": "Test", "value": 1000}'

# Testar listagem de canais
curl -k https://localhost:18080/v1/channels \
  -H "Grpc-Metadata-macaroon: $(xxd -ps -u -c 1000 ~/.lnd/admin.macaroon)"
```

## 🚨 Troubleshooting de Autenticação

### Problemas Comuns

#### 1. **Erro: "rpc error: code = Unavailable"**
```bash
# Verificar se LND está rodando
docker compose ps lnd-testnet

# Verificar logs
docker compose logs lnd-testnet

# Verificar conectividade
telnet localhost 18080
```

#### 2. **Erro: "rpc error: code = PermissionDenied"**
```bash
# Verificar macaroon
ls -la ~/.lnd/admin.macaroon

# Verificar permissões
lncli --network=testnet getinfo

# Recriar macaroon se necessário
rm ~/.lnd/admin.macaroon
lncli --network=testnet unlock
```

#### 3. **Erro: "certificate verify failed"**
```bash
# Verificar certificado
openssl x509 -in ~/.lnd/tls.cert -text -noout

# Verificar se é o certificado correto
openssl s_client -connect localhost:18080 -servername localhost
```

#### 4. **Erro: "connection refused"**
```bash
# Verificar se porta está aberta
netstat -tlnp | grep 18080

# Verificar configuração LND
cat ~/.lnd/lnd.conf
```

### Scripts de Diagnóstico

```bash
#!/bin/bash
# diagnose-lnd-auth.sh

echo "🔍 LND Authentication Diagnostics"
echo "=================================="

# Verificar arquivos de credenciais
echo "📁 Checking credential files..."
ls -la ~/.lnd/{tls.cert,admin.macaroon} 2>/dev/null || echo "❌ Credential files missing"

# Verificar conectividade
echo "🌐 Testing connectivity..."
curl -k -s https://localhost:18080/v1/getinfo \
  --cert ~/.lnd/tls.cert \
  --key ~/.lnd/tls.key \
  --macaroon ~/.lnd/admin.macaroon \
  && echo "✅ Connection successful" || echo "❌ Connection failed"

# Verificar permissões
echo "🔐 Testing permissions..."
lncli --network=testnet getinfo && echo "✅ Admin access working" || echo "❌ Admin access failed"

echo "🏁 Diagnostics complete"
```

## 📊 Monitoramento de Segurança

### Métricas de Autenticação

```typescript
export interface SecurityMetrics {
  totalRequests: number;
  failedAuthAttempts: number;
  macaroonRotations: number;
  certificateExpiry: Date;
  lastSuccessfulAuth: Date;
  activeMacaroons: number;
}
```

### Alertas de Segurança

```typescript
export class SecurityAlertService {
  async checkSecurityAlerts(): Promise<void> {
    // Verificar expiração de certificado
    const certExpiry = await this.getCertificateExpiry();
    if (certExpiry < Date.now() + 30 * 24 * 60 * 60 * 1000) { // 30 dias
      await this.sendAlert('Certificate expires soon', { expiry: certExpiry });
    }

    // Verificar tentativas de autenticação falhadas
    const failedAttempts = await this.getFailedAuthAttempts();
    if (failedAttempts > 10) {
      await this.sendAlert('High number of failed auth attempts', { count: failedAttempts });
    }
  }
}
```

## 🔄 Rotação de Credenciais

### Rotação Automática de Macaroons

```typescript
export class CredentialRotationService {
  async rotateMacaroons(): Promise<void> {
    this.logger.info('🔄 Starting macaroon rotation');

    try {
      // 1. Criar novos macaroons
      const newMacaroons = await this.createNewMacaroons();
      
      // 2. Atualizar configuração
      await this.updateConfiguration(newMacaroons);
      
      // 3. Testar nova configuração
      await this.testNewConfiguration();
      
      // 4. Invalidar macaroons antigos
      await this.invalidateOldMacaroons();
      
      this.logger.info('✅ Macaroon rotation completed successfully');
      
    } catch (error) {
      this.logger.error('❌ Macaroon rotation failed:', error);
      throw error;
    }
  }
}
```

### Backup de Credenciais

```typescript
export class CredentialBackupService {
  async backupCredentials(): Promise<void> {
    const backup = {
      timestamp: new Date().toISOString(),
      tlsCert: fs.readFileSync(this.config.tlsCert, 'base64'),
      adminMacaroon: fs.readFileSync(this.config.macaroon, 'base64'),
      nodeId: await this.getNodeId()
    };

    // Salvar backup criptografado
    const encryptedBackup = this.encrypt(JSON.stringify(backup));
    fs.writeFileSync(`./backups/lnd-credentials-${Date.now()}.enc`, encryptedBackup);
  }
}
```

## 📋 Checklist de Segurança

### ✅ Configuração Inicial

- [ ] Certificado TLS gerado e configurado
- [ ] Macaroon admin criado e protegido
- [ ] Variáveis de ambiente configuradas
- [ ] Permissões de arquivo corretas (600)
- [ ] Backup de credenciais realizado

### ✅ Monitoramento Contínuo

- [ ] Logs de autenticação ativos
- [ ] Métricas de segurança coletadas
- [ ] Alertas de falha configurados
- [ ] Verificação de conectividade automática
- [ ] Auditoria de permissões periódica

### ✅ Manutenção

- [ ] Rotação de macaroons agendada
- [ ] Backup de credenciais automatizado
- [ ] Atualização de certificados planejada
- [ ] Testes de autenticação regulares
- [ ] Documentação de segurança atualizada

## 🔗 Referências

- **LND Security**: https://docs.lightning.engineering/lightning-network-tools/lnd/security-best-practices
- **Macaroons RFC**: https://tools.ietf.org/html/rfc8452
- **TLS Best Practices**: https://wiki.mozilla.org/Security/Server_Side_TLS
- **Lightning Security**: https://github.com/lightningnetwork/lightning-rfc/blob/master/00-introduction.md
