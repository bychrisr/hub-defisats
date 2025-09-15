import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import axios from 'axios';

interface PerformanceData {
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
    trend: number;
  };
  throughput: Array<{
    timestamp: string;
    requests: number;
    errors: number;
  }>;
  errorRate: {
    current: number;
    trend: number;
    breakdown: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  automationPerformance: Array<{
    automation: string;
    avgExecutionTime: number;
    successRate: number;
    executions: number;
  }>;
  systemResources: Array<{
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
  }>;
  lnMarketsPerformance: {
    avgResponseTime: number;
    successRate: number;
    lastSync: string;
    status: string;
  };
}

export default function Performance() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPerformanceData = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`/api/performance?period=${timeRange}`);
      setPerformanceData(response.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'disconnected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading && !performanceData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Dados não disponíveis</h3>
        <p className="text-muted-foreground">
          Não foi possível carregar os dados de performance.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance</h1>
            <p className="text-gray-600">Monitoramento em tempo real do sistema</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15m">15 min</SelectItem>
                <SelectItem value="1h">1 hora</SelectItem>
                <SelectItem value="6h">6 horas</SelectItem>
                <SelectItem value="24h">24 horas</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={fetchPerformanceData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(performanceData.responseTime.avg)}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">P95:</span>
                <span className="font-medium">{formatTime(performanceData.responseTime.p95)}</span>
                <span className="text-muted-foreground">P99:</span>
                <span className="font-medium">{formatTime(performanceData.responseTime.p99)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={`flex items-center ${performanceData.responseTime.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {performanceData.responseTime.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(performanceData.responseTime.trend).toFixed(1)}%
                </span>
                vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(performanceData.errorRate.current)}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`flex items-center ${performanceData.errorRate.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {performanceData.errorRate.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(performanceData.errorRate.trend).toFixed(1)}%
                </span>
                vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">LN Markets</CardTitle>
              {getStatusIcon(performanceData.lnMarketsPerformance.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(performanceData.lnMarketsPerformance.avgResponseTime)}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de sucesso: {formatPercentage(performanceData.lnMarketsPerformance.successRate)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Última sync: {new Date(performanceData.lnMarketsPerformance.lastSync).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Throughput</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceData.throughput[performanceData.throughput.length - 1]?.requests || 0}/min
              </div>
              <p className="text-xs text-muted-foreground">
                Requisições por minuto
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tempo de Resposta</CardTitle>
              <CardDescription>
                Média, P95 e P99 ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData.throughput}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [formatTime(Number(value)), '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Requests/min"
                  />
                  <Line
                    type="monotone"
                    dataKey="errors"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Errors/min"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* System Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos do Sistema</CardTitle>
              <CardDescription>
                CPU, memória e disco ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData.systemResources}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [`${value.toFixed(1)}%`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="CPU"
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Memory"
                  />
                  <Area
                    type="monotone"
                    dataKey="disk"
                    stackId="3"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                    name="Disk"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Erros</CardTitle>
              <CardDescription>
                Tipos de erro mais comuns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceData.errorRate.breakdown.map((error, index) => (
                  <div key={error.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-medium text-red-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{error.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {error.count} ocorrências
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-600">
                      {formatPercentage(error.percentage)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Automation Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance das Automations</CardTitle>
              <CardDescription>
                Tempo de execução e taxa de sucesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.automationPerformance.map((automation) => (
                  <div key={automation.automation} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{automation.automation}</span>
                      <Badge variant="secondary">
                        {automation.executions} execs
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tempo médio:</span>
                        <div className="font-medium">{formatTime(automation.avgExecutionTime)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Taxa de sucesso:</span>
                        <div className="font-medium">{formatPercentage(automation.successRate)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
