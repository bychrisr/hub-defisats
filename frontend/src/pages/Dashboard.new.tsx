import { useEffect, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Wallet,
  Target,
  Activity,
  TrendingDown,
  CheckCircle,
  PieChart,
  BarChart3,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useAutomationStore } from '@/stores/automation';
import SimpleChart from '@/components/charts/SimpleChart';
import { useUserPositions, useUserBalance, useConnectionStatus } from '@/contexts/RealtimeDataContext';
import { usePositionsMetrics, usePositions, useCredentialsError } from '@/contexts/PositionsContext';
import { 
  useMarketData,
  useOptimizedDashboardMetrics, 
  useOptimizedPositions, 
  useBtcPrice,
  useOptimizedMarketData
} from '@/contexts/MarketDataContext';
import RealtimeStatus from '@/components/RealtimeStatus';
import { useThemeClasses } from '@/contexts/ThemeContext';
import CoinGeckoCard from '@/components/CoinGeckoCard';
import PriceChange from '@/components/PriceChange';
import { useFormatSats } from '@/hooks/useFormatSats';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useEstimatedBalance } from '@/hooks/useEstimatedBalance';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { useActiveAccountData } from '@/hooks/useActiveAccountData';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LNMarketsError } from '@/components/LNMarketsError';
import { PnLCard } from '@/components/dashboard/PnLCard';
import { PnLChartCard } from '@/components/dashboard/PnLChartCard';
import { MetricMiniCard, ActiveTradesMiniCard, BalanceMiniCard, MarginMiniCard } from '@/components/dashboard/MetricMiniCard';
import SatsIcon from '@/components/SatsIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { Tooltip } from '@/components/ui/tooltip';
import LightweightLiquidationChart from '@/components/charts/LightweightLiquidationChart';
import PriceReference from '@/components/lnmarkets/PriceReference';
import TradingViewMonitor from '@/components/TradingViewMonitor';
import { marketDataService } from '@/services/marketData.service';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, getProfile, isLoading: authLoading } = useAuthStore();
  const {
    automations,
    fetchAutomations,
    fetchStats,
    stats,
    isLoading: automationLoading,
  } = useAutomationStore();
  
  // Hook otimizado para dados da dashboard (baseado no roadmap)
  // Dados centralizados de mercado
  const { 
    data: marketData, 
    isLoading: marketLoading, 
    error: marketError, 
    refresh: refreshMarket,
    lastUpdate,
    cacheHit
  } = useMarketData();
  
  // Métricas otimizadas da dashboard
  const {
    totalPL,
    totalMargin,
    positionCount
  } = useOptimizedDashboardMetrics();
  
  // Dados de posições otimizados
  const { positions: optimizedPositions } = useOptimizedPositions();

  // Hook para informações da conta ativa
  const { accountInfo, hasActiveAccount } = useActiveAccountData();
  
  // ✅ DADOS DE TESTE PARA SIMULAR POSIÇÕES
  const testPositions = useMemo(() => {
    // Simular 2 posições para teste
    return [
      {
        id: 'pos1',
        symbol: 'XBTUSD',
        liquidation_price: 118663,
        takeprofit: null, // Sem take profit
        side: 'short',
        quantity: 50
      }
    ];
  }, []);

  // ✅ DADOS DE TESTE PARA SIMULAR LINHAS DE LIQUIDAÇÃO
  const liquidationLines = useMemo(() => {
    return testPositions.map(pos => ({
      price: pos.liquidation_price,
      side: pos.side,
      quantity: pos.quantity,
      symbol: pos.symbol
    }));
  }, [testPositions]);

  // ✅ DADOS DE TESTE PARA SIMULAR LINHAS DE TAKE PROFIT
  const takeProfitLines = useMemo(() => {
    return testPositions
      .filter(pos => pos.takeprofit)
      .map(pos => ({
        price: pos.takeprofit!,
        side: pos.side,
        quantity: pos.quantity,
        symbol: pos.symbol
      }));
  }, [testPositions]);

  // Hook para dados históricos
  const { candleData } = useHistoricalData({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    enabled: true
  });

  // Hook para saldo estimado
  const estimatedBalance = useEstimatedBalance();

  // Hook para dashboard em tempo real
  const { isUpdating } = useRealtimeDashboard();

  // Hook para dados otimizados de mercado
  const { data: optimizedMarketData } = useOptimizedMarketData();
  const optimizedMarketIndex = optimizedMarketData?.index || 0;

  // Hook para preço do BTC
  const btcPrice = useBtcPrice();

  // Hook para erro de credenciais
  const { credentialsError, clearCredentialsError } = useCredentialsError();

  // Função para calcular saldo estimado
  const calculateEstimatedBalance = useCallback(() => {
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.estimated_balance || 0;
  }, [estimatedBalance.data]);

  // Função para calcular trades ativos
  const calculateActiveTrades = useCallback(() => {
    if (!optimizedPositions) return 0;
    return optimizedPositions.filter(pos => pos.status === 'running').length;
  }, [optimizedPositions]);

  // Função para calcular total investido
  const calculateTotalInvested = useCallback(() => {
    if (!optimizedPositions) return 0;
    return optimizedPositions.reduce((total, pos) => total + (pos.margin || 0), 0);
  }, [optimizedPositions]);

  // Função para calcular taxas pagas
  const calculateFeesPaid = useCallback(() => {
    if (!optimizedPositions) return 0;
    return optimizedPositions.reduce((total, pos) => total + (pos.fees || 0), 0);
  }, [optimizedPositions]);

  // Função para calcular taxa de sucesso
  const calculateSuccessRate = useCallback(() => {
    if (!optimizedPositions) return 0;
    const closedPositions = optimizedPositions.filter(pos => pos.status === 'closed');
    if (closedPositions.length === 0) return 0;
    
    const successfulTrades = closedPositions.filter(pos => (pos.pnl || 0) > 0).length;
    return (successfulTrades / closedPositions.length) * 100;
  }, [optimizedPositions]);

  // Função para calcular retorno médio
  const calculateAverageReturn = useCallback(() => {
    if (!optimizedPositions) return 0;
    const closedPositions = optimizedPositions.filter(pos => pos.status === 'closed');
    if (closedPositions.length === 0) return 0;
    
    const totalReturn = closedPositions.reduce((total, pos) => {
      const pnl = pos.pnl || 0;
      const margin = pos.margin || 1;
      return total + (pnl / margin) * 100;
    }, 0);
    
    return totalReturn / closedPositions.length;
  }, [optimizedPositions]);

  // Função para calcular relação risco/recompensa
  const calculateRiskRewardRatio = useCallback(() => {
    if (!optimizedPositions) return 0;
    const activePositions = optimizedPositions.filter(pos => pos.status === 'running');
    if (activePositions.length === 0) return 0;
    
    const totalRisk = activePositions.reduce((total, pos) => {
      const margin = pos.margin || 0;
      const liquidationPrice = pos.liquidation_price || 0;
      const entryPrice = pos.entry_price || 0;
      const quantity = pos.quantity || 0;
      
      if (pos.side === 'long') {
        return total + (entryPrice - liquidationPrice) * quantity;
      } else {
        return total + (liquidationPrice - entryPrice) * quantity;
      }
    }, 0);
    
    const totalReward = activePositions.reduce((total, pos) => {
      const margin = pos.margin || 0;
      return total + margin * 2; // Assumindo 2:1 reward
    }, 0);
    
    return totalReward / totalRisk || 0;
  }, [optimizedPositions]);

  // Função para calcular frequência de trading
  const calculateTradingFrequency = useCallback(() => {
    if (!optimizedPositions) return 0;
    const closedPositions = optimizedPositions.filter(pos => pos.status === 'closed');
    if (closedPositions.length === 0) return 0;
    
    // Assumindo que as posições foram fechadas nos últimos 30 dias
    const days = 30;
    return closedPositions.length / days;
  }, [optimizedPositions]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      getProfile();
      fetchAutomations();
      fetchStats();
    }
  }, [user, getProfile, fetchAutomations, fetchStats]);

  return (
    <RouteGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-vibrant">Dashboard</h1>
                </div>
                
                {/* Status da conexão */}
                <RealtimeStatus />
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Botão de refresh */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshMarket}
                  disabled={marketLoading}
                  className="flex items-center space-x-2"
                >
                  {marketLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  <span>Refresh</span>
                </Button>
                
                {/* Link para perfil */}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/profile">
                    <Wallet className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* LN Markets Credentials Error */}
          {credentialsError && (
            <LNMarketsError 
              error={credentialsError}
              onConfigure={() => {
                clearCredentialsError();
                // Navigate to profile page to configure credentials
                window.location.href = '/profile';
              }}
            />
          )}

          {/* Account Status */}
          <div className="mb-6">
            {hasActiveAccount ? (
              <Badge variant="outline" className="text-sm border-green-400/60 text-green-200 bg-green-600/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                Conta ativa
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-sm">
                <XCircle className="w-3 h-3 mr-1" />
                Nenhuma conta ativa
              </Badge>
            )}
          </div>
          
          {/* Liquid Glass Mosaic Dashboard - Layout responsivo */}
          <div className="grid grid-cols-12 gap-4 auto-rows-[140px]">
            {/* Card Principal PnL - 2x2 */}
            <div className="col-span-12 md:col-span-6 lg:col-span-5 row-span-2">
              <PnLChartCard
                pnlValue={totalPL || 0}
                percentageChange={totalMargin > 0 ? ((totalPL || 0) / totalMargin * 100) : 0}
                subtitle="Total Profit & Loss"
                showChart={true}
                showFilters={true}
                initialPeriod="7D"
              />
            </div>
            
            {/* Mini Cards agrupados - Grid interno */}
            <div className="col-span-12 md:col-span-6 lg:col-span-7 grid grid-cols-2 gap-4">
              <ActiveTradesMiniCard
                longCount={optimizedPositions ? optimizedPositions.filter(pos => pos.status === 'running' && pos.side === 'long').length : 0}
                shortCount={optimizedPositions ? optimizedPositions.filter(pos => pos.status === 'running' && pos.side === 'short').length : 0}
                totalCount={positionCount || 0}
              />
              
              <MarginMiniCard
                margin={totalMargin || 0}
                marginRatio={totalMargin > 0 ? ((totalPL || 0) / totalMargin * 100) : 0}
              />
              
              <BalanceMiniCard
                balance={calculateEstimatedBalance()}
                freeBalance={estimatedBalance.data?.free_balance}
                showSatsIcon={true}
              />
              
              <MetricMiniCard
                title="Free Balance"
                value={estimatedBalance.data?.free_balance || 0}
                formatAsSats={true}
                showSatsIcon={true}
                variant="neutral"
                tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
              />
            </div>
          </div>

          {/* Seção de Gráficos e Análises */}
          <div className="mt-8">
            {/* Gráfico de Liquidação */}
            <div className="mb-8">
              <LightweightLiquidationChart
                liquidationLines={liquidationLines}
                takeProfitLines={takeProfitLines}
                candleData={candleData}
                marketIndex={optimizedMarketIndex}
                isLoading={marketLoading}
              />
            </div>

            {/* TradingView Monitor */}
            <div className="mb-8">
              <TradingViewMonitor />
            </div>
          </div>

          {/* Seção de Automações */}
          <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Automações Ativas */}
              <div className="col-span-1">
                <Card className="liquid-glass-base p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-vibrant">Automações Ativas</h3>
                    <Badge variant="outline" className="text-green-400 border-green-400/60 bg-green-600/20">
                      {automations?.length || 0} Ativas
                    </Badge>
                  </div>
                  
                  {automations && automations.length > 0 ? (
                    <div className="space-y-3">
                      {automations.slice(0, 3).map((automation, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card/30">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <span className="text-sm font-medium">{automation.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {automation.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhuma automação ativa</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Estatísticas */}
              <div className="col-span-1">
                <Card className="liquid-glass-base p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-vibrant">Estatísticas</h3>
                    <Badge variant="outline" className="text-blue-400 border-blue-400/60 bg-blue-600/20">
                      Hoje
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-card/30">
                      <div className="text-2xl font-bold text-green-400">
                        {stats?.successfulTrades || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Trades Sucesso</div>
                    </div>
                    
                    <div className="text-center p-3 rounded-lg bg-card/30">
                      <div className="text-2xl font-bold text-red-400">
                        {stats?.failedTrades || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Trades Falha</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
