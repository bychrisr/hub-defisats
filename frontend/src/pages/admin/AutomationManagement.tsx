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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  Play,
  Pause,
  Square,
  RotateCcw,
  Bot,
  Cpu,
  Database,
  BarChart2,
  Edit,
  Trash2,
  Copy,
  Power,
  PowerOff,
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Automation {
  id: string;
  name: string;
  type: 'dca' | 'grid' | 'martingale' | 'scalping' | 'arbitrage' | 'custom';
  status: 'active' | 'paused' | 'stopped' | 'error';
  userId: string;
  userEmail: string;
  planType: string;
  createdAt: string;
  lastExecuted?: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  totalPnL: number;
  avgExecutionTime: number; // in seconds
  maxDrawdown: number;
  currentDrawdown: number;
  riskLevel: 'low' | 'medium' | 'high';
  parameters: {
    symbol: string;
    timeframe: string;
    amount: number;
    stopLoss?: number;
    takeProfit?: number;
    maxPositions?: number;
    customSettings?: Record<string, any>;
  };
  performance: {
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    consecutiveWins: number;
    consecutiveLosses: number;
  };
  alerts: {
    enabled: boolean;
    email: boolean;
    telegram: boolean;
    webhook: boolean;
  };
}

interface AutomationMetrics {
  totalAutomations: number;
  activeAutomations: number;
  pausedAutomations: number;
  stoppedAutomations: number;
  errorAutomations: number;
  avgSuccessRate: number;
  totalPnL: number;
  totalExecutions: number;
  bestPerformer: string;
  worstPerformer: string;
}

export default function AutomationManagement() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<AutomationMetrics | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    planType: 'all',
    riskLevel: 'all',
    dateRange: '30d',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Ref para controlar se é o carregamento inicial
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  // Apenas carrega uma vez no início
  useEffect(() => {
    console.log('🔍 AUTOMATION MANAGEMENT - Initial load useEffect triggered');
    fetchAutomations();
    isInitialLoad.current = false;
  }, []);

  // Recarrega quando os filtros mudam (mas não em loop)
  useEffect(() => {
    console.log('🔍 AUTOMATION MANAGEMENT - Filter change useEffect triggered', { 
      isInitialLoad: isInitialLoad.current,
      filters: { search: filters.search, type: filters.type, status: filters.status, planType: filters.planType, riskLevel: filters.riskLevel, dateRange: filters.dateRange, sortBy: filters.sortBy, sortOrder: filters.sortOrder },
      lastFilters: lastFilters.current
    });
    
    // Só executa se não for o carregamento inicial e se os filtros realmente mudaram
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.type !== filters.type ||
        lastFilters.current.status !== filters.status ||
        lastFilters.current.planType !== filters.planType ||
        lastFilters.current.riskLevel !== filters.riskLevel ||
        lastFilters.current.dateRange !== filters.dateRange ||
        lastFilters.current.sortBy !== filters.sortBy ||
        lastFilters.current.sortOrder !== filters.sortOrder;
      
      if (filtersChanged) {
        console.log('🔍 AUTOMATION MANAGEMENT - Filters changed, executing fetchAutomations');
        lastFilters.current = { ...filters };
        fetchAutomations();
      }
    }
  }, [filters.search, filters.type, filters.status, filters.planType, filters.riskLevel, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const fetchAutomations = async () => {
    setRefreshing(true);
    try {
      // Simular dados de automações
      const mockAutomations: Automation[] = [
        {
          id: '1',
          name: 'BTC DCA Strategy',
          type: 'dca',
          status: 'active',
          userId: 'user1',
          userEmail: 'trader1@example.com',
          planType: 'pro',
          createdAt: '2025-01-15T10:30:00Z',
          lastExecuted: '2025-01-15T14:30:00Z',
          totalExecutions: 156,
          successfulExecutions: 142,
          failedExecutions: 14,
          successRate: 91.0,
          totalPnL: 2450.75,
          avgExecutionTime: 2.3,
          maxDrawdown: -320.50,
          currentDrawdown: -45.20,
          riskLevel: 'medium',
          parameters: {
            symbol: 'BTCUSD',
            timeframe: '1h',
            amount: 100,
            stopLoss: 0.05,
            takeProfit: 0.10,
            maxPositions: 5
          },
          performance: {
            winRate: 91.0,
            profitFactor: 1.85,
            sharpeRatio: 2.1,
            avgWin: 18.50,
            avgLoss: -12.30,
            largestWin: 95.75,
            largestLoss: -45.20,
            consecutiveWins: 12,
            consecutiveLosses: 3
          },
          alerts: {
            enabled: true,
            email: true,
            telegram: false,
            webhook: true
          }
        },
        {
          id: '2',
          name: 'ETH Grid Trading',
          type: 'grid',
          status: 'paused',
          userId: 'user2',
          userEmail: 'trader2@example.com',
          planType: 'advanced',
          createdAt: '2025-01-15T09:15:00Z',
          lastExecuted: '2025-01-15T12:45:00Z',
          totalExecutions: 89,
          successfulExecutions: 78,
          failedExecutions: 11,
          successRate: 87.6,
          totalPnL: 1250.30,
          avgExecutionTime: 1.8,
          maxDrawdown: -180.75,
          currentDrawdown: -25.40,
          riskLevel: 'high',
          parameters: {
            symbol: 'ETHUSD',
            timeframe: '15m',
            amount: 50,
            stopLoss: 0.08,
            takeProfit: 0.15,
            maxPositions: 10
          },
          performance: {
            winRate: 87.6,
            profitFactor: 1.42,
            sharpeRatio: 1.65,
            avgWin: 16.20,
            avgLoss: -11.40,
            largestWin: 78.50,
            largestLoss: -35.80,
            consecutiveWins: 8,
            consecutiveLosses: 4
          },
          alerts: {
            enabled: true,
            email: true,
            telegram: true,
            webhook: false
          }
        },
        {
          id: '3',
          name: 'Custom Scalping Bot',
          type: 'scalping',
          status: 'error',
          userId: 'user3',
          userEmail: 'trader3@example.com',
          planType: 'basic',
          createdAt: '2025-01-15T08:00:00Z',
          lastExecuted: '2025-01-15T11:20:00Z',
          totalExecutions: 23,
          successfulExecutions: 15,
          failedExecutions: 8,
          successRate: 65.2,
          totalPnL: -125.50,
          avgExecutionTime: 0.8,
          maxDrawdown: -250.75,
          currentDrawdown: -125.50,
          riskLevel: 'high',
          parameters: {
            symbol: 'BTCUSD',
            timeframe: '1m',
            amount: 25,
            stopLoss: 0.02,
            takeProfit: 0.03,
            maxPositions: 3,
            customSettings: {
              scalpingThreshold: 0.001,
              maxDailyTrades: 50,
              volatilityFilter: true
            }
          },
          performance: {
            winRate: 65.2,
            profitFactor: 0.85,
            sharpeRatio: -0.45,
            avgWin: 8.50,
            avgLoss: -10.20,
            largestWin: 25.75,
            largestLoss: -45.30,
            consecutiveWins: 4,
            consecutiveLosses: 6
          },
          alerts: {
            enabled: true,
            email: true,
            telegram: false,
            webhook: false
          }
        }
      ];

      const mockMetrics: AutomationMetrics = {
        totalAutomations: 3,
        activeAutomations: 1,
        pausedAutomations: 1,
        stoppedAutomations: 0,
        errorAutomations: 1,
        avgSuccessRate: 81.3,
        totalPnL: 3575.55,
        totalExecutions: 268,
        bestPerformer: 'BTC DCA Strategy',
        worstPerformer: 'Custom Scalping Bot'
      };

      setAutomations(mockAutomations);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast.error('Failed to fetch automations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500 text-white">Paused</Badge>;
      case 'stopped':
        return <Badge className="bg-gray-500 text-white">Stopped</Badge>;
      case 'error':
        return <Badge className="bg-red-500 text-white">Error</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dca':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'grid':
        return <BarChart3 className="h-4 w-4 text-green-500" />;
      case 'martingale':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'scalping':
        return <Activity className="h-4 w-4 text-orange-500" />;
      case 'arbitrage':
        return <Target className="h-4 w-4 text-cyan-500" />;
      case 'custom':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'dca':
        return 'DCA';
      case 'grid':
        return 'Grid';
      case 'martingale':
        return 'Martingale';
      case 'scalping':
        return 'Scalping';
      case 'arbitrage':
        return 'Arbitrage';
      case 'custom':
        return 'Custom';
      default:
        return 'Unknown';
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-500 text-white">Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      case 'high':
        return <Badge className="bg-red-500 text-white">High</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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

  const handleToggleAutomation = async (automationId: string, currentStatus: string) => {
    try {
      console.log('🔍 AUTOMATION MANAGEMENT - Toggling automation status for:', automationId);
      
      // Simular toggle de status
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      setAutomations(prev => prev.map(automation => 
        automation.id === automationId 
          ? { ...automation, status: newStatus as any }
          : automation
      ));
      
      toast.success(`Automation ${newStatus === 'active' ? 'started' : 'paused'} successfully`);
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast.error('Failed to toggle automation status');
    }
  };

  const handleDeleteAutomation = async (automationId: string, automationName: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente a automação "${automationName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      console.log('🗑️ AUTOMATION MANAGEMENT - Deleting automation:', automationId);
      
      setAutomations(prev => prev.filter(automation => automation.id !== automationId));
      toast.success('Automation deleted successfully');
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast.error('Failed to delete automation');
    }
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
                    <h3 className="text-lg font-semibold text-text-primary">Loading Automations</h3>
                    <p className="text-sm text-text-secondary">Fetching automation data...</p>
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
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Automation Management
                        </h1>
                        <p className="text-text-secondary">Manage and monitor trading automations</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => fetchAutomations()} 
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
                      <Bot className="h-4 w-4 mr-2" />
                      New Automation
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
                      <p className="text-sm font-medium text-text-secondary">Total Automations</p>
                      <p className="text-2xl font-bold text-text-primary">{metrics.totalAutomations}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                      <Bot className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Active</p>
                      <p className="text-2xl font-bold text-green-500">{metrics.activeAutomations}</p>
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
                      <p className="text-sm font-medium text-text-secondary">Avg Success Rate</p>
                      <p className="text-2xl font-bold text-text-primary">{formatPercentage(metrics.avgSuccessRate)}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10">
                      <TrendingUp className="h-6 w-6 text-purple-500" />
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
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search automations..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="dca">DCA</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="martingale">Martingale</SelectItem>
                    <SelectItem value="scalping">Scalping</SelectItem>
                    <SelectItem value="arbitrage">Arbitrage</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="stopped">Stopped</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
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

                <Select value={filters.riskLevel} onValueChange={(value) => setFilters({ ...filters, riskLevel: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
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
                  onClick={() => setFilters({ search: '', type: 'all', status: 'all', planType: 'all', riskLevel: 'all', dateRange: '30d', sortBy: 'createdAt', sortOrder: 'desc' })}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Automations Table */}
          <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Automations</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Showing {automations.length} automations
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
                          <Bot className="h-4 w-4" />
                          Automation
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
                          Type
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Risk
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
                          Success Rate
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
                    {automations.map((automation, index) => (
                      <TableRow 
                        key={automation.id}
                        className={cn(
                          "hover:bg-background/50 transition-colors duration-200",
                          index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                        )}
                      >
                        <TableCell className="font-medium text-text-primary">
                          <div>
                            <div className="font-medium">{automation.name}</div>
                            <div className="text-sm text-text-secondary">
                              {automation.parameters.symbol} • {automation.parameters.timeframe}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(automation.status)}
                            {getStatusBadge(automation.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(automation.type)}
                            <Badge variant="outline" className="font-semibold">
                              {getTypeLabel(automation.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRiskBadge(automation.riskLevel)}
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "font-semibold",
                            automation.totalPnL > 0 ? "text-green-500" : automation.totalPnL < 0 ? "text-red-500" : "text-text-secondary"
                          )}>
                            {formatCurrency(automation.totalPnL)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{formatPercentage(automation.successRate)}</div>
                            <Progress value={automation.successRate} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{automation.userEmail}</div>
                            <Badge variant="outline" className="text-xs">
                              {automation.planType.toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-background border border-border shadow-lg">
                              <DropdownMenuItem 
                                className="cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                onClick={() => setSelectedAutomation(automation)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                onClick={() => handleToggleAutomation(automation.id, automation.status)}
                              >
                                {automation.status === 'active' ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Start
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                onClick={() => {/* TODO: Implement edit */}}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground text-destructive"
                                onClick={() => handleDeleteAutomation(automation.id, automation.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Automation Details Dialog */}
          {selectedAutomation && (
            <Dialog open={!!selectedAutomation} onOpenChange={() => setSelectedAutomation(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Bot className="h-6 w-6 text-primary" />
                    {selectedAutomation.name}
                  </DialogTitle>
                  <DialogDescription>
                    Detailed automation configuration and performance
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Type:</span>
                          <span className="font-medium">{getTypeLabel(selectedAutomation.type)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Symbol:</span>
                          <span className="font-medium">{selectedAutomation.parameters.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Timeframe:</span>
                          <span className="font-medium">{selectedAutomation.parameters.timeframe}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Amount:</span>
                          <span className="font-medium">{formatCurrency(selectedAutomation.parameters.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Risk Level:</span>
                          <span className="font-medium">{getRiskBadge(selectedAutomation.riskLevel)}</span>
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
                            selectedAutomation.totalPnL > 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {formatCurrency(selectedAutomation.totalPnL)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Success Rate:</span>
                          <span className="font-medium text-green-500">{formatPercentage(selectedAutomation.successRate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Total Executions:</span>
                          <span className="font-medium">{selectedAutomation.totalExecutions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Avg Execution Time:</span>
                          <span className="font-medium">{selectedAutomation.avgExecutionTime}s</span>
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
                          <div className="text-2xl font-bold text-green-500">{selectedAutomation.performance.winRate.toFixed(1)}%</div>
                          <div className="text-sm text-text-secondary">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{selectedAutomation.performance.profitFactor.toFixed(2)}</div>
                          <div className="text-sm text-text-secondary">Profit Factor</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{selectedAutomation.performance.sharpeRatio.toFixed(2)}</div>
                          <div className="text-sm text-text-secondary">Sharpe Ratio</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-500">{formatPercentage(selectedAutomation.maxDrawdown)}</div>
                          <div className="text-sm text-text-secondary">Max Drawdown</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Alerts Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Alerts Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">Alerts Enabled:</span>
                          <Switch checked={selectedAutomation.alerts.enabled} disabled />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Email:</span>
                            <Switch checked={selectedAutomation.alerts.email} disabled />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Telegram:</span>
                            <Switch checked={selectedAutomation.alerts.telegram} disabled />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Webhook:</span>
                            <Switch checked={selectedAutomation.alerts.webhook} disabled />
                          </div>
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
