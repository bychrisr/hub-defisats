/**
 * Feature Flags Configuration
 * Controla funcionalidades do sistema baseado em variáveis de ambiente
 */

export const featureFlags = {
  verifyBlockHard: import.meta.env.VITE_FEATURE_VERIFY_BLOCK_HARD === 'true',
  gateOnTour: import.meta.env.VITE_FEATURE_GATE_ON_TOUR === 'true',
  gateOnBlockedAction: import.meta.env.VITE_FEATURE_GATE_ON_BLOCKED_ACTION === 'true',
  plansPostAuth: import.meta.env.VITE_FEATURE_PLANS_POST_AUTH === 'true',
  planGateCooldownSec: parseInt(import.meta.env.VITE_PLAN_GATE_COOLDOWN_SEC || '90'),
  otpMaxAttempts15M: parseInt(import.meta.env.VITE_OTP_MAX_ATTEMPTS_15M || '5'),
  emailVerifMaxResendsPerHour: parseInt(import.meta.env.VITE_EMAIL_VERIF_MAX_RESENDS_PER_HOUR || '3'),
};

// Helper para verificar se uma feature está habilitada
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature] as boolean;
}

// Helper para obter valor numérico de uma feature
export function getFeatureValue(feature: keyof typeof featureFlags): number {
  return featureFlags[feature] as number;
}
