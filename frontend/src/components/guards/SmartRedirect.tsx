import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface SmartRedirectProps {
  children: React.ReactNode;
}

export const SmartRedirect: React.FC<SmartRedirectProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, getRedirectRoute, canAccessRoute } = useUserPermissions();

  // Se não está autenticado, permitir acesso (será redirecionado pelo ProtectedRoute)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Se está na rota raiz e autenticado, redirecionar para a página apropriada
  if (location.pathname === '/') {
    return <Navigate to={getRedirectRoute()} replace />;
  }

  // Se está tentando acessar uma rota que não tem permissão, redirecionar
  if (!canAccessRoute(location.pathname)) {
    return <Navigate to={getRedirectRoute()} replace />;
  }

  // Se está tentando acessar /admin mas não é admin, redirecionar
  if (location.pathname.startsWith('/admin') && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se tudo está ok, renderizar o conteúdo
  return <>{children}</>;
};
