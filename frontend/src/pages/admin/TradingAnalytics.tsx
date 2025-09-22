import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Target,
  Clock,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  PieChart,
  LineChart,
  BarChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Crown,
  Gem,
  Gift,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TradingMetrics {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  winRate: number;
  totalPnL: number;
  averagePnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  activePositions: number;
  totalVolume: number;
  averageTradeSize: number;
  bestTrade: number;
  worstTrade: number;
  tradingFrequency: number;
  riskRewardRatio: number;
}

interface UserTradingStats {
  userId: string;
  email: string;
  planType: string;
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  activePositions: number;
  lastTradeDate: string;
  tradingFrequency: number;
  riskScore: number;
  automationCount: number;
  isActive: boolean;
}

interface TradingTrend {
  date: string;
  trades: number;
  pnl: number;
  volume: number;
  winRate: number;
}

export default function TradingAnalytics() {
  const [metrics, setMetrics] = useState<TradingMetrics | null>(null);
  const [userStats, setUserStats] = useState<UserTradingStats[]>([]);
  const [trends, setTrends] = useState<TradingTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    search: '',
    planType: 'all',
    timeRange: '7d',
    sortBy: 'totalPnL'
  });

  // Ref para controlar se é o carregamento inicial
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  // Apenas carrega uma vez no início
  useEffect(() => {
    console.log('🔍 TRADING ANALYTICS - Initial load useEffect triggered');
    fetchTradingData();
    isInitialLoad.current = false;
  }, []);

  // Recarrega quando os filtros mudam (mas não em loop)
  useEffect(() => {
    console.log('🔍 TRADING ANALYTICS - Filter change useEffect triggered', { 
      isInitialLoad: isInitialLoad.current,
      filters: { search: filters.search, planType: filters.planType, timeRange: filters.timeRange, sortBy: filters.sortBy },
      lastFilters: lastFilters.current
    });
    
    // Só executa se não for o carregamento inicial e se os filtros realmente mudaram
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.planType !== filters.planType ||
        lastFilters.current.timeRange !== filters.timeRange ||
        lastFilters.current.sortBy !== filters.sortBy;
      
      if (filtersChanged) {
        console.log('🔍 TRADING ANALYTICS - Filters changed, executing fetchTradingData');
        lastFilters.current = { ...filters };
        fetchTradingData();
      }
    }
  }, [filters.search, filters.planType, filters.timeRange, filters.sortBy]);

  const fetchTradingData = async () => {
    setRefreshing(true);
    try {
      // Simular dados de trading analytics
      const mockMetrics: TradingMetrics = {
        totalTrades: 15420,
        successfulTrades: 12336,
        failedTrades: 3084,
        winRate: 80.0,
        totalPnL: 2847500,
        averagePnL: 184.6,
        maxDrawdown: -12500,
        sharpeRatio: 1.85,
        volatility: 0.23,
        activePositions: 156,
        totalVolume: 125000000,
        averageTradeSize: 8105,
        bestTrade: 25000,
        worstTrade: -8500,
        tradingFrequency: 12.5,
        riskRewardRatio: 2.1
      };

      const mockUserStats: UserTradingStats[] = [
        {
          userId: '1',
          email: 'trader1@example.com',
          planType: 'pro',
          totalTrades: 1250,
          winRate: 85.2,
          totalPnL: 125000,
          activePositions: 8,
          lastTradeDate: '2024-01-22T10:30:00Z',
          tradingFrequency: 15.2,
          riskScore: 0.3,
          automationCount: 5,
          isActive: true
        },
        {
          userId: '2',
          email: 'trader2@example.com',
          planType: 'advanced',
          totalTrades: 890,
          winRate: 78.5,
          totalPnL: 85000,
          activePositions: 12,
          lastTradeDate: '2024-01-22T09:15:00Z',
          tradingFrequency: 11.8,
          riskScore: 0.5,
          automationCount: 3,
          isActive: true
        },
        {
          userId: '3',
          email: 'trader3@example.com',
          planType: 'basic',
          totalTrades: 450,
          winRate: 72.1,
          totalPnL: 25000,
          activePositions: 5,
          lastTradeDate: '2024-01-21T16:45:00Z',
          tradingFrequency: 8.5,
          riskScore: 0.7,
          automationCount: 2,
          isActive: true
        },
        {
          userId: '4',
          email: 'trader4@example.com',
          planType: 'lifetime',
          totalTrades: 2100,
          winRate: 88.9,
          totalPnL: 185000,
          activePositions: 15,
          lastTradeDate: '2024-01-22T11:20:00Z',
          tradingFrequency: 18.5,
          riskScore: 0.2,
          automationCount: 8,
          isActive: true
        },
        {
          userId: '5',
          email: 'trader5@example.com',
          planType: 'free',
          totalTrades: 120,
          winRate: 65.0,
          totalPnL: 5000,
          activePositions: 2,
          lastTradeDate: '2024-01-20T14:30:00Z',
          tradingFrequency: 4.2,
          riskScore: 0.8,
          automationCount: 1,
          isActive: false
        }
      ];

      const mockTrends: TradingTrend[] = [
        { date: '2024-01-15', trades: 1200, pnl: 45000, volume: 12000000, winRate: 78.5 },
        { date: '2024-01-16', trades: 1350, pnl: 52000, volume: 13500000, winRate: 80.2 },
        { date: '2024-01-17', trades: 1100, pnl: 38000, volume: 11000000, winRate: 75.8 },
        { date: '2024-01-18', trades: 1450, pnl: 61000, volume: 14500000, winRate: 82.1 },
        { date: '2024-01-19', trades: 1300, pnl: 48000, volume: 13000000, winRate: 79.3 },
        { date: '2024-01-20', trades: 1250, pnl: 55000, volume: 12500000, winRate: 81.5 },
        { date: '2024-01-21', trades: 1400, pnl: 58000, volume: 14000000, winRate: 83.2 },
        { date: '2024-01-22', trades: 1320, pnl: 51000, volume: 13200000, winRate: 80.0 }
      ];

      setTimeout(() => {
        setMetrics(mockMetrics);
        setUserStats(mockUserStats);
        setTrends(mockTrends);
        setLoading(false);
        setRefreshing(false);
        toast.success('Dados de trading carregados com sucesso!');
      }, 1000);
    } catch (error) {
      console.error('Error fetching trading data:', error);
      setLoading(false);
      setRefreshing(false);
      toast.error('Erro ao carregar dados de trading');
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'free':
        return <Gift className="h-4 w-4" />;
      case 'basic':
        return <Zap className="h-4 w-4" />;
      case 'advanced':
        return <Star className="h-4 w-4" />;
      case 'pro':
        return <Crown className="h-4 w-4" />;
      case 'lifetime':
        return <Gem className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'free':
        return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
      case 'basic':
        return 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25';
      case 'advanced':
        return 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25';
      case 'pro':
        return 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25';
      case 'lifetime':
        return 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 0.3) return 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25';
    if (riskScore <= 0.6) return 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25';
    return 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore <= 0.3) return 'Baixo';
    if (riskScore <= 0.6) return 'Médio';
    return 'Alto';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatSats = (value: number) => {
    return `${value.toLocaleString('pt-BR')} sats`;
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
                  <h3 className="text-xl font-semibold text-text-primary">Carregando Trading Analytics</h3>
                  <p className="text-text-secondary">Aguarde enquanto carregamos os dados de trading...</p>
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
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Trading Analytics
                        </h1>
                        <p className="text-text-secondary">Análise completa de performance de trading</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={fetchTradingData}
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
            <Card className="gradient-card-blue profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Total de Trades</p>
                    <p className="text-2xl font-bold text-text-primary">{metrics?.totalTrades.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-text-secondary">+12.5% vs mês anterior</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                    <Activity className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-green profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-text-primary">{metrics?.winRate.toFixed(1)}%</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-text-secondary">{metrics?.successfulTrades.toLocaleString()} sucessos</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 backdrop-blur-sm">
                    <Target className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-yellow profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">P&L Total</p>
                    <p className="text-2xl font-bold text-text-primary">{formatSats(metrics?.totalPnL || 0)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-text-secondary">+8.2% vs mês anterior</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 backdrop-blur-sm">
                    <DollarSign className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-purple profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Posições Ativas</p>
                    <p className="text-2xl font-bold text-text-primary">{metrics?.activePositions}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-text-secondary">Em tempo real</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 backdrop-blur-sm">
                    <Zap className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                    <BarChart className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Performance</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Sharpe Ratio</span>
                    <span className="font-semibold text-text-primary">{metrics?.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Volatilidade</span>
                    <span className="font-semibold text-text-primary">{(metrics?.volatility || 0) * 100}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Max Drawdown</span>
                    <span className="font-semibold text-red-500">{formatSats(metrics?.maxDrawdown || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Risk/Reward</span>
                    <span className="font-semibold text-text-primary">{metrics?.riskRewardRatio.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Trading Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">P&L Médio</span>
                    <span className="font-semibold text-text-primary">{formatSats(metrics?.averagePnL || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Volume Total</span>
                    <span className="font-semibold text-text-primary">{formatSats(metrics?.totalVolume || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Tamanho Médio</span>
                    <span className="font-semibold text-text-primary">{formatSats(metrics?.averageTradeSize || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Frequência</span>
                    <span className="font-semibold text-text-primary">{metrics?.tradingFrequency.toFixed(1)}/dia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Extremos</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Melhor Trade</span>
                    <span className="font-semibold text-green-500">{formatSats(metrics?.bestTrade || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Pior Trade</span>
                    <span className="font-semibold text-red-500">{formatSats(metrics?.worstTrade || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Trades Falhados</span>
                    <span className="font-semibold text-text-primary">{metrics?.failedTrades.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Taxa de Falha</span>
                    <span className="font-semibold text-text-primary">{((metrics?.failedTrades || 0) / (metrics?.totalTrades || 1) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                    value="users" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Usuários
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
                          <PieChart className="h-5 w-5 text-blue-500" />
                          Distribuição de Trades
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-text-secondary">Trades Sucessos</span>
                            <div className="flex items-center gap-2">
                              <Progress value={metrics?.winRate || 0} className="w-20 h-2" />
                              <span className="text-sm font-semibold text-text-primary">{metrics?.winRate.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-text-secondary">Trades Falhados</span>
                            <div className="flex items-center gap-2">
                              <Progress value={100 - (metrics?.winRate || 0)} className="w-20 h-2" />
                              <span className="text-sm font-semibold text-text-primary">{(100 - (metrics?.winRate || 0)).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-green-500" />
                          Status Atual
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-text-secondary">Usuários Ativos</span>
                            <Badge className="bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25">
                              {userStats.filter(u => u.isActive).length}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-text-secondary">Automações Ativas</span>
                            <Badge className="bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25">
                              {userStats.reduce((sum, u) => sum + u.automationCount, 0)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-text-secondary">Plano Mais Usado</span>
                            <Badge className="bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25">
                              Pro
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-6">
                  {/* Filters */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                      <Filter className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary">Filtros</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar usuários..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="pl-10 backdrop-blur-sm bg-background/50 border-border/50"
                      />
                    </div>
                    <Select value={filters.planType} onValueChange={(value) => setFilters({ ...filters, planType: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue placeholder="Tipo de Plano" />
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
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="totalPnL">P&L Total</SelectItem>
                        <SelectItem value="winRate">Taxa de Sucesso</SelectItem>
                        <SelectItem value="totalTrades">Total de Trades</SelectItem>
                        <SelectItem value="tradingFrequency">Frequência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/20">
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Usuário
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4" />
                              Plano
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Trades
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Win Rate
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              P&L
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Risco
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Status
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userStats.map((user, index) => (
                          <TableRow
                            key={user.userId}
                            className={cn(
                              "hover:bg-background/50 transition-colors",
                              index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                            )}
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-text-primary">{user.email}</div>
                                <div className="text-sm text-text-secondary">
                                  {user.automationCount} automações
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPlanColor(user.planType)}>
                                <div className="flex items-center gap-1">
                                  {getPlanIcon(user.planType)}
                                  {user.planType.toUpperCase()}
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-text-primary">{user.totalTrades.toLocaleString()}</div>
                              <div className="text-xs text-text-secondary">{user.tradingFrequency.toFixed(1)}/dia</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={user.winRate} className="w-16 h-2" />
                                <span className="text-sm font-semibold text-text-primary">{user.winRate.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={cn(
                                "text-sm font-semibold",
                                user.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                              )}>
                                {formatSats(user.totalPnL)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRiskColor(user.riskScore)}>
                                {getRiskLabel(user.riskScore)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "font-semibold px-3 py-1 rounded-full border-0",
                                  user.isActive
                                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                                    : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
                                )}
                              >
                                {user.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
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
                          <LineChart className="h-5 w-5 text-blue-500" />
                          Evolução de Trades
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
                                  {trend.trades} trades
                                </span>
                                <span className={cn(
                                  "text-sm font-semibold",
                                  trend.pnl >= 0 ? "text-green-500" : "text-red-500"
                                )}>
                                  {formatSats(trend.pnl)}
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
                          <BarChart className="h-5 w-5 text-green-500" />
                          Performance por Dia
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
                                  {trend.winRate.toFixed(1)}%
                                </span>
                              </div>
                              <Progress value={trend.winRate} className="h-2" />
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
