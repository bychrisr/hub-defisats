import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import SystemHealth from '@/components/system/SystemHealth';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

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
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonitoringData = async () => {
    try {
      setRefreshing(true);
      console.log('🔍 MONITORING - Fetching monitoring data...');
      console.log('🔍 MONITORING - Token in localStorage:', localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING');
      console.log('🔍 MONITORING - Auth state:', { isAuthenticated, authLoading });
      
      const response = await api.get('/api/admin/monitoring');
      console.log('✅ MONITORING - Data received:', response.data);
      
      setMonitoringData(response.data);
    } catch (error: any) {
      console.error('❌ MONITORING - Error fetching monitoring data:', error);
      console.error('❌ MONITORING - Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Só fazer a requisição se estiver autenticado e não estiver carregando
    if (isAuthenticated && !authLoading) {
      fetchMonitoringData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchMonitoringData, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, authLoading]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'good':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
      case 'down':
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'down':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-500';
    if (latency < 200) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getErrorRateColor = (rate: number) => {
    if (rate < 1) return 'text-green-500';
    if (rate < 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'degrading') => {
    switch (trend) {
      case 'improving': return '↗️';
      case 'stable': return '→';
      case 'degrading': return '↘️';
      default: return '?';
    }
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'degrading') => {
    switch (trend) {
      case 'improving': return 'text-green-500';
      case 'stable': return 'text-blue-500';
      case 'degrading': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const renderMetricCard = (
    title: string,
    current: number,
    averages: MetricAverages,
    unit: string = '',
    formatValue: (value: number) => string = (v) => v.toString()
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {getStatusIcon(averages.status)}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{formatValue(current)}{unit}</span>
            <span className={`text-sm ${getStatusColor(averages.status)}`}>
              {averages.status.toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>1h avg:</span>
              <span>{formatValue(averages.average_1h)}{unit}</span>
            </div>
            <div className="flex justify-between">
              <span>24h avg:</span>
              <span>{formatValue(averages.average_24h)}{unit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Trend:</span>
              <span className={`${getTrendColor(averages.trend)}`}>
                {getTrendIcon(averages.trend)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!monitoringData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load monitoring data</p>
        <Button onClick={fetchMonitoringData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const { 
    api_latency, 
    error_rate, 
    queue_sizes, 
    ln_markets_status, 
    system_health,
    memory_usage,
    cpu_usage,
    active_connections,
    averages,
    health_summary
  } = monitoringData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="header-modern flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-vibrant">System Monitoring</h1>
          <p className="text-vibrant-secondary mt-2">Real-time infrastructure monitoring with historical averages</p>
        </div>
        <Button 
          onClick={fetchMonitoringData} 
          disabled={refreshing}
          className="btn-modern-primary"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Health Summary */}
      {health_summary && (
        <Card className={`card-modern ${health_summary.overall_status === 'critical' ? 'border-red-500' : 
                         health_summary.overall_status === 'warning' ? 'border-yellow-500' : 
                         'border-green-500'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-vibrant">
              {getStatusIcon(health_summary.overall_status)}
              System Health Summary
              <Badge variant={health_summary.overall_status === 'critical' ? 'destructive' : 
                             health_summary.overall_status === 'warning' ? 'secondary' : 'default'}>
                {health_summary.overall_status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health_summary.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Issues:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {health_summary.issues.map((issue, index) => (
                    <li key={index} className="text-red-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {health_summary.recommendations.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="font-medium text-blue-600">Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {health_summary.recommendations.map((rec, index) => (
                    <li key={index} className="text-blue-600">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics with Averages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {averages ? (
          <>
            {renderMetricCard(
              'API Latency',
              api_latency,
              averages.api_latency,
              'ms',
              (v) => v.toFixed(0)
            )}
            {renderMetricCard(
              'Error Rate',
              error_rate,
              averages.error_rate,
              '%',
              (v) => v.toFixed(2)
            )}
            {renderMetricCard(
              'Memory Usage',
              memory_usage || 0,
              averages.memory_usage,
              'MB',
              (v) => v.toFixed(1)
            )}
            {renderMetricCard(
              'CPU Usage',
              cpu_usage || 0,
              averages.cpu_usage,
              '%',
              (v) => v.toFixed(1)
            )}
          </>
        ) : (
          <>
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-vibrant-secondary">API Latency</CardTitle>
            <Activity className="h-4 w-4 icon-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-vibrant number-lg ${getLatencyColor(api_latency)}`}>
              {api_latency}ms
            </div>
            <p className="text-xs text-vibrant-secondary mt-1">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-vibrant-secondary">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 icon-warning" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-vibrant number-lg ${getErrorRateColor(error_rate)}`}>
              {error_rate}%
            </div>
            <p className="text-xs text-vibrant-secondary mt-1">
              5xx errors in last 5min
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-vibrant-secondary">LN Markets API</CardTitle>
            <CheckCircle className="h-4 w-4 icon-success" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(ln_markets_status)}
              <span className={`text-lg font-semibold capitalize text-vibrant ${getStatusColor(ln_markets_status)}`}>
                {ln_markets_status}
              </span>
            </div>
            <p className="text-xs text-vibrant-secondary mt-1">
              External API status
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-vibrant-secondary">Queue Health</CardTitle>
            <Activity className="h-4 w-4 icon-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(queue_sizes).length > 0 ? (
                Object.entries(queue_sizes).map(([queue, size]) => (
                  <div key={queue} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-vibrant-secondary">
                      {queue.replace(/-/g, ' ')}
                    </span>
                    <Badge variant={size > 100 ? "destructive" : size > 50 ? "secondary" : "default"}>
                      {size} jobs
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-vibrant-secondary py-4">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No queue data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Queue Health with Averages */}
      {averages && (
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-vibrant-secondary">Queue Health</CardTitle>
            {getStatusIcon(averages.queue_health.status)}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-vibrant number-lg">{averages.queue_health.total_jobs} jobs</span>
                <span className={`text-sm ${getStatusColor(averages.queue_health.status)}`}>
                  {averages.queue_health.status.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-vibrant-secondary">
                <div className="flex justify-between">
                  <span>1h avg:</span>
                  <span className="number-sm">{averages.queue_health.average_1h.toFixed(1)} jobs</span>
                </div>
                <div className="flex justify-between">
                  <span>24h avg:</span>
                  <span className="number-sm">{averages.queue_health.average_24h.toFixed(1)} jobs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Trend:</span>
                  <span className={`${getTrendColor(averages.queue_health.trend)}`}>
                    {getTrendIcon(averages.queue_health.trend)}
                  </span>
                </div>
              </div>

              {Object.entries(queue_sizes).length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="font-medium text-sm text-vibrant">Queue Breakdown:</h4>
                  {Object.entries(queue_sizes).map(([queue, size]) => (
                    <div key={queue} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-vibrant-secondary">
                        {queue.replace(/-/g, ' ')}
                      </span>
                      <Badge variant={size > 100 ? "destructive" : size > 50 ? "secondary" : "default"}>
                        {size} jobs
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health - Detailed Component */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-vibrant">System Health</h2>
        <SystemHealth />
      </div>

      {/* Alerts Section */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="text-vibrant">System Alerts</CardTitle>
          <CardDescription className="text-vibrant-secondary">Recent system alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 border rounded-lg bg-background/50 backdrop-blur-sm">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-vibrant">All systems operational</p>
                <p className="text-sm text-vibrant-secondary">Last check: 2 minutes ago</p>
              </div>
              <Badge variant="default">Info</Badge>
            </div>
            
            <div className="flex items-center space-x-4 p-4 border rounded-lg bg-background/50 backdrop-blur-sm">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium text-vibrant">High queue volume detected</p>
                <p className="text-sm text-vibrant-secondary">automation-execute queue has 150 jobs</p>
              </div>
              <Badge variant="secondary">Warning</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
