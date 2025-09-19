import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Users, TrendingUp, AlertTriangle, DollarSign, Gift, Activity, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { apiGet } from '@/lib/fetch';
import SatsIcon from '@/components/SatsIcon';
import { useTooltips } from '@/hooks/useTooltips';
import { MetricCard } from '@/components/dashboard/MetricCard';

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
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="header-modern flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-vibrant">Admin Dashboard</h1>
          <p className="text-vibrant-secondary mt-2">Monitor system performance and user activity</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 bg-background/50 backdrop-blur-sm border-border/50">
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
            className="btn-modern-primary"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-vibrant-secondary">Total Users</CardTitle>
            <Users className="h-4 w-4 icon-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vibrant number-lg">{kpis.total_users.toLocaleString()}</div>
            <p className="text-xs text-vibrant-secondary mt-1">
              {kpis.active_users} active in period
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-vibrant-secondary">Trade Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 icon-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vibrant number-lg">{kpis.success_rate.toFixed(1)}%</div>
            <div className="flex items-center space-x-2 mt-2">
              <div className={`h-2 w-16 rounded-full ${getSuccessRateColor(kpis.success_rate)}`} />
              <span className="text-xs text-vibrant-secondary">
                {kpis.trades_success} success, {kpis.trades_error} errors
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-vibrant-secondary">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 icon-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vibrant number-lg">{formatSats(kpis.revenue_sats)}</div>
            <p className="text-xs text-vibrant-secondary mt-1">
              {kpis.coupons_used} coupons used
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-vibrant-secondary">Workers Status</CardTitle>
            <Server className="h-4 w-4 icon-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={kpis.workers_failed > 0 ? "destructive" : "default"}>
                {kpis.workers_active} Active
              </Badge>
              {kpis.workers_failed > 0 && (
                <Badge variant="destructive">
                  {kpis.workers_failed} Failed
                </Badge>
              )}
            </div>
            <p className="text-xs text-vibrant-secondary mt-2">
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
  );
}
