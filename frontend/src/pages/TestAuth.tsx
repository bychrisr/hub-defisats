import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth';
import { useAuthGuard } from '@/components/guards/AuthGuard';
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

/**
 * Página de teste para verificar o funcionamento da autenticação
 * Esta página deve ser protegida e redirecionar para login se não autenticado
 */
export default function TestAuth() {
  const { isAuthenticated, isLoading, isInitialized, user } = useAuthStore();
  const authGuard = useAuthGuard();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-vibrant mb-2">Teste de Autenticação</h1>
        <p className="text-muted-foreground">
          Esta página testa o sistema de autenticação e redirecionamento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status da Autenticação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Status da Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Inicializado:</span>
              <Badge variant={isInitialized ? "default" : "secondary"}>
                {isInitialized ? "Sim" : "Não"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Carregando:</span>
              <Badge variant={isLoading ? "default" : "secondary"}>
                {isLoading ? "Sim" : "Não"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Autenticado:</span>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "Sim" : "Não"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* AuthGuard Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              AuthGuard Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Pronto:</span>
              <Badge variant={authGuard.isReady ? "default" : "secondary"}>
                {authGuard.isReady ? "Sim" : "Não"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Precisa Redirecionar:</span>
              <Badge variant={authGuard.needsRedirect ? "destructive" : "default"}>
                {authGuard.needsRedirect ? "Sim" : "Não"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Usuário */}
        {user && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <div className="font-medium">{user.email}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Username:</span>
                  <div className="font-medium">{user.username}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Admin:</span>
                  <Badge variant={user.is_admin ? "default" : "secondary"}>
                    {user.is_admin ? "Sim" : "Não"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Instruções de Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Para testar o redirecionamento:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Faça logout da aplicação</li>
                <li>Tente acessar esta página diretamente pela URL</li>
                <li>Você deve ser redirecionado para /login</li>
                <li>Faça login novamente</li>
                <li>Você deve ser redirecionado de volta para esta página</li>
              </ol>
              
              <p className="mt-4"><strong>URL de teste:</strong> <code>/test-auth</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
