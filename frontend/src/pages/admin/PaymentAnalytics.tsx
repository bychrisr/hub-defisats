import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { 
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  BarChart3,
  BarChart,
  LineChart,
  PieChart,
  Activity,
  Target,
  Shield,
  Star,
  Crown,
  Gem,
  Gift,
  Settings,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageTransactionValue: number;
  lightningPayments: number;
  fiatPayments: number;
  conversionRate: number;
  refundRate: number;
  chargebackRate: number;
  revenueGrowth: number;
  transactionGrowth: number;
  topPlanRevenue: string;
  averageRevenuePerUser: number;
}

interface PaymentTransaction {
  id: string;
  userId: string;
  userEmail: string;
  planType: string;
  timestamp: string;
  amount: number;
  currency: 'sats' | 'USD' | 'BRL';
  paymentMethod: 'lightning' | 'fiat' | 'crypto';
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
  description: string;
  invoiceId?: string;
  txHash?: string;
  fee: number;
  netAmount: number;
  planName: string;
  duration: number;
  isRecurring: boolean;
  nextBillingDate?: string;
}

interface RevenueByPlan {
  planType: string;
  planName: string;
  revenue: number;
  transactions: number;
  users: number;
  averageRevenue: number;
  growth: number;
}

interface PaymentTrend {
  date: string;
  revenue: number;
  transactions: number;
  lightningPayments: number;
  fiatPayments: number;
  successRate: number;
}

export default function PaymentAnalytics() {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [revenueByPlan, setRevenueByPlan] = useState<RevenueByPlan[]>([]);
  const [trends, setTrends] = useState<PaymentTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentMethod: 'all',
    planType: 'all',
    dateRange: '30d',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });

  // Ref para controlar se é o carregamento inicial
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  // Apenas carrega uma vez no início
  useEffect(() => {
    console.log('🔍 PAYMENT ANALYTICS - Initial load useEffect triggered');
    fetchPaymentData();
    isInitialLoad.current = false;
  }, []);

  // Recarrega quando os filtros mudam (mas não em loop)
  useEffect(() => {
    console.log('🔍 PAYMENT ANALYTICS - Filter change useEffect triggered', { 
      isInitialLoad: isInitialLoad.current,
      filters: { search: filters.search, status: filters.status, paymentMethod: filters.paymentMethod, planType: filters.planType, dateRange: filters.dateRange, sortBy: filters.sortBy, sortOrder: filters.sortOrder },
      lastFilters: lastFilters.current
    });
    
    // Só executa se não for o carregamento inicial e se os filtros realmente mudaram
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.status !== filters.status ||
        lastFilters.current.paymentMethod !== filters.paymentMethod ||
        lastFilters.current.planType !== filters.planType ||
        lastFilters.current.dateRange !== filters.dateRange ||
        lastFilters.current.sortBy !== filters.sortBy ||
        lastFilters.current.sortOrder !== filters.sortOrder;
      
      if (filtersChanged) {
        console.log('🔍 PAYMENT ANALYTICS - Filters changed, executing fetchPaymentData');
        lastFilters.current = { ...filters };
        fetchPaymentData();
      }
    }
  }, [filters.search, filters.status, filters.paymentMethod, filters.planType, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const fetchPaymentData = async () => {
    setRefreshing(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
      if (filters.planType) queryParams.append('planType', filters.planType);
      if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await api.get(`/api/admin/payments/analytics?${queryParams.toString()}`);

      if (response.data.success) {
        setMetrics(response.data.metrics);
        setTransactions(response.data.data);
        setRevenueByPlan(response.data.revenueByPlan || []);
        setTrends(response.data.trends || []);
        setLoading(false);
        setRefreshing(false);
        toast.success('Dados de pagamentos carregados com sucesso!');
      } else {
        throw new Error(response.data.message || 'Failed to fetch payment data');
      }

    } catch (error) {
      console.error('Error fetching payment data:', error);
      setLoading(false);
      setRefreshing(false);
      toast.error('Erro ao carregar dados de pagamentos');
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'free': return <Gift className="h-4 w-4" />;
      case 'basic': return <Zap className="h-4 w-4" />;
      case 'advanced': return <Star className="h-4 w-4" />;
      case 'pro': return <Crown className="h-4 w-4" />;
      case 'lifetime': return <Gem className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'free': return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
      case 'basic': return 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25';
      case 'advanced': return 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25';
      case 'pro': return 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25';
      case 'lifetime': return 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25';
      default: return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25';
      case 'FAILED': return 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25';
      case 'PENDING': return 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25';
      case 'REFUNDED': return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
      default: return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'lightning': return 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25';
      case 'fiat': return 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25';
      case 'crypto': return 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25';
      default: return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const formatCurrency = (value: number, currency: string = 'sats') => {
    if (currency === 'sats') {
      return `${value.toLocaleString('pt-BR')} sats`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <h3 className="text-xl font-semibold text-text-primary">Carregando Payment Analytics</h3>
                  <p className="text-text-secondary">Aguarde enquanto carregamos os dados de pagamentos...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Payment Analytics
                        </h1>
                        <p className="text-text-secondary">Análise completa de receita e pagamentos</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={fetchPaymentData}
                      disabled={refreshing}
                      className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      className="backdrop-blur-sm bg-green-600/90 hover:bg-green-600 text-white shadow-lg shadow-green-600/25"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="gradient-card-green profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Receita Total</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(metrics?.totalRevenue || 0)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-text-secondary">+{metrics?.revenueGrowth.toFixed(1)}% vs mês anterior</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 backdrop-blur-sm">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-blue profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Receita Mensal</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(metrics?.monthlyRevenue || 0)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-text-secondary">Janeiro 2024</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-yellow profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Transações</p>
                    <p className="text-2xl font-bold text-text-primary">{metrics?.totalTransactions.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-text-secondary">{metrics?.conversionRate.toFixed(1)}% sucesso</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 backdrop-blur-sm">
                    <Activity className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-purple profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Lightning Payments</p>
                    <p className="text-2xl font-bold text-text-primary">{metrics?.lightningPayments.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-text-secondary">{((metrics?.lightningPayments || 0) / (metrics?.totalTransactions || 1) * 100).toFixed(1)}% do total</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 backdrop-blur-sm">
                    <Zap className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Plan */}
          <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Receita por Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueByPlan.map((plan, index) => (
                  <div key={plan.planType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getPlanColor(plan.planType)}>
                          <div className="flex items-center gap-1">
                            {getPlanIcon(plan.planType)}
                            {plan.planName}
                          </div>
                        </Badge>
                        <span className="text-sm text-text-secondary">{plan.users} usuários</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-text-primary">
                          {formatCurrency(plan.revenue)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {plan.transactions} transações
                        </div>
                      </div>
                    </div>
                    <Progress value={(plan.revenue / (metrics?.totalRevenue || 1)) * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>Média: {formatCurrency(plan.averageRevenue)}</span>
                      <span className={cn(
                        "flex items-center gap-1",
                        plan.growth >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {plan.growth >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(plan.growth).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 profile-sidebar-glow backdrop-blur-sm bg-background/50 border-border/50">
                  <TabsTrigger 
                    value="overview" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger 
                    value="transactions" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Transações
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trends" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <LineChart className="h-4 w-4 mr-2" />
                    Tendências
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-green-500" />
                          Métricas de Conversão
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary">Taxa de Sucesso</span>
                            <div className="flex items-center gap-2">
                              <Progress value={metrics?.conversionRate || 0} className="w-20 h-2" />
                              <span className="text-sm font-semibold text-text-primary">{metrics?.conversionRate.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary">Taxa de Reembolso</span>
                            <div className="flex items-center gap-2">
                              <Progress value={metrics?.refundRate || 0} className="w-20 h-2" />
                              <span className="text-sm font-semibold text-text-primary">{metrics?.refundRate.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary">Taxa de Chargeback</span>
                            <div className="flex items-center gap-2">
                              <Progress value={metrics?.chargebackRate || 0} className="w-20 h-2" />
                              <span className="text-sm font-semibold text-text-primary">{metrics?.chargebackRate.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-500" />
                          Métodos de Pagamento
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary">Lightning Network</span>
                            <div className="flex items-center gap-2">
                              <Progress value={((metrics?.lightningPayments || 0) / (metrics?.totalTransactions || 1)) * 100} className="w-20 h-2" />
                              <span className="text-sm font-semibold text-text-primary">{metrics?.lightningPayments.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary">Fiat (USD/BRL)</span>
                            <div className="flex items-center gap-2">
                              <Progress value={((metrics?.fiatPayments || 0) / (metrics?.totalTransactions || 1)) * 100} className="w-20 h-2" />
                              <span className="text-sm font-semibold text-text-primary">{metrics?.fiatPayments.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary">Valor Médio</span>
                            <span className="text-sm font-semibold text-text-primary">{formatCurrency(metrics?.averageTransactionValue || 0)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="space-y-6">
                  {/* Filters */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                      <Filter className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary">Filtros</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar transações..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="pl-10 backdrop-blur-sm bg-background/50 border-border/50"
                      />
                    </div>
                    <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="SUCCESS">Sucesso</SelectItem>
                        <SelectItem value="FAILED">Falha</SelectItem>
                        <SelectItem value="PENDING">Pendente</SelectItem>
                        <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.paymentMethod} onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue placeholder="Método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="lightning">Lightning</SelectItem>
                        <SelectItem value="fiat">Fiat</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.planType} onValueChange={(value) => setFilters({ ...filters, planType: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue placeholder="Plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="lifetime">Lifetime</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue placeholder="Ordenar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="timestamp">Data</SelectItem>
                        <SelectItem value="amount">Valor</SelectItem>
                        <SelectItem value="userEmail">Usuário</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/20">
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Data
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Usuário
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Plano
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Valor
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Método
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Status
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Ações
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction, index) => (
                          <TableRow
                            key={transaction.id}
                            className={cn(
                              "hover:bg-background/50 transition-colors",
                              index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                            )}
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-text-primary">
                                  {new Date(transaction.timestamp).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="text-xs text-text-secondary">
                                  {new Date(transaction.timestamp).toLocaleTimeString('pt-BR')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-text-primary">{transaction.userEmail}</div>
                                <Badge className={getPlanColor(transaction.planType)}>
                                  <div className="flex items-center gap-1">
                                    {getPlanIcon(transaction.planType)}
                                    {transaction.planType.toUpperCase()}
                                  </div>
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-text-primary">{transaction.planName}</div>
                                <div className="text-xs text-text-secondary">
                                  {transaction.isRecurring ? 'Recorrente' : 'Único'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-text-primary">
                                  {formatCurrency(transaction.amount, transaction.currency)}
                                </div>
                                <div className="text-xs text-text-secondary">
                                  Taxa: {formatCurrency(transaction.fee, transaction.currency)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPaymentMethodColor(transaction.paymentMethod)}>
                                {transaction.paymentMethod.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="backdrop-blur-sm bg-background/50 hover:bg-background/70 border-border/50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Trends Tab */}
                <TabsContent value="trends" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <LineChart className="h-5 w-5 text-green-500" />
                          Evolução da Receita
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {trends.slice(-7).map((trend, index) => (
                            <div key={trend.date} className="flex items-center justify-between">
                              <span className="text-sm text-text-secondary">
                                {new Date(trend.date).toLocaleDateString('pt-BR')}
                              </span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-text-primary">
                                  {formatCurrency(trend.revenue)}
                                </span>
                                <span className="text-sm text-text-secondary">
                                  {trend.transactions} transações
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart className="h-5 w-5 text-blue-500" />
                          Taxa de Sucesso Diária
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {trends.slice(-7).map((trend, index) => (
                            <div key={trend.date} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-text-secondary">
                                  {new Date(trend.date).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="text-sm font-semibold text-text-primary">
                                  {trend.successRate.toFixed(1)}%
                                </span>
                              </div>
                              <Progress value={trend.successRate} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
