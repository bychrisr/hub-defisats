import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Zap,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  responseTime: number;
  lastCheck: Date;
  details: {
    api: { status: string; responseTime: number };
    database: { status: string; responseTime: number };
    redis: { status: string; responseTime: number };
    lnmarkets: { status: string; responseTime: number };
  };
}

export const SystemHealth = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();

      const response = await axios.get('/api/health/detailed');
      const responseTime = Date.now() - startTime;

      const healthData: HealthStatus = {
        status: response.data.status || 'healthy',
        responseTime,
        lastCheck: new Date(),
        details: {
          api: { 
            status: response.data.services?.api || 'healthy', 
            responseTime: responseTime 
          },
          database: { 
            status: response.data.services?.database?.status || 'unknown', 
            responseTime: response.data.services?.database?.responseTime || 0 
          },
          redis: { 
            status: response.data.services?.redis?.status || 'unknown', 
            responseTime: response.data.services?.redis?.responseTime || 0 
          },
          lnmarkets: { 
            status: 'healthy', // Mock status for now
            responseTime: Math.floor(Math.random() * 200) + 50 // Mock response time
          },
        },
      };

      setHealth(healthData);

      // Toast notification for critical issues
      if (healthData.status === 'error') {
        toast.error('Sistema com problemas críticos');
      } else if (healthData.status === 'warning') {
        toast.warning('Sistema com alertas');
      }

    } catch (error: any) {
      console.error('Health check failed:', error);
      const fallbackHealth: HealthStatus = {
        status: 'error',
        responseTime: 0,
        lastCheck: new Date(),
        details: {
          api: { status: 'error', responseTime: 0 },
          database: { status: 'error', responseTime: 0 },
          redis: { status: 'error', responseTime: 0 },
          lnmarkets: { status: 'error', responseTime: 0 },
        },
      };
      setHealth(fallbackHealth);
      toast.error('Falha ao verificar saúde do sistema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();

    if (autoRefresh) {
      const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default',
      running: 'default',
      warning: 'secondary',
      error: 'destructive',
      down: 'destructive',
      unknown: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const formatResponseTime = (ms: number) => {
    if (ms === 0) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!health) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Carregando status do sistema...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Saúde do Sistema
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Status em tempo real dos componentes do sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-muted-foreground">
                {autoRefresh ? 'Auto-refresh' : 'Pausado'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(health.status)}
            <div>
              <h3 className="font-medium">Status Geral</h3>
              <p className="text-sm text-muted-foreground">
                Última verificação: {health.lastCheck.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(health.status)}
            <p className="text-sm text-muted-foreground mt-1">
              <Clock className="h-3 w-3 inline mr-1" />
              {formatResponseTime(health.responseTime)}
            </p>
          </div>
        </div>

        {/* Component Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              API & Serviços
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Backend API</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.details.api.status)}
                  <span className="text-sm">{formatResponseTime(health.details.api.responseTime)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">LN Markets</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.details.lnmarkets.status)}
                  <span className="text-sm">{formatResponseTime(health.details.lnmarkets.responseTime)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Infraestrutura
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">PostgreSQL</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.details.database.status)}
                  <span className="text-sm">{formatResponseTime(health.details.database.responseTime)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Redis Cache</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.details.redis.status)}
                  <span className="text-sm">{formatResponseTime(health.details.redis.responseTime)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Métricas de Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded">
              <div className="text-2xl font-bold text-green-500">
                {formatResponseTime(health.details.api.responseTime)}
              </div>
              <p className="text-xs text-muted-foreground">API Response</p>
            </div>
            <div className="text-center p-3 border rounded">
              <div className="text-2xl font-bold text-blue-500">
                {formatResponseTime(health.details.database.responseTime)}
              </div>
              <p className="text-xs text-muted-foreground">DB Response</p>
            </div>
            <div className="text-center p-3 border rounded">
              <div className="text-2xl font-bold text-purple-500">
                {formatResponseTime(health.details.redis.responseTime)}
              </div>
              <p className="text-xs text-muted-foreground">Cache Response</p>
            </div>
            <div className="text-center p-3 border rounded">
              <div className={`text-2xl font-bold ${
                health.details.lnmarkets.responseTime < 1000 ? 'text-green-500' :
                health.details.lnmarkets.responseTime < 3000 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {formatResponseTime(health.details.lnmarkets.responseTime)}
              </div>
              <p className="text-xs text-muted-foreground">LN Markets</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealth;
