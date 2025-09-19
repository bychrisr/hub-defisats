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
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useAutomationStore } from '@/stores/automation';
import SimpleChart from '@/components/charts/SimpleChart';
import { useUserPositions, useUserBalance, useConnectionStatus } from '@/contexts/RealtimeDataContext';
import { usePositionsMetrics, usePositions, useCredentialsError } from '@/contexts/PositionsContext';
import LatestPricesWidget from '@/components/market/LatestPricesWidget';
import RealtimeStatus from '@/components/RealtimeStatus';
import { useThemeClasses } from '@/contexts/ThemeContext';
import CoinGeckoCard from '@/components/CoinGeckoCard';
import PriceChange from '@/components/PriceChange';
import { useFormatSats } from '@/hooks/useFormatSats';
import { useHistoricalData } from '@/hooks/useHistoricalData';
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
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-4xl font-bold text-vibrant">Dashboard</h1>
                {isRealtimeEnabled && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-sm text-success font-semibold">Live</span>
                  </div>
                )}
              </div>
              <p className="text-vibrant-secondary text-lg font-medium">Welcome back, {user?.email}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-sm font-semibold px-3 py-1 border-primary/30 text-primary">
                {user?.plan_type.toUpperCase()} Plan
              </Badge>
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

        {/* Posições Ativas */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-vibrant">Posições Ativas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

        {/* Latest Prices Widget - Dados públicos sem autenticação */}
        <div className="mt-6">
          <LatestPricesWidget showRefreshButton={true} compact={false} />
        </div>
      </div>
    </RouteGuard>
  );
}