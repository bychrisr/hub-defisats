import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

interface SecureRouteProps {
  children: React.ReactNode;
  fallbackRoute?: string;
  requireAdmin?: boolean;
}

/**
 * SecureRoute - Componente de proteção de rota com verificação dupla
 * 
 * Implementa múltiplas camadas de verificação:
 * 1. Verificação de inicialização
 * 2. Verificação de carregamento
 * 3. Verificação de autenticação
 * 4. Verificação de admin (opcional)
 * 
 * Garante que nenhum usuário não autenticado possa acessar rotas protegidas.
 */
export const SecureRoute: React.FC<SecureRouteProps> = ({ 
  children, 
  fallbackRoute = '/login',
  requireAdmin = false
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, isInitialized, user } = useAuthStore();

  console.log('🔒 SECURE ROUTE - State check:', {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    isInitialized,
    requireAdmin,
    isAdmin: user?.is_admin
  });

  // 1. Verificação de inicialização
  if (!isInitialized) {
    console.log('⏳ SECURE ROUTE - Not initialized, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Inicializando...</p>
        </div>
      </div>
    );
  }

  // 2. Verificação de carregamento
  if (isLoading) {
    console.log('⏳ SECURE ROUTE - Loading, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // 3. Verificação de autenticação
  if (!isAuthenticated) {
    console.log('❌ SECURE ROUTE - Not authenticated, redirecting to:', fallbackRoute);
    return <Navigate to={fallbackRoute} replace state={{ from: location }} />;
  }

  // 4. Verificação de admin (se necessário)
  if (requireAdmin && !user?.is_admin) {
    console.log('❌ SECURE ROUTE - Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // 5. Todas as verificações passaram
  console.log('✅ SECURE ROUTE - All checks passed, rendering content');
  return <>{children}</>;
};

/**
 * Hook para verificação rápida de segurança de rota
 */
export const useSecureRoute = (requireAdmin = false) => {
  const { isAuthenticated, isLoading, isInitialized, user } = useAuthStore();

  const isSecure = isInitialized && !isLoading && isAuthenticated;
  const isAdminSecure = isSecure && (!requireAdmin || user?.is_admin);

  return {
    isSecure,
    isAdminSecure,
    needsRedirect: isInitialized && !isLoading && !isAuthenticated,
    needsAdminRedirect: isSecure && requireAdmin && !user?.is_admin,
    isReady: isInitialized && !isLoading
  };
};
