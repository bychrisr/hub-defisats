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
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useAutomationStore } from '@/stores/automation';
import SimpleChart from '@/components/charts/SimpleChart';
import { useUserPositions, useUserBalance, useConnectionStatus } from '@/contexts/RealtimeDataContext';
import RealtimeStatus from '@/components/RealtimeStatus';
import { useThemeClasses } from '@/contexts/ThemeContext';
import CoinGeckoCard from '@/components/CoinGeckoCard';
import PriceChange from '@/components/PriceChange';

export default function Dashboard() {
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
  const userBalance = useUserBalance();
  const { isConnected } = useConnectionStatus();

  useEffect(() => {
    if (!user) {
      getProfile();
    }
    fetchAutomations();
    fetchStats();
  }, [user, getProfile, fetchAutomations, fetchStats]);

  const isLoading = authLoading || automationLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const marginGuardAutomation = automations.find(
    a => a.type === 'margin_guard'
  );
  const activeAutomations = automations.filter(a => a.is_active);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-secondary">Welcome back, {user?.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {user?.plan_type.toUpperCase()} Plan
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Automations
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.active || 0} active, {stats?.inactive || 0} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Automations
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active || 0}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Margem Disponível
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userBalance?.available_balance ? `${(userBalance.available_balance / 100000000).toFixed(8)} BTC` : '0.00000000 BTC'}
              </div>
              <p className="text-xs text-muted-foreground">
                {userBalance?.available_balance ? `${(userBalance.available_balance / 100).toFixed(2)} sats` : '0 sats'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Account Status
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.email_verified ? 'Verified' : 'Pending'}
              </div>
              <p className="text-xs text-muted-foreground">
                Email verification
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
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

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest automation activity</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`}
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

        {/* Gráfico de Preços */}
        <SimpleChart />
    </div>
  );
}
