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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Settings,
  FileText,
  Play,
  Pause,
  Square,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BacktestReport {
  id: string;
  name: string;
  strategy: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  createdAt: string;
  completedAt?: string;
  duration: number; // in seconds
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  startDate: string;
  endDate: string;
  timeframe: string;
  symbol: string;
  initialCapital: number;
  finalCapital: number;
  userId: string;
  userEmail: string;
  planType: string;
}

interface BacktestMetrics {
  totalReports: number;
  runningReports: number;
  completedReports: number;
  failedReports: number;
  avgWinRate: number;
  avgSharpeRatio: number;
  totalPnL: number;
  bestStrategy: string;
  worstStrategy: string;
}

export default function BacktestReports() {
  const [reports, setReports] = useState<BacktestReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<BacktestMetrics | null>(null);
  const [selectedReport, setSelectedReport] = useState<BacktestReport | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    strategy: 'all',
    planType: 'all',
    dateRange: '30d',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Ref para controlar se é o carregamento inicial
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  // Apenas carrega uma vez no início
  useEffect(() => {
    console.log('🔍 BACKTEST REPORTS - Initial load useEffect triggered');
    fetchBacktestReports();
    isInitialLoad.current = false;
  }, []);

  // Recarrega quando os filtros mudam (mas não em loop)
  useEffect(() => {
    console.log('🔍 BACKTEST REPORTS - Filter change useEffect triggered', { 
      isInitialLoad: isInitialLoad.current,
      filters: { search: filters.search, status: filters.status, strategy: filters.strategy, planType: filters.planType, dateRange: filters.dateRange, sortBy: filters.sortBy, sortOrder: filters.sortOrder },
      lastFilters: lastFilters.current
    });
    
    // Só executa se não for o carregamento inicial e se os filtros realmente mudaram
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.status !== filters.status ||
        lastFilters.current.strategy !== filters.strategy ||
        lastFilters.current.planType !== filters.planType ||
        lastFilters.current.dateRange !== filters.dateRange ||
        lastFilters.current.sortBy !== filters.sortBy ||
        lastFilters.current.sortOrder !== filters.sortOrder;
      
      if (filtersChanged) {
        console.log('🔍 BACKTEST REPORTS - Filters changed, executing fetchBacktestReports');
        lastFilters.current = { ...filters };
        fetchBacktestReports();
      }
    }
  }, [filters.search, filters.status, filters.strategy, filters.planType, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const fetchBacktestReports = async () => {
    setRefreshing(true);
    try {
      // Simular dados de backtest reports
      const mockReports: BacktestReport[] = [
        {
          id: '1',
          name: 'EMA Crossover Strategy',
          strategy: 'EMA_CROSSOVER',
          status: 'completed',
          createdAt: '2025-01-15T10:30:00Z',
          completedAt: '2025-01-15T10:45:00Z',
          duration: 900,
          totalTrades: 156,
          winningTrades: 89,
          losingTrades: 67,
          winRate: 57.05,
          totalPnL: 2450.75,
          maxDrawdown: -320.50,
          sharpeRatio: 1.85,
          profitFactor: 1.42,
          avgWin: 45.20,
          avgLoss: -28.15,
          largestWin: 180.75,
          largestLoss: -95.30,
          consecutiveWins: 8,
          consecutiveLosses: 5,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          timeframe: '1h',
          symbol: 'BTCUSD',
          initialCapital: 10000,
          finalCapital: 12450.75,
          userId: 'user1',
          userEmail: 'trader1@example.com',
          planType: 'pro'
        },
        {
          id: '2',
          name: 'RSI Mean Reversion',
          strategy: 'RSI_MEAN_REVERSION',
          status: 'running',
          createdAt: '2025-01-15T11:00:00Z',
          duration: 1800,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPnL: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          profitFactor: 0,
          avgWin: 0,
          avgLoss: 0,
          largestWin: 0,
          largestLoss: 0,
          consecutiveWins: 0,
          consecutiveLosses: 0,
          startDate: '2024-06-01',
          endDate: '2024-12-31',
          timeframe: '4h',
          symbol: 'ETHUSD',
          initialCapital: 5000,
          finalCapital: 5000,
          userId: 'user2',
          userEmail: 'trader2@example.com',
          planType: 'advanced'
        },
        {
          id: '3',
          name: 'Bollinger Bands Strategy',
          strategy: 'BOLLINGER_BANDS',
          status: 'failed',
          createdAt: '2025-01-15T09:15:00Z',
          completedAt: '2025-01-15T09:20:00Z',
          duration: 300,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPnL: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          profitFactor: 0,
          avgWin: 0,
          avgLoss: 0,
          largestWin: 0,
          largestLoss: 0,
          consecutiveWins: 0,
          consecutiveLosses: 0,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          timeframe: '1d',
          symbol: 'BTCUSD',
          initialCapital: 10000,
          finalCapital: 10000,
          userId: 'user3',
          userEmail: 'trader3@example.com',
          planType: 'basic'
        }
      ];

      const mockMetrics: BacktestMetrics = {
        totalReports: 3,
        runningReports: 1,
        completedReports: 1,
        failedReports: 1,
        avgWinRate: 57.05,
        avgSharpeRatio: 1.85,
        totalPnL: 2450.75,
        bestStrategy: 'EMA Crossover Strategy',
        worstStrategy: 'Bollinger Bands Strategy'
      };

      setReports(mockReports);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching backtest reports:', error);
      toast.error('Failed to fetch backtest reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500 text-white">Running</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500 text-white">Paused</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                    <h3 className="text-lg font-semibold text-text-primary">Loading Backtest Reports</h3>
                    <p className="text-sm text-text-secondary">Fetching backtest data...</p>
                  </div>
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
                          Backtest Reports
                        </h1>
                        <p className="text-text-secondary">Manage and analyze backtest reports</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => fetchBacktestReports()} 
                      disabled={refreshing}
                      className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button 
                      className="backdrop-blur-sm bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      New Backtest
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Total Reports</p>
                      <p className="text-2xl font-bold text-text-primary">{metrics.totalReports}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Running</p>
                      <p className="text-2xl font-bold text-blue-500">{metrics.runningReports}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                      <Activity className="h-6 w-6 text-blue-500 animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Completed</p>
                      <p className="text-2xl font-bold text-green-500">{metrics.completedReports}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Total P&L</p>
                      <p className="text-2xl font-bold text-text-primary">{formatCurrency(metrics.totalPnL)}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10">
                      <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.strategy} onValueChange={(value) => setFilters({ ...filters, strategy: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Strategies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Strategies</SelectItem>
                    <SelectItem value="EMA_CROSSOVER">EMA Crossover</SelectItem>
                    <SelectItem value="RSI_MEAN_REVERSION">RSI Mean Reversion</SelectItem>
                    <SelectItem value="BOLLINGER_BANDS">Bollinger Bands</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.planType} onValueChange={(value) => setFilters({ ...filters, planType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ search: '', status: 'all', strategy: 'all', planType: 'all', dateRange: '30d', sortBy: 'createdAt', sortOrder: 'desc' })}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Backtest Reports</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Showing {reports.length} reports
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Report
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Status
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Strategy
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
                          <TrendingUp className="h-4 w-4" />
                          Win Rate
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Duration
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          User
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary w-[50px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report, index) => (
                      <TableRow 
                        key={report.id}
                        className={cn(
                          "hover:bg-background/50 transition-colors duration-200",
                          index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                        )}
                      >
                        <TableCell className="font-medium text-text-primary">
                          <div>
                            <div className="font-medium">{report.name}</div>
                            <div className="text-sm text-text-secondary">{report.symbol} • {report.timeframe}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(report.status)}
                            {getStatusBadge(report.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {report.strategy.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "font-semibold",
                            report.totalPnL > 0 ? "text-green-500" : report.totalPnL < 0 ? "text-red-500" : "text-text-secondary"
                          )}>
                            {formatCurrency(report.totalPnL)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{report.winRate.toFixed(1)}%</div>
                            <Progress value={report.winRate} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-text-secondary">
                            {formatDuration(report.duration)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{report.userEmail}</div>
                            <Badge variant="outline" className="text-xs">
                              {report.planType.toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                              className="hover:bg-accent hover:text-accent-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-accent hover:text-accent-foreground"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Report Details Dialog */}
          {selectedReport && (
            <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    {selectedReport.name}
                  </DialogTitle>
                  <DialogDescription>
                    Detailed backtest report analysis
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Strategy:</span>
                          <span className="font-medium">{selectedReport.strategy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Symbol:</span>
                          <span className="font-medium">{selectedReport.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Timeframe:</span>
                          <span className="font-medium">{selectedReport.timeframe}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Period:</span>
                          <span className="font-medium">{selectedReport.startDate} - {selectedReport.endDate}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Total P&L:</span>
                          <span className={cn(
                            "font-medium",
                            selectedReport.totalPnL > 0 ? "text-green-500" : selectedReport.totalPnL < 0 ? "text-red-500" : "text-text-secondary"
                          )}>
                            {formatCurrency(selectedReport.totalPnL)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Win Rate:</span>
                          <span className="font-medium">{selectedReport.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Sharpe Ratio:</span>
                          <span className="font-medium">{selectedReport.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Max Drawdown:</span>
                          <span className="font-medium text-red-500">{formatCurrency(selectedReport.maxDrawdown)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Trading Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Trading Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{selectedReport.totalTrades}</div>
                          <div className="text-sm text-text-secondary">Total Trades</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">{selectedReport.winningTrades}</div>
                          <div className="text-sm text-text-secondary">Winning Trades</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-500">{selectedReport.losingTrades}</div>
                          <div className="text-sm text-text-secondary">Losing Trades</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{selectedReport.profitFactor.toFixed(2)}</div>
                          <div className="text-sm text-text-secondary">Profit Factor</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
