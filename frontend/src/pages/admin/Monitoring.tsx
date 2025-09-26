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
  Zap,
  Cpu,
  HardDrive,
  MemoryStick,
  Network
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

interface HardwareMetrics {
  cpu: {
    usage: string;
    cores: number;
    temperature?: string;
    loadAverage?: string[];
  };
  memory: {
    total: string;
    used: string;
    free: string;
    usagePercent: string;
    swap: {
      total: string;
      used: string;
      free: string;
    };
  };
  disk?: {
    total: string;
    used: string;
    free: string;
    usagePercent: string;
    readSpeed: string;
    writeSpeed: string;
  };
  system: {
    uptime: string;
    platform: string;
    arch: string;
    hostname: string;
    loadAverage?: string[];
  };
  network: {
    interfaces: Array<{
      name: string;
      bytesReceived: string;
      bytesSent: string;
      packetsReceived: string;
      packetsSent: string;
    }>;
  };
  lastUpdate: string;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    value: number;
    threshold: number;
    timestamp: number;
  }>;
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
        status: string;
        lastCheck: number;
        successRate: number;
        errorCount: number;
      };
      coinGecko: {
        latency: number;
        status: string;
        lastCheck: number;
        successRate: number;
        errorCount: number;
      };
    };
  };
}

const formatUptime = (uptime: number): string => {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const Monitoring: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthReport | null>(null);
  const [hardwareMetrics, setHardwareMetrics] = useState<HardwareMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'api' | 'hardware'>('api');

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch health data and hardware metrics in parallel
      const [healthResponse, hardwareResponse] = await Promise.all([
        api.get('/api/admin/health/health'),
        api.get('/api/admin/hardware/metrics').catch(() => null) // Don't fail if hardware metrics are not available
      ]);

      if (healthResponse.data.success) {
        setHealthData(healthResponse.data.data);
      }

      if (hardwareResponse && hardwareResponse.data.success) {
        setHardwareMetrics(hardwareResponse.data.data);
      }

      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Failed to fetch health data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
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
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-500/50 bg-green-500/10';
      case 'degraded':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'unhealthy':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return 'border-border bg-card';
    }
  };

  const getComponentIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'database':
        return <Database className="w-5 h-5 text-blue-500" />;
      case 'redis':
        return <Server className="w-5 h-5 text-red-500" />;
      case 'websocket':
        return <Wifi className="w-5 h-5 text-purple-500" />;
      case 'externalapis':
        return <Globe className="w-5 h-5 text-orange-500" />;
      case 'systemresources':
        return <Activity className="w-5 h-5 text-green-500" />;
      default:
        return <Server className="w-5 h-5 text-gray-500" />;
    }
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

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('api')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'api'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              API Performance
            </div>
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'hardware'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Server className="w-4 h-4 mr-2" />
              Hardware Metrics
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'api' && (
        <div className="space-y-6">
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
                    Last updated: {lastUpdate ? lastUpdate.toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">Uptime</p>
                <p className="text-lg font-semibold text-text-primary">{formatUptime(healthData.uptime)}</p>
              </div>
            </div>
          </div>

          {/* Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthData.components.map((component) => (
              <div key={component.name} className="bg-bg-card border border-border rounded-lg p-4 profile-tabs-glow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getComponentIcon(component.name)}
                    <h4 className="ml-2 font-medium text-text-primary capitalize">{component.name}</h4>
                  </div>
                  {getStatusIcon(component.status)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Status:</span>
                    <span className={`capitalize ${
                      component.status === 'healthy' ? 'text-green-600' :
                      component.status === 'degraded' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {component.status}
                    </span>
                  </div>
                  {component.latency && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Latency:</span>
                      <span className="text-text-primary">{component.latency}ms</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Last Check:</span>
                    <span className="text-text-primary">{formatTimestamp(component.lastCheck)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {healthData.alerts.length > 0 && (
            <div className="bg-bg-card border border-border rounded-lg p-6 profile-tabs-glow">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-text-primary">Active Alerts</h3>
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {healthData.alerts.filter(alert => !alert.resolved).length}
                </span>
              </div>
              <div className="space-y-3">
                {healthData.alerts.filter(alert => !alert.resolved).map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                    alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                    alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{alert.message}</p>
                        <p className="text-sm text-gray-600">Component: {alert.component}</p>
                        <p className="text-sm text-gray-600">{formatTimestamp(alert.timestamp)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="bg-card rounded-lg border border-border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Performance Metrics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Total Checks</h4>
                  <p className="text-text-secondary">{healthData.metrics.totalChecks}</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Success Rate</h4>
                  <p className="text-text-secondary">
                    {((healthData.metrics.successfulChecks / healthData.metrics.totalChecks) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Average Latency</h4>
                  <p className="text-text-secondary">{healthData.metrics.averageLatency.toFixed(1)}ms</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Uptime</h4>
                  <p className="text-text-secondary">{healthData.metrics.uptimePercentage.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-card rounded-lg border border-border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">System Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Uptime</h4>
                  <p className="text-text-secondary">{formatUptime(healthData.uptime)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Consecutive Failures</h4>
                  <p className="text-text-secondary">{healthData.metrics.consecutiveFailures}</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Last Healthy Time</h4>
                  <p className="text-text-secondary">{formatTimestamp(healthData.metrics.lastHealthyTime)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Total Alerts</h4>
                  <p className="text-text-secondary">{healthData.alerts.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Metrics Tab */}
      {activeTab === 'hardware' && (
        <div className="space-y-6">
          {hardwareMetrics ? (
            <>
              {/* Hardware Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* CPU */}
                <div className="bg-bg-card border border-border rounded-lg p-4 profile-tabs-glow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Cpu className="w-5 h-5 text-blue-400 mr-2" />
                      <h4 className="font-medium text-text-primary">CPU</h4>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      parseInt(hardwareMetrics.cpu.usage) > 90 ? 'bg-red-500/20 text-red-400' :
                      parseInt(hardwareMetrics.cpu.usage) > 70 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {hardwareMetrics.cpu.usage}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Cores:</span>
                      <span className="text-text-primary">{hardwareMetrics.cpu.cores}</span>
                    </div>
                    {hardwareMetrics.cpu.temperature && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Temperature:</span>
                        <span className="text-text-primary">{hardwareMetrics.cpu.temperature}°C</span>
                      </div>
                    )}
                    {hardwareMetrics.cpu.loadAverage && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Load Avg:</span>
                        <span className="text-text-primary">{hardwareMetrics.cpu.loadAverage.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Memory */}
                <div className="bg-bg-card border border-border rounded-lg p-4 profile-tabs-glow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <MemoryStick className="w-5 h-5 text-green-400 mr-2" />
                      <h4 className="font-medium text-text-primary">Memory</h4>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      parseInt(hardwareMetrics.memory.usagePercent) > 95 ? 'bg-red-500/20 text-red-400' :
                      parseInt(hardwareMetrics.memory.usagePercent) > 80 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {hardwareMetrics.memory.usagePercent}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Total:</span>
                      <span className="text-text-primary">{hardwareMetrics.memory.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Used:</span>
                      <span className="text-text-primary">{hardwareMetrics.memory.used}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Free:</span>
                      <span className="text-text-primary">{hardwareMetrics.memory.free}</span>
                    </div>
                  </div>
                </div>

                {/* Disk */}
                {hardwareMetrics.disk && (
                  <div className="bg-bg-card border border-border rounded-lg p-4 profile-tabs-glow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <HardDrive className="w-5 h-5 text-purple-400 mr-2" />
                        <h4 className="font-medium text-text-primary">Disk</h4>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        parseInt(hardwareMetrics.disk.usagePercent) > 95 ? 'bg-red-500/20 text-red-400' :
                        parseInt(hardwareMetrics.disk.usagePercent) > 85 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {hardwareMetrics.disk.usagePercent}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Total:</span>
                        <span className="text-text-primary">{hardwareMetrics.disk.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Used:</span>
                        <span className="text-text-primary">{hardwareMetrics.disk.used}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Free:</span>
                        <span className="text-text-primary">{hardwareMetrics.disk.free}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* System */}
                <div className="bg-bg-card border border-border rounded-lg p-4 profile-tabs-glow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Server className="w-5 h-5 text-orange-400 mr-2" />
                      <h4 className="font-medium text-text-primary">System</h4>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Uptime:</span>
                      <span className="text-text-primary">{hardwareMetrics.system.uptime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Platform:</span>
                      <span className="text-text-primary">{hardwareMetrics.system.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Hostname:</span>
                      <span className="text-text-primary">{hardwareMetrics.system.hostname}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Alerts */}
              {hardwareMetrics.alerts && hardwareMetrics.alerts.length > 0 && (
                <div className="bg-bg-card border border-border rounded-lg p-6 profile-tabs-glow">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                    <h3 className="text-lg font-semibold text-text-primary">Hardware Alerts</h3>
                  </div>
                  <div className="space-y-3">
                    {hardwareMetrics.alerts.map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                        alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{alert.message}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Update */}
              <div className="text-center text-sm text-text-secondary">
                Last updated: {hardwareMetrics.lastUpdate ? new Date(hardwareMetrics.lastUpdate).toLocaleString() : 'Never'}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Hardware Data Available</h3>
              <p className="text-gray-600">Unable to load hardware metrics information.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Monitoring;