---
title: "Plan Gate System"
category: features
subcategory: conversion
tags: [plan-gate, conversion, upgrade, user-experience]
priority: high
status: active
last_updated: 2025-01-22
version: "1.0"
authors: ["Axisor Team"]
---

# Plan Gate System

## Summary

Contextual plan gates that appear at strategic moments to encourage users to upgrade to paid plans. Implements cooldown logic, conversion tracking, and seamless upgrade flows.

## Gate Triggers

### 1. Tour End
- After completing product tour
- Show value proposition
- Highlight key features

### 2. Tour Skip
- When user skips tour
- Immediate value demonstration
- Feature preview

### 3. Blocked Action
- When accessing premium feature
- Contextual upgrade prompt
- Feature-specific messaging

## PlanGateController

```typescript
class PlanGateController {
  private cooldown = 90; // seconds
  private lastShown = 0;
  
  shouldShowGate(trigger: string): boolean {
    const now = Date.now() / 1000;
    const timeSinceLastShown = now - this.lastShown;
    
    if (timeSinceLastShown < this.cooldown) {
      return false;
    }
    
    this.lastShown = now;
    return true;
  }
}
```

## PlanDecisionSheet Component

```typescript
interface PlanDecisionSheetProps {
  trigger: 'tour_end' | 'tour_skip' | 'blocked_action';
  feature?: string;
  onClose: () => void;
  onUpgrade: (plan: string) => void;
}

export function PlanDecisionSheet({ trigger, feature, onClose, onUpgrade }: PlanDecisionSheetProps) {
  return (
    <div className="plan-decision-sheet">
      <h2>Unlock Full Potential</h2>
      <p>Choose your plan to access all features</p>
      
      <div className="plans-grid">
        <PlanCard plan="BASIC" price="$29/month" />
        <PlanCard plan="ADVANCED" price="$99/month" />
        <PlanCard plan="PRO" price="$299/month" />
      </div>
      
      <button onClick={() => onUpgrade('BASIC')}>
        Start with BASIC
      </button>
    </div>
  );
}
```

## Conversion Analytics

```typescript
// Track gate events
trackEvent('plan_gate_shown', { trigger, feature });
trackEvent('plan_gate_dismissed', { trigger });
trackEvent('plan_selected', { plan, trigger });
```

## Related Documentation

- [Registration Verification Flow](./registration-verification-flow.md)
- [Entitlements System](./entitlements-system.md)
- [Feature Flags](./feature-flags.md)
