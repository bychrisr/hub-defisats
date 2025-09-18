import React from 'react';
import { Loader2, Shield, AlertCircle } from 'lucide-react';

interface LoadingGuardProps {
  isLoading: boolean;
  isAuthenticated: boolean;
  children: React.ReactNode;
  message?: string;
  showIcon?: boolean;
}

export const LoadingGuard: React.FC<LoadingGuardProps> = ({
  isLoading,
  isAuthenticated,
  children,
  message = 'Verificando autenticação...',
  showIcon = true
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-lg border bg-card">
          {showIcon && (
            <div className="relative">
              <Shield className="h-12 w-12 text-primary animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
          )}
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {message}
            </h3>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto verificamos suas credenciais...
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Conectando ao servidor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-lg border bg-card">
          <AlertCircle className="h-12 w-12 text-destructive" />
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Acesso Negado
            </h3>
            <p className="text-sm text-muted-foreground">
              Você precisa estar logado para acessar esta página.
            </p>
          </div>
          
          <div className="flex space-x-2">
            <a
              href="/login"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Fazer Login
            </a>
            <a
              href="/"
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Voltar ao Início
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
