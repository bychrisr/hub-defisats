/**
 * Dashboard Refatorado
 * 
 * Versão atualizada do Dashboard que utiliza os novos hooks refatorados
 * para consumir os endpoints da LN Markets API v2 refatorados
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { useAutomationStore } from '@/stores/automationStore';
import { useLNMarketsRefactoredDashboard, useLNMarketsRefactoredMetrics, useLNMarketsRefactoredPositions, useLNMarketsRefactoredTicker, useLNMarketsRefactoredConnectionStatus, useLNMarketsRefactoredRealtime } from '@/hooks/useLNMarketsRefactored';
import { useOptimizedMarketData } from '@/hooks/useOptimizedMarketData';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useUserBalance } from '@/contexts/RealtimeDataContext';
import { useCredentialsError } from '@/contexts/PositionsContext';
import { useFormatSats } from '@/hooks/useFormatSats';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Zap, 
  Shield, 
  BarChart3, 
  PieChart, 
  Target, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

export default function DashboardRefactored() {
  const { t } = useTranslation();
  const { user, getProfile, isLoading: authLoading } = useAuthStore();
  const {
    automations,
    fetchAutomations,
    fetchStats,
    stats,
    isLoading: automationLoading,
  } = useAutomationStore();
  
  // Hook refatorado para dados da dashboard (API v2 refatorada)
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError, 
    refresh: refreshDashboard,
    lastUpdate,
    cacheHit
  } = useLNMarketsRefactoredDashboard();
  
  // Métricas refatoradas da dashboard
  const {
    totalPL,
    estimatedProfit,
    totalMargin,
    estimatedFees,
    availableMargin,
    estimatedBalance,
    totalInvested,
    netProfit,
    feesPaid,
    positionCount,
    activeTrades,
    isLoading: metricsLoading,
    error: metricsError
  } = useLNMarketsRefactoredMetrics();
  
  // Dados de posições refatorados
  const { positions: refactoredPositions } = useLNMarketsRefactoredPositions();
  
  // Dados de ticker refatorados
  const { ticker: refactoredTicker } = useLNMarketsRefactoredTicker();
  
  // Status de conexão refatorado
  const { isConnected: isRefactoredConnected, error: connectionError } = useLNMarketsRefactoredConnectionStatus();
  
  // Dados de mercado otimizados (mantido para compatibilidade)
  const { marketIndex: optimizedMarketIndex } = useOptimizedMarketData();
  
  // Dados históricos (mantido para compatibilidade)
  const historicalData = useHistoricalData({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    initialLimit: 168,
    enabled: false
  });
  
  // Dados de saldo (mantido para compatibilidade)
  const balanceData = useUserBalance();
  
  // Hook de tempo real refatorado
  const { refreshAll: refreshRefactoredAll, isEnabled: isRealtimeEnabled } = useLNMarketsRefactoredRealtime({
    positionsInterval: 10000, // 10 segundos
    balanceInterval: 30000,   // 30 segundos
    tickerInterval: 60000,    // 1 minuto
    enabled: true
  });
  
  // Utilitários
  const { formatSats, getDynamicSize } = useFormatSats();
  
  // Erro de credenciais LN Markets
  const { credentialsError, clearCredentialsError } = useCredentialsError();
  
  // Estados locais
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefactoredData, setShowRefactoredData] = useState(true);

  // Função para refresh manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDashboard();
      await refreshRefactoredAll();
      toast.success('Dashboard atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Função para alternar entre dados antigos e refatorados
  const toggleDataSource = () => {
    setShowRefactoredData(!showRefactoredData);
    toast.info(`Mostrando dados ${showRefactoredData ? 'antigos' : 'refatorados'}`);
  };

  // Verificar se há erros de credenciais
  useEffect(() => {
    if (credentialsError) {
      toast.error(credentialsError);
      clearCredentialsError();
    }
  }, [credentialsError, clearCredentialsError]);

  // Loading state
  if (authLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardError || metricsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados da dashboard: {dashboardError || metricsError}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Refatorado</h1>
          <p className="text-muted-foreground">
            Dados da LN Markets API v2 refatorada
            {lastUpdate && (
              <span className="ml-2 text-sm">
                • Atualizado em {new Date(lastUpdate).toLocaleTimeString()}
                {cacheHit && <span className="text-green-500"> • Cache</span>}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDataSource}
          >
            {showRefactoredData ? 'Mostrar Dados Antigos' : 'Mostrar Dados Refatorados'}
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status de Conexão */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {isRefactoredConnected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-medium">
            {isRefactoredConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <Badge variant={showRefactoredData ? 'default' : 'secondary'}>
          {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
        </Badge>
        {isRealtimeEnabled && (
          <Badge variant="outline" className="text-green-600">
            <Zap className="h-3 w-3 mr-1" />
            Tempo Real
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="positions">Posições</TabsTrigger>
          <TabsTrigger value="market">Mercado</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSats(showRefactoredData ? estimatedBalance : (balanceData?.balance || 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P&L Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSats(showRefactoredData ? totalPL : (balanceData?.pnl || 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posições Ativas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {showRefactoredData ? activeTrades : (refactoredPositions?.length || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Margem Total</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSats(showRefactoredData ? totalMargin : 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dados do Ticker */}
          {showRefactoredData && refactoredTicker && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Preço do Bitcoin (API v2 Refatorada)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Preço Atual</p>
                    <p className="text-2xl font-bold">${refactoredTicker.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mudança 24h</p>
                    <p className={`text-xl font-bold ${refactoredTicker.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {refactoredTicker.changePercent24h >= 0 ? '+' : ''}{refactoredTicker.changePercent24h.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Alta 24h</p>
                    <p className="text-lg font-semibold">${refactoredTicker.high24h.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Baixa 24h</p>
                    <p className="text-lg font-semibold">${refactoredTicker.low24h.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Posições */}
        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Posições Ativas</span>
                <Badge variant="outline">{refactoredPositions?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {refactoredPositions && refactoredPositions.length > 0 ? (
                <div className="space-y-4">
                  {refactoredPositions.map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${position.side === 'long' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium">{position.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {position.side.toUpperCase()} • {position.leverage}x
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatSats(position.pnl)}</p>
                        <p className={`text-sm ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma posição ativa</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mercado */}
        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Dados de Mercado</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showRefactoredData && refactoredTicker ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Preço</p>
                      <p className="text-2xl font-bold">${refactoredTicker.price.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Mudança 24h</p>
                      <p className={`text-xl font-bold ${refactoredTicker.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {refactoredTicker.changePercent24h >= 0 ? '+' : ''}{refactoredTicker.changePercent24h.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Volume 24h</p>
                      <p className="text-lg font-semibold">{refactoredTicker.volume24h.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Fonte</p>
                      <p className="text-sm font-medium">API v2 Refatorada</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Dados de mercado não disponíveis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Análise de Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Métricas de Negócio</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Investido:</span>
                      <span className="font-medium">{formatSats(totalInvested)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taxas Pagas:</span>
                      <span className="font-medium">{formatSats(feesPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Margem Disponível:</span>
                      <span className="font-medium">{formatSats(availableMargin)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Status da API</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conexão:</span>
                      <Badge variant={isRefactoredConnected ? 'default' : 'destructive'}>
                        {isRefactoredConnected ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fonte:</span>
                      <span className="text-sm font-medium">API v2 Refatorada</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tempo Real:</span>
                      <Badge variant={isRealtimeEnabled ? 'default' : 'secondary'}>
                        {isRealtimeEnabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
