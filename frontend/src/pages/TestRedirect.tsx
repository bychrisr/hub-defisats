import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

/**
 * Página de teste para verificar redirecionamento de autenticação
 * Esta página deve redirecionar para login se não autenticado
 */
export default function TestRedirect() {
  const { isAuthenticated, isLoading, isInitialized, user, logout } = useAuthStore();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'warning';
    message: string;
  }>>([]);

  const runTests = () => {
    const results = [];

    // Teste 1: Verificação de inicialização
    if (isInitialized) {
      results.push({
        test: 'Inicialização',
        status: 'success' as const,
        message: 'Aplicação inicializada corretamente'
      });
    } else {
      results.push({
        test: 'Inicialização',
        status: 'error' as const,
        message: 'Aplicação não foi inicializada'
      });
    }

    // Teste 2: Verificação de carregamento
    if (!isLoading) {
      results.push({
        test: 'Estado de Carregamento',
        status: 'success' as const,
        message: 'Não está em estado de carregamento'
      });
    } else {
      results.push({
        test: 'Estado de Carregamento',
        status: 'warning' as const,
        message: 'Ainda está carregando'
      });
    }

    // Teste 3: Verificação de autenticação
    if (isAuthenticated) {
      results.push({
        test: 'Autenticação',
        status: 'success' as const,
        message: 'Usuário está autenticado'
      });
    } else {
      results.push({
        test: 'Autenticação',
        status: 'error' as const,
        message: 'Usuário NÃO está autenticado - deveria ter redirecionado!'
      });
    }

    // Teste 4: Verificação de dados do usuário
    if (user) {
      results.push({
        test: 'Dados do Usuário',
        status: 'success' as const,
        message: `Usuário: ${user.email}`
      });
    } else {
      results.push({
        test: 'Dados do Usuário',
        status: 'error' as const,
        message: 'Dados do usuário não disponíveis'
      });
    }

    setTestResults(results);
  };

  useEffect(() => {
    runTests();
  }, [isAuthenticated, isLoading, isInitialized, user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-vibrant mb-2">Teste de Redirecionamento</h1>
        <p className="text-muted-foreground">
          Esta página testa se o redirecionamento de autenticação está funcionando
        </p>
      </div>

      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="w-5 h-5 mr-2" />
            Status Atual da Aplicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Resultados dos Testes
            </span>
            <Button onClick={runTests} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Executar Novamente
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.test}</span>
                </div>
                <Badge className={getStatusColor(result.status)}>
                  {result.message}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Testar o Redirecionamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Teste Manual:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Clique no botão "Fazer Logout" abaixo</li>
                <li>Após o logout, tente acessar esta página novamente</li>
                <li>Você deve ser redirecionado para /login</li>
                <li>Faça login novamente</li>
                <li>Você deve ser redirecionado de volta para esta página</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Teste de URL Direta:</h4>
              <p className="text-sm text-muted-foreground">
                Abra uma nova aba e cole esta URL: <code className="bg-gray-100 px-2 py-1 rounded">/test-redirect</code>
              </p>
            </div>

            {isAuthenticated && (
              <div className="pt-4 border-t">
                <Button onClick={logout} variant="destructive">
                  Fazer Logout para Testar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
