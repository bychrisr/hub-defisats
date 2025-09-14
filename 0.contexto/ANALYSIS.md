## 1. Entities

- **User**
    - id (UUID, pk, required)
    - email (string, unique, required)
    - password_hash (string, nullable)
    - social_provider (enum: google, github, etc., nullable)
    - social_id (string, nullable)
    - ln_markets_api_key (string, encrypted, required)
    - ln_markets_api_secret (string, encrypted, required)
    - plan_type (enum: free, basic, advanced, pro, default: free)
    - last_activity_at (datetime, nullable)
    - created_at (datetime, default: now)
    - updated_at (datetime, default: now)
    - is_active (boolean, default: true)
    - session_expires_at (datetime, nullable)
    - [ASSUMPTION] Users can have only one active LN Markets key pair at a time.

## 1.1. Design System Architecture

### CoinGecko Inspired Design System
- **Design Tokens**: Centralizados em `frontend/src/lib/design-tokens.ts`
- **Paleta de Cores**: 
  - Primária: `#3773f5` (CoinGecko Blue)
  - Secundária: `#f5ac37` (CoinGecko Orange) 
  - Sucesso: `#0ecb81` (CoinGecko Green)
  - Destrutiva: `#f6465d` (CoinGecko Red)
- **Tipografia**: Inter (principal) + JetBrains Mono (dados técnicos)
- **Temas**: Light/Dark mode com CSS variables
- **Componentes**: CoinGeckoCard, PriceChange, ThemeContext

### UI Components
- **CoinGeckoCard**: Card component com estilo CoinGecko
- **PriceChange**: Componente para exibir mudanças de preço com cores semânticas
- **ThemeContext**: Context para gerenciamento de temas
- **Design System Page**: Página de demonstração dos componentes
- **Automation**
    - id (UUID, pk, required)
    - user_id (UUID, fk to [User.id](http://user.id/), required)
    - type (enum: margin_guard, tp_sl, auto_entry, required)
    - config (jsonb, required)
    - is_active (boolean, default: true)
    - created_at (datetime, default: now)
    - updated_at (datetime, default: now)
- **TradeLog**
    - id (UUID, pk, required)
    - user_id (UUID, fk to [User.id](http://user.id/), required)
    - automation_id (UUID, fk to [Automation.id](http://automation.id/), nullable)
    - trade_id (string, required) // LN Markets trade ID
    - status (enum: success, app_error, exchange_error, required)
    - error_message (text, nullable)
    - executed_at (datetime, required)
    - created_at (datetime, default: now)
- **Notification**
    - id (UUID, pk, required)
    - user_id (UUID, fk to [User.id](http://user.id/), required)
    - type (enum: telegram, email, whatsapp, required)
    - is_enabled (boolean, default: true)
    - channel_config (jsonb, required)
    - created_at (datetime, default: now)
    - updated_at (datetime, default: now)
- **Payment**
    - id (UUID, pk, required)
    - user_id (UUID, fk to [User.id](http://user.id/), required)
    - plan_type (enum: basic, advanced, pro, required)
    - amount_sats (integer, required)
    - lightning_invoice (string, required)
    - status (enum: pending, paid, expired, failed, required)
    - paid_at (datetime, nullable)
    - created_at (datetime, default: now)
    - updated_at (datetime, default: now)
- **BacktestReport**
    - id (UUID, pk, required)
    - user_id (UUID, fk to [User.id](http://user.id/), required)
    - config (jsonb, required)
    - result (jsonb, required)
    - created_at (datetime, default: now)
- **AdminUser**
    - id (UUID, pk, required)
    - user_id (UUID, fk to [User.id](http://user.id/), unique, required)
    - role (enum: superadmin, admin, required)
    - created_at (datetime, default: now)
- **Coupon**
    - id (UUID, pk, required)
    - code (string, unique, required)
    - usage_limit (integer, default: 1)
    - used_count (integer, default: 0)
    - plan_type (enum: free, basic, advanced, pro, required)
    - expires_at (datetime, nullable)
    - created_at (datetime, default: now)
- **SystemAlert**
    - id (UUID, pk, required)
    - message (text, required)
    - severity (enum: info, warning, critical, required)
    - is_global (boolean, default: false)
    - created_at (datetime, default: now)

## 2. Relationships

- **User** 1:N **Automation**
    - `Automation.user_id` → `User.id`
- **User** 1:N **TradeLog**
    - `TradeLog.user_id` → `User.id`
- **Automation** 1:N **TradeLog**
    - `TradeLog.automation_id` → `Automation.id` (nullable)
- **User** 1:N **Notification**
    - `Notification.user_id` → `User.id`
- **User** 1:N **Payment**
    - `Payment.user_id` → `User.id`
- **User** 1:N **BacktestReport**
    - `BacktestReport.user_id` → `User.id`
- **User** 1:1 **AdminUser**
    - `AdminUser.user_id` → `User.id`
- **User** N:N **Coupon** (via join table `user_coupon`)
    - `user_coupon.user_id` → `User.id`
    - `user_coupon.coupon_id` → `Coupon.id`
    - [ASSUMPTION] Each user can redeem a coupon once.
- **User** N:1 **Coupon** (used during onboarding)
    - `User.id` ← via coupon code in registration flow

## 3. API Endpoints (previstos)

- **Rota**: `POST /api/auth/register`
    - **Método**: POST
    - **Payload esperado**:
        
        ```json
        {
          "email": "string",
          "password": "string",
          "ln_markets_api_key": "string",
          "ln_markets_api_secret": "string",
          "coupon_code": "string"
        }
        
        ```
        
    - **Response**:
        
        ```json
        {
          "user_id": "uuid",
          "token": "jwt",
          "plan_type": "free"
        }
        
        ```
        
    - **Auth/Permissões**: Public
- **Rota**: `POST /api/auth/login`
    - **Método**: POST
    - **Payload esperado**:
        
        ```json
        {
          "email": "string",
          "password": "string"
        }
        
        ```
        
    - **Response**:
        
        ```json
        {
          "user_id": "uuid",
          "token": "jwt",
          "plan_type": "free"
        }
        
        ```
        
    - **Auth/Permissões**: Public
- **Rota**: `GET /api/users/me`
    - **Método**: GET
    - **Response**:
        
        ```json
        {
          "id": "uuid",
          "email": "string",
          "plan_type": "string",
          "notifications": [...],
          "automations": [...]
        }
        
        ```
        
    - **Auth/Permissões**: Authenticated User
- **Rota**: `POST /api/automations`
    - **Método**: POST
    - **Payload esperado**:
        
        ```json
        {
          "type": "margin_guard",
          "config": {}
        }
        
        ```
        
    - **Response**:
        
        ```json
        {
          "id": "uuid",
          "type": "margin_guard",
          "is_active": true
        }
        
        ```
        
    - **Auth/Permissões**: Authenticated User
- **Rota**: `GET /api/trades/logs`
    - **Método**: GET
    - **Response**:
        
        ```json
        [
          {
            "id": "uuid",
            "trade_id": "string",
            "status": "success",
            "executed_at": "datetime"
          }
        ]
        
        ```
        
    - **Auth/Permissões**: Authenticated User
- **Rota**: `POST /api/backtests`
    - **Método**: POST
    - **Payload esperado**:
        
        ```json
        {
          "config": {}
        }
        
        ```
        
    - **Response**:
        
        ```json
        {
          "id": "uuid",
          "result": {}
        }
        
        ```
        
    - **Auth/Permissões**: Authenticated User
- **Rota**: `POST /api/payments/lightning`
    - **Método**: POST
    - **Payload esperado**:
        
        ```json
        {
          "plan_type": "basic"
        }
        
        ```
        
    - **Response**:
        
        ```json
        {
          "invoice": "string",
          "amount_sats": 10000
        }
        
        ```
        
    - **Auth/Permissões**: Authenticated User
- **Rota**: `GET /api/admin/dashboard`
    - **Método**: GET
    - **Response**:
        
        ```json
        {
          "kpi": {},
          "users": [...],
          "payments": [...]
        }
        
        ```
        
    - **Auth/Permissões**: Superadmin
- **Rota**: `POST /api/admin/coupons`
    - **Método**: POST
    - **Payload esperado**:
        
        ```json
        {
          "code": "string",
          "plan_type": "pro",
          "usage_limit": 10
        }
        
        ```
        
    - **Response**:
        
        ```json
        {
          "id": "uuid",
          "code": "string"
        }
        
        ```
        
    - **Auth/Permissões**: Superadmin

## 4. Business Rules

- LN Markets keys must be encrypted before storage.
- Session must expire after 30 minutes of inactivity unless configured otherwise.
- Automation execution must be logged with distinction between app errors and exchange errors.
- Payment invoices must be automatically validated and retried if expired.
- Users can only have one active LN Markets key pair.
- Coupon usage is limited to one per user.
- Automation execution must have latency < 200ms.
- Backtests are based on personal trade history only.
- Notifications are enabled by default for all channels.
- Admins can view detailed logs and system-wide alerts.

## 5. Validations

- **User.email**: required, valid email format, unique.
- **User.password**: required if not using social login, min 8 chars.
- **User.ln_markets_api_key/secret**: required, min 16 chars.
- **Automation.type**: required, enum (margin_guard, tp_sl, auto_entry).
- **Automation.config**: required, JSON validation based on type.
- **Payment.plan_type**: required, enum (basic, advanced, pro).
- **Payment.amount_sats**: integer, > 0.
- **Coupon.code**: required, alphanumeric, unique.
- **Coupon.plan_type**: required, enum (free, basic, advanced, pro).
- **Notification.type**: required, enum (telegram, email, whatsapp).
- **Notification.channel_config**: required, channel-specific JSON schema.

## 6. Critical Flows

- **User Registration & Onboarding**
    - User registers → validates LN Markets keys → applies coupon (if any) → sets initial plan → generates session.
- **Automation Execution**
    - User configures automation → system polls LN Markets API → executes trade → logs result → sends notification if needed.
- **Payment Processing**
    - User selects plan → system generates Lightning invoice → validates payment → upgrades user plan → logs payment.
- **Backtest Execution**
    - User requests backtest → system fetches personal trade history → evaluates automation config → stores report.
- **Alerts & Notifications**
    - System monitors margin → detects risk → sends alerts via configured channels (Telegram, Email, WhatsApp).

## 7. Security Architecture

### Authentication & Authorization
- **JWT + Refresh Tokens**: Access tokens (15min) + refresh tokens (7d) em HTTP-only cookies
- **2FA Obrigatório**: Google Authenticator para admins, backup codes
- **Social Login**: Google/GitHub OAuth2 com validação de domínio
- **Session Management**: Controle de sessões ativas, logout remoto, prevenção de login concorrente

### Password Security
- **Validação Robusta**: 8+ chars, maiúscula, minúscula, número, símbolo
- **HIBP Integration**: Verificação contra vazamentos via k-Anonymity
- **Hash Seguro**: bcrypt com salt rounds 12
- **Reset Seguro**: Token único, expiração 15min, uso único

### Attack Prevention
- **Rate Limiting**: 5 tentativas/15min login, 3 tentativas/1h registro
- **CAPTCHA**: reCAPTCHA v3 após 3 falhas, hCaptcha como fallback
- **CSRF Protection**: Tokens CSRF para operações state-changing
- **XSS Prevention**: DOMPurify, escape de HTML, CSP headers
- **SQL Injection**: Prisma ORM com prepared statements

### Data Protection
- **Encryption**: AES-256 para keys LN Markets, libsodium para dados sensíveis
- **Sanitization**: Validação e sanitização de todos os inputs
- **Audit Logs**: Logs de segurança com IP, user agent, timestamps
- **Monitoring**: Alertas para atividades suspeitas, múltiplos erros

### Infrastructure Security
- **HTTPS Only**: Redirecionamento HTTP → HTTPS, HSTS headers
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options
- **Cookie Security**: HttpOnly, Secure, SameSite=Strict
- **Environment**: Variáveis de ambiente para secrets, .env ignorado

### Compliance & Monitoring
- **GDPR**: Retenção de dados, direito ao esquecimento
- **Audit Trail**: Logs de todas as ações críticas
- **Backup**: Backup criptografado com retenção configurável
- **Incident Response**: Plano de resposta a vazamentos de dados