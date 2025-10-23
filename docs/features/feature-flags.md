---
title: "Feature Flags"
category: features
subcategory: configuration
tags: [feature-flags, configuration, rollout, deployment]
priority: high
status: active
last_updated: 2025-01-22
version: "1.0"
authors: ["Axisor Team"]
---

# Feature Flags

## Summary

Feature flags system for controlling the rollout of the new registration and verification flow. Enables gradual deployment, A/B testing, and quick rollback capabilities.

## Feature Flags Configuration

### Backend Configuration

```typescript
// backend/src/config/env.ts
export const featureFlags = {
  verifyBlockHard: env.FEATURE_VERIFY_BLOCK_HARD === 'true',
  gateOnTour: env.FEATURE_GATE_ON_TOUR === 'true',
  gateOnBlockedAction: env.FEATURE_GATE_ON_BLOCKED_ACTION === 'true',
  plansPostAuth: env.FEATURE_PLANS_POST_AUTH === 'true',
  planGateCooldownSec: env.PLAN_GATE_COOLDOWN_SEC,
  otpMaxAttempts15M: env.OTP_MAX_ATTEMPTS_15M,
  emailVerifMaxResendsPerHour: env.EMAIL_VERIF_MAX_RESENDS_PER_HOUR,
};
```

### Frontend Configuration

```typescript
// frontend/src/config/featureFlags.ts
export const featureFlags = {
  verifyBlockHard: import.meta.env.VITE_FEATURE_VERIFY_BLOCK_HARD === 'true',
  gateOnTour: import.meta.env.VITE_FEATURE_GATE_ON_TOUR === 'true',
  gateOnBlockedAction: import.meta.env.VITE_FEATURE_GATE_ON_BLOCKED_ACTION === 'true',
  plansPostAuth: import.meta.env.VITE_FEATURE_PLANS_POST_AUTH === 'true',
  planGateCooldownSec: parseInt(import.meta.env.VITE_PLAN_GATE_COOLDOWN_SEC || '90'),
  otpMaxAttempts15M: parseInt(import.meta.env.VITE_OTP_MAX_ATTEMPTS_15M || '5'),
  emailVerifMaxResendsPerHour: parseInt(import.meta.env.VITE_EMAIL_VERIF_MAX_RESENDS_PER_HOUR || '3'),
};
```

## Flag Usage

### Backend Usage

```typescript
// Check feature flag before enforcing verification
if (config.featureFlags.verifyBlockHard && !user.email_verified) {
  return reply.status(403).send({
    error: 'EMAIL_VERIFICATION_REQUIRED',
    message: 'Please verify your email to access this feature'
  });
}
```

### Frontend Usage

```typescript
// Conditional rendering based on feature flags
function Dashboard() {
  const { verifyBlockHard } = useFeatureFlags();
  
  if (verifyBlockHard && !user.email_verified) {
    return <VerifyEmailRequired />;
  }
  
  return <DashboardContent />;
}
```

## Rollout Strategy

### Phase 1: Internal Testing (10%)
- Enable for internal team
- Test all flows
- Validate functionality

### Phase 2: Beta Users (25%)
- Enable for beta users
- Monitor metrics
- Collect feedback

### Phase 3: Gradual Rollout (50%)
- Enable for half of users
- Monitor conversion rates
- Check error rates

### Phase 4: Full Rollout (100%)
- Enable for all users
- Monitor system stability
- Track success metrics

## Rollback Plan

```bash
# Quick rollback by disabling flags
export FEATURE_VERIFY_BLOCK_HARD=false
export FEATURE_GATE_ON_TOUR=false
export FEATURE_GATE_ON_BLOCKED_ACTION=false
export FEATURE_PLANS_POST_AUTH=false
```

## Related Documentation

- [Registration Verification Flow](./registration-verification-flow.md)
- [Entitlements System](./entitlements-system.md)
- [Plan Gate System](./plan-gate-system.md)
