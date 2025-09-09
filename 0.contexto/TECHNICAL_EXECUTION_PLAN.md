## 🎯 OBJETIVO FINAL  
Ter **MVP funcional para 30 testers** em **60 dias**, com:  
✅ Margin Guard 100% operacional  
✅ Logs que distinguem erro app vs corretora  
✅ Notificações via Telegram (EvolutionAPI)  
✅ Backtest funcional (mesmo que via CSV manual)  
✅ Entradas automáticas + TP/SL  
✅ Painel admin com KPIs reais  
✅ Zero falhas críticas atribuídas ao app

---

## ⚙️ FASE 1: INFRAESTRUTURA + AUTENTICAÇÃO + VALIDAÇÃO DE KEYS (DIA 1-10)

### ✅ OBJETIVO  
Garantir que o sistema esteja 100% funcional para testers, com cadastro, autenticação, validação de keys LN Markets e painel admin.

---

### 📌 TAREFA 1.1: VALIDAR KEYS LN MARKETS NO CADASTRO  
**Endpoint LN Markets:** `GET /v2/user`  
**Headers obrigatórios:**  
```ts
LNM-ACCESS-KEY: string
LNM-ACCESS-SIGNATURE: string (HMAC-SHA256 base64)
LNM-ACCESS-PASSPHRASE: string
LNM-ACCESS-TIMESTAMP: number (ms)
```

**Payload de teste (backend/src/services/lnmarkets.service.ts):**
```ts
// Testa credenciais
const testKeys = async (apiKey: string, apiSecret: string, passphrase: string) => {
  const timestamp = Date.now();
  const method = 'GET';
  const path = '/v2/user';
  const params = '';
  const signature = createHmac('sha256', apiSecret)
    .update(`${timestamp}${method}${path}${params}`)
    .digest('base64');

  const headers = {
    'LNM-ACCESS-KEY': apiKey,
    'LNM-ACCESS-SIGNATURE': signature,
    'LNM-ACCESS-PASSPHRASE': passphrase,
    'LNM-ACCESS-TIMESTAMP': timestamp.toString(),
  };

  try {
    const res = await axios.get('https://api.lnmarkets.com/v2/user', { headers });
    return { success: true, data: res.data };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('INVALID_LN_MARKETS_KEYS');
    }
    throw new Error('LN_MARKETS_API_ERROR');
  }
};
```

**Critérios de aceitação técnica:**  
- [x] Teste unitário: `should return 401 if keys are invalid`  
- [x] Teste de contrato: Mock de 401 → retorna `INVALID_LN_MARKETS_KEYS`  
- [x] Teste de contrato: Mock de 200 → retorna `success: true`  
- [x] Fallback: Se API down, retorna erro controlado (não crasha app)
- [x] **IMPLEMENTADO**: Validação LN Markets funcionando 100% com credenciais sandbox

---

### 📌 TAREFA 1.2: CRIPTOGRAFAR KEYS NO BANCO  
**Arquivo:** `backend/src/utils/encryption.ts`  
**Biblioteca:** `libsodium-wrappers`  
**Chave:** `ENCRYPTION_KEY` do `.env` (32 chars)

```ts
import * as sodium from 'libsodium-wrappers';

export const encrypt = async (text: string): Promise<string> => {
  await sodium.ready;
  const key = sodium.from_hex(process.env.ENCRYPTION_KEY!);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const encrypted = sodium.crypto_secretbox_easy(text, nonce, key);
  return Buffer.concat([nonce, encrypted]).toString('base64');
};

export const decrypt = async (encryptedText: string): Promise<string> => {
  await sodium.ready;
  const key = sodium.from_hex(process.env.ENCRYPTION_KEY!);
  const data = Buffer.from(encryptedText, 'base64');
  const nonce = data.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const encrypted = data.slice(sodium.crypto_secretbox_NONCEBYTES);
  const decrypted = sodium.crypto_secretbox_open_easy(encrypted, nonce, key);
  return Buffer.from(decrypted).toString('utf8');
};
```

**Critérios de aceitação técnica:**  
- [x] Teste unitário: `should encrypt and decrypt correctly`  
- [x] Teste de integração: Registrar usuário → verificar no banco → keys em `bytea`  
- [x] Validação Zod: `ln_markets_api_key: z.string().min(16)`
- [x] **IMPLEMENTADO**: Criptografia funcionando 100% com libsodium-wrappers  

---

### 📌 TAREFA 1.3: ATIVAR CUPOM ALPHATESTER VITALÍCIO  
**Arquivo:** `backend/src/controllers/auth.controller.ts`  
**Fluxo:**  
1. Recebe `coupon_code` no `POST /api/auth/register`  
2. Verifica em `Coupon` (code = ALPHATESTER, usage_limit > used_count)  
3. Se válido → seta `plan_type = 'free'` + registra em `user_coupon`  
4. Incrementa `used_count`

**Critérios de aceitação técnica:**  
- [x] Teste unitário: `should apply ALPHATESTER coupon and set plan_type to free`  
- [x] Teste de contrato: Registrar com cupom → GET `/api/users/me` → `plan_type = 'free'`  
- [x] Rate limiting: 3 tentativas/hora por IP (Redis)
- [x] **IMPLEMENTADO**: Cupom ALPHATESTER funcionando 100% com relacionamento UserCoupon

---

### 📌 TAREFA 1.4: PAINEL ADMIN BÁSICO FUNCIONAL  
**Rotas:**  
- `GET /api/admin/dashboard` → KPIs básicos  
- `GET /api/admin/users` → lista de usuários

**Arquivo:** `backend/src/controllers/admin.controller.ts`  
**KPIs retornados:**  
```ts
{
  total_users: number,
  active_users: number,
  total_trades: number,
  successful_trades: number,
  failed_trades: number
}
```

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Login superadmin → acessar dashboard → retorna dados reais  
- [ ] Teste de performance: Latência < 200ms (Prometheus)  
- [ ] Teste de segurança: Acesso negado se não for superadmin (403)

---

## ⚡ FASE 2: MARGIN GUARD + LOGS + NOTIFICAÇÕES (DIA 11-35)

### ✅ OBJETIVO  
Ter o **Margin Guard 100% funcional**, com logs granulares e notificações via Telegram em tempo real.

---

### ✅ TAREFA 2.1: WORKER — MARGIN MONITOR (EXECUTA A CADA 5S)
**Endpoint LN Markets:** `GET /v2/futures/trades?type=running`
**Cálculo de risco:**
```ts
const marginRatio = position.maintenance_margin / (position.margin + position.pl);
const level = marginRatio > 0.9 ? 'critical' : marginRatio > 0.8 ? 'warning' : 'safe';
```

**Arquivo:** `backend/src/workers/margin-monitor.ts`
**Fila BullMQ:** `margin-check` (prioridade: high)

**Critérios de aceitação técnica:**
- [x] Teste unitário: `should calculate margin ratio correctly`
- [x] Teste de contrato: Simular margin_ratio = 0.92 → dispara alerta
- [x] Fallback: Se API down, loga erro, não crasha worker
- [x] Implementado scheduler periódico a cada 5 segundos
- [x] Autenticação LN Markets com HMAC-SHA256
- [x] Suporte a múltiplos usuários simultaneamente

---

### 📌 TAREFA 2.2: WORKER — AUTOMATION EXECUTOR (EXECUTA MARGIN GUARD)  
**Endpoint LN Markets:** `POST /v2/futures/close`  
**Payload:** `{ "id": "trade_id" }`  
**Log de execução:** Registrar em `TradeLog` com `status = 'success' | 'app_error' | 'exchange_error'`

**Arquivo:** `backend/src/workers/automation-executor.ts`  
**Fila BullMQ:** `automation-execute` (prioridade: critical)

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Simular execução → verificar se trade é fechado na LN Markets  
- [ ] Teste de resiliência: Mock de 500 → retry 3x com backoff exponencial  
- [ ] Log granular: Registrar `raw_response` da API LN Markets

---

### 📌 TAREFA 2.3: WORKER — NOTIFICAÇÃO (TELEGRAM VIA EVOLUTIONAPI)  
**Endpoint:** `POST https://api.evolution-api.com/message/sendText`  
**Payload:**  
```json
{
  "number": "5511999999999",
  "text": "⚠️ Margem crítica! Margin Ratio: 92%"
}
```

**Arquivo:** `backend/src/workers/notification.ts`  
**Fila BullMQ:** `notification-send` (prioridade: normal)

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Simular alerta → verificar se mensagem chega no Telegram  
- [ ] Teste de fallback: Se EvolutionAPI down → loga erro, não crasha  
- [ ] Rate limiting: Max 20 concorrentes, timeout 10s

---

### 📌 TAREFA 2.4: LOGS GRANULARES DE TRADES  
**Tabela:** `TradeLog`  
**Campos obrigatórios:**  
- `error_message`: string  
- `raw_response`: JSON (resposta completa da LN Markets)  
- `status`: `success | app_error | exchange_error`

**Arquivo:** `backend/src/services/trade-log.service.ts`

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Simular erro → verificar se log distingue `app_error` vs `exchange_error`  
- [ ] Teste de performance: Inserção < 50ms  
- [ ] Teste de segurança: Dados sensíveis não expostos nos logs

---

## 📈 FASE 3: BACKTESTING + RELATÓRIOS (DIA 36-50)

### ✅ OBJETIVO  
Ter **backtest funcional** (mesmo que via CSV manual) e relatórios visuais básicos.

---

### 📌 TAREFA 3.1: BACKTEST SIMPLES (HISTÓRICO PESSOAL)  
**Endpoint LN Markets:** `GET /v2/futures/trades?type=closed&from=...&to=...`  
**Lógica:** Simular automação sobre trades fechados → calcular win_rate, PnL, drawdown

**Arquivo:** `backend/src/services/backtest.service.ts`

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Executar backtest → retornar métricas corretas  
- [ ] Teste de performance: Processamento < 2s para 100 trades  
- [ ] Fallback: Se API down, usa dados mockados (CSV local)

---

### 📌 TAREFA 3.2: RELATÓRIO VISUAL (GRÁFICOS BÁSICOS)  
**Biblioteca:** `Recharts`  
**Componente:** `src/components/BacktestReport.tsx`  
**Gráficos:**  
- Evolução de PnL ao longo do tempo  
- Distribuição de trades (win/loss)

**Critérios de aceitação técnica:**  
- [ ] Teste visual: Gráficos refletem dados do backtest  
- [ ] Teste de acessibilidade: Labels corretas, contraste adequado  
- [ ] Teste de responsividade: Funciona em mobile

---

## 🔔 FASE 4: ENTRADAS AUTOMÁTICAS + TP/SL (DIA 51-60)

### ✅ OBJETIVO  
Ter **entradas automáticas + Take Profit/Stop Loss** funcionando.

---

### 📌 TAREFA 4.1: WORKER — ENTRADAS AUTOMÁTICAS  
**Endpoint LN Markets:** `POST /v2/futures/new-trade`  
**Payload:**  
```json
{
  "type": "m",
  "side": "b",
  "leverage": 10,
  "quantity": 100,
  "stoploss": 18000,
  "takeprofit": 22000
}
```

**Arquivo:** `backend/src/workers/automation-executor.ts` (extensão)

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Simular entrada → verificar se ordem é criada na LN Markets  
- [ ] Teste de validação: Zod schema para payload  
- [ ] Teste de segurança: Validação de saldo antes de executar

---

### 📌 TAREFA 4.2: ATUALIZAR TRADE (TP/SL)  
**Endpoint LN Markets:** `POST /v2/futures/update-trade`  
**Payload:** `{ "id": "trade_id", "type": "stoploss", "value": 18000 }`

**Arquivo:** `backend/src/services/automation.service.ts`

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Atualizar TP/SL → verificar se trade é atualizado na LN Markets  
- [ ] Teste de idempotência: Mesma requisição 2x → não duplica ação  
- [ ] Log de auditoria: Registrar quem atualizou e quando