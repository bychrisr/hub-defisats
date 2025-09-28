import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

interface ProtectedRouteWrapperProps {
  children: React.ReactNode;
  fallbackRoute?: string;
  requireAdmin?: boolean;
}

/**
 * ProtectedRouteWrapper - Wrapper de rota protegida com verificação imediata
 * 
 * Este componente executa a verificação de autenticação no nível mais alto
 * possível, antes de qualquer renderização de conteúdo.
 */
export const ProtectedRouteWrapper: React.FC<ProtectedRouteWrapperProps> = ({ 
  children, 
  fallbackRoute = '/login',
  requireAdmin = false
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, isInitialized, user } = useAuthStore();

  console.log('🔒 PROTECTED ROUTE WRAPPER - State check:', {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    isInitialized,
    requireAdmin,
    isAdmin: user?.is_admin
  });

  // Verificação de inicialização
  if (!isInitialized) {
    console.log('⏳ PROTECTED ROUTE WRAPPER - Not initialized, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Inicializando aplicação...</p>
        </div>
      </div>
    );
  }

  // Verificação de carregamento
  if (isLoading) {
    console.log('⏳ PROTECTED ROUTE WRAPPER - Loading, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Verificação de autenticação
  if (!isAuthenticated) {
    console.log('❌ PROTECTED ROUTE WRAPPER - Not authenticated, redirecting to:', fallbackRoute);
    return <Navigate to={fallbackRoute} replace state={{ from: location }} />;
  }

  // Verificação de admin (se necessário)
  if (requireAdmin && !user?.is_admin) {
    console.log('❌ PROTECTED ROUTE WRAPPER - Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Todas as verificações passaram
  console.log('✅ PROTECTED ROUTE WRAPPER - All checks passed, rendering content');
  return <>{children}</>;
};

/**
 * Hook para verificação de rota protegida
 */
export const useProtectedRoute = (requireAdmin = false) => {
  const { isAuthenticated, isLoading, isInitialized, user } = useAuthStore();

  return {
    isAuthenticated,
    isLoading,
    isInitialized,
    isAdmin: user?.is_admin,
    needsRedirect: isInitialized && !isLoading && !isAuthenticated,
    needsAdminRedirect: isAuthenticated && requireAdmin && !user?.is_admin,
    isReady: isInitialized && !isLoading
  };
};
