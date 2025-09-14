import React from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Crown, 
  Lock, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  User,
  Settings
} from 'lucide-react';

const TestPermissions: React.FC = () => {
  const {
    isAuthenticated,
    isAdmin,
    userPlan,
    canAccessRoute,
    hasPlanLevel,
    getRedirectRoute,
    getUpgradeRoute,
    getAllowedRoutes,
    user,
  } = useUserPermissions();

  const testRoutes = [
    { path: '/dashboard', name: 'Dashboard', requiredPlan: 'free' },
    { path: '/automation', name: 'Automation', requiredPlan: 'basic' },
    { path: '/positions', name: 'Positions', requiredPlan: 'basic' },
    { path: '/reports', name: 'Reports', requiredPlan: 'basic' },
    { path: '/margin-guard', name: 'Margin Guard', requiredPlan: 'advanced' },
    { path: '/trading', name: 'Trading', requiredPlan: 'advanced' },
    { path: '/logs', name: 'Logs', requiredPlan: 'advanced' },
    { path: '/admin', name: 'Admin Panel', requiredPlan: 'admin' },
  ];

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return <Lock className="h-4 w-4" />;
      case 'basic': return <Shield className="h-4 w-4" />;
      case 'advanced': return <Crown className="h-4 w-4" />;
      case 'pro': return <Crown className="h-4 w-4" />;
      case 'lifetime': return <Crown className="h-4 w-4" />;
      default: return <Lock className="h-4 w-4" />;
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Login Necessário</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Você precisa estar logado para testar as permissões.
            </p>
            <Button className="w-full" onClick={() => window.location.href = '/login'}>
              <User className="h-4 w-4 mr-2" />
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Teste de Permissões do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Usuário:</span>
                <span className="text-muted-foreground">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getPlanColor(userPlan)}>
                  {getPlanIcon(userPlan)}
                  <span className="ml-1">{userPlan.toUpperCase()}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Badge className="bg-red-100 text-red-800">
                    <Crown className="h-4 w-4 mr-1" />
                    ADMIN
                  </Badge>
                ) : (
                  <Badge variant="outline">Usuário</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Routes */}
        <Card>
          <CardHeader>
            <CardTitle>Teste de Acesso às Rotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testRoutes.map((route) => {
                const canAccess = canAccessRoute(route.path);
                const hasRequiredPlan = route.requiredPlan === 'admin' 
                  ? isAdmin 
                  : hasPlanLevel(route.requiredPlan as any);

                return (
                  <div
                    key={route.path}
                    className={`p-4 border rounded-lg ${
                      canAccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{route.name}</h3>
                      {canAccess ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Rota:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {route.path}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Plano necessário:</span>
                        <Badge className={getPlanColor(route.requiredPlan)}>
                          {getPlanIcon(route.requiredPlan)}
                          <span className="ml-1">{route.requiredPlan.toUpperCase()}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={canAccess ? 'text-green-600' : 'text-red-600'}>
                          {canAccess ? 'Acesso Permitido' : 'Acesso Negado'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Allowed Routes */}
        <Card>
          <CardHeader>
            <CardTitle>Rotas Permitidas para Seu Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {getAllowedRoutes().map((route) => (
                <Badge key={route} variant="outline" className="justify-center">
                  {route}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => window.location.href = getRedirectRoute()}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir para Página Principal
              </Button>
              <Button variant="outline" onClick={() => window.location.href = getUpgradeRoute()}>
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                <Settings className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPermissions;
