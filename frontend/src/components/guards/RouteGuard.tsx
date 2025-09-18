import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { LoadingGuard } from './LoadingGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ArrowRight, 
  Crown, 
  Lock,
  AlertTriangle
} from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPlan?: 'basic' | 'advanced' | 'pro' | 'lifetime';
  requireAdmin?: boolean;
  fallbackRoute?: string;
  showUpgradePrompt?: boolean;
  isLoading?: boolean;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredPlan,
  requireAdmin = false,
  fallbackRoute,
  showUpgradePrompt = true,
  isLoading = false,
}) => {
  const location = useLocation();
  const {
    isAuthenticated,
    isAdmin,
    userPlan,
    canAccessRoute,
    getRedirectRoute,
    getUpgradeRoute,
    getAccessDeniedMessage,
    hasPlanLevel,
  } = useUserPermissions();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <LoadingGuard 
        isLoading={true}
        isAuthenticated={isAuthenticated}
        message="Verificando permissões de acesso..."
      >
        {children}
      </LoadingGuard>
    );
  }

  // Se não está autenticado, mostrar tela de acesso negado com loading
  if (!isAuthenticated) {
    return (
      <LoadingGuard 
        isLoading={false}
        isAuthenticated={false}
        message="Acesso negado"
      >
        {children}
      </LoadingGuard>
    );
  }

  // Verificar se é admin quando necessário
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar se pode acessar a rota
  if (!canAccessRoute(location.pathname)) {
    // Se tem rota de fallback específica, usar ela
    if (fallbackRoute) {
      return <Navigate to={fallbackRoute} replace />;
    }

    // Se não deve mostrar prompt de upgrade, redirecionar
    if (!showUpgradePrompt) {
      return <Navigate to={getRedirectRoute()} replace />;
    }

    // Mostrar tela de acesso negado com opção de upgrade
    return <AccessDeniedScreen 
      route={location.pathname}
      requiredPlan={requiredPlan}
      currentPlan={userPlan}
      upgradeRoute={getUpgradeRoute()}
      message={getAccessDeniedMessage(location.pathname)}
    />;
  }

  // Verificar plano específico se necessário
  if (requiredPlan) {
    const planHierarchy = {
      'basic': 1,
      'advanced': 2,
      'pro': 3,
      'lifetime': 4,
    };

    const currentPlanLevel = {
      'free': 0,
      'basic': 1,
      'advanced': 2,
      'pro': 3,
      'lifetime': 4,
    }[userPlan] || 0;

    const requiredPlanLevel = planHierarchy[requiredPlan];

    if (currentPlanLevel < requiredPlanLevel) {
      if (!showUpgradePrompt) {
        return <Navigate to={getRedirectRoute()} replace />;
      }

      return <AccessDeniedScreen 
        route={location.pathname}
        requiredPlan={requiredPlan}
        currentPlan={userPlan}
        upgradeRoute={getUpgradeRoute()}
        message={getAccessDeniedMessage(location.pathname)}
      />;
    }
  }

  // Se passou em todas as verificações, renderizar o conteúdo
  return <>{children}</>;
};

// Componente de tela de acesso negado
const AccessDeniedScreen: React.FC<{
  route: string;
  requiredPlan?: string;
  currentPlan: string;
  upgradeRoute: string;
  message: string;
}> = ({ route, requiredPlan, currentPlan, upgradeRoute, message }) => {
  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return <Lock className="h-5 w-5" />;
      case 'basic': return <Shield className="h-5 w-5" />;
      case 'advanced': return <Crown className="h-5 w-5" />;
      case 'pro': return <Crown className="h-5 w-5" />;
      case 'lifetime': return <Crown className="h-5 w-5" />;
      default: return <Lock className="h-5 w-5" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'pro': return 'bg-gold-100 text-gold-800';
      case 'lifetime': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rota solicitada:</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {route}
              </code>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Seu plano atual:</span>
              <Badge className={getPlanColor(currentPlan)}>
                {getPlanIcon(currentPlan)}
                <span className="ml-1">{currentPlan.toUpperCase()}</span>
              </Badge>
            </div>

            {requiredPlan && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plano necessário:</span>
                <Badge className={getPlanColor(requiredPlan)}>
                  {getPlanIcon(requiredPlan)}
                  <span className="ml-1">{requiredPlan.toUpperCase()}</span>
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => window.location.href = upgradeRoute}
              className="w-full"
            >
              <Crown className="h-4 w-4 mr-2" />
              Fazer Upgrade
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook para usar o RouteGuard de forma mais simples
export const useRouteGuard = (requiredPlan?: 'basic' | 'advanced' | 'pro' | 'lifetime', requireAdmin?: boolean) => {
  const { canAccessRoute, getRedirectRoute, hasPlanLevel, isAdmin } = useUserPermissions();

  const checkAccess = (route: string) => {
    if (!canAccessRoute(route)) {
      return { allowed: false, redirectTo: getRedirectRoute() };
    }

    if (requireAdmin && !isAdmin) {
      return { allowed: false, redirectTo: '/dashboard' };
    }

    if (requiredPlan && !hasPlanLevel(requiredPlan as any)) {
      return { allowed: false, redirectTo: getRedirectRoute() };
    }

    return { allowed: true, redirectTo: null };
  };

  return { checkAccess };
};
