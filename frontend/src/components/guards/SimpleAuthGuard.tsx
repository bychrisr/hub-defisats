import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { Loader2 } from 'lucide-react';

interface SimpleAuthGuardProps {
  children: React.ReactNode;
  fallbackRoute?: string;
  requireAdmin?: boolean;
}

/**
 * ✅ SIMPLE AUTH GUARD - Versão Simplificada e Robusta
 * 
 * Esta versão elimina toda a complexidade desnecessária e foca apenas
 * no essencial: verificar se o usuário está autenticado ou não.
 */
export const SimpleAuthGuard: React.FC<SimpleAuthGuardProps> = ({ 
  children, 
  fallbackRoute = '/login',
  requireAdmin = false
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ INICIALIZAÇÃO SIMPLES - Sem loops complexos
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 SIMPLE AUTH GUARD - Initializing...');
        
        // Verificar token no localStorage
        const token = localStorage.getItem('access_token');
        console.log('🔍 SIMPLE AUTH GUARD - Token check:', token ? 'EXISTS' : 'MISSING');
        
        if (!token) {
          console.log('❌ SIMPLE AUTH GUARD - No token, not authenticated');
          setIsInitialized(true);
          return;
        }
        
        // Se há token, verificar se o usuário já está carregado
        if (isAuthenticated && user) {
          console.log('✅ SIMPLE AUTH GUARD - User already authenticated');
          setIsInitialized(true);
          return;
        }
        
        // Se há token mas usuário não carregado, tentar carregar
        console.log('🔄 SIMPLE AUTH GUARD - Token exists, loading user...');
        await useAuthStore.getState().getProfile();
        console.log('✅ SIMPLE AUTH GUARD - User loaded successfully');
        
      } catch (error) {
        console.error('❌ SIMPLE AUTH GUARD - Error during initialization:', error);
        // Limpar tokens inválidos e atualizar estado
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // ✅ CORREÇÃO: Atualizar o estado do store para não autenticado
        useAuthStore.setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          isInitialized: true,
          error: null
        });
      } finally {
        setIsInitialized(true);
      }
    };

    // Timeout de segurança - máximo 5 segundos
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        console.log('⏰ SIMPLE AUTH GUARD - Timeout reached, forcing initialization');
        
        // ✅ CORREÇÃO: Se timeout atingido, verificar token e definir estado apropriado
        const token = localStorage.getItem('access_token');
        if (!token) {
          useAuthStore.setState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            isInitialized: true,
            error: null
          });
        }
        
        setIsInitialized(true);
      }
    }, 5000);

    initializeAuth();

    return () => clearTimeout(timeout);
  }, []); // ✅ Array vazio - executa apenas uma vez

  console.log('🛡️ SIMPLE AUTH GUARD - State:', {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    isInitialized,
    hasUser: !!user,
    requireAdmin,
    isAdmin: user?.is_admin
  });

  // ✅ LÓGICA SIMPLIFICADA DE DECISÃO
  if (!isInitialized) {
    console.log('⏳ SIMPLE AUTH GUARD - Not initialized, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar para login
  if (!isAuthenticated) {
    console.log('❌ SIMPLE AUTH GUARD - Not authenticated, redirecting to login');
    return <Navigate to={fallbackRoute} state={{ from: location }} replace />;
  }

  // Se requer admin mas usuário não é admin
  if (requireAdmin && !user?.is_admin) {
    console.log('❌ SIMPLE AUTH GUARD - Admin required but user is not admin');
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ TUDO OK - Renderizar children
  console.log('✅ SIMPLE AUTH GUARD - Authentication successful, rendering children');
  return <>{children}</>;
};
