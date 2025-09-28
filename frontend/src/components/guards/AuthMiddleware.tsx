import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

interface AuthMiddlewareProps {
  children: React.ReactNode;
  fallbackRoute?: string;
}

/**
 * AuthMiddleware - Middleware de autenticação que executa antes da renderização
 * 
 * Este componente garante que a verificação de autenticação seja feita
 * antes de qualquer renderização de conteúdo protegido.
 */
export const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({ 
  children, 
  fallbackRoute = '/login' 
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, isInitialized, getProfile } = useAuthStore();

  console.log('🛡️ AUTH MIDDLEWARE - State check:', {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    isInitialized
  });

  // Efeito para garantir que o perfil seja carregado se necessário
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (token && !isInitialized && !isLoading) {
      console.log('🔄 AUTH MIDDLEWARE - Token found but not initialized, calling getProfile...');
      getProfile().catch((error) => {
        console.log('❌ AUTH MIDDLEWARE - getProfile failed:', error.message);
      });
    }
  }, [isInitialized, isLoading, getProfile]);

  // Se não foi inicializado ainda, mostrar loading
  if (!isInitialized) {
    console.log('⏳ AUTH MIDDLEWARE - Not initialized, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se está carregando, mostrar loading
  if (isLoading) {
    console.log('⏳ AUTH MIDDLEWARE - Loading, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar imediatamente
  if (!isAuthenticated) {
    console.log('❌ AUTH MIDDLEWARE - Not authenticated, redirecting to:', fallbackRoute);
    return <Navigate to={fallbackRoute} replace state={{ from: location }} />;
  }

  // Usuário autenticado - renderizar conteúdo
  console.log('✅ AUTH MIDDLEWARE - User authenticated, rendering content');
  return <>{children}</>;
};

/**
 * Hook para verificação rápida de autenticação
 */
export const useAuthMiddleware = () => {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  return {
    isAuthenticated,
    isLoading,
    isInitialized,
    needsRedirect: isInitialized && !isLoading && !isAuthenticated,
    isReady: isInitialized && !isLoading
  };
};
