export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number; // em sats
  price_yearly: number; // em sats
  price_lifetime: number; // em sats
  currency: string;
  features: {
    automations: string[];
    notifications: string[];
    backtests: string[];
    advanced: string[];
    support: string[];
  };
  max_automations: number; // -1 para ilimitado
  max_backtests: number; // -1 para ilimitado
  max_notifications: number; // -1 para ilimitado
  has_priority: boolean;
  has_advanced: boolean;
  has_api_access: boolean;
  is_active: boolean;
  order: number;
  color: string;
  icon: string;
}

export const PLANS_CONFIG: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    slug: 'free',
    description: 'Plano gratuito com recursos básicos',
    price_monthly: 0,
    price_yearly: 0,
    price_lifetime: 0,
    currency: 'sats',
    features: {
      automations: ['Margin Guard'],
      notifications: ['Email'],
      backtests: ['Historical Data'],
      advanced: [],
      support: ['Email Support'],
    },
    max_automations: 1,
    max_backtests: 3,
    max_notifications: 5,
    has_priority: false,
    has_advanced: false,
    has_api_access: false,
    is_active: true,
    order: 1,
    color: 'gray',
    icon: 'gift',
  },
  {
    id: 'basic',
    name: 'Basic',
    slug: 'basic',
    description: 'Plano básico para traders iniciantes',
    price_monthly: 10000,
    price_yearly: 100000,
    price_lifetime: 0,
    currency: 'sats',
    features: {
      automations: ['Margin Guard', 'Take Profit'],
      notifications: ['Email', 'Telegram'],
      backtests: ['Historical Data', 'Performance Analysis'],
      advanced: ['API Access'],
      support: ['Email Support'],
    },
    max_automations: 5,
    max_backtests: 10,
    max_notifications: 20,
    has_priority: false,
    has_advanced: false,
    has_api_access: true,
    is_active: true,
    order: 2,
    color: 'blue',
    icon: 'zap',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    slug: 'advanced',
    description: 'Plano avançado com recursos premium',
    price_monthly: 25000,
    price_yearly: 250000,
    price_lifetime: 0,
    currency: 'sats',
    features: {
      automations: ['Margin Guard', 'Take Profit', 'Stop Loss'],
      notifications: ['Email', 'Telegram', 'WhatsApp'],
      backtests: ['Historical Data', 'Performance Analysis', 'Custom Strategies'],
      advanced: ['API Access', 'Advanced Analytics', 'Custom Webhooks'],
      support: ['Priority Support', '24/7 Chat'],
    },
    max_automations: 15,
    max_backtests: 50,
    max_notifications: 100,
    has_priority: true,
    has_advanced: true,
    has_api_access: true,
    is_active: true,
    order: 3,
    color: 'purple',
    icon: 'star',
  },
  {
    id: 'pro',
    name: 'Pro',
    slug: 'pro',
    description: 'Plano profissional com todos os recursos',
    price_monthly: 50000,
    price_yearly: 500000,
    price_lifetime: 0,
    currency: 'sats',
    features: {
      automations: ['Margin Guard', 'Take Profit', 'Stop Loss', 'Custom Strategies'],
      notifications: ['Email', 'Telegram', 'WhatsApp', 'Push Notifications'],
      backtests: ['Historical Data', 'Performance Analysis', 'Custom Strategies', 'Advanced Analytics'],
      advanced: ['API Access', 'Advanced Analytics', 'Custom Webhooks', 'White-label Options'],
      support: ['Priority Support', '24/7 Chat', 'Dedicated Support'],
    },
    max_automations: -1, // ilimitado
    max_backtests: -1, // ilimitado
    max_notifications: -1, // ilimitado
    has_priority: true,
    has_advanced: true,
    has_api_access: true,
    is_active: true,
    order: 4,
    color: 'yellow',
    icon: 'crown',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    slug: 'lifetime',
    description: 'Acesso vitalício a todos os recursos',
    price_monthly: 0,
    price_yearly: 0,
    price_lifetime: 500000,
    currency: 'sats',
    features: {
      automations: ['Margin Guard', 'Take Profit', 'Stop Loss', 'Custom Strategies'],
      notifications: ['Email', 'Telegram', 'WhatsApp', 'Push Notifications'],
      backtests: ['Historical Data', 'Performance Analysis', 'Custom Strategies', 'Advanced Analytics'],
      advanced: ['API Access', 'Advanced Analytics', 'Custom Webhooks', 'White-label Options'],
      support: ['Priority Support', '24/7 Chat', 'Dedicated Support'],
    },
    max_automations: -1, // ilimitado
    max_backtests: -1, // ilimitado
    max_notifications: -1, // ilimitado
    has_priority: true,
    has_advanced: true,
    has_api_access: true,
    is_active: true,
    order: 5,
    color: 'green',
    icon: 'gem',
  },
];

export const getPlanById = (id: string): Plan | undefined => {
  return PLANS_CONFIG.find(plan => plan.id === id);
};

export const getActivePlans = (): Plan[] => {
  return PLANS_CONFIG.filter(plan => plan.is_active);
};

export const formatPlanPrice = (plan: Plan): string => {
  if (plan.price_lifetime > 0) {
    return `${plan.price_lifetime.toLocaleString()} sats (lifetime)`;
  }
  if (plan.price_yearly > 0) {
    return `${plan.price_yearly.toLocaleString()} sats/year`;
  }
  if (plan.price_monthly > 0) {
    return `${plan.price_monthly.toLocaleString()} sats/month`;
  }
  return 'Free';
};
