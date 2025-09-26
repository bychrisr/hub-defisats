/**
 * Admin Monitoring Page
 * 
 * Dashboard de monitoramento de saúde do sistema
 */

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Activity, 
  Database, 
  Server, 
  Wifi, 
  Globe, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  details: Record<string, any>;
  lastCheck: number;
  error?: string;
}

interface HealthAlert {
  id: string;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

interface HealthReport {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  components: ComponentHealth[];
  alerts: HealthAlert[];
  metrics: {
    totalChecks: number;
    successfulChecks: number;
    failedChecks: number;
    averageLatency: number;
    uptimePercentage: number;
    lastHealthyTime: number;
    consecutiveFailures: number;
    apiMetrics: {
      lnMarkets: {
        latency: number;
        status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
        lastCheck: number;
        successRate: number;
        errorCount: number;
      };
      coinGecko: {
        latency: number;
        status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
        lastCheck: number;
        successRate: number;
        errorCount: number;
      };
    };
  };
}

const Monitoring: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/health/health');
      
      if (response.data.success) {
        setHealthData(response.data.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError('Failed to fetch health data');
      }
    } catch (err: any) {
      console.error('Error fetching health data:', err);
      setError(err.response?.data?.message || 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'unhealthy':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      default:
        return 'text-text-secondary bg-bg-card border-border';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low':
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      default:
        return 'text-text-secondary bg-bg-card border-border';
    }
  };

  const getComponentIcon = (name: string) => {
    switch (name) {
      case 'database':
        return <Database className="w-6 h-6" />;
      case 'redis':
        return <Server className="w-6 h-6" />;
      case 'websocket':
        return <Wifi className="w-6 h-6" />;
      case 'externalAPIs':
        return <Globe className="w-6 h-6" />;
      case 'systemResources':
        return <Activity className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading health data...</span>
                </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="w-6 h-6 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-800">Error Loading Health Data</h3>
        </div>
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={fetchHealthData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Health Data Available</h3>
        <p className="text-gray-600">Unable to load system health information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-bg-primary min-h-screen p-6">
          {/* Header */}
      <div className="flex items-center justify-between">
                      <div>
          <h1 className="text-2xl font-bold text-text-primary">System Monitoring</h1>
          <p className="text-text-secondary">Real-time health monitoring and system status</p>
                  </div>
                  <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-text-secondary">Auto-refresh</span>
            </label>
          </div>
          <button
            onClick={fetchHealthData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors profile-tabs-glow"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
          </button>
                  </div>
                </div>

      {/* Overall Status */}
      <div className={`rounded-lg border-2 p-6 bg-bg-card border-border profile-tabs-glow ${getStatusColor(healthData.overallStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(healthData.overallStatus)}
            <div className="ml-3">
              <h2 className="text-xl font-semibold capitalize text-text-primary">
                System Status: {healthData.overallStatus}
              </h2>
              <p className="text-sm text-text-secondary">
                Last updated: {lastUpdate ? formatTimestamp(lastUpdate.getTime()) : 'Never'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {healthData.metrics.uptimePercentage.toFixed(1)}%
                  </div>
            <div className="text-sm text-text-secondary">Uptime</div>
                  </div>
                </div>
                  </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-card rounded-lg border border-border p-4 profile-tabs-glow">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
              <div className="text-2xl font-bold text-text-primary">{healthData.metrics.totalChecks}</div>
              <div className="text-sm text-text-secondary">Total Checks</div>
                    </div>
                  </div>
                </div>
        
        <div className="bg-bg-card rounded-lg border border-border p-4 profile-tabs-glow">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                  <div>
              <div className="text-2xl font-bold text-text-primary">{healthData.metrics.successfulChecks}</div>
              <div className="text-sm text-text-secondary">Successful</div>
                    </div>
                  </div>
                </div>
        
        <div className="bg-bg-card rounded-lg border border-border p-4 profile-tabs-glow">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
                  <div>
              <div className="text-2xl font-bold text-text-primary">{healthData.metrics.failedChecks}</div>
              <div className="text-sm text-text-secondary">Failed</div>
                  </div>
                </div>
                </div>
        
        <div className="bg-bg-card rounded-lg border border-border p-4 profile-tabs-glow">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-purple-500 mr-3" />
                  <div>
              <div className="text-2xl font-bold text-text-primary">{healthData.metrics.averageLatency.toFixed(0)}ms</div>
              <div className="text-sm text-text-secondary">Avg Latency</div>
                    </div>
                  </div>
                  </div>
                </div>

      {/* Individual API Metrics */}
      <div className="bg-bg-card rounded-lg border border-border profile-tabs-glow">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Individual API Performance</h3>
          <p className="text-sm text-text-secondary">Detailed metrics for each external API</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LN Markets API */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">LN Markets API</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  healthData.metrics.apiMetrics.lnMarkets.status === 'healthy' ? 'text-green-400 bg-green-900/20 border-green-500/30' :
                  healthData.metrics.apiMetrics.lnMarkets.status === 'degraded' ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30' :
                  healthData.metrics.apiMetrics.lnMarkets.status === 'unhealthy' ? 'text-red-400 bg-red-900/20 border-red-500/30' :
                  'text-text-secondary bg-bg-card border-border'
                }`}>
                  {healthData.metrics.apiMetrics.lnMarkets.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-text-primary">
                    {healthData.metrics.apiMetrics.lnMarkets.latency.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-text-secondary">Latency</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-text-primary">
                    {healthData.metrics.apiMetrics.lnMarkets.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-text-secondary">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-text-primary">
                    {healthData.metrics.apiMetrics.lnMarkets.errorCount}
                  </div>
                  <div className="text-sm text-text-secondary">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-text-primary">
                    {healthData.metrics.apiMetrics.lnMarkets.lastCheck ? 
                      new Date(healthData.metrics.apiMetrics.lnMarkets.lastCheck).toLocaleTimeString() : 
                      'Never'
                    }
                  </div>
                  <div className="text-sm text-text-secondary">Last Check</div>
                </div>
              </div>
            </div>

            {/* CoinGecko API */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">CoinGecko API</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  healthData.metrics.apiMetrics.coinGecko.status === 'healthy' ? 'text-green-400 bg-green-900/20 border-green-500/30' :
                  healthData.metrics.apiMetrics.coinGecko.status === 'degraded' ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30' :
                  healthData.metrics.apiMetrics.coinGecko.status === 'unhealthy' ? 'text-red-400 bg-red-900/20 border-red-500/30' :
                  'text-text-secondary bg-bg-card border-border'
                }`}>
                  {healthData.metrics.apiMetrics.coinGecko.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-text-primary">
                    {healthData.metrics.apiMetrics.coinGecko.latency.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-text-secondary">Latency</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-text-primary">
                    {healthData.metrics.apiMetrics.coinGecko.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-text-secondary">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-text-primary">
                    {healthData.metrics.apiMetrics.coinGecko.errorCount}
                  </div>
                  <div className="text-sm text-text-secondary">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-text-primary">
                    {healthData.metrics.apiMetrics.coinGecko.lastCheck ? 
                      new Date(healthData.metrics.apiMetrics.coinGecko.lastCheck).toLocaleTimeString() : 
                      'Never'
                    }
                  </div>
                  <div className="text-sm text-text-secondary">Last Check</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Components Status */}
      <div className="bg-bg-card rounded-lg border border-border profile-tabs-glow">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Component Status</h3>
                </div>
        <div className="divide-y">
          {healthData.components.map((component) => (
            <div key={component.name} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getComponentIcon(component.name)}
                  <div className="ml-3">
                    <h4 className="font-medium capitalize text-text-primary">{component.name}</h4>
                    <p className="text-sm text-text-secondary">
                      Last check: {formatTimestamp(component.lastCheck)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {component.latency && (
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-text-primary">{component.latency}ms</span>
                    </div>
                  )}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(component.status)} flex items-center`}>
                    <span className="capitalize">{component.status}</span>
                  </div>
                </div>
              </div>
              
              {component.details && Object.keys(component.details).length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(component.details).map(([key, value]) => (
                    <div key={key} className="bg-bg-card border border-border rounded p-3 profile-tabs-glow">
                      <div className="text-sm font-medium text-text-primary capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {typeof value === 'object' ? (
                          <div className="space-y-1">
                            {Object.entries(value).map(([subKey, subValue]) => (
                              <div key={subKey} className="flex justify-between items-center">
                                <span className="capitalize text-text-secondary">{subKey.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className={`font-mono text-sm ${
                                  subKey.toLowerCase().includes('latency') || subKey.toLowerCase().includes('time') 
                                    ? 'text-blue-400 font-semibold' 
                                    : 'text-text-primary'
                                }`}>
                                  {String(subValue)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className={`font-mono ${
                            key.toLowerCase().includes('latency') || key.toLowerCase().includes('time')
                              ? 'text-blue-400 font-semibold'
                              : 'text-text-primary'
                          }`}>
                            {String(value)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {component.error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded">
                  <div className="text-sm text-red-400">
                    <strong>Error:</strong> {component.error}
                  </div>
                </div>
              )}
                    </div>
          ))}
                    </div>
                  </div>
                  
      {/* Active Alerts */}
      {healthData.alerts.length > 0 && (
        <div className="bg-bg-card rounded-lg border border-border profile-tabs-glow">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary">Active Alerts</h3>
                    </div>
          <div className="divide-y">
            {healthData.alerts.filter(alert => !alert.resolved).map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mr-3" />
                    <div>
                      <h4 className="font-medium text-text-primary">{alert.message}</h4>
                      <p className="text-sm text-text-secondary">
                        Component: {alert.component} • {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
      )}

      {/* System Info */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">System Information</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Uptime</h4>
              <p className="text-gray-600">{formatUptime(healthData.uptime)}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Consecutive Failures</h4>
              <p className="text-gray-600">{healthData.metrics.consecutiveFailures}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Last Healthy Time</h4>
              <p className="text-gray-600">{formatTimestamp(healthData.metrics.lastHealthyTime)}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Total Alerts</h4>
              <p className="text-gray-600">{healthData.alerts.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;