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
  Play,
  Pause,
  Square,
  RotateCcw,
  Cpu,
  Database,
  BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Simulation {
  id: string;
  name: string;
  type: 'monte_carlo' | 'stress_test' | 'scenario' | 'optimization';
  status: 'running' | 'completed' | 'failed' | 'paused';
  createdAt: string;
  completedAt?: string;
  duration: number; // in seconds
  iterations: number;
  completedIterations: number;
  successRate: number;
  avgReturn: number;
  maxReturn: number;
  minReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  var95: number; // Value at Risk 95%
  var99: number; // Value at Risk 99%
  expectedShortfall: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  userId: string;
  userEmail: string;
  planType: string;
  parameters: {
    initialCapital: number;
    timeHorizon: number;
    riskFreeRate: number;
    volatility: number;
    drift: number;
  };
  results: {
    finalCapital: number;
    totalReturn: number;
    annualizedReturn: number;
    riskAdjustedReturn: number;
  };
}

interface SimulationMetrics {
  totalSimulations: number;
  runningSimulations: number;
  completedSimulations: number;
  failedSimulations: number;
  avgSuccessRate: number;
  avgSharpeRatio: number;
  totalIterations: number;
  bestSimulation: string;
  worstSimulation: string;
}

export default function SimulationAnalytics() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<SimulationMetrics | null>(null);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
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
    console.log('🔍 SIMULATION ANALYTICS - Initial load useEffect triggered');
    fetchSimulations();
    isInitialLoad.current = false;
  }, []);

  // Recarrega quando os filtros mudam (mas não em loop)
  useEffect(() => {
    console.log('🔍 SIMULATION ANALYTICS - Filter change useEffect triggered', { 
      isInitialLoad: isInitialLoad.current,
      filters: { search: filters.search, type: filters.type, status: filters.status, planType: filters.planType, dateRange: filters.dateRange, sortBy: filters.sortBy, sortOrder: filters.sortOrder },
      lastFilters: lastFilters.current
    });
    
    // Só executa se não for o carregamento inicial e se os filtros realmente mudaram
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.type !== filters.type ||
        lastFilters.current.status !== filters.status ||
        lastFilters.current.planType !== filters.planType ||
        lastFilters.current.dateRange !== filters.dateRange ||
        lastFilters.current.sortBy !== filters.sortBy ||
        lastFilters.current.sortOrder !== filters.sortOrder;
      
      if (filtersChanged) {
        console.log('🔍 SIMULATION ANALYTICS - Filters changed, executing fetchSimulations');
        lastFilters.current = { ...filters };
        fetchSimulations();
      }
    }
  }, [filters.search, filters.type, filters.status, filters.planType, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const fetchSimulations = async () => {
    setRefreshing(true);
    try {
      // Simular dados de simulações
      const mockSimulations: Simulation[] = [
        {
          id: '1',
          name: 'Monte Carlo Portfolio Analysis',
          type: 'monte_carlo',
          status: 'completed',
          createdAt: '2025-01-15T10:30:00Z',
          completedAt: '2025-01-15T10:45:00Z',
          duration: 900,
          iterations: 10000,
          completedIterations: 10000,
          successRate: 78.5,
          avgReturn: 12.5,
          maxReturn: 45.2,
          minReturn: -15.8,
          volatility: 18.3,
          sharpeRatio: 0.68,
          maxDrawdown: -12.4,
          var95: -8.2,
          var99: -12.1,
          expectedShortfall: -15.3,
          confidenceInterval: {
            lower: 8.2,
            upper: 16.8
          },
          userId: 'user1',
          userEmail: 'trader1@example.com',
          planType: 'pro',
          parameters: {
            initialCapital: 100000,
            timeHorizon: 365,
            riskFreeRate: 0.02,
            volatility: 0.18,
            drift: 0.08
          },
          results: {
            finalCapital: 112500,
            totalReturn: 12.5,
            annualizedReturn: 12.5,
            riskAdjustedReturn: 0.68
          }
        },
        {
          id: '2',
          name: 'Stress Test - Market Crash',
          type: 'stress_test',
          status: 'running',
          createdAt: '2025-01-15T11:00:00Z',
          duration: 1800,
          iterations: 5000,
          completedIterations: 2500,
          successRate: 0,
          avgReturn: 0,
          maxReturn: 0,
          minReturn: 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          var95: 0,
          var99: 0,
          expectedShortfall: 0,
          confidenceInterval: {
            lower: 0,
            upper: 0
          },
          userId: 'user2',
          userEmail: 'trader2@example.com',
          planType: 'advanced',
          parameters: {
            initialCapital: 50000,
            timeHorizon: 180,
            riskFreeRate: 0.01,
            volatility: 0.35,
            drift: -0.05
          },
          results: {
            finalCapital: 50000,
            totalReturn: 0,
            annualizedReturn: 0,
            riskAdjustedReturn: 0
          }
        },
        {
          id: '3',
          name: 'Scenario Analysis - Bull Market',
          type: 'scenario',
          status: 'completed',
          createdAt: '2025-01-15T09:15:00Z',
          completedAt: '2025-01-15T09:30:00Z',
          duration: 900,
          iterations: 1000,
          completedIterations: 1000,
          successRate: 92.3,
          avgReturn: 25.8,
          maxReturn: 48.7,
          minReturn: 5.2,
          volatility: 12.1,
          sharpeRatio: 2.13,
          maxDrawdown: -3.2,
          var95: -2.1,
          var99: -4.8,
          expectedShortfall: -6.2,
          confidenceInterval: {
            lower: 22.1,
            upper: 29.5
          },
          userId: 'user3',
          userEmail: 'trader3@example.com',
          planType: 'basic',
          parameters: {
            initialCapital: 25000,
            timeHorizon: 90,
            riskFreeRate: 0.03,
            volatility: 0.12,
            drift: 0.15
          },
          results: {
            finalCapital: 31450,
            totalReturn: 25.8,
            annualizedReturn: 25.8,
            riskAdjustedReturn: 2.13
          }
        }
      ];

      const mockMetrics: SimulationMetrics = {
        totalSimulations: 3,
        runningSimulations: 1,
        completedSimulations: 2,
        failedSimulations: 0,
        avgSuccessRate: 85.4,
        avgSharpeRatio: 1.41,
        totalIterations: 16000,
        bestSimulation: 'Scenario Analysis - Bull Market',
        worstSimulation: 'Monte Carlo Portfolio Analysis'
      };

      setSimulations(mockSimulations);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching simulations:', error);
      toast.error('Failed to fetch simulations');
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'monte_carlo':
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'stress_test':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'scenario':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'optimization':
        return <Zap className="h-4 w-4 text-purple-500" />;
      default:
        return <Cpu className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'monte_carlo':
        return 'Monte Carlo';
      case 'stress_test':
        return 'Stress Test';
      case 'scenario':
        return 'Scenario';
      case 'optimization':
        return 'Optimization';
      default:
        return 'Unknown';
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
                    <h3 className="text-lg font-semibold text-text-primary">Loading Simulations</h3>
                    <p className="text-sm text-text-secondary">Fetching simulation data...</p>
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
                        <Cpu className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Simulation Analytics
                        </h1>
                        <p className="text-text-secondary">Advanced simulation and risk analysis</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => fetchSimulations()} 
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
                      New Simulation
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
                      <p className="text-sm font-medium text-text-secondary">Total Simulations</p>
                      <p className="text-2xl font-bold text-text-primary">{metrics.totalSimulations}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                      <Cpu className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Running</p>
                      <p className="text-2xl font-bold text-blue-500">{metrics.runningSimulations}</p>
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
                      <p className="text-sm font-medium text-text-secondary">Avg Success Rate</p>
                      <p className="text-2xl font-bold text-green-500">{formatPercentage(metrics.avgSuccessRate)}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Total Iterations</p>
                      <p className="text-2xl font-bold text-text-primary">{metrics.totalIterations.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10">
                      <Database className="h-6 w-6 text-purple-500" />
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
                    placeholder="Search simulations..."
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
                    <SelectItem value="monte_carlo">Monte Carlo</SelectItem>
                    <SelectItem value="stress_test">Stress Test</SelectItem>
                    <SelectItem value="scenario">Scenario</SelectItem>
                    <SelectItem value="optimization">Optimization</SelectItem>
                  </SelectContent>
                </Select>

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
                  onClick={() => setFilters({ search: '', type: 'all', status: 'all', planType: 'all', dateRange: '30d', sortBy: 'createdAt', sortOrder: 'desc' })}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Simulations Table */}
          <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Simulations</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Showing {simulations.length} simulations
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
                          <Cpu className="h-4 w-4" />
                          Simulation
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
                          <BarChart2 className="h-4 w-4" />
                          Progress
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Avg Return
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          VaR 95%
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
                    {simulations.map((simulation, index) => (
                      <TableRow 
                        key={simulation.id}
                        className={cn(
                          "hover:bg-background/50 transition-colors duration-200",
                          index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                        )}
                      >
                        <TableCell className="font-medium text-text-primary">
                          <div>
                            <div className="font-medium">{simulation.name}</div>
                            <div className="text-sm text-text-secondary">
                              {simulation.iterations.toLocaleString()} iterations
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(simulation.status)}
                            {getStatusBadge(simulation.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(simulation.type)}
                            <Badge variant="outline" className="font-semibold">
                              {getTypeLabel(simulation.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              {simulation.status === 'running' 
                                ? `${Math.round((simulation.completedIterations / simulation.iterations) * 100)}%`
                                : '100%'
                              }
                            </div>
                            <Progress 
                              value={simulation.status === 'running' 
                                ? (simulation.completedIterations / simulation.iterations) * 100 
                                : 100
                              } 
                              className="w-16 h-2" 
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "font-semibold",
                            simulation.avgReturn > 0 ? "text-green-500" : simulation.avgReturn < 0 ? "text-red-500" : "text-text-secondary"
                          )}>
                            {simulation.avgReturn > 0 ? '+' : ''}{formatPercentage(simulation.avgReturn)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-red-500">
                            {formatPercentage(simulation.var95)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{simulation.userEmail}</div>
                            <Badge variant="outline" className="text-xs">
                              {simulation.planType.toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSimulation(simulation)}
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

          {/* Simulation Details Dialog */}
          {selectedSimulation && (
            <Dialog open={!!selectedSimulation} onOpenChange={() => setSelectedSimulation(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Cpu className="h-6 w-6 text-primary" />
                    {selectedSimulation.name}
                  </DialogTitle>
                  <DialogDescription>
                    Detailed simulation analysis and results
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Simulation Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Type:</span>
                          <span className="font-medium">{getTypeLabel(selectedSimulation.type)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Iterations:</span>
                          <span className="font-medium">{selectedSimulation.iterations.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Duration:</span>
                          <span className="font-medium">{formatDuration(selectedSimulation.duration)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Status:</span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(selectedSimulation.status)}
                            {getStatusBadge(selectedSimulation.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Performance Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Success Rate:</span>
                          <span className="font-medium text-green-500">{formatPercentage(selectedSimulation.successRate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Avg Return:</span>
                          <span className={cn(
                            "font-medium",
                            selectedSimulation.avgReturn > 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {formatPercentage(selectedSimulation.avgReturn)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Sharpe Ratio:</span>
                          <span className="font-medium">{selectedSimulation.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Max Drawdown:</span>
                          <span className="font-medium text-red-500">{formatPercentage(selectedSimulation.maxDrawdown)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Risk Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-500">{formatPercentage(selectedSimulation.var95)}</div>
                          <div className="text-sm text-text-secondary">VaR 95%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-500">{formatPercentage(selectedSimulation.var99)}</div>
                          <div className="text-sm text-text-secondary">VaR 99%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-500">{formatPercentage(selectedSimulation.expectedShortfall)}</div>
                          <div className="text-sm text-text-secondary">Expected Shortfall</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-text-primary">{formatPercentage(selectedSimulation.volatility)}</div>
                          <div className="text-sm text-text-secondary">Volatility</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Confidence Interval */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Confidence Interval</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-text-primary mb-2">
                          {formatPercentage(selectedSimulation.confidenceInterval.lower)} - {formatPercentage(selectedSimulation.confidenceInterval.upper)}
                        </div>
                        <div className="text-text-secondary">95% Confidence Interval for Returns</div>
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
