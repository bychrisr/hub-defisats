# Sistema Anti-Fraude

## Visão Geral

O Sistema Anti-Fraude do Axisor foi projetado para prevenir abuso de cupons e registros fraudulentos através de múltiplas camadas de segurança e análise de risco.

**Criado em**: 2025-10-22  
**Última atualização**: 2025-10-22  
**Versão**: 1.0.0

---

## 🎯 Objetivos

1. **Prevenir abuso de cupons**: Impedir que usuários criem múltiplas contas para usar o mesmo cupom
2. **Detectar padrões suspeitos**: Identificar comportamentos fraudulentos (VPN, emails temporários, velocidade)
3. **Balancear segurança e UX**: Minimizar fricção para usuários legítimos

---

## 🏗️ Arquitetura

### Camadas de Proteção

```
┌─────────────────────────────────────────────────┐
│         1. Blacklist Check (Bloqueio Imediato)  │
├─────────────────────────────────────────────────┤
│         2. Device Fingerprinting                │
├─────────────────────────────────────────────────┤
│         3. IP Tracking                          │
├─────────────────────────────────────────────────┤
│         4. Rate Limiting (OTP/Resend)            │
├─────────────────────────────────────────────────┤
│         5. Risk Score Calculation (0-100)       │
├─────────────────────────────────────────────────┤
│         6. Action Based on Score:               │
│            • 0-29: Approve                      │
│            • 30-70: Verify (email code)         │
│            • 71-100: Block                      │
├─────────────────────────────────────────────────┤
│         7. Usage Tracking & Analytics           │
├─────────────────────────────────────────────────┤
│         8. Auto-Blacklist (patterns detected)   │
└─────────────────────────────────────────────────┘
```

### Rate Limiting Integration

```typescript
// OTP Rate Limiting
export const otpRateLimit = rateLimit({
  max: 5, // 5 attempts per 15 minutes
  timeWindow: '15 minutes',
  keyGenerator: (request) => {
    const { email } = request.body as { email: string };
    return `${request.ip}-${email}`;
  }
});

// Email Resend Rate Limiting
export const resendRateLimit = rateLimit({
  max: 3, // 3 resends per hour
  timeWindow: '1 hour',
  keyGenerator: (request) => {
    const { email } = request.body as { email: string };
    return `resend-${request.ip}-${email}`;
  }
});
```

---

## 📊 Risk Scoring System

### Fatores e Pontuação

| Fator | Pontuação | Descrição |
|-------|-----------|-----------|
| **Blacklist Match** | 100 | IP, fingerprint ou domínio de email bloqueado |
| **IP Reuso (24h)** | +20 por uso | Mesmo IP usado múltiplas vezes em 24 horas |
| **Fingerprint Reuso (7d)** | +30 por uso | Mesmo dispositivo usado múltiplas vezes em 7 dias |
| **Email Temporário** | +40 | Email de serviço temporário/descartável detectado |
| **VPN/Proxy** | +25 | IP identificado como VPN ou proxy |
| **Alta Velocidade** | +15 | 3+ registros do mesmo IP em 1 hora |
| **Abuso de Cupom** | +30 | Cupom usado múltiplas vezes além do limite |

### Thresholds de Decisão

```typescript
if (riskScore >= 71) {
  action = 'block';           // Bloquear completamente
  message = 'REGISTRATION_BLOCKED_FRAUD';
}
else if (riskScore >= 30) {
  action = 'verify';          // Requer código de verificação
  message = 'Verification code sent to your email';
}
else {
  action = 'approve';         // Aprovar normalmente
}
```

---

## 🔍 Device Fingerprinting

### Tecnologia

Utilizamos **@fingerprintjs/fingerprintjs** (versão open-source) para gerar um identificador único e estável do navegador/dispositivo.

### Dados Coletados

O fingerprint é gerado com base em:
- User-Agent
- Screen resolution e color depth
- Timezone
- Plugins instalados
- Canvas fingerprint
- WebGL fingerprint
- Audio context fingerprint

### Características

- ✅ **Estável**: Mesmo ID mesmo após limpar cookies
- ✅ **Cross-session**: Persiste entre sessões
- ✅ **Anônimo**: Não identifica pessoalmente o usuário
- ⚠️ **Limitações**: Usuários podem burlar com ferramentas anti-fingerprinting

### Implementação

```typescript
// Frontend
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const fingerprint = await getDeviceFingerprint();
// Retorna: "a1b2c3d4e5f6g7h8"
```

---

## 🚫 Sistema de Blacklist

### Tipos de Bloqueio

1. **IP Address**: Bloqueia registros de um endereço IP específico
2. **Device Fingerprint**: Bloqueia um dispositivo específico
3. **Email Domain**: Bloqueia domínios inteiros (ex: temp-mail.org)

### Blacklist Temporária vs Permanente

**Temporária** (auto-adicionada):
- IP com 5+ registros em 24h → Bloqueio por 24h
- Fingerprint com 3+ registros em 7 dias → Bloqueio por 7 dias
- Remoção automática após expiração

**Permanente** (manual):
- IPs de bots conhecidos
- Domínios de email temporário
- Fraudes confirmadas manualmente

### API de Gerenciamento

```typescript
// Adicionar à blacklist
await blacklistService.add('ip', '192.168.1.100', 'Fraude confirmada', 24);

// Verificar blacklist
const isBlocked = await blacklistService.isBlacklisted('ip', '192.168.1.100');

// Remover da blacklist
await blacklistService.remove('ip', '192.168.1.100');

// Limpar entradas expiradas
await blacklistService.cleanupExpired();
```

---

## 📧 Verificação por Código (6 Dígitos)

### Quando é Acionada

A verificação por código é acionada quando:
- Risk score entre 30-70
- Cupom com 100% de desconto sendo usado
- Múltiplos registros do mesmo IP/dispositivo detectados

### Fluxo

```
1. Usuário seleciona plano com cupom 100% desconto
2. Sistema calcula risk score
3. Se score 30-70:
   ├─ Gerar código de 6 dígitos
   ├─ Enviar código por email
   ├─ Salvar código no registrationProgress (expira em 5 min)
   └─ Mostrar modal para usuário digitar código
4. Usuário digita código
5. Sistema valida:
   ├─ Código correto? → Completar registro
   ├─ Código expirado? → Permitir reenvio
   └─ Código errado? → Mensagem de erro
```

### Características

- ⏱️ **Expiração**: 5 minutos
- 🔄 **Reenvio**: Ilimitado (gera novo código a cada vez)
- 🔐 **Armazenamento**: Hash do código no banco de dados
- ✅ **Auto-submit**: Código é validado automaticamente ao digitar 6 dígitos

---

## 📈 Monitoramento e Analytics

### Logs de Risco

Todas as avaliações de risco são registradas na tabela `risk_log`:

```sql
SELECT 
  ip_address,
  risk_score,
  action_taken,
  factors,
  created_at
FROM risk_log
ORDER BY risk_score DESC
LIMIT 10;
```

### Métricas Importantes

**Dashboards recomendados:**
- Taxa de bloqueio por dia
- Risk score médio
- Top IPs/fingerprints bloqueados
- Cupons mais abusados
- Taxa de conversão por risk score

### Alertas Automáticos

Configurar alertas para:
- ⚠️ 10+ registros bloqueados em 1 hora (possível ataque)
- ⚠️ Aumento súbito de risk scores altos
- ⚠️ Mesmo cupom usado 50+ vezes em 24h

---

## ⚙️ Configuração e Ajustes

### Thresholds Configuráveis

Atualmente hardcoded em `anti-fraud.service.ts`, mas podem ser movidos para configuração:

```typescript
// Recomendado: criar tabela fraud_config
const config = {
  riskScoreThresholds: {
    approve: 29,
    verify: 70,
    block: 71,
  },
  autoBlacklist: {
    ipRegistrations24h: 5,
    fingerprintRegistrations7d: 3,
  },
  verification: {
    codeLength: 6,
    codeExpiryMinutes: 5,
    maxResendAttempts: 10,
  },
  couponLimits: {
    defaultMaxUsesPerIP: 2,
    defaultMaxUsesPerFingerprint: 2,
    defaultCooldownHours: 168, // 7 dias
  },
};
```

### Ajustando Sensibilidade

**Mais Restritivo** (para prevenir fraude):
```typescript
riskScoreThresholds: {
  approve: 19,  // ↓ de 29
  verify: 50,   // ↓ de 70
  block: 51,    // ↓ de 71
}
```

**Mais Permissivo** (para melhorar UX):
```typescript
riskScoreThresholds: {
  approve: 39,  // ↑ de 29
  verify: 80,   // ↑ de 70
  block: 81,    // ↑ de 71
}
```

---

## 🧪 Testes

### Cenários de Teste

**1. Registro Normal (Low Risk)**
```bash
# Primeiro registro de um IP/dispositivo novo
# Esperado: risk_score < 30, aprovado automaticamente
```

**2. Registro Repetido (Medium Risk)**
```bash
# Mesmo IP/fingerprint já usou cupom antes
# Esperado: risk_score 30-70, requer verificação por código
```

**3. Abuso Detectado (High Risk)**
```bash
# 5+ registros do mesmo IP em 24h
# Esperado: risk_score > 70, bloqueado
```

### Testar Verificação por Código

```bash
# 1. Criar registro
curl -X POST http://localhost:13010/api/registration/personal-data \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Test",
    "lastName":"User",
    "username":"testuser",
    "email":"test@example.com",
    "password":"Test123!",
    "confirmPassword":"Test123!",
    "couponCode":"TESTCOUPON100"
  }'

# 2. Selecionar plano (com cupom 100%)
# Se risk score 30-70, receberá código por email

# 3. Verificar código
curl -X POST http://localhost:13010/api/registration/validate-code \
  -H "Content-Type: application/json" \
  -d '{
    "sessionToken":"xxx",
    "code":"123456"
  }'
```

---

## 🛡️ Boas Práticas

### Para Administradores

1. **Monitorar regularmente**: Revisar logs de risco semanalmente
2. **Ajustar thresholds**: Baseado em métricas reais
3. **Revisar blacklist**: Remover bloqueios injustos
4. **Atualizar lista de emails temporários**: Novos serviços surgem constantemente

### Para Desenvolvedores

1. **Não hardcodar**: Usar configuração para thresholds
2. **Logar tudo**: Facilitar debugging e análise
3. **Testes A/B**: Testar diferentes configurações
4. **Rate limiting**: Adicionar em endpoints sensíveis

---

## 🔧 Troubleshooting

### Problema: Muitos falsos positivos

**Sintoma**: Usuários legítimos sendo bloqueados  
**Solução**:
1. Aumentar thresholds (approve: 39, verify: 80)
2. Reduzir pontos por fator individual
3. Revisar blacklist manual

### Problema: Muito abuso passando

**Sintoma**: Fraudes não sendo detectadas  
**Solução**:
1. Reduzir thresholds (approve: 19, verify: 50)
2. Adicionar mais domínios temporários à lista
3. Integrar serviço de detecção de VPN (IPHub, IPQualityScore)

### Problema: Código de verificação não chega

**Sintoma**: Email não enviado ou demora muito  
**Solução**:
1. Verificar MailHog (dev): http://localhost:8025
2. Verificar SMTP_HOST e SMTP_PORT
3. Verificar logs do EmailService
4. Testar conexão: `curl /api/email/test-connection`

---

## 📚 Referências

### Arquivos Relacionados

**Backend:**
- `src/services/anti-fraud.service.ts` - Lógica principal de risco
- `src/services/blacklist.service.ts` - Gerenciamento de blacklist
- `src/services/email.service.ts` - Envio de códigos de verificação
- `prisma/schema.prisma` - Modelos: CouponUsage, Blacklist, RiskLog

**Frontend:**
- `src/utils/fingerprint.ts` - Geração de fingerprint
- `src/components/auth/VerificationCodeModal.tsx` - Modal de código
- `src/hooks/useRegistration.ts` - Integração com anti-fraude

### Integrações Futuras

1. **IPQualityScore** - Detecção avançada de VPN/Proxy
2. **MaxMind GeoIP** - Geolocalização de IP
3. **Hunter.io** - Validação de email corporativo
4. **reCAPTCHA v3** - Score de bot/humano

---

## 📊 Estatísticas (Exemplo)

```sql
-- Registros bloqueados por dia
SELECT 
  DATE(created_at) as date,
  COUNT(*) as blocked_registrations,
  AVG(risk_score) as avg_risk_score
FROM risk_log
WHERE action_taken = 'blocked'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top IPs bloqueados
SELECT 
  ip_address,
  COUNT(*) as attempts,
  MAX(risk_score) as max_risk_score
FROM risk_log
WHERE action_taken = 'blocked'
GROUP BY ip_address
ORDER BY attempts DESC
LIMIT 10;

-- Efetividade de verificação por código
SELECT 
  action_taken,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM risk_log
WHERE risk_score BETWEEN 30 AND 70
GROUP BY action_taken;
```

---

## 🔐 Segurança e Privacidade

### LGPD/GDPR Compliance

**Dados Coletados:**
- IP Address (necessário para segurança)
- Device Fingerprint (anônimo, não identifica pessoalmente)
- User-Agent (informação pública do navegador)

**Retenção:**
- Logs de risco: 90 dias
- Blacklist temporária: conforme configurado
- Coupon usage: permanente (para auditoria)

**Direitos do Usuário:**
- Solicitar remoção de IP da blacklist
- Visualizar risk score do próprio registro
- Contestar bloqueio injusto

### Anonimização

IPs são parcialmente mascarados em logs públicos:
```
192.168.1.100 → 192.168.1.xxx
```

---

## 🚀 Melhorias Futuras

### Curto Prazo
- [ ] Dashboard de analytics do sistema anti-fraude
- [ ] Configuração via Admin Panel (thresholds, blacklist)
- [ ] Alertas automáticos (Slack/Email) para administradores

### Médio Prazo
- [ ] Machine Learning para detecção de padrões
- [ ] Integração com IPQualityScore
- [ ] Sistema de "trustscore" para usuários verificados

### Longo Prazo
- [ ] Behavioral biometrics (padrões de digitação, movimento do mouse)
- [ ] Network analysis (graph de relacionamentos suspeitos)
- [ ] Honeypot coupons (cupons falsos para detectar bots)

---

**Autor**: Sistema Axisor  
**Revisão**: Pendente  
**Status**: Implementado


