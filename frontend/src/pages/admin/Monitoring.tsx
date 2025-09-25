import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Server,
  Database,
  Zap,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Monitor,
  Shield,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MetricAverages {
  current: number;
  average_1h: number;
  average_24h: number;
  trend: 'improving' | 'stable' | 'degrading';
  status: 'good' | 'warning' | 'critical';
}

interface MonitoringData {
  api_latency: number;
  error_rate: number;
  queue_sizes: {
    [key: string]: number;
  };
  ln_markets_status: string;
  system_health: {
    database: string;
    redis: string;
    workers: string;
  };
  memory_usage?: number;
  cpu_usage?: number;
  active_connections?: number;
  averages?: {
    api_latency: MetricAverages;
    error_rate: MetricAverages;
    memory_usage: MetricAverages;
    cpu_usage: MetricAverages;
    queue_health: MetricAverages;
  };
  health_summary?: {
    overall_status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  };
}

export default function Monitoring() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMonitoringData();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    setRefreshing(true);
    try {
      // Buscar dados reais do backend
      const response = await fetch('/api/admin/monitoring', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Transformar dados do backend para o formato esperado pelo frontend
        const monitoringData: MonitoringData = {
          api_latency: result.data.performance?.apiLatency || 0,
          error_rate: result.data.performance?.errorRate || 0,
          queue_sizes: result.data.metrics?.business || {},
          ln_markets_status: result.data.services?.lnMarkets?.status || 'unknown',
          system_health: {
            database: result.data.services?.database?.status || 'unknown',
            redis: result.data.services?.redis?.status || 'unknown',
            workers: result.data.services?.workers?.status || 'unknown'
          },
          memory_usage: result.data.system?.memory?.percentage || 0,
          cpu_usage: result.data.system?.cpu?.user || 0,
          active_connections: result.data.system?.activeConnections || 0,
          averages: {
            api_latency: {
              current: result.data.performance?.apiLatency || 0,
              average_1h: result.data.performance?.apiLatency || 0,
              average_24h: result.data.performance?.apiLatency || 0,
              trend: 'stable',
              status: result.data.performance?.apiLatency < 100 ? 'good' : 'warning'
            },
            error_rate: {
              current: result.data.performance?.errorRate || 0,
              average_1h: result.data.performance?.errorRate || 0,
              average_24h: result.data.performance?.errorRate || 0,
              trend: 'stable',
              status: result.data.performance?.errorRate < 5 ? 'good' : 'critical'
            },
            memory_usage: {
              current: result.data.system?.memory?.percentage || 0,
              average_1h: result.data.system?.memory?.percentage || 0,
              average_24h: result.data.system?.memory?.percentage || 0,
              trend: 'stable',
              status: result.data.system?.memory?.percentage < 80 ? 'good' : 'warning'
            },
            cpu_usage: {
              current: result.data.system?.cpu?.user || 0,
              average_1h: result.data.system?.cpu?.user || 0,
              average_24h: result.data.system?.cpu?.user || 0,
              trend: 'stable',
              status: result.data.system?.cpu?.user < 80 ? 'good' : 'warning'
            },
            queue_health: {
              current: 85,
              average_1h: 78,
              average_24h: 82,
              trend: 'stable',
              status: 'good'
            }
          },
          health_summary: {
            overall_status: result.data.performance?.availability > 95 ? 'healthy' : 'warning',
            issues: result.data.alerts?.active > 0 ? [`${result.data.alerts.active} alertas ativos`] : [],
            recommendations: []
          }
        };

        setMonitoringData(monitoringData);
        setLoading(false);
        setRefreshing(false);
        toast.success('Dados de monitoramento atualizados!');
      } else {
        throw new Error(result.message || 'Erro ao buscar dados de monitoramento');
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setLoading(false);
      setRefreshing(false);
      toast.error('Erro ao carregar dados de monitoramento');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'good':
        return 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25';
      case 'warning':
        return 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25';
      case 'critical':
      case 'offline':
        return 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degrading':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
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
                  <h3 className="text-xl font-semibold text-text-primary">Carregando Monitoramento</h3>
                  <p className="text-text-secondary">Aguarde enquanto carregamos os dados do sistema...</p>
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
                        <Monitor className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Monitoramento do Sistema
                        </h1>
                        <p className="text-text-secondary">Acompanhe a saúde e performance da aplicação</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={fetchMonitoringData}
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

          {/* Health Summary */}
          {monitoringData?.health_summary && (
            <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Resumo da Saúde do Sistema</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(monitoringData.health_summary.overall_status)}
                    <span className="text-lg font-medium text-text-primary">
                      Status: {monitoringData.health_summary.overall_status.toUpperCase()}
                    </span>
                  </div>
                  <Badge className={getStatusColor(monitoringData.health_summary.overall_status)}>
                    {monitoringData.health_summary.overall_status === 'healthy' ? 'Saudável' : 
                     monitoringData.health_summary.overall_status === 'warning' ? 'Atenção' : 'Crítico'}
                  </Badge>
                </div>
                {monitoringData.health_summary.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Recomendações:</h4>
                    <ul className="space-y-1">
                      {monitoringData.health_summary.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-text-secondary flex items-center gap-2">
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* API Latency */}
            <Card className="gradient-card-blue profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Latência da API</p>
                    <p className="text-2xl font-bold text-text-primary">{monitoringData?.api_latency}ms</p>
                    <div className="flex items-center gap-2 mt-1">
                      {monitoringData?.averages?.api_latency && getTrendIcon(monitoringData.averages.api_latency.trend)}
                      <span className="text-xs text-text-secondary">
                        {monitoringData?.averages?.api_latency?.average_1h}ms (1h)
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                    <Activity className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Rate */}
            <Card className="gradient-card-green profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Taxa de Erro</p>
                    <p className="text-2xl font-bold text-text-primary">{(monitoringData?.error_rate || 0) * 100}%</p>
                    <div className="flex items-center gap-2 mt-1">
                      {monitoringData?.averages?.error_rate && getTrendIcon(monitoringData.averages.error_rate.trend)}
                      <span className="text-xs text-text-secondary">
                        {((monitoringData?.averages?.error_rate?.average_1h || 0) * 100).toFixed(2)}% (1h)
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 backdrop-blur-sm">
                    <AlertTriangle className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card className="gradient-card-yellow profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Uso de Memória</p>
                    <p className="text-2xl font-bold text-text-primary">{monitoringData?.memory_usage}%</p>
                    <div className="flex items-center gap-2 mt-1">
                      {monitoringData?.averages?.memory_usage && getTrendIcon(monitoringData.averages.memory_usage.trend)}
                      <span className="text-xs text-text-secondary">
                        {monitoringData?.averages?.memory_usage?.average_1h}% (1h)
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 backdrop-blur-sm">
                    <HardDrive className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={monitoringData?.memory_usage || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* CPU Usage */}
            <Card className="gradient-card-purple profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Uso de CPU</p>
                    <p className="text-2xl font-bold text-text-primary">{monitoringData?.cpu_usage}%</p>
                    <div className="flex items-center gap-2 mt-1">
                      {monitoringData?.averages?.cpu_usage && getTrendIcon(monitoringData.averages.cpu_usage.trend)}
                      <span className="text-xs text-text-secondary">
                        {monitoringData?.averages?.cpu_usage?.average_1h}% (1h)
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 backdrop-blur-sm">
                    <Cpu className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={monitoringData?.cpu_usage || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services Status */}
            <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Status dos Serviços</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg backdrop-blur-sm bg-background/50 border-border/50">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-text-primary">Database</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(monitoringData?.system_health?.database || 'unknown')}
                      <Badge className={getStatusColor(monitoringData?.system_health?.database || 'unknown')}>
                        {monitoringData?.system_health?.database || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg backdrop-blur-sm bg-background/50 border-border/50">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium text-text-primary">Redis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(monitoringData?.system_health?.redis || 'unknown')}
                      <Badge className={getStatusColor(monitoringData?.system_health?.redis || 'unknown')}>
                        {monitoringData?.system_health?.redis || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg backdrop-blur-sm bg-background/50 border-border/50">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-text-primary">Workers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(monitoringData?.system_health?.workers || 'unknown')}
                      <Badge className={getStatusColor(monitoringData?.system_health?.workers || 'unknown')}>
                        {monitoringData?.system_health?.workers || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg backdrop-blur-sm bg-background/50 border-border/50">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-purple-500" />
                      <span className="font-medium text-text-primary">LN Markets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(monitoringData?.ln_markets_status || 'unknown')}
                      <Badge className={getStatusColor(monitoringData?.ln_markets_status || 'unknown')}>
                        {monitoringData?.ln_markets_status || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Queue Status */}
            <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Status das Filas</h3>
                </div>
                <div className="space-y-4">
                  {monitoringData?.queue_sizes && Object.entries(monitoringData.queue_sizes).map(([queue, size]) => (
                    <div key={queue} className="flex items-center justify-between p-3 rounded-lg backdrop-blur-sm bg-background/50 border-border/50">
                      <div className="flex items-center gap-3">
                        <Wifi className="h-5 w-5 text-blue-500" />
                        <span className="font-medium text-text-primary capitalize">
                          {queue.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary">{size} itens</span>
                        <Badge 
                          className={cn(
                            "text-xs",
                            size > 50 ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25" :
                            size > 20 ? "bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25" :
                            "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25"
                          )}
                        >
                          {size > 50 ? 'Alto' : size > 20 ? 'Médio' : 'Baixo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Connections */}
          {monitoringData?.active_connections && (
            <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                    <Wifi className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Conexões Ativas</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-text-primary">{monitoringData.active_connections}</p>
                    <p className="text-sm text-text-secondary">Conexões simultâneas</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 backdrop-blur-sm">
                    <Wifi className="h-8 w-8 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}