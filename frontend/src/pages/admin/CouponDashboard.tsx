import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Gift, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  Target
} from 'lucide-react';

interface CouponDashboardData {
  total_coupons: number;
  active_coupons: number;
  inactive_coupons: number;
  total_uses: number;
  total_revenue_saved: number;
  total_new_users: number;
  average_conversion_rate: number;
  top_coupons: Array<{
    id: string;
    code: string;
    uses_count: number;
    revenue_saved: number;
    conversion_rate: number;
  }>;
  recent_activity: Array<{
    id: string;
    code: string;
    action: string;
    timestamp: string;
  }>;
  daily_metrics: Array<{
    date: string;
    views: number;
    clicks: number;
    uses: number;
    new_users: number;
    revenue_saved: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function CouponDashboard() {
  const [dashboardData, setDashboardData] = useState<CouponDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/coupons/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

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
  }, []);

  const formatCurrency = (sats: number) => {
    return `${sats.toLocaleString()} sats`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar dashboard</h3>
        <p className="text-muted-foreground mb-4">Não foi possível carregar os dados do dashboard.</p>
        <Button onClick={fetchDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Cupons</h1>
          <p className="text-muted-foreground">
            Métricas e análises completas do sistema de cupons
          </p>
        </div>
        <Button onClick={fetchDashboardData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cupons</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.total_coupons}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-green-600">
                {dashboardData.active_coupons} ativos
              </Badge>
              <Badge variant="outline" className="text-red-600">
                {dashboardData.inactive_coupons} inativos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.total_uses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Cupons utilizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Economizada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.total_revenue_saved)}</div>
            <p className="text-xs text-muted-foreground">
              Total economizado pelos usuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.total_new_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Atraídos por cupons
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Coupons */}
            <Card>
              <CardHeader>
                <CardTitle>Top Cupons por Uso</CardTitle>
                <CardDescription>
                  Cupons mais utilizados pelos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.top_coupons.map((coupon, index) => (
                    <div key={coupon.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-mono font-medium">{coupon.code}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatPercentage(coupon.conversion_rate)} conversão
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{coupon.uses_count} usos</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(coupon.revenue_saved)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Conversão Média</CardTitle>
                <CardDescription>
                  Performance geral dos cupons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {formatPercentage(dashboardData.average_conversion_rate)}
                  </div>
                  <p className="text-muted-foreground">
                    Taxa de conversão média
                  </p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(dashboardData.average_conversion_rate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Daily Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Diárias (Últimos 30 dias)</CardTitle>
              <CardDescription>
                Visualizações, cliques e usos por dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dashboardData.daily_metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => formatDate(value)}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value, name) => [
                      value.toLocaleString(),
                      name === 'views' ? 'Visualizações' :
                      name === 'clicks' ? 'Cliques' :
                      name === 'uses' ? 'Usos' :
                      name === 'new_users' ? 'Novos Usuários' :
                      name === 'revenue_saved' ? 'Receita Economizada' : name
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="views"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="clicks"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uses" 
                    stroke="#ffc658" 
                    strokeWidth={2}
                    name="uses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas ações nos cupons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recent_activity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-mono font-medium">{activity.code}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.action}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(activity.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
