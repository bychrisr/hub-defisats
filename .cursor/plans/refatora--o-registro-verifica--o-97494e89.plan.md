<!-- 97494e89-70d2-4fe8-95e2-3074070a8442 c2290ca5-5ebf-474f-9032-088e1e615bef -->
# Refatoração: Fluxo Registro → Verificação → Demo → Gate → Planos → Onboarding

## Contexto e Decisões

**Padrão de mercado**: GitHub, Stripe, GitLab - NENHUMA ação sensível antes de `email_verified=true` + JWT.

**Decisões de Implementação**:

- Scope: Todas as 12 fases sequencialmente
- Usuários existentes: Migração com entitlements
- Email: Configurar/validar primeiro (DKIM/SPF/DMARC)
- Deploy: Feature flags para rollout controlado
- Demo: JSON estático realista (720 barras OHLCV)
- Gate: Ativa ao finalizar/pular tour E em ações bloqueadas (cooldown 90s)

## Feature Flags (Adicionar ao `.env`)

```bash
FEATURE_VERIFY_BLOCK_HARD=true
FEATURE_GATE_ON_TOUR=true
FEATURE_GATE_ON_BLOCKED_ACTION=true
FEATURE_PLANS_POST_AUTH=true
PLAN_GATE_COOLDOWN_SEC=90
OTP_MAX_ATTEMPTS_15M=5
EMAIL_VERIF_MAX_RESENDS_PER_HOUR=3
```

---

## FASE 0: Infraestrutura e Validação Email

### 0.1 Configurar e Testar Email Service

**Verificar**: `backend/src/config/email.config.ts`

- Validar SMTP configurado corretamente
- Testar envio em ambiente staging
- Verificar DKIM/SPF/DMARC configurados no DNS
- Criar endpoint de teste: `POST /api/email/test-send`

**Script de validação**:

```bash
backend/scripts/validate-email-config.ts
```

- Testa conexão SMTP
- Envia email de teste
- Verifica bounce rate

### 0.2 Adicionar Feature Flags ao Sistema

**Modificar**: `backend/src/config/env.ts`

```typescript
export const featureFlags = {
  verifyBlockHard: process.env.FEATURE_VERIFY_BLOCK_HARD === 'true',
  gateOnTour: process.env.FEATURE_GATE_ON_TOUR === 'true',
  gateOnBlockedAction: process.env.FEATURE_GATE_ON_BLOCKED_ACTION === 'true',
  plansPostAuth: process.env.FEATURE_PLANS_POST_AUTH === 'true',
};
```

**Criar**: `frontend/src/config/featureFlags.ts`

```typescript
export const featureFlags = {
  verifyBlockHard: import.meta.env.VITE_FEATURE_VERIFY_BLOCK_HARD === 'true',
  gateOnTour: import.meta.env.VITE_FEATURE_GATE_ON_TOUR === 'true',
  // ... outros flags
};
```

---

## FASE 1: Schema e Migração de Entitlements

### 1.1 Adicionar Model UserEntitlements

**Modificar**: `backend/prisma/schema.prisma`

Adicionar após o model `User`:

```prisma
model UserEntitlements {
  id          String   @id @default(uuid())
  user_id     String   @unique
  plan        String   @default("FREE")
  feature_set String   @default("free")
  demo_mode   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @default(now())
  
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("user_entitlements")
}
```

Adicionar relação no model `User`:

```prisma
user_entitlements UserEntitlements?
```

**Executar migração**:

```bash
cd backend
npx prisma migrate dev --name add_user_entitlements
```

### 1.2 Script de Backfill para Usuários Existentes

**Criar**: `backend/scripts/backfill-entitlements.ts`

```typescript
// Adiciona entitlements FREE para todos usuários sem entitlements
// Marca demo_mode=false para usuários já verificados
// Gera relatório de usuários sem email_verified
```

**Executar**:

```bash
npx tsx backend/scripts/backfill-entitlements.ts
```

---

## FASE 2: Bloqueio de Verificação

### 2.1 Criar Página VerifyEmailRequired

**Criar**: `frontend/src/pages/VerifyEmailRequired.tsx`

Componentes principais:

- Instruções claras "Verifique seu email para continuar"
- Campo OTP de 6 dígitos (fallback)
- Botão "Reenviar email" (rate-limited)
- Polling a cada 10s via `GET /api/auth/verification-status`
- Auto-redirect para `/login` quando `email_verified=true`

### 2.2 Backend - Endpoint de Status

**Modificar**: `backend/src/routes/auth.routes.ts`

Adicionar endpoint público (linha ~713):

```typescript
fastify.post('/verification-status', async (request, reply) => {
  const { email } = request.body as { email: string };
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { email_verified: true, account_status: true }
  });
  
  if (!user) {
    return reply.send({ email_verified: false, account_status: 'not_found' });
  }
  
  return reply.send({
    email_verified: user.email_verified,
    account_status: user.account_status
  });
});
```

### 2.3 Modificar Fluxo de Registro

**Modificar**: `frontend/src/hooks/useRegistration.ts`

No método `savePersonalData` (linha ~108):

```typescript
// Após sucesso, redirecionar para /verify-email-required
navigate('/verify-email-required', {
  state: { email: data.email }
});
```

### 2.4 Adicionar Rota no App

**Modificar**: `frontend/src/App.tsx`

Adicionar após rota `/verify-email` (linha ~283):

```tsx
<Route
  path="/verify-email-required"
  element={
    <PublicRoute>
      <VerifyEmailRequired />
    </PublicRoute>
  }
/>
```

---

## FASE 3: Sistema OTP + Magic Link

### 3.1 Atualizar Template de Email

**Modificar**: `backend/src/templates/emails/verification.hbs`

Adicionar seção OTP após o botão de verificação:

```html
<div style="margin-top: 30px; text-align: center;">
  <p>Ou use este código de verificação:</p>
  <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">
    {{otp}}
  </div>
  <p style="color: #666;">Código expira em 10 minutos</p>
</div>
```

### 3.2 Sistema OTP no Auth Service

**Modificar**: `backend/src/services/auth.service.ts`

Adicionar métodos (após linha ~730):

```typescript
async generateOTP(userId: string): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      email_verification_token: otpHash,
      email_verification_expires: new Date(Date.now() + 10 * 60 * 1000)
    }
  });
  
  return otp;
}

async validateOTP(email: string, code: string): Promise<{ success: boolean; jwt?: string }> {
  const user = await this.prisma.user.findUnique({ where: { email } });
  
  if (!user || !user.email_verification_token) {
    return { success: false };
  }
  
  if (user.email_verification_expires < new Date()) {
    return { success: false };
  }
  
  const isValid = await bcrypt.compare(code, user.email_verification_token);
  
  if (!isValid) {
    return { success: false };
  }
  
  // Marcar como verificado
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      account_status: 'active',
      email_verification_token: null
    }
  });
  
  // Criar entitlement FREE
  await this.ensureFreeEntitlement(user.id);
  
  // Gerar JWT
  const token = await this.fastify.jwt.sign({
    sub: user.id,
    email: user.email,
    email_verified: true
  });
  
  return { success: true, jwt: token };
}
```

### 3.3 Endpoint POST /verify-email/otp

**Modificar**: `backend/src/routes/auth.routes.ts`

Adicionar (linha ~813):

```typescript
fastify.post('/verify-email/otp', async (request, reply) => {
  const { email, code } = request.body as { email: string; code: string };
  
  const result = await authController.authService.validateOTP(email, code);
  
  if (!result.success) {
    return reply.status(400).send({
      success: false,
      error: 'INVALID_CODE'
    });
  }
  
  return reply.send({
    success: true,
    jwt: result.jwt
  });
});
```

### 3.4 Rate Limiting Middleware

**Criar**: `backend/src/middleware/otp-rate-limit.middleware.ts`

```typescript
import rateLimit from '@fastify/rate-limit';

export const otpRateLimit = rateLimit({
  max: 5,
  timeWindow: '15 minutes',
  keyGenerator: (request) => {
    const { email } = request.body as { email: string };
    return `${request.ip}-${email}`;
  }
});

export const resendRateLimit = rateLimit({
  max: 3,
  timeWindow: '1 hour',
  keyGenerator: (request) => {
    const { email } = request.body as { email: string };
    return `resend-${request.ip}-${email}`;
  }
});
```

Aplicar nos endpoints de OTP e resend.

---

## FASE 4: Login Automático pós-Verificação

### 4.1 Magic Link com Auto-Login

**Modificar**: `backend/src/routes/auth.routes.ts`

Atualizar endpoint `GET /api/auth/verify-email/:token` (linha ~757):

```typescript
fastify.get('/api/auth/verify-email/:token', async (request, reply) => {
  const { token } = request.params as { token: string };
  
  // 1. Validar token (single-use)
  const result = await authController.authService.verifyEmailToken(token);
  
  if (!result.success) {
    return reply.redirect(`${process.env.FRONTEND_URL}/verify-email?status=error`);
  }
  
  // 2. Buscar usuário e marcar como verificado
  const user = await prisma.user.update({
    where: { email: result.email },
    data: {
      email_verified: true,
      account_status: 'active',
      email_verification_token: null // Invalidar token
    }
  });
  
  // 3. Criar entitlement FREE
  await authController.authService.ensureFreeEntitlement(user.id);
  
  // 4. Gerar JWT
  const jwt = await fastify.jwt.sign({
    sub: user.id,
    email: user.email,
    email_verified: true
  });
  
  // 5. Set cookie HttpOnly + Secure
  reply.setCookie('access_token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 dias
  });
  
  // 6. Redirect para dashboard com flag first=true
  return reply.redirect(`${process.env.FRONTEND_URL}/dashboard?first=true`);
});
```

### 4.2 Service de Entitlements

**Criar**: `backend/src/services/entitlements.service.ts`

```typescript
export class EntitlementsService {
  constructor(private prisma: PrismaClient) {}
  
  async ensureFreeEntitlement(userId: string) {
    return await this.prisma.userEntitlements.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        plan: 'FREE',
        feature_set: 'free',
        demo_mode: true
      },
      update: {}
    });
  }
  
  async getUserEntitlements(userId: string) {
    return await this.prisma.userEntitlements.findUnique({
      where: { user_id: userId }
    });
  }
  
  async updatePlan(userId: string, plan: string, demoMode: boolean = false) {
    return await this.prisma.userEntitlements.update({
      where: { user_id: userId },
      data: {
        plan,
        feature_set: plan.toLowerCase(),
        demo_mode: demoMode,
        updated_at: new Date()
      }
    });
  }
}
```

Integrar no `AuthService` (importar e usar).

### 4.3 Endpoint GET /api/me/entitlements

**Criar**: `backend/src/routes/entitlements.routes.ts`

```typescript
export async function entitlementsRoutes(fastify: FastifyInstance) {
  const entitlementsService = new EntitlementsService(prisma);
  
  fastify.get('/me/entitlements', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Get current user entitlements',
      tags: ['Entitlements'],
      response: {
        200: {
          type: 'object',
          properties: {
            plan: { type: 'string' },
            feature_set: { type: 'string' },
            demo_mode: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const userId = (request as any).user.sub;
    const ent = await entitlementsService.getUserEntitlements(userId);
    
    if (!ent) {
      return reply.status(404).send({ error: 'Entitlements not found' });
    }
    
    return reply.send({
      plan: ent.plan,
      feature_set: ent.feature_set,
      demo_mode: ent.demo_mode
    });
  });
}
```

Registrar em `backend/src/index.ts`.

---

## FASE 5: Dados Demo Estáticos

### 5.1 Criar Arquivos JSON de Demo

**Criar**: `frontend/public/demo/ohlcv_BTCUSD_1h.json`

Estrutura: Array de 720 barras (30 dias × 24h):

```json
[
  [1704067200, 42500, 42800, 42300, 42650, 1234.5],
  [1704070800, 42650, 42900, 42500, 42750, 1567.2],
  ...
]
```

**Criar**: `frontend/public/demo/metrics.json`

```json
{
  "totalPnL": 12.4,
  "totalPnLSats": 124000,
  "winRate": 58.3,
  "totalTrades": 47,
  "winningTrades": 27,
  "losingTrades": 20,
  "avgWin": 2.8,
  "avgLoss": -1.9,
  "sharpeRatio": 1.85,
  "maxDrawdown": -8.5
}
```

**Criar**: `frontend/public/demo/bots.json`

```json
[
  {
    "id": "demo-bot-1",
    "name": "EMA Crossover 9/21",
    "status": "draft",
    "type": "ema_crossover",
    "config": { "fast": 9, "slow": 21 }
  },
  {
    "id": "demo-bot-2",
    "name": "RSI Mean Reversion",
    "status": "draft",
    "type": "rsi_reversal",
    "config": { "oversold": 30, "overbought": 70 }
  }
]
```

**Criar**: `frontend/public/demo/positions.json`

```json
[
  {
    "id": "demo-pos-1",
    "side": "long",
    "quantity": 0.05,
    "entryPrice": 42500,
    "currentPrice": 43200,
    "pnl": 3.2,
    "leverage": 2,
    "margin": 1062.5
  },
  {
    "id": "demo-pos-2",
    "side": "short",
    "quantity": 0.03,
    "entryPrice": 43800,
    "currentPrice": 43200,
    "pnl": 1.8,
    "leverage": 3,
    "margin": 437.33
  }
]
```

### 5.2 Serviço de Demo

**Criar**: `frontend/src/services/demo.service.ts`

```typescript
export interface DemoData {
  ohlcv: number[][];
  metrics: any;
  bots: any[];
  positions: any[];
}

export async function loadDemoData(): Promise<DemoData> {
  const [ohlcv, metrics, bots, positions] = await Promise.all([
    fetch('/demo/ohlcv_BTCUSD_1h.json').then(r => r.json()),
    fetch('/demo/metrics.json').then(r => r.json()),
    fetch('/demo/bots.json').then(r => r.json()),
    fetch('/demo/positions.json').then(r => r.json())
  ]);
  
  return { ohlcv, metrics, bots, positions };
}
```

---

## FASE 6: Dashboard Demo + Tour

### 6.1 Hook de Entitlements

**Criar**: `frontend/src/hooks/useEntitlements.ts`

```typescript
export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/me/entitlements', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })
      .then(r => r.json())
      .then(setEntitlements)
      .finally(() => setLoading(false));
  }, []);
  
  return { entitlements, loading };
}

const FEATURES = {
  free: ['view_dashboard', 'create_draft_bots', 'backtest'],
  basic: ['view_dashboard', 'create_draft_bots', 'backtest', 'connect_1_exchange', 'run_live_bots_limited'],
  advanced: ['view_dashboard', 'create_draft_bots', 'backtest', 'connect_1_exchange', 'run_live_bots_limited', 'unlimited_bots', 'advanced_reports'],
  pro: ['view_dashboard', 'create_draft_bots', 'backtest', 'connect_1_exchange', 'run_live_bots_limited', 'unlimited_bots', 'advanced_reports', 'multi_tenant', 'api_access']
};

export function hasFeature(ent: any, feature: string): boolean {
  if (!ent) return false;
  return FEATURES[ent.feature_set as keyof typeof FEATURES]?.includes(feature) ?? false;
}
```

### 6.2 Dashboard - Carregar Demo ou Real

**Modificar**: `frontend/src/pages/DashboardLiquid.tsx`

No início do componente:

```typescript
const { entitlements } = useEntitlements();
const [data, setData] = useState<any>(null);
const [searchParams] = useSearchParams();
const isFirstVisit = searchParams.get('first') === 'true';
const [runTour, setRunTour] = useState(false);

useEffect(() => {
  if (!entitlements) return;
  
  if (entitlements.demo_mode) {
    loadDemoData().then(setData);
  } else {
    loadRealData().then(setData);
  }
}, [entitlements]);

// Tour automático
useEffect(() => {
  if (isFirstVisit && entitlements?.demo_mode) {
    setTimeout(() => setRunTour(true), 1000);
  }
}, [isFirstVisit, entitlements]);
```

Adicionar banner de demo no JSX:

```tsx
{entitlements?.demo_mode && (
  <Alert className="mb-4">
    🎮 Modo Demo — Explore à vontade. Para operar de verdade, escolha um plano.
  </Alert>
)}
```

### 6.3 Integrar ProductTour

**Modificar**: `frontend/src/components/ProductTour.tsx`

Adicionar props para callbacks:

```typescript
interface ProductTourProps {
  run: boolean;
  onComplete: () => void;
  onSkip: () => void;
}
```

No componente pai (DashboardLiquid):

```tsx
<ProductTour
  run={runTour}
  onComplete={handleTourComplete}
  onSkip={handleTourSkip}
/>
```

---

## FASE 7: Gate de Decisão

### 7.1 Plan Gate Controller

**Criar**: `frontend/src/services/planGateController.ts`

```typescript
class PlanGateController {
  private cooldownMs = 90000; // 90s
  private lastShown = 0;
  
  canShow(): boolean {
    return (
      Date.now() - this.lastShown > this.cooldownMs &&
      sessionStorage.getItem('gateSeenThisSession') !== 'true'
    );
  }
  
  show(trigger: 'tour_end' | 'tour_skip' | 'blocked_action') {
    if (!this.canShow()) return;
    
    this.lastShown = Date.now();
    sessionStorage.setItem('gateSeenThisSession', 'true');
    
    window.dispatchEvent(new CustomEvent('open-plan-gate', {
      detail: { trigger }
    }));
  }
  
  reset() {
    this.lastShown = 0;
    sessionStorage.removeItem('gateSeenThisSession');
  }
}

export const planGateController = new PlanGateController();
```

### 7.2 Plan Decision Sheet Component

**Criar**: `frontend/src/components/plans/PlanDecisionSheet.tsx`

```tsx
export function PlanDecisionSheet() {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<string>('');
  
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setTrigger(e.detail.trigger);
      setOpen(true);
    };
    
    window.addEventListener('open-plan-gate', handler as any);
    return () => window.removeEventListener('open-plan-gate', handler as any);
  }, []);
  
  const title = {
    tour_end: '🎉 Tour completo! Pronto para começar?',
    tour_skip: '⚡ Vamos direto ao ponto?',
    blocked_action: '🔒 Essa funcionalidade requer um plano pago'
  }[trigger] || 'Escolha seu plano';
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Compare nossos planos e escolha o melhor para você
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          {/* Plan cards com features visuais */}
          <PlanCard plan="free" active />
          <PlanCard plan="basic" />
          <PlanCard plan="advanced" />
        </div>
        
        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={handleContinueFree}>
            Continuar no Free
          </Button>
          <Button onClick={handleChoosePlan}>
            Escolher Plano Pago
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

### 7.3 Integrar Gate no Tour

**Modificar**: `frontend/src/components/ProductTour.tsx`

```typescript
import { planGateController } from '@/services/planGateController';

const handleComplete = () => {
  onComplete();
  if (featureFlags.gateOnTour) {
    planGateController.show('tour_end');
  }
};

const handleSkip = () => {
  onSkip();
  if (featureFlags.gateOnTour) {
    planGateController.show('tour_skip');
  }
};
```

### 7.4 Protected Button Component

**Criar**: `frontend/src/components/ui/ProtectedButton.tsx`

```tsx
export function ProtectedButton({
  feature,
  children,
  onClick,
  ...props
}: {
  feature: string;
  children: React.ReactNode;
  onClick: () => void;
} & ButtonProps) {
  const { entitlements } = useEntitlements();
  const allowed = hasFeature(entitlements, feature);
  
  const handleClick = () => {
    if (allowed) {
      return onClick();
    }
    
    if (featureFlags.gateOnBlockedAction) {
      planGateController.show('blocked_action');
    }
  };
  
  return (
    <Button
      disabled={!allowed}
      onClick={handleClick}
      title={!allowed ? '🔒 Upgrade para desbloquear' : ''}
      {...props}
    >
      {children}
      {!allowed && <Lock className="ml-2 h-4 w-4" />}
    </Button>
  );
}
```

---

## FASE 8: Planos Pós-Autenticação

### 8.1 Nova Página de Planos Autenticada

**Criar**: `frontend/src/pages/Plans.tsx`

```tsx
export function Plans() {
  const { entitlements } = useEntitlements();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState<any>(null);
  
  const handleSelectPlan = async (plan: string) => {
    const response = await fetch('/api/plans/choose', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ plan, coupon })
    });
    
    const data = await response.json();
    
    if (data.next === '/onboarding') {
      navigate('/onboarding');
    } else if (data.next === '/checkout') {
      navigate('/checkout', { state: data });
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1>Escolha seu Plano</h1>
      
      <div className="grid grid-cols-4 gap-6 mt-8">
        <PlanCard
          plan="free"
          active={entitlements?.plan === 'FREE'}
          onSelect={() => handleSelectPlan('FREE')}
        />
        <PlanCard plan="basic" onSelect={() => handleSelectPlan('BASIC')} />
        <PlanCard plan="advanced" onSelect={() => handleSelectPlan('ADVANCED')} />
        <PlanCard plan="pro" onSelect={() => handleSelectPlan('PRO')} />
      </div>
      
      <CouponInput value={coupon} onChange={setCoupon} />
    </div>
  );
}
```

Adicionar rota em `App.tsx`:

```tsx
<Route
  path="/plans"
  element={
    <ProtectedRoute>
      <Plans />
    </ProtectedRoute>
  }
/>
```

### 8.2 Backend - Endpoint Choose Plan

**Criar**: `backend/src/routes/plans.routes.ts`

```typescript
export async function plansRoutes(fastify: FastifyInstance) {
  const plansService = new PlansService(prisma, fastify);
  
  fastify.post('/choose', {
    preHandler: [authMiddleware, requireVerified],
    schema: {
      body: {
        type: 'object',
        required: ['plan'],
        properties: {
          plan: { type: 'string', enum: ['FREE', 'BASIC', 'ADVANCED', 'PRO'] },
          coupon: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { plan, coupon } = request.body as any;
    const userId = (request as any).user.sub;
    
    if (plan === 'FREE') {
      // Atualizar entitlements
      await entitlementsService.updatePlan(userId, 'FREE', false);
      
      return reply.send({
        success: true,
        next: '/onboarding'
      });
    }
    
    // Plano pago - criar payment intent
    const paymentIntent = await plansService.createPaymentIntent(
      userId,
      plan,
      coupon
    );
    
    return reply.send({
      success: true,
      next: '/checkout',
      client_secret: paymentIntent.clientSecret,
      invoice: paymentIntent.invoice
    });
  });
}
```

**Criar**: `backend/src/services/plans.service.ts` com lógica de planos e validação de cupom.

### 8.3 Middleware Require Verified

**Criar**: `backend/src/middleware/require-verified.middleware.ts`

```typescript
export function requireVerified(request: any, reply: any, done: any) {
  if (!request.user?.email_verified) {
    return reply.code(403).send({
      error: 'EMAIL_NOT_VERIFIED',
      message: 'Email verification required'
    });
  }
  done();
}
```

Aplicar em todas rotas sensíveis:

- `/api/plans/*`
- `/api/payments/*`
- `/api/onboarding/*`
- `/api/credentials/*`

---

## FASE 9: Onboarding Pós-Auth

### 9.1 Remover SessionToken do Onboarding

**Modificar**: `backend/src/routes/onboarding.routes.ts`

Remover query param `?sessionToken=` e usar apenas:

```typescript
preHandler: [authMiddleware, requireVerified]
```

**Modificar**: `frontend/src/hooks/useOnboarding.ts`

Remover todas referências a `sessionToken`. Usar apenas JWT do `localStorage`.

**Modificar**: `frontend/src/pages/Onboarding.tsx`

Remover lógica de sessionToken. Buscar dados via:

```typescript
const { user } = useAuthStore();
const { entitlements } = useEntitlements();
```

---

## FASE 10: Feature Gating na UI

### 10.1 Criar Feature Config

**Criar**: `frontend/src/config/features.ts`

```typescript
export const FEATURES = {
  free: [
    'view_dashboard',
    'create_draft_bots',
    'backtest',
    'view_reports_readonly'
  ],
  basic: [
    'view_dashboard',
    'create_draft_bots',
    'backtest',
    'view_reports_readonly',
    'connect_1_exchange',
    'run_live_bots_limited',
    'basic_support'
  ],
  advanced: [
    'view_dashboard',
    'create_draft_bots',
    'backtest',
    'view_reports_readonly',
    'connect_1_exchange',
    'run_live_bots_limited',
    'basic_support',
    'unlimited_bots',
    'advanced_reports',
    'priority_ws'
  ],
  pro: [
    'view_dashboard',
    'create_draft_bots',
    'backtest',
    'view_reports_readonly',
    'connect_1_exchange',
    'run_live_bots_limited',
    'basic_support',
    'unlimited_bots',
    'advanced_reports',
    'priority_ws',
    'multi_tenant',
    'compliance',
    'api_access',
    'white_label'
  ]
};
```

### 10.2 Aplicar Proteções em Componentes

**Modificar principais componentes**:

`DashboardLiquid.tsx` - Ações "Run Live":

```tsx
<ProtectedButton feature="run_live_bots_limited" onClick={handleRunBot}>
  Run Live
</ProtectedButton>
```

`MarginGuard.tsx` - Conexão de exchange:

```tsx
<ProtectedButton feature="connect_1_exchange" onClick={handleConnect}>
  Connect Exchange
</ProtectedButton>
```

`Sidebar.tsx` - Menu items com tooltips:

```tsx
{!hasFeature(entitlements, 'advanced_reports') && (
  <Tooltip content="Disponível no plano Advanced">
    <Button disabled>Advanced Reports</Button>
  </Tooltip>
)}
```

---

## FASE 11: Telemetria e Analytics

### 11.1 Serviço de Analytics

**Criar**: `frontend/src/services/analytics.service.ts`

```typescript
export class AnalyticsService {
  track(event: string, properties?: Record<string, any>) {
    // Enviar para backend ou serviço de analytics
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties, timestamp: Date.now() })
    });
  }
  
  trackPlanSheetViewed(trigger: string) {
    this.track('plan_sheet_viewed', { trigger });
  }
  
  trackPlanSheetClosed() {
    this.track('plan_sheet_closed');
  }
  
  trackChooseFree() {
    this.track('choose_free');
  }
  
  trackChoosePaid(plan: string) {
    this.track('choose_paid', { plan });
  }
  
  trackBlockedAction(actionId: string, featureRequired: string) {
    this.track('blocked_action', { actionId, featureRequired });
  }
  
  trackDemoLoaded(loadTimeMs: number) {
    this.track('demo_loaded', { loadTimeMs });
  }
}

export const analytics = new AnalyticsService();
```

Integrar nos componentes chave.

### 11.2 Backend - Endpoint de Analytics

**Criar**: `backend/src/routes/analytics.routes.ts`

```typescript
fastify.post('/track', {
  preHandler: [authMiddleware],
  schema: {
    body: {
      type: 'object',
      required: ['event'],
      properties: {
        event: { type: 'string' },
        properties: { type: 'object' },
        timestamp: { type: 'number' }
      }
    }
  }
}, async (request, reply) => {
  const { event, properties, timestamp } = request.body as any;
  const userId = (request as any).user.sub;
  
  // Armazenar evento
  await prisma.analyticsEvent.create({
    data: {
      user_id: userId,
      event,
      properties,
      timestamp: new Date(timestamp)
    }
  });
  
  return reply.send({ success: true });
});
```

---

## FASE 12: Documentação e Testes

### 12.1 ADR Completo

**Criar**: `docs/architecture/ADR-001-registration-verification-flow.md`

Documentar:

- Contexto e motivação
- Decisões tomadas
- Alternativas consideradas
- Consequências
- Métricas de sucesso

### 12.2 Guia de Features

**Criar**: `docs/features/feature-gating-guide.md`

- Feature matrix por plano
- Como adicionar novas features protegidas
- Como testar permissões
- Troubleshooting comum

### 12.3 Testes E2E

**Criar**: `frontend/e2e/registration-flow.spec.ts`

Cenários críticos:

```typescript
test('T1: Registro → ignorar email → tentar dashboard → redirect verify-required', async ({ page }) => {
  // ...
});

test('T2: Registro → magic link → dashboard demo → tour → gate', async ({ page }) => {
  // ...
});

test('T3: Registro → OTP → escolher Free → onboarding', async ({ page }) => {
  // ...
});

test('T4: Registro → verificação → escolher Pago → checkout → onboarding', async ({ page }) => {
  // ...
});

test('T5: Ação bloqueada → gate contextual', async ({ page }) => {
  // ...
});

test('T6: Gate cooldown (não abre 2x em 90s)', async ({ page }) => {
  // ...
});
```

**Criar**: `backend/tests/integration/anti-fraud.test.ts`

Cenários:

- Cupom usado múltiplas vezes mesmo IP
- Blacklist automática após 5 registros
- Risk score calculation

---

## Checklist de Segurança Final

- [ ] Nenhuma rota de planos/pagamento/onboarding/credenciais acessível sem JWT + email_verified
- [ ] SessionToken removido do onboarding
- [ ] Magic link single-use (invalida após uso)
- [ ] OTP rate-limited (5/15min, 3 reenvios/hora)
- [ ] Mensagens neutras em erros (não vazar se email existe)
- [ ] Credenciais de exchange apenas após autenticação completa
- [ ] Cupom só efetivado no checkout autenticado
- [ ] Demo sem side-effects (dados locais/estáticos)
- [ ] HTTPS obrigatório em produção
- [ ] Cookies httpOnly + secure + sameSite
- [ ] JWT com expiração adequada (7 dias)
- [ ] Rate limiting em todos endpoints críticos

---

## Rollout Plan

1. **Staging**: Validar email service (DKIM/SPF/DMARC)
2. **DB**: Executar migração + backfill de entitlements
3. **Deploy**: Feature flags desabilitadas
4. **Canário**: Habilitar para 10% dos usuários
5. **Monitor**: Métricas de conversão e erros
6. **Rollout**: 25% → 50% → 100%
7. **Cleanup**: Remover código antigo após 2 semanas

---

## Métricas de Sucesso

- ✅ Taxa de verificação de email > 85%
- ✅ Tempo médio até primeiro login < 3 minutos
- ✅ Taxa de conversão Free → Pago > 8% (D7)
- ✅ Zero registros completados sem email_verified
- ✅ Gate mostrado com contexto (não spam)
- ✅ Performance demo: LCP < 1.2s p95
- ✅ Bounce rate de emails < 2%
- ✅ Erros de autenticação < 0.5%

### To-dos

- [ ] FASE 0: Configurar email service, adicionar feature flags aos .env files, criar endpoint de teste de email
- [ ] FASE 1: Adicionar UserEntitlements ao schema.prisma, executar migração, criar e rodar script de backfill para usuários existentes
- [ ] FASE 2: Criar página VerifyEmailRequired, endpoint verification-status, modificar fluxo de registro para redirecionar para verificação
- [ ] FASE 3: Implementar sistema OTP (generateOTP, validateOTP), atualizar template de email, criar rate limiting middleware
- [ ] FASE 4: Implementar auto-login no magic link, criar EntitlementsService, criar endpoint /me/entitlements
- [ ] FASE 5: Criar arquivos JSON de demo (ohlcv, metrics, bots, positions), criar demo.service.ts para carregamento
- [ ] FASE 6: Criar useEntitlements hook, modificar Dashboard para carregar demo ou real baseado em entitlements, integrar tour automático
- [ ] FASE 7: Criar PlanGateController, PlanDecisionSheet component, integrar gate no tour e criar ProtectedButton
- [ ] FASE 8: Criar página Plans autenticada, endpoint /plans/choose, PlansService, middleware requireVerified
- [ ] FASE 9: Remover sessionToken do onboarding (backend e frontend), adicionar guards requireVerified
- [ ] FASE 10: Criar features.ts config, aplicar ProtectedButton em componentes principais (Dashboard, MarginGuard, Sidebar)
- [ ] FASE 11: Criar analytics.service.ts, integrar tracking de eventos, criar endpoint /analytics/track
- [ ] FASE 12: Criar ADR completo, guia de features, testes E2E (T1-T6), testes de anti-fraud, validar checklist de segurança