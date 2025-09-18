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
  Shield,
  TrendingUp,
  Settings,
  User,
  BarChart3,
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
import { usePositionsMetrics, usePositions } from '@/contexts/PositionsContext';
import LatestPricesWidget from '@/components/market/LatestPricesWidget';
import RealtimeStatus from '@/components/RealtimeStatus';
import { useThemeClasses } from '@/contexts/ThemeContext';
import CoinGeckoCard from '@/components/CoinGeckoCard';
import PriceChange from '@/components/PriceChange';
import { useFormatSatsText } from '@/hooks/useDashboardMetrics';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useEstimatedBalance } from '@/hooks/useEstimatedBalance';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PnLCard } from '@/components/dashboard/PnLCard';
import SatsIcon from '@/components/SatsIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { RouteGuard } from '@/components/guards/RouteGuard';

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
  const historicalData = useHistoricalData();
  const estimatedBalance = useEstimatedBalance();
  const { data: positionsContextData } = usePositions(); // Para obter o marketIndex consistente
  const formatSats = useFormatSatsText();
  
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

  const marginGuardAutomation = automations.find(
    a => a.type === 'margin_guard'
  );
  const activeAutomations = automations.filter(a => a.is_active);

  return (
    <RouteGuard isLoading={isLoading}>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
                {isRealtimeEnabled && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Live</span>
                  </div>
                )}
              </div>
              <p className="text-text-secondary">Welcome back, {user?.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {user?.plan_type.toUpperCase()} Plan
              </Badge>
              {isRealtimeEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAll}
                  className="text-xs"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
          </div>

          {/* Linha 1 - Posições Ativas */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">Posições Ativas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <PnLCard
                title="PnL Total"
                pnl={positionsData.totalPL || 0}
                percentage={positionsData.totalMargin > 0 ? ((positionsData.totalPL || 0) / positionsData.totalMargin) * 100 : 0}
                subtitle="Lucro/prejuízo total"
              />
              
              <PnLCard
                title="Profit Estimado"
                pnl={positionsData.estimatedProfit || 0}
                subtitle="Se fechadas com take profit"
                icon={Target}
              />
              
              <MetricCard
                title="Posições em Execução"
                value={(positionsData.positionCount || 0).toString()}
                subtitle={'BTC @ ' + (positionsContextData?.marketIndex?.index ? '$' + positionsContextData.marketIndex.index.toLocaleString() : 'Carregando...')}
                icon={Activity}
                variant={(positionsData.positionCount || 0) > 0 ? 'default' : 'warning'}
              />
              
              <MetricCard
                title="Margem Total"
                value={formatSats(positionsData.totalMargin || 0)}
                subtitle="Margem utilizada"
                icon={Wallet}
              />
              
              <MetricCard
                title="Taxas Estimadas"
                value={formatSats(positionsData.totalFees || 0)}
                subtitle="Taxas das posições ativas"
                icon={DollarSign}
              />
            </div>
          </div>

          {/* Linha 2 - Histórico */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">{t('dashboard.history')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <MetricCard
                title="Margem disponível"
                value={formatSats(balanceData?.balance || 0)}
                subtitle="Saldo da conta LN Markets"
                icon={Wallet}
                variant="default"
              />

              <PnLCard
                title={t('dashboard.estimated_balance')}
                pnl={estimatedBalance.data?.estimated_balance || 0}
                subtitle={estimatedBalance.isLoading ? t('common.loading') : (estimatedBalance.data?.positions_count || 0) + ' ' + t('dashboard.positions')}
                icon={Wallet}
              />

              <MetricCard
                title={t('dashboard.total_invested')}
                value={formatSats(estimatedBalance.data?.total_invested || 0)}
                subtitle={estimatedBalance.isLoading ? t('common.loading') : (estimatedBalance.data?.trades_count || 0) + ' ' + t('dashboard.trades')}
                icon={Target}
              />

              <PnLCard
                title={t('dashboard.total_profit')}
                pnl={historicalMetrics?.totalProfit || 0}
                subtitle={t('dashboard.sum_of_all_profits')}
                icon={TrendingUp}
              />

              <MetricCard
                title={t('dashboard.fees_paid')}
                value={formatSats(historicalMetrics?.totalFees || 0)}
                subtitle={t('dashboard.fees_in_operations')}
                icon={DollarSign}
              />

              <MetricCard
                title={t('dashboard.success_rate')}
                value={(historicalMetrics?.successRate || 0).toFixed(1) + '%'}
                subtitle={(historicalMetrics?.winningPositions || 0) + '/' + (historicalMetrics?.totalPositions || 0) + ' ' + t('dashboard.trades') + ' | ' + t('dashboard.volatile_btc')}
                icon={CheckCircle}
                variant={(historicalMetrics?.successRate || 0) >= 50 ? 'success' : 'warning'}
              />
            </div>
          </div>


          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">{t('dashboard.quick_actions')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and automations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button asChild className="h-auto p-4">
                      <Link to="/margin-guard">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-medium">Margin Guard</div>
                            <div className="text-sm opacity-70">
                              {marginGuardAutomation ? 'Configure' : 'Set up'}{' '}
                              protection
                            </div>
                          </div>
                        </div>
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto p-4">
                      <Link to="/automation">
                        <div className="flex items-center space-x-3">
                          <Settings className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-medium">All Automations</div>
                            <div className="text-sm opacity-70">
                              Manage all automations
                            </div>
                          </div>
                        </div>
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto p-4">
                      <Link to="/profile">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-medium">Profile</div>
                            <div className="text-sm opacity-70">
                              Account settings
                            </div>
                          </div>
                        </div>
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto p-4">
                      <Link to="/reports">
                        <div className="flex items-center space-x-3">
                          <BarChart3 className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-medium">Reports</div>
                            <div className="text-sm opacity-70">
                              View automation reports
                            </div>
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">Recent Activity</h2>
            <Card>
              <CardHeader>
                <CardTitle>Latest Automation Activity</CardTitle>
                <CardDescription>Recent automation events and updates</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentActivity.slice(0, 5).map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={'w-2 h-2 rounded-full ' + (activity.is_active ? 'bg-green-500' : 'bg-gray-400')}
                          />
                          <div>
                            <div className="text-sm font-medium capitalize">
                              {activity.type.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-text-secondary">
                              {new Date(activity.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={activity.is_active ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-text-secondary mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">No recent activity</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Create your first automation to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                      <Shield className="h-5 w-5 text-primary" />
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
                      <Settings className="h-5 w-5 text-secondary" />
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