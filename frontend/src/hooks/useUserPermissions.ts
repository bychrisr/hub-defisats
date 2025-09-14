import { useAuthStore } from '@/stores/auth';

// Tipos de planos disponíveis
export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  ADVANCED = 'advanced',
  PRO = 'pro',
  LIFETIME = 'lifetime',
}

// Hierarquia de planos (maior número = mais permissões)
const PLAN_HIERARCHY = {
  [PlanType.FREE]: 0,
  [PlanType.BASIC]: 1,
  [PlanType.ADVANCED]: 2,
  [PlanType.PRO]: 3,
  [PlanType.LIFETIME]: 4,
};

// Configuração de permissões por rota
const ROUTE_PERMISSIONS = {
  // Rotas públicas (todos podem acessar)
  public: ['/', '/login', '/register'],
  
  // Rotas que requerem autenticação básica
  authenticated: [
    '/dashboard',
    '/profile',
    '/logout'
  ],
  
  // Rotas que requerem plano básico ou superior
  basic: [
    '/automation',
    '/positions',
    '/backtests',
    '/reports'
  ],
  
  // Rotas que requerem plano avançado ou superior
  advanced: [
    '/trading',
    '/margin-guard',
    '/logs'
  ],
  
  // Rotas que requerem plano pro ou superior
  pro: [
    '/api',
    '/analytics',
    '/advanced-tools'
  ],
  
  // Rotas administrativas (apenas admins)
  admin: [
    '/admin',
    '/admin/dashboard',
    '/admin/menus',
    '/admin/dynamic-pages',
    '/admin/monitoring',
    '/admin/users',
    '/admin/coupons',
    '/admin/alerts',
    '/admin/settings'
  ]
};

// Hook para gerenciar permissões do usuário
export const useUserPermissions = () => {
  const { user, isAuthenticated } = useAuthStore();
  
  // Obter tipo de plano do usuário
  const getUserPlanType = (): PlanType => {
    if (!user?.plan_type) return PlanType.FREE;
    return user.plan_type as PlanType;
  };
  
  // Verificar se o usuário é admin
  const isAdmin = (): boolean => {
    return user?.is_admin === true;
  };
  
  // Verificar se o usuário tem plano suficiente
  const hasPlanLevel = (requiredPlan: PlanType): boolean => {
    if (!isAuthenticated) return false;
    
    const userPlan = getUserPlanType();
    return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
  };
  
  // Verificar se o usuário pode acessar uma rota
  const canAccessRoute = (route: string): boolean => {
    // Rotas públicas sempre permitidas
    if (ROUTE_PERMISSIONS.public.includes(route)) {
      return true;
    }
    
    // Se não está autenticado, só pode acessar rotas públicas
    if (!isAuthenticated) {
      return false;
    }
    
    // Verificar rotas administrativas
    if (ROUTE_PERMISSIONS.admin.some(adminRoute => route.startsWith(adminRoute))) {
      return isAdmin();
    }
    
    // Verificar rotas autenticadas
    if (ROUTE_PERMISSIONS.authenticated.includes(route)) {
      return true;
    }
    
    // Verificar rotas por nível de plano
    if (ROUTE_PERMISSIONS.basic.includes(route)) {
      return hasPlanLevel(PlanType.BASIC);
    }
    
    if (ROUTE_PERMISSIONS.advanced.includes(route)) {
      return hasPlanLevel(PlanType.ADVANCED);
    }
    
    if (ROUTE_PERMISSIONS.pro.includes(route)) {
      return hasPlanLevel(PlanType.PRO);
    }
    
    // Por padrão, permitir acesso se autenticado
    return true;
  };
  
  // Obter rota de redirecionamento baseada no tipo de usuário
  const getRedirectRoute = (): string => {
    if (!isAuthenticated) {
      return '/login';
    }
    
    if (isAdmin()) {
      return '/admin';
    }
    
    const userPlan = getUserPlanType();
    
    switch (userPlan) {
      case PlanType.FREE:
        return '/dashboard';
      case PlanType.BASIC:
        return '/dashboard';
      case PlanType.ADVANCED:
        return '/dashboard';
      case PlanType.PRO:
        return '/dashboard';
      case PlanType.LIFETIME:
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };
  
  // Obter rota de upgrade baseada no plano atual
  const getUpgradeRoute = (): string => {
    const userPlan = getUserPlanType();
    
    switch (userPlan) {
      case PlanType.FREE:
        return '/upgrade?plan=basic';
      case PlanType.BASIC:
        return '/upgrade?plan=advanced';
      case PlanType.ADVANCED:
        return '/upgrade?plan=pro';
      case PlanType.PRO:
        return '/upgrade?plan=lifetime';
      case PlanType.LIFETIME:
        return '/dashboard'; // Já tem o plano máximo
      default:
        return '/upgrade?plan=basic';
    }
  };
  
  // Obter mensagem de erro para rota não permitida
  const getAccessDeniedMessage = (route: string): string => {
    if (ROUTE_PERMISSIONS.admin.some(adminRoute => route.startsWith(adminRoute))) {
      return 'Acesso negado. Apenas administradores podem acessar esta página.';
    }
    
    const userPlan = getUserPlanType();
    
    if (ROUTE_PERMISSIONS.basic.includes(route)) {
      return `Esta funcionalidade requer um plano Básico ou superior. Seu plano atual: ${userPlan.toUpperCase()}`;
    }
    
    if (ROUTE_PERMISSIONS.advanced.includes(route)) {
      return `Esta funcionalidade requer um plano Avançado ou superior. Seu plano atual: ${userPlan.toUpperCase()}`;
    }
    
    if (ROUTE_PERMISSIONS.pro.includes(route)) {
      return `Esta funcionalidade requer um plano Pro ou superior. Seu plano atual: ${userPlan.toUpperCase()}`;
    }
    
    return 'Acesso negado. Você não tem permissão para acessar esta página.';
  };
  
  // Obter rotas permitidas para o usuário atual
  const getAllowedRoutes = (): string[] => {
    const routes: string[] = [...ROUTE_PERMISSIONS.public];
    
    if (!isAuthenticated) {
      return routes;
    }
    
    // Adicionar rotas autenticadas
    routes.push(...ROUTE_PERMISSIONS.authenticated);
    
    // Adicionar rotas baseadas no plano
    if (hasPlanLevel(PlanType.BASIC)) {
      routes.push(...ROUTE_PERMISSIONS.basic);
    }
    
    if (hasPlanLevel(PlanType.ADVANCED)) {
      routes.push(...ROUTE_PERMISSIONS.advanced);
    }
    
    if (hasPlanLevel(PlanType.PRO)) {
      routes.push(...ROUTE_PERMISSIONS.pro);
    }
    
    // Adicionar rotas administrativas se for admin
    if (isAdmin()) {
      routes.push(...ROUTE_PERMISSIONS.admin);
    }
    
    return routes;
  };
  
  return {
    // Estados
    isAuthenticated,
    isAdmin: isAdmin(),
    userPlan: getUserPlanType(),
    
    // Funções de verificação
    canAccessRoute,
    hasPlanLevel,
    
    // Funções de redirecionamento
    getRedirectRoute,
    getUpgradeRoute,
    getAccessDeniedMessage,
    getAllowedRoutes,
    
    // Informações do usuário
    user,
  };
};
