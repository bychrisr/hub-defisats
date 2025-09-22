import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Gift, 
  Activity, 
  Server,
  BarChart3,
  Shield,
  Loader2,
  Database,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { apiGet } from '@/lib/fetch';
import SatsIcon from '@/components/SatsIcon';
import { useTooltips } from '@/hooks/useTooltips';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { cn } from '@/lib/utils';

interface DashboardKPIs {
  total_users: number;
  active_users: number;
  trades_success: number;
  trades_error: number;
  success_rate: number;
  revenue_sats: number;
  coupons_used: number;
  workers_active: number;
  workers_failed: number;
}

interface ChartData {
  time: string;
  count: number;
}

interface DashboardData {
  kpis: DashboardKPIs;
  charts: {
    trades_over_time: ChartData[];
    users_over_time: ChartData[];
    revenue_over_time: ChartData[];
  };
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);
  const { cards, loading: cardsLoading } = useTooltips();

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await apiGet(`/api/admin/dashboard?period=${period}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const formatSats = (sats: number) => {
    if (sats >= 100000000) {
      return (
        <span className="flex items-center gap-1">
          {(sats / 100000000).toFixed(2)} BTC
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1">
        {sats.toLocaleString()}
        <SatsIcon size={28} variant="default" />
      </span>
    );
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl"></div>
                    <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-text-primary">Loading Dashboard</h3>
                    <p className="text-sm text-text-secondary">Fetching admin data...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const { kpis, charts } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-3xl"></div>
            <Card className="relative backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Admin Dashboard
                        </h1>
                        <p className="text-text-secondary">Monitor system performance and user activity</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-32 backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">Last Hour</SelectItem>
                        <SelectItem value="24h">Last 24h</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={fetchDashboardData} 
                      disabled={refreshing}
                      className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <Card className="gradient-card-blue backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{kpis.total_users.toLocaleString()}</div>
                <p className="text-xs text-text-secondary mt-1">
                  {kpis.active_users} active in period
                </p>
              </CardContent>
            </Card>

            {/* Trade Success Rate */}
            <Card className="gradient-card-green backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{kpis.success_rate.toFixed(1)}%</div>
                <div className="flex items-center space-x-2 mt-2">
                  <div className={`h-2 w-16 rounded-full ${getSuccessRateColor(kpis.success_rate)}`} />
                  <span className="text-xs text-text-secondary">
                    {kpis.trades_success} success, {kpis.trades_error} errors
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card className="gradient-card-yellow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{formatSats(kpis.revenue_sats)}</div>
                <p className="text-xs text-text-secondary mt-1">
                  {kpis.coupons_used} coupons used
                </p>
              </CardContent>
            </Card>

            {/* Workers Status */}
            <Card className="gradient-card-purple backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-500" />
                  Workers Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={kpis.workers_failed > 0 ? "destructive" : "default"}
                    className={cn(
                      "font-semibold px-3 py-1 rounded-full border-0",
                      kpis.workers_failed > 0 
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25'
                        : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                    )}
                  >
                    {kpis.workers_active} Active
                  </Badge>
                  {kpis.workers_failed > 0 && (
                    <Badge className="bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25 font-semibold px-3 py-1 rounded-full border-0">
                      {kpis.workers_failed} Failed
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  {kpis.workers_failed === 0 ? 'All systems operational' : 'Some workers need attention'}
                </p>
              </CardContent>
            </Card>
          </div>

      {/* Dashboard Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-vibrant">Dashboard Cards</h2>
          <Badge variant="outline" className="text-vibrant-secondary">
            {cards.length} cards configurados
          </Badge>
        </div>
        
        {cardsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="card-modern">
                <CardHeader className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="animate-pulse">
                  <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <MetricCard
                key={card.id}
                title={card.title}
                value={card.description || 'Sem descrição'}
                subtitle={`Categoria: ${card.category}`}
                cardKey={card.key}
                className="card-modern"
              />
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <Tabs defaultValue="trades" className="space-y-4">
        <TabsList className="bg-background/50 backdrop-blur-sm border-border/50">
          <TabsTrigger value="trades" className="data-[state=active]:bg-vibrant data-[state=active]:text-white">Trades Over Time</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-vibrant data-[state=active]:text-white">Users Activity</TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-vibrant data-[state=active]:text-white">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="trades" className="space-y-4">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-vibrant">Trades Over Time</CardTitle>
              <CardDescription className="text-vibrant-secondary">Trade execution volume in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.trades_over_time}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-vibrant">User Activity</CardTitle>
              <CardDescription className="text-vibrant-secondary">User registration and activity patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-vibrant-secondary">
                <p>User activity chart coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-vibrant">Revenue Trends</CardTitle>
              <CardDescription className="text-vibrant-secondary">Revenue generation over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-vibrant-secondary">
                <p>Revenue chart coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}
