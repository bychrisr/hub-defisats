import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LightweightLiquidationChart from './LightweightLiquidationChart';
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

interface InfiniteHistoricalDataDemoProps {
  symbol?: string;
  height?: number;
}

export const InfiniteHistoricalDataDemo: React.FC<InfiniteHistoricalDataDemoProps> = ({
  symbol = 'BTCUSDT',
  height = 400
}) => {
  const [currentTimeframe, setCurrentTimeframe] = useState('1h');
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const {
    candleData,
    isLoading,
    isLoadingMore,
    error,
    hasMoreData,
    loadMoreHistorical,
    resetData,
    loadDataForRange,
    getDataRange,
    isDataAvailable,
    loadInitialData
  } = useHistoricalData({
    symbol,
    timeframe: currentTimeframe,
    initialLimit: 168, // 7 dias para 1h
    enabled: true,
    maxDataPoints: 10000,
    loadThreshold: 20
  });

  const dataRange = getDataRange();
  const dataCount = candleData?.length || 0;

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' }
  ];

  const handleTimeframeChange = (newTimeframe: string) => {
    setCurrentTimeframe(newTimeframe);
  };

  const handleLoadSpecificRange = () => {
    if (!dataRange) return;
    
    // Carregar dados de 30 dias atrás
    const thirtyDaysAgo = dataRange.start - (30 * 24 * 60 * 60);
    const twentyDaysAgo = dataRange.start - (20 * 24 * 60 * 60);
    
    loadDataForRange(thirtyDaysAgo, twentyDaysAgo);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dados Históricos Infinitos - {symbol}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* Timeframes */}
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={currentTimeframe === tf.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeframeChange(tf.value)}
                >
                  {tf.label}
                </Button>
              ))}
            </div>

            {/* Controles */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMoreHistorical}
                disabled={!hasMoreData || isLoadingMore}
              >
                <Download className="h-4 w-4 mr-1" />
                {isLoadingMore ? 'Carregando...' : 'Mais Dados'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔄 FORCE LOAD - Forçando carregamento de dados históricos...');
                  loadMoreHistorical();
                }}
                disabled={isLoadingMore}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Forçar Carregamento
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSpecificRange}
                disabled={!dataRange}
              >
                <Clock className="h-4 w-4 mr-1" />
                30 Dias Atrás
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetData}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                <Info className="h-4 w-4 mr-1" />
                Debug
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 flex flex-wrap gap-2">
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

          {/* Debug Info */}
          {showDebugInfo && dataRange && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Informações de Debug:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Range de Dados:</strong><br />
                  Início: {formatTimestamp(dataRange.start)}<br />
                  Fim: {formatTimestamp(dataRange.end)}
                </div>
                <div>
                  <strong>Configuração:</strong><br />
                  Timeframe: {currentTimeframe}<br />
                  Threshold: 20 candles<br />
                  Max Data Points: 10,000
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico */}
      <Card>
        <CardContent className="p-0">
          <LightweightLiquidationChart
            symbol={`BINANCE:${symbol}`}
            height={height}
            useApiData={true}
            timeframe={currentTimeframe}
            onTimeframeChange={handleTimeframeChange}
            showToolbar={true}
            displaySymbol={symbol}
            symbolDescription={`${symbol}: BINANCE FUTURES`}
          />
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como Usar o Sistema de Dados Infinitos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>1. Zoom Out:</strong> Use o scroll do mouse ou gestos de pinch para fazer zoom out e navegar para períodos mais antigos.</p>
            <p><strong>2. Carregamento Automático:</strong> Quando você se aproximar do início dos dados disponíveis (20 candles), novos dados históricos serão carregados automaticamente.</p>
            <p><strong>3. Navegação Livre:</strong> Você pode navegar para qualquer período histórico - o sistema carregará os dados necessários sob demanda.</p>
            <p><strong>4. Cache Inteligente:</strong> Os dados são armazenados em cache para evitar requisições desnecessárias.</p>
            <p><strong>5. Limite de Memória:</strong> O sistema mantém no máximo 10,000 candles em memória para otimizar performance.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
