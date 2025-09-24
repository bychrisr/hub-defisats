import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDocumentation, useDocumentationWebSocket } from '@/hooks/useDocumentation';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Database,
  FileText,
  Wifi,
  WifiOff
} from 'lucide-react';

export function DocumentationTest() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  const { 
    isLoading, 
    error, 
    searchDocs, 
    getDocContent, 
    getCategories, 
    getStats, 
    getIndex 
  } = useDocumentation();
  
  const { stats: wsStats, isConnected, error: wsError } = useDocumentationWebSocket();

  const runTests = async () => {
    setIsRunningTests(true);
    const results: Record<string, boolean> = {};

    try {
      // Teste 1: Buscar documentos
      console.log('🧪 Testando busca de documentos...');
      const searchResult = await searchDocs({ limit: 5 });
      results.search = searchResult !== null && searchResult.files.length > 0;
      console.log('✅ Busca:', results.search);

      // Teste 2: Obter categorias
      console.log('🧪 Testando categorias...');
      const categories = await getCategories();
      results.categories = categories !== null && categories.length > 0;
      console.log('✅ Categorias:', results.categories);

      // Teste 3: Obter estatísticas
      console.log('🧪 Testando estatísticas...');
      const stats = await getStats();
      results.stats = stats !== null && stats.totalFiles > 0;
      console.log('✅ Estatísticas:', results.stats);

      // Teste 4: Obter índice
      console.log('🧪 Testando índice...');
      const index = await getIndex();
      results.index = index !== null && index.categories.length > 0;
      console.log('✅ Índice:', results.index);

      // Teste 5: Carregar conteúdo de um documento
      if (searchResult && searchResult.files.length > 0) {
        console.log('🧪 Testando carregamento de conteúdo...');
        const content = await getDocContent(searchResult.files[0].path);
        results.content = content !== null && content.content.length > 0;
        console.log('✅ Conteúdo:', results.content);
      } else {
        results.content = false;
      }

      // Teste 6: WebSocket
      console.log('🧪 Testando WebSocket...');
      results.websocket = isConnected && wsStats !== null;
      console.log('✅ WebSocket:', results.websocket);

    } catch (err) {
      console.error('❌ Erro durante os testes:', err);
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const getTestIcon = (testName: string) => {
    const passed = testResults[testName];
    return passed ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getTestStatus = (testName: string) => {
    const passed = testResults[testName];
    return passed ? 'success' : 'destructive';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Teste de Integração - Documentação</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={runTests} 
              disabled={isRunningTests}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunningTests ? 'animate-spin' : ''}`} />
              <span>{isRunningTests ? 'Executando Testes...' : 'Executar Testes'}</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                WebSocket: {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Erro:</strong> {error}
              </p>
            </div>
          )}

          {wsError && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Erro WebSocket:</strong> {wsError}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getTestIcon('search')}
              <div>
                <p className="font-medium">Busca de Documentos</p>
                <Badge variant={getTestStatus('search')}>
                  {testResults.search ? '✅ Passou' : '❌ Falhou'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getTestIcon('categories')}
              <div>
                <p className="font-medium">Categorias</p>
                <Badge variant={getTestStatus('categories')}>
                  {testResults.categories ? '✅ Passou' : '❌ Falhou'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getTestIcon('stats')}
              <div>
                <p className="font-medium">Estatísticas</p>
                <Badge variant={getTestStatus('stats')}>
                  {testResults.stats ? '✅ Passou' : '❌ Falhou'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getTestIcon('index')}
              <div>
                <p className="font-medium">Índice Completo</p>
                <Badge variant={getTestStatus('index')}>
                  {testResults.index ? '✅ Passou' : '❌ Falhou'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getTestIcon('content')}
              <div>
                <p className="font-medium">Carregamento de Conteúdo</p>
                <Badge variant={getTestStatus('content')}>
                  {testResults.content ? '✅ Passou' : '❌ Falhou'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getTestIcon('websocket')}
              <div>
                <p className="font-medium">WebSocket</p>
                <Badge variant={getTestStatus('websocket')}>
                  {testResults.websocket ? '✅ Passou' : '❌ Falhou'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas em Tempo Real */}
      {wsStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Estatísticas em Tempo Real</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{wsStats.totalFiles}</p>
                <p className="text-sm text-muted-foreground">Arquivos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{wsStats.totalCategories}</p>
                <p className="text-sm text-muted-foreground">Categorias</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {(wsStats.totalSize / 1024).toFixed(1)} KB
                </p>
                <p className="text-sm text-muted-foreground">Tamanho</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{wsStats.totalLines}</p>
                <p className="text-sm text-muted-foreground">Linhas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Testes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Status Geral:</strong>{' '}
              {Object.values(testResults).every(Boolean) ? (
                <span className="text-green-600">✅ Todos os testes passaram</span>
              ) : (
                <span className="text-red-600">❌ Alguns testes falharam</span>
              )}
            </p>
            <p className="text-sm">
              <strong>Testes Executados:</strong> {Object.keys(testResults).length}
            </p>
            <p className="text-sm">
              <strong>Testes Aprovados:</strong> {Object.values(testResults).filter(Boolean).length}
            </p>
            <p className="text-sm">
              <strong>WebSocket:</strong> {isConnected ? '✅ Conectado' : '❌ Desconectado'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
