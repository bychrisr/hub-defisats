import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackRoute?: string;
}

/**
 * AuthGuard - Componente de proteção de autenticação robusto
 * 
 * Garante que apenas usuários autenticados acessem rotas protegidas.
 * Implementa múltiplas camadas de verificação para evitar problemas de redirecionamento.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallbackRoute = '/login' 
}) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  console.log('🔐 AUTH GUARD - State check:', {
    isAuthenticated,
    isLoading,
    isInitialized,
    fallbackRoute
  });

  // 1. Verificação de inicialização
  if (!isInitialized) {
    console.log('⏳ AUTH GUARD - Not initialized, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // 2. Verificação de carregamento
  if (isLoading) {
    console.log('⏳ AUTH GUARD - Loading, showing loading...');
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
    console.log('❌ AUTH GUARD - Not authenticated, redirecting to:', fallbackRoute);
    return <Navigate to={fallbackRoute} replace />;
  }

  // 4. Usuário autenticado - renderizar conteúdo
  console.log('✅ AUTH GUARD - User authenticated, rendering content');
  return <>{children}</>;
};

/**
 * Hook para verificação rápida de autenticação
 */
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  return {
    isAuthenticated,
    isLoading,
    isInitialized,
    needsRedirect: isInitialized && !isLoading && !isAuthenticated,
    isReady: isInitialized && !isLoading
  };
};
