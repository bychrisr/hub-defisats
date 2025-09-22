import { useEffect } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useAutomationStore } from '@/stores/automation';
import SimpleChart from '@/components/charts/SimpleChart';
import { useUserPositions, useUserBalance, useConnectionStatus } from '@/contexts/RealtimeDataContext';
import { usePositionsMetrics, usePositions, useCredentialsError } from '@/contexts/PositionsContext';
import RealtimeStatus from '@/components/RealtimeStatus';
import { useThemeClasses } from '@/contexts/ThemeContext';
import CoinGeckoCard from '@/components/CoinGeckoCard';
import PriceChange from '@/components/PriceChange';
import { useFormatSats } from '@/hooks/useFormatSats';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import BTCChart from '@/components/charts/BTCChart';
import { useEstimatedBalance } from '@/hooks/useEstimatedBalance';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LNMarketsError } from '@/components/LNMarketsError';
import { PnLCard } from '@/components/dashboard/PnLCard';
import SatsIcon from '@/components/SatsIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { useTooltips } from '@/hooks/useTooltips';

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
  
  // Dados em tempo real
  const realtimePositions = useUserPositions();
  const balanceData = useUserBalance();
  const { isConnected } = useConnectionStatus();
  
  // Erro de credenciais LN Markets
  const { credentialsError, clearCredentialsError } = useCredentialsError();
  
  // Hook de tempo real para todos os dados do dashboard
  const { refreshAll, isEnabled: isRealtimeEnabled } = useRealtimeDashboard({
    positionsInterval: 5000, // 5 segundos
    balanceInterval: 10000, // 10 segundos
    marketInterval: 30000, // 30 segundos
    historicalInterval: 60000, // 1 minuto
    enabled: true
  });
  
  // Novos hooks para métricas da dashboard
  const positionsData = usePositionsMetrics();
  const { getTooltipText, getTooltipPosition, isTooltipEnabled } = useTooltips();
  const historicalData = useHistoricalData();
  const estimatedBalance = useEstimatedBalance();
  const { data: positionsContextData } = usePositions(); // Para obter o marketIndex consistente
  const { formatSats } = useFormatSats();
  
  // Dados históricos para cálculos
  const historicalMetrics = historicalData.data;
  

  useEffect(() => {
    if (!user) {
      getProfile();
    }
    fetchAutomations();
    fetchStats();
  }, [user, getProfile, fetchAutomations, fetchStats]);

  const isLoading = authLoading || automationLoading;

  const activeAutomations = automations.filter(a => a.is_active);

  return (
    <RouteGuard isLoading={isLoading}>
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-4xl font-bold text-vibrant">Dashboard</h1>
                {isRealtimeEnabled && (
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-sm text-success font-semibold">Live</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <p className="text-vibrant-secondary text-lg font-medium break-all">Welcome back, {user?.email}</p>
                <Badge variant="outline" className="text-sm font-semibold px-3 py-1 border-primary/30 text-primary w-fit">
                  {user?.plan_type.toUpperCase()} Plan
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* TODO: Botão Refresh comentado para futuras modificações */}
              {/* 
              {isRealtimeEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAll}
                  className="text-xs btn-modern-primary"
                >
                  <Activity className="w-4 h-4 mr-2 icon-primary" />
                  Refresh
                </Button>
              )}
              */}
            </div>
          </div>

          {/* LN Markets Credentials Error */}
          {credentialsError && (
            <LNMarketsError 
              error={credentialsError}
              onConfigure={() => {
                clearCredentialsError();
                // Navigate to profile page to configure credentials
                window.location.href = '/profile';
              }}
              showConfigureButton={true}
            />
          )}

        {/* Nova Linha - Cards Principais */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-vibrant">Key Metrics</h2>
          
          {/* Cards com degradês coloridos */}
          <div className="grid grid-cols-5 gap-6">
            {/* Card PnL Total com degradê vermelho - NOVO DESIGN */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <TrendingUp className="w-6 h-6 text-red-300 stroke-2 group-hover:text-red-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-red border-2 border-red-500 hover:border-red-400 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    {/* Título maior */}
                    <div className="mb-4">
                      <CardTitle className="text-h3 text-vibrant">Total PnL</CardTitle>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className="text-number-lg text-red-200">
                        {formatSats(positionsData.totalPL || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                    {/* Badge e label */}
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className="text-label-sm px-2 py-1 border-red-400/60 text-red-200 bg-red-600/20"
                      >
                        {positionsData.totalMargin > 0 ? `${((positionsData.totalPL || 0) / positionsData.totalMargin * 100).toFixed(1)}%` : '0.0%'}
                      </Badge>
                      <span className="text-caption text-red-300/80">vs Margin</span>
                    </div>
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Card Estimated Profit com degradê verde - NOVO DESIGN */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-green-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <TrendingUp className="w-6 h-6 text-green-300 stroke-2 group-hover:text-green-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-green border-2 border-green-500 hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    {/* Título maior */}
                    <div className="mb-4">
                      <CardTitle className="text-h3 text-vibrant">Estimated Profit</CardTitle>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className="text-number-lg text-green-200">
                        {formatSats(positionsData.estimatedProfit || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                    {/* Badge e label */}
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className="text-label-sm px-2 py-1 border-green-400/60 text-green-200 bg-green-600/20"
                      >
                        {positionsData.totalMargin > 0 ? `+${((positionsData.estimatedProfit || 0) / positionsData.totalMargin * 100).toFixed(1)}%` : '+0.0%'}
                      </Badge>
                      <span className="text-caption text-green-300/80">vs Margin</span>
                    </div>
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Card Active Trades com degradê azul - NOVO DESIGN */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <Activity className="w-6 h-6 text-blue-300 stroke-2 group-hover:text-blue-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-blue border-2 border-blue-500 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    {/* Título maior */}
                    <div className="mb-4">
                      <CardTitle className="text-h3 text-vibrant">Active Trades</CardTitle>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className="text-number-lg text-blue-200">
                        {(() => {
                          // Debug detalhado
                          console.log('🔍 ACTIVE TRADES - DEBUG COMPLETO:', {
                            positionsData: positionsData,
                            positionsArray: positionsData.positions,
                            positionsLength: positionsData.positions?.length,
                            positionCount: positionsData.positionCount,
                            hasPositions: !!(positionsData.positions && positionsData.positions.length > 0)
                          });
                          
                          if (positionsData.positions && positionsData.positions.length > 0) {
                            const runningPositions = positionsData.positions.filter(pos => pos.status === 'running').length;
                            console.log('🔍 ACTIVE TRADES - Usando positions array:', runningPositions);
                            return runningPositions;
                          }
                          
                          console.log('🔍 ACTIVE TRADES - Usando positionCount fallback:', positionsData.positionCount);
                          return positionsData.positionCount || 0;
                        })()}
                      </div>
                    </div>
                    
                    {/* Contagem Long/Short como Badges */}
                    <div className="mb-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className="text-xs px-2 py-1 border-green-400/60 text-green-200 bg-green-600/20 whitespace-nowrap"
                        >
                          {(() => {
                            if (positionsData.positions && positionsData.positions.length > 0) {
                              const longCount = positionsData.positions.filter(pos => pos.status === 'running' && pos.side === 'long').length;
                              console.log('🔍 LONG COUNT - positions array:', longCount, positionsData.positions.map(p => ({ id: p.id, side: p.side, status: p.status })));
                              return longCount;
                            }
                            console.log('🔍 LONG COUNT - No positions array, returning 0');
                            return 0;
                          })()} Long
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="text-xs px-2 py-1 border-red-400/60 text-red-200 bg-red-600/20 whitespace-nowrap"
                        >
                          {(() => {
                            if (positionsData.positions && positionsData.positions.length > 0) {
                              const shortCount = positionsData.positions.filter(pos => pos.status === 'running' && pos.side === 'short').length;
                              console.log('🔍 SHORT COUNT - positions array:', shortCount, positionsData.positions.map(p => ({ id: p.id, side: p.side, status: p.status })));
                              return shortCount;
                            }
                            console.log('🔍 SHORT COUNT - No positions array, returning 0');
                            return 0;
                          })()} Short
                        </Badge>
                      </div>
                    </div>
                    
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Card Total Margin com degradê roxo - NOVO DESIGN */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <PieChart className="w-6 h-6 text-purple-300 stroke-2 group-hover:text-purple-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-purple border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    {/* Título maior */}
                    <div className="mb-4">
                      <CardTitle className="text-h3 text-vibrant">Total Margin</CardTitle>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className="text-number-lg text-purple-200">
                        {formatSats(positionsData.totalMargin || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Card Estimated Fees com degradê laranja - NOVO DESIGN */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-orange-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <TrendingDown className="w-6 h-6 text-orange-300 stroke-2 group-hover:text-orange-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-orange border-2 border-orange-500 hover:border-orange-400 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    {/* Título maior */}
                    <div className="mb-4">
                      <CardTitle className="text-h3 text-vibrant">Estimated Fees</CardTitle>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className="text-number-lg text-orange-200">
                        {formatSats(positionsData.estimatedFees || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                    {/* Badge e label */}
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className="text-label-sm px-2 py-1 border-orange-400/60 text-orange-200 bg-orange-600/20"
                      >
                        0.1%
                      </Badge>
                      <span className="text-caption text-orange-300/80">rate</span>
                    </div>
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>
          </div>
        </div>

        {/* Active Positions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-vibrant">Active Positions</h2>
          
          {/* Cards com altura uniforme - Responsivo */}
          <div className="positions-active-cards">
            <PnLCard
              title="PnL Total"
              pnl={positionsData.totalPL || 0}
              percentage={positionsData.totalMargin > 0 ? ((positionsData.totalPL || 0) / positionsData.totalMargin) * 100 : 0}
              titleSize="lg"
              cardKey="total_pnl"
              cursor="default"
              icon={TrendingUp}
              floatingIcon={true}
            />
            
            <PnLCard
              title="Profit Estimado"
              pnl={positionsData.estimatedProfit || 0}
              titleSize="lg"
              cardKey="estimated_profit"
              cursor="default"
              icon={Target}
              floatingIcon={true}
            />
            
            <PnLCard
              title="Trades em execução"
              pnl={positionsData.positionCount || 0}
              titleSize="lg"
              cardKey="positions_count"
              cursor="default"
              icon={Activity}
              variant="neutral"
              showSatsIcon={false}
              floatingIcon={true}
            />
            
            <PnLCard
              title="Margem Total"
              pnl={positionsData.totalMargin || 0}
              titleSize="lg"
              cardKey="total_margin"
              cursor="default"
              icon={Wallet}
              variant="neutral"
              showSatsIcon={true}
              floatingIcon={true}
            />
            
            <PnLCard
              title="Taxas Estimadas"
              pnl={positionsData.totalFees || 0}
              titleSize="lg"
              cardKey="estimated_fees"
              cursor="default"
              icon={DollarSign}
              variant="neutral"
              showSatsIcon={true}
              floatingIcon={true}
            />
          </div>
        </div>

          {/* Histórico */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-vibrant">{t('dashboard.history')}</h2>
            <div className="dashboard-cards-container">
              <PnLCard
                title="Margem disponível"
                pnl={balanceData?.balance || 0}
                icon={Wallet}
                variant="neutral"
                cardKey="available_margin"
                titleSize="lg"
                floatingIcon={true}
                cursor="default"
                showSatsIcon={true}
              />

              <PnLCard
                title={t('dashboard.estimated_balance')}
                pnl={estimatedBalance.data?.estimated_balance || 0}
                icon={Wallet}
                titleSize="lg"
                floatingIcon={true}
                cursor="default"
              />

              <PnLCard
                title={t('dashboard.total_invested')}
                pnl={estimatedBalance.data?.total_invested || 0}
                icon={Target}
                cardKey="total_invested"
                variant="neutral"
                titleSize="lg"
                floatingIcon={true}
                cursor="default"
                showSatsIcon={true}
              />

              <PnLCard
                title={t('dashboard.total_profit')}
                pnl={historicalMetrics?.totalProfit || 0}
                icon={TrendingUp}
                variant="neutral"
                titleSize="lg"
                floatingIcon={true}
                cursor="default"
                showSatsIcon={true}
              />

              <PnLCard
                title={t('dashboard.fees_paid')}
                pnl={historicalMetrics?.totalFees || 0}
                icon={DollarSign}
                cardKey="fees_paid"
                variant="neutral"
                titleSize="lg"
                floatingIcon={true}
                cursor="default"
                showSatsIcon={true}
              />

              <MetricCard
                cardKey="success_rate"
                title={t('dashboard.success_rate')}
                value={(historicalMetrics?.successRate || 0).toFixed(1) + '%'}
                icon={CheckCircle}
                titleSize="lg"
                floatingIcon={true}
                cursor="default"
                variant={(historicalMetrics?.successRate || 0) >= 50 ? 'success' : 'warning'}
              />
            </div>
          </div>




          {/* Automation Types Overview */}
          {stats && stats.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Automation Overview</CardTitle>
                <CardDescription>
                  Breakdown of your automation types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Target className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Margin Guard</div>
                        <div className="text-sm text-text-secondary">
                          Position protection
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.byType.margin_guard}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <div>
                        <div className="font-medium">TP/SL</div>
                        <div className="text-sm text-text-secondary">
                          Take profit / Stop loss
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.byType.tp_sl}</div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5 text-secondary" />
                      <div>
                        <div className="font-medium">Auto Entry</div>
                        <div className="text-sm text-text-secondary">
                          Automatic entries
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.byType.auto_entry}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* BTC Chart - Gráfico de candlesticks */}
        <div className="mt-6">
          <BTCChart height={500} />
        </div>
      </div>
    </RouteGuard>
  );
}