import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  Zap,
  Shield,
  Star,
  Crown,
  Gem,
  Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TradeLog {
  id: string;
  userId: string;
  userEmail: string;
  planType: string;
  timestamp: string;
  action: 'BUY' | 'SELL' | 'CLOSE' | 'OPEN';
  symbol: string;
  side: 'LONG' | 'SHORT';
  amount: number;
  price: number;
  pnl: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  automationId?: string;
  automationName?: string;
  errorMessage?: string;
  duration?: number;
  leverage: number;
  margin: number;
  volume: number;
}

interface TradeStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalVolume: number;
  totalPnL: number;
  averagePnL: number;
  winRate: number;
  averageDuration: number;
  automationTrades: number;
  manualTrades: number;
}

export default function TradeLogs() {
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    action: 'all',
    planType: 'all',
    dateRange: '7d',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [selectedLog, setSelectedLog] = useState<TradeLog | null>(null);

  // Ref para controlar se é o carregamento inicial
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  // Apenas carrega uma vez no início
  useEffect(() => {
    console.log('🔍 TRADE LOGS - Initial load useEffect triggered');
    fetchTradeLogs();
    isInitialLoad.current = false;
  }, []);

  // Recarrega quando os filtros mudam (mas não em loop)
  useEffect(() => {
    console.log('🔍 TRADE LOGS - Filter change useEffect triggered', { 
      isInitialLoad: isInitialLoad.current,
      filters: { search: filters.search, status: filters.status, action: filters.action, planType: filters.planType, dateRange: filters.dateRange, sortBy: filters.sortBy, sortOrder: filters.sortOrder },
      lastFilters: lastFilters.current
    });
    
    // Só executa se não for o carregamento inicial e se os filtros realmente mudaram
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.status !== filters.status ||
        lastFilters.current.action !== filters.action ||
        lastFilters.current.planType !== filters.planType ||
        lastFilters.current.dateRange !== filters.dateRange ||
        lastFilters.current.sortBy !== filters.sortBy ||
        lastFilters.current.sortOrder !== filters.sortOrder;
      
      if (filtersChanged) {
        console.log('🔍 TRADE LOGS - Filters changed, executing fetchTradeLogs');
        lastFilters.current = { ...filters };
        fetchTradeLogs();
      }
    }
  }, [filters.search, filters.status, filters.action, filters.planType, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const fetchTradeLogs = async () => {
    setRefreshing(true);
    try {
      // Simular dados de trade logs
      const mockLogs: TradeLog[] = [
        {
          id: '1',
          userId: '1',
          userEmail: 'trader1@example.com',
          planType: 'pro',
          timestamp: '2024-01-22T10:30:00Z',
          action: 'BUY',
          symbol: 'BTC/USD',
          side: 'LONG',
          amount: 0.1,
          price: 45000,
          pnl: 2500,
          status: 'SUCCESS',
          automationId: 'auto-1',
          automationName: 'BTC Momentum',
          leverage: 10,
          margin: 4500,
          volume: 4500,
          duration: 3600
        },
        {
          id: '2',
          userId: '2',
          userEmail: 'trader2@example.com',
          planType: 'advanced',
          timestamp: '2024-01-22T10:25:00Z',
          action: 'SELL',
          symbol: 'ETH/USD',
          side: 'SHORT',
          amount: 2.5,
          price: 3200,
          pnl: -1200,
          status: 'FAILED',
          errorMessage: 'Insufficient margin',
          leverage: 5,
          margin: 16000,
          volume: 8000
        },
        {
          id: '3',
          userId: '3',
          userEmail: 'trader3@example.com',
          planType: 'basic',
          timestamp: '2024-01-22T10:20:00Z',
          action: 'CLOSE',
          symbol: 'BTC/USD',
          side: 'LONG',
          amount: 0.05,
          price: 44800,
          pnl: 800,
          status: 'SUCCESS',
          leverage: 20,
          margin: 1120,
          volume: 2240,
          duration: 7200
        },
        {
          id: '4',
          userId: '4',
          userEmail: 'trader4@example.com',
          planType: 'lifetime',
          timestamp: '2024-01-22T10:15:00Z',
          action: 'OPEN',
          symbol: 'SOL/USD',
          side: 'LONG',
          amount: 100,
          price: 95,
          pnl: 0,
          status: 'PENDING',
          leverage: 3,
          margin: 3167,
          volume: 9500
        },
        {
          id: '5',
          userId: '5',
          userEmail: 'trader5@example.com',
          planType: 'free',
          timestamp: '2024-01-22T10:10:00Z',
          action: 'BUY',
          symbol: 'BTC/USD',
          side: 'LONG',
          amount: 0.01,
          price: 44900,
          pnl: 150,
          status: 'SUCCESS',
          leverage: 2,
          margin: 2245,
          volume: 449
        }
      ];

      const mockStats: TradeStats = {
        totalTrades: 15420,
        successfulTrades: 12336,
        failedTrades: 3084,
        totalVolume: 125000000,
        totalPnL: 2847500,
        averagePnL: 184.6,
        winRate: 80.0,
        averageDuration: 5400,
        automationTrades: 12300,
        manualTrades: 3120
      };

      setTimeout(() => {
        setLogs(mockLogs);
        setStats(mockStats);
        setLoading(false);
        setRefreshing(false);
        toast.success('Logs de trades carregados com sucesso!');
      }, 1000);
    } catch (error) {
      console.error('Error fetching trade logs:', error);
      setLoading(false);
      setRefreshing(false);
      toast.error('Erro ao carregar logs de trades');
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
      default: return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25';
      case 'SELL': return 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25';
      case 'OPEN': return 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25';
      case 'CLOSE': return 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25';
      default: return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'LONG' 
      ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
      : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25';
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
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
                  <h3 className="text-xl font-semibold text-text-primary">Carregando Trade Logs</h3>
                  <p className="text-text-secondary">Aguarde enquanto carregamos os logs de trades...</p>
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
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Trade Logs
                        </h1>
                        <p className="text-text-secondary">Gestão e análise de logs de trades</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={fetchTradeLogs}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="gradient-card-blue profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Total de Trades</p>
                    <p className="text-2xl font-bold text-text-primary">{stats?.totalTrades.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-text-secondary">Últimos 30 dias</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-green profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-text-primary">{stats?.winRate.toFixed(1)}%</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-text-secondary">{stats?.successfulTrades.toLocaleString()} sucessos</span>
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
                    <p className="text-2xl font-bold text-text-primary">{formatSats(stats?.totalPnL || 0)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-text-secondary">Média: {formatSats(stats?.averagePnL || 0)}</span>
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
                    <p className="text-sm font-medium text-text-secondary">Volume Total</p>
                    <p className="text-2xl font-bold text-text-primary">{formatSats(stats?.totalVolume || 0)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      <span className="text-xs text-text-secondary">Todas as operações</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 backdrop-blur-sm">
                    <BarChart3 className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 profile-sidebar-glow backdrop-blur-sm bg-background/50 border-border/50">
                  <TabsTrigger 
                    value="all" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Todos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="success" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Sucessos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="failed" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Falhas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="automation" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Automação
                  </TabsTrigger>
                </TabsList>

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
                      placeholder="Buscar trades..."
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
                    </SelectContent>
                  </Select>
                  <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                    <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="BUY">Compra</SelectItem>
                      <SelectItem value="SELL">Venda</SelectItem>
                      <SelectItem value="OPEN">Abertura</SelectItem>
                      <SelectItem value="CLOSE">Fechamento</SelectItem>
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
                      <SelectItem value="pnl">P&L</SelectItem>
                      <SelectItem value="amount">Valor</SelectItem>
                      <SelectItem value="userEmail">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Logs Table */}
                <div className="overflow-x-auto rounded-lg border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-background/20">
                        <TableHead className="font-semibold text-text-primary">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Timestamp
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
                            <Activity className="h-4 w-4" />
                            Ação
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-text-primary">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Par
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
                            <TrendingUp className="h-4 w-4" />
                            P&L
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
                      {logs.map((log, index) => (
                        <TableRow
                          key={log.id}
                          className={cn(
                            "hover:bg-background/50 transition-colors",
                            index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                          )}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-text-primary">
                                {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-text-primary">{log.userEmail}</div>
                              <Badge className={getPlanColor(log.planType)}>
                                <div className="flex items-center gap-1">
                                  {getPlanIcon(log.planType)}
                                  {log.planType.toUpperCase()}
                                </div>
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={getActionColor(log.action)}>
                                {log.action}
                              </Badge>
                              <Badge className={getSideColor(log.side)}>
                                {log.side}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-text-primary">{log.symbol}</div>
                              <div className="text-xs text-text-secondary">
                                {log.leverage}x leverage
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-text-primary">
                                {log.amount.toFixed(4)} {log.symbol.split('/')[0]}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {formatSats(log.volume)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={cn(
                              "text-sm font-semibold",
                              log.pnl >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {log.pnl >= 0 ? '+' : ''}{formatSats(log.pnl)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
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
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
