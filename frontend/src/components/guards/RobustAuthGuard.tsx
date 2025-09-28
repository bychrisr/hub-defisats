import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

interface RobustAuthGuardProps {
  children: React.ReactNode;
  fallbackRoute?: string;
  requireAdmin?: boolean;
}

/**
 * RobustAuthGuard - Guard robusto que garante inicialização completa
 * 
 * Este componente resolve o problema de inicialização de autenticação
 * garantindo que o estado seja sempre finalizado corretamente.
 */
export const RobustAuthGuard: React.FC<RobustAuthGuardProps> = ({ 
  children, 
  fallbackRoute = '/login',
  requireAdmin = false
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, isInitialized, user } = useAuthStore();
  const [forceInitialized, setForceInitialized] = useState(false);

  useEffect(() => {
    // ✅ TIMEOUT DE SEGURANÇA: Se não inicializou em 5 segundos, forçar
    const timeout = setTimeout(() => {
      if (!isInitialized && !forceInitialized) {
        console.log('⏰ ROBUST AUTH GUARD - Timeout atingido, forçando inicialização...');
        
        // Verificar localStorage diretamente
        const token = localStorage.getItem('access_token');
        console.log('🔍 ROBUST AUTH GUARD - Token check:', token ? 'EXISTS' : 'MISSING');
        
        if (!token) {
          console.log('🔧 ROBUST AUTH GUARD - Sem token, definindo estado não autenticado');
          useAuthStore.getState().set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            isInitialized: true,
            error: null
          });
        } else {
          console.log('🔧 ROBUST AUTH GUARD - Com token, definindo estado autenticado');
          useAuthStore.getState().set({
            isLoading: false,
            isInitialized: true,
            error: null
          });
        }
        
        setForceInitialized(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isInitialized, forceInitialized]);

  // ✅ VERIFICAÇÃO ADICIONAL: Se persistir sem inicializar, verificar localStorage
  useEffect(() => {
    if (!isInitialized && !isLoading && !forceInitialized) {
      const token = localStorage.getItem('access_token');
      console.log('🔍 ROBUST AUTH GUARD - Verificação adicional:', {
        isInitialized,
        isLoading,
        hasToken: !!token,
        forceInitialized
      });

      if (!token) {
        console.log('🔧 ROBUST AUTH GUARD - Sem token, forçando estado não autenticado');
        useAuthStore.getState().set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          isInitialized: true,
          error: null
        });
        setForceInitialized(true);
      }
    }
  }, [isInitialized, isLoading, forceInitialized]);

  console.log('🛡️ ROBUST AUTH GUARD - State check:', {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    isInitialized,
    forceInitialized,
    requireAdmin,
    isAdmin: user?.is_admin
  });

  // Se não foi inicializado ainda, mostrar loading
  if (!isInitialized && !forceInitialized) {
    console.log('⏳ ROBUST AUTH GUARD - Not initialized, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Inicializando aplicação...</p>
        </div>
      </div>
    );
  }

  // Se está carregando, mostrar loading
  if (isLoading) {
    console.log('⏳ ROBUST AUTH GUARD - Loading, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar
  if (!isAuthenticated) {
    console.log('❌ ROBUST AUTH GUARD - Not authenticated, redirecting to:', fallbackRoute);
    return <Navigate to={fallbackRoute} replace state={{ from: location }} />;
  }

  // Se não é admin (quando necessário), redirecionar
  if (requireAdmin && !user?.is_admin) {
    console.log('❌ ROBUST AUTH GUARD - Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Usuário autenticado - renderizar conteúdo
  console.log('✅ ROBUST AUTH GUARD - All checks passed, rendering content');
  return <>{children}</>;
};
