import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { 
  BarChart3, 
  Download, 
  RefreshCw, 
  Info,
  TrendingUp,
  Clock,
  Database
} from 'lucide-react';

export const HistoricalDataTest: React.FC = () => {
  const [currentTimeframe, setCurrentTimeframe] = useState('1h');
  const [testResults, setTestResults] = useState<string[]>([]);

  const {
    candleData,
    isLoading,
    isLoadingMore,
    error,
    hasMoreData,
    loadMoreHistorical,
    resetData,
    getDataRange,
    isDataAvailable
  } = useHistoricalData({
    symbol: 'BTCUSDT',
    timeframe: currentTimeframe,
    initialLimit: 168, // 7 dias para 1h
    enabled: true,
    maxDataPoints: 10000,
    loadThreshold: currentTimeframe === '1h' ? 50 : 20
  });

  const dataRange = getDataRange();
  const dataCount = candleData?.length || 0;

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const testLoadMore = async () => {
    addTestResult(`🔄 Testando carregamento de mais dados...`);
    addTestResult(`📊 Estado atual: ${dataCount} candles, hasMoreData: ${hasMoreData}`);
    
    try {
      await loadMoreHistorical();
      addTestResult(`✅ Carregamento iniciado com sucesso`);
    } catch (err: any) {
      addTestResult(`❌ Erro no carregamento: ${err.message}`);
    }
  };

  const testDataRange = () => {
    if (dataRange) {
      addTestResult(`📅 Range de dados: ${new Date(dataRange.start * 1000).toLocaleString()} - ${new Date(dataRange.end * 1000).toLocaleString()}`);
    } else {
      addTestResult(`❌ Nenhum range de dados disponível`);
    }
  };

  const testDataAvailability = () => {
    if (dataRange) {
      const testTime = dataRange.start - 3600; // 1 hora antes do início
      const isAvailable = isDataAvailable(testTime);
      addTestResult(`🔍 Dados disponíveis para ${new Date(testTime * 1000).toLocaleString()}: ${isAvailable ? 'Sim' : 'Não'}`);
    }
  };

  const timeframes = [
    { value: '1h', label: '1h' },
    { value: '30m', label: '30m' },
    { value: '15m', label: '15m' },
    { value: '5m', label: '5m' }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Teste de Dados Históricos - {currentTimeframe}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Timeframes */}
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={currentTimeframe === tf.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCurrentTimeframe(tf.value);
                    addTestResult(`🔄 Timeframe alterado para: ${tf.value}`);
                  }}
                >
                  {tf.label}
                </Button>
              ))}
            </div>

            {/* Status */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={isLoading ? "default" : "secondary"}>
                <Database className="h-3 w-3 mr-1" />
                {isLoading ? 'Carregando...' : `${dataCount} candles`}
              </Badge>
              
              <Badge variant={hasMoreData ? "default" : "outline"}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {hasMoreData ? 'Mais dados disponíveis' : 'Todos os dados carregados'}
              </Badge>
              
              {error && (
                <Badge variant="destructive">
                  Erro: {error}
                </Badge>
              )}
            </div>

            {/* Controles de Teste */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testLoadMore}
                disabled={!hasMoreData || isLoadingMore}
              >
                <Download className="h-4 w-4 mr-1" />
                {isLoadingMore ? 'Carregando...' : 'Testar Carregamento'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={testDataRange}
              >
                <Clock className="h-4 w-4 mr-1" />
                Testar Range
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={testDataAvailability}
              >
                <Info className="h-4 w-4 mr-1" />
                Testar Disponibilidade
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetData}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>

            {/* Log de Testes */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Log de Testes:</h4>
              <div className="bg-muted p-3 rounded-lg text-sm max-h-40 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum teste executado ainda...</p>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="mb-1 font-mono text-xs">
                      {result}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Informações de Debug */}
            {dataRange && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <h4 className="font-semibold mb-2">Informações de Debug:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <strong>Range de Dados:</strong><br />
                    Início: {new Date(dataRange.start * 1000).toLocaleString()}<br />
                    Fim: {new Date(dataRange.end * 1000).toLocaleString()}
                  </div>
                  <div>
                    <strong>Configuração:</strong><br />
                    Timeframe: {currentTimeframe}<br />
                    Threshold: {currentTimeframe === '1h' ? '50' : '20'} candles<br />
                    Max Data Points: 10,000
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
