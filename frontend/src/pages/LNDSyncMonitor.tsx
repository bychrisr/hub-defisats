import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';

interface SyncProgress {
  currentBlock: number;
  currentTestnetBlock: number;
  percentage: number;
  syncedToChain: boolean;
  syncedToGraph: boolean;
  numPeers: number;
  version: string;
  alias: string;
  color: string;
  timestamp: string;
}

export default function LNDSyncMonitor() {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/lnd-sync-simple/sync-progress');
      const data = await response.json();
      
      if (data.success) {
        setProgress(data.data);
        setLastUpdate(new Date());
      } else {
        setError(data.error || 'Failed to fetch sync progress');
      }
    } catch (err) {
      setError('Network error: Could not connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchProgress, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(2);
  };

  const getStatusColor = () => {
    if (!progress) return 'bg-gray-500';
    if (progress.syncedToChain) return 'bg-green-500';
    if (progress.percentage > 90) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (!progress) return 'Desconhecido';
    if (progress.syncedToChain) return 'Sincronizado';
    if (progress.percentage > 90) return 'Quase Pronto';
    return 'Sincronizando';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">⚡ LND Sync Monitor</h1>
        <p className="text-gray-600">
          Acompanhe em tempo real o progresso da sincronização do LND com a rede Bitcoin testnet
        </p>
      </div>

      {/* Control Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Controles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Button
              onClick={fetchProgress}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar Agora
            </Button>
            
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
            >
              {autoRefresh ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>

            {lastUpdate && (
              <span className="text-sm text-gray-500">
                Última atualização: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600 flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {progress && (
        <>
          {/* Main Progress Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: progress.color }}
                />
                {progress.alias}
                <Badge className={getStatusColor()}>
                  {getStatusText()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso da Sincronização</span>
                    <span>{formatPercentage(progress.percentage)}%</span>
                  </div>
                  <Progress value={progress.percentage} className="h-3" />
                </div>

                {/* Block Numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 mb-1">Bloco Atual (LND)</div>
                    <div className="text-2xl font-bold text-blue-800">
                      {formatNumber(progress.currentBlock)}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 mb-1">Bloco Atual (Testnet)</div>
                    <div className="text-2xl font-bold text-green-800">
                      {formatNumber(progress.currentTestnetBlock)}
                    </div>
                  </div>
                </div>

                {/* Blocks Remaining */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-yellow-600 mb-1">Blocos Restantes</div>
                  <div className="text-xl font-bold text-yellow-800">
                    {formatNumber(progress.currentTestnetBlock - progress.currentBlock)} blocos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sync Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Status da Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Sincronizado com Chain:</span>
                    <Badge variant={progress.syncedToChain ? "default" : "secondary"}>
                      {progress.syncedToChain ? "Sim" : "Não"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sincronizado com Graph:</span>
                    <Badge variant={progress.syncedToGraph ? "default" : "secondary"}>
                      {progress.syncedToGraph ? "Sim" : "Não"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Número de Peers:</span>
                    <Badge variant={progress.numPeers > 0 ? "default" : "secondary"}>
                      {progress.numPeers} peers
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Node Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Informações do Nó
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Versão:</span>
                    <Badge variant="outline">{progress.version}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Alias:</span>
                    <Badge variant="outline">{progress.alias}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cor:</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border" 
                        style={{ backgroundColor: progress.color }}
                      />
                      <Badge variant="outline">{progress.color}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Explanation */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>📚 Como Funciona a Sincronização?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>O que está acontecendo:</strong> O LND está "lendo" todos os blocos da blockchain Bitcoin testnet 
                  para entender quem tem quanto dinheiro e quais transações são válidas.
                </p>
                <p>
                  <strong>Por que demora:</strong> A testnet tem milhões de blocos! É como ler um livro gigante página por página.
                </p>
                <p>
                  <strong>Quando terminar:</strong> O LND poderá criar invoices, receber pagamentos e fazer tudo que precisamos 
                  para o nosso sistema de faucet interno funcionar.
                </p>
                <p>
                  <strong>Depois da sincronização:</strong> O LND só precisará "ler as páginas novas" que saem a cada 10 minutos, 
                  ficando muito mais rápido!
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
