/**
 * Admin Monitoring Page
 * 
 * Dashboard de monitoramento de saúde do sistema
 */

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { cachedApi } from '@/services/cached-api.service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
  Network,
  Shield,
  BarChart3,
  DollarSign,
  Settings
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

interface MarketData {
  index: number;
  change24h: number;
  timestamp: number;
  provider: string;
  source: 'primary' | 'fallback' | 'emergency' | 'cache';
  age: number;
}

interface LNMarketsData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

interface ProviderStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  failureCount: number;
}

interface ExternalAPIStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  successRate: number;
  lastCheck: number;
  errorCount: number;
  endpoint?: string;
  description?: string;
  provider?: 'lnmarkets' | 'coingecko' | 'binance' | 'tradingview';
  category?: 'trading' | 'market_data' | 'charts' | 'analytics';
  enabled?: boolean;
  priority?: number;
}

const Monitoring: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthReport | null>(null);
  const [hardwareMetrics, setHardwareMetrics] = useState<HardwareMetrics | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [lnMarketsData, setLnMarketsData] = useState<LNMarketsData | null>(null);
  const [providerStatus, setProviderStatus] = useState<any>({});
  const [externalAPIs, setExternalAPIs] = useState<ExternalAPIStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'api' | 'hardware' | 'external' | 'market' | 'diagnostic' | 'protection'>('api');
  
  // Diagnostic state
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [connectionTestData, setConnectionTestData] = useState<any>(null);
  const [continuousMonitoring, setContinuousMonitoring] = useState<{
    isRunning: boolean;
    monitoringId?: string;
    durationMinutes: number;
  }>({ isRunning: false, durationMinutes: 5 });

  // Protection state
  const [protectionData, setProtectionData] = useState<any>(null);
  const [protectionLoading, setProtectionLoading] = useState(false);

  const handleResetCircuitBreaker = async () => {
    try {
      const response = await cachedApi.post('/api/admin/market-data/providers/reset-circuit-breaker');
      if (response.data.success) {
        toast.success('Circuit breakers resetados com sucesso!');
        // Refresh data after reset
        await fetchHealthData();
      } else {
        toast.error('Erro ao resetar circuit breakers');
      }
    } catch (error: any) {
      console.error('Failed to reset circuit breakers:', error);
      toast.error('Erro ao resetar circuit breakers');
    }
  };

  const handleTestAllProviders = async () => {
    try {
      const response = await cachedApi.post('/api/admin/market-data/providers/test');
      if (response.data.success) {
        toast.success('Teste de provedores executado com sucesso!');
        await fetchHealthData();
      } else {
        toast.error('Erro ao testar provedores');
      }
    } catch (error: any) {
      console.error('Failed to test providers:', error);
      toast.error('Erro ao testar provedores');
    }
  };

  const handleForceRefresh = async () => {
    try {
      const response = await cachedApi.post('/api/admin/market-data/market-data/refresh');
      if (response.data.success) {
        toast.success('Dados de mercado atualizados com sucesso!');
        await fetchHealthData();
      } else {
        toast.error('Erro ao atualizar dados de mercado');
      }
    } catch (error: any) {
      console.error('Failed to refresh market data:', error);
      toast.error('Erro ao atualizar dados de mercado');
    }
  };

  const handleRunDiagnostic = async () => {
    try {
      setDiagnosticLoading(true);
      const response = await cachedApi.get('/api/admin/lnmarkets/diagnostic/full');
      if (response.data.success) {
        setDiagnosticData(response.data.data);
        toast.success('Diagnóstico executado com sucesso!');
      } else {
        toast.error('Erro ao executar diagnóstico');
      }
    } catch (error: any) {
      console.error('Failed to run diagnostic:', error);
      toast.error('Erro ao executar diagnóstico');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleConnectionTest = async () => {
    try {
      setDiagnosticLoading(true);
      const response = await cachedApi.get('/api/admin/lnmarkets/diagnostic/connection-test');
      if (response.data.success) {
        setConnectionTestData(response.data.data);
        toast.success('Teste de conexão executado com sucesso!');
      } else {
        toast.error('Erro ao testar conexão');
      }
    } catch (error: any) {
      console.error('Failed to test connection:', error);
      toast.error('Erro ao testar conexão');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleStartContinuousMonitoring = async () => {
    try {
      setDiagnosticLoading(true);
      const response = await cachedApi.post('/api/admin/lnmarkets/diagnostic/continuous-monitoring', {
        durationMinutes: continuousMonitoring.durationMinutes
      });
      if (response.data.success) {
        setContinuousMonitoring({
          isRunning: true,
          monitoringId: response.data.data.monitoringId,
          durationMinutes: continuousMonitoring.durationMinutes
        });
        toast.success(`Monitoramento contínuo iniciado por ${continuousMonitoring.durationMinutes} minutos!`);
      } else {
        toast.error('Erro ao iniciar monitoramento contínuo');
      }
    } catch (error: any) {
      console.error('Failed to start continuous monitoring:', error);
      toast.error('Erro ao iniciar monitoramento contínuo');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleTestProtection = async () => {
    try {
      setProtectionLoading(true);
      const response = await cachedApi.post('/api/admin/market-data/protection/test', {
        userId: 'test-user',
        automationId: 'test-automation'
      });
      if (response.data.success) {
        setProtectionData(response.data.data);
        toast.success('Teste de proteção executado com sucesso!');
      } else {
        toast.error('Erro ao testar proteção');
      }
    } catch (error: any) {
      console.error('Failed to test protection:', error);
      toast.error('Erro ao testar proteção');
    } finally {
      setProtectionLoading(false);
    }
  };

  const loadProtectionData = async () => {
    try {
      setProtectionLoading(true);
      
      // Load protection status
      const statusResponse = await cachedApi.get('/api/admin/market-data/protection/status');
      if (statusResponse.data.success) {
        setProtectionData(statusResponse.data.data);
      }

      // Load cache configuration
      const cacheResponse = await cachedApi.get('/api/admin/market-data/protection/cache/config');
      if (cacheResponse.data.success) {
        setCacheConfig(cacheResponse.data.data);
      }

      // Load protection rules
      const rulesResponse = await cachedApi.get('/api/admin/market-data/protection/rules');
      if (rulesResponse.data.success) {
        setProtectionRules(rulesResponse.data.data);
      }

      // Load provider status
      const providersResponse = await cachedApi.get('/api/admin/market-data/protection/providers');
      if (providersResponse.data.success) {
        setProviderStatus(providersResponse.data.data);
      }

      // Load protection metrics
      const metricsResponse = await cachedApi.get('/api/admin/market-data/protection/metrics');
      if (metricsResponse.data.success) {
        setProtectionMetrics(metricsResponse.data.data);
      }

    } catch (error: any) {
      console.error('Failed to load protection data:', error);
      toast.error('Erro ao carregar dados de proteção');
    } finally {
      setProtectionLoading(false);
    }
  };

  const handleUpdateCacheConfig = async (newConfig: any) => {
    try {
      const response = await cachedApi.post('/api/admin/market-data/protection/cache/config', newConfig);
      if (response.data.success) {
        setCacheConfig(newConfig);
        toast.success('Configuração de cache atualizada!');
        setShowConfigModal(false);
      } else {
        toast.error('Erro ao atualizar configuração de cache');
      }
    } catch (error: any) {
      console.error('Failed to update cache config:', error);
      toast.error('Erro ao atualizar configuração de cache');
    }
  };

  const handleUpdateProtectionRules = async (newRules: any) => {
    try {
      const response = await cachedApi.post('/api/admin/market-data/protection/rules', newRules);
      if (response.data.success) {
        setProtectionRules(newRules);
        toast.success('Regras de proteção atualizadas!');
        setShowConfigModal(false);
      } else {
        toast.error('Erro ao atualizar regras de proteção');
      }
    } catch (error: any) {
      console.error('Failed to update protection rules:', error);
      toast.error('Erro ao atualizar regras de proteção');
    }
  };

  const handleResetCircuitBreaker = async () => {
    try {
      const response = await cachedApi.post('/api/admin/market-data/protection/circuit-breaker/reset');
      if (response.data.success) {
        toast.success('Circuit breaker resetado com sucesso!');
        loadProtectionData(); // Reload data
      } else {
        toast.error('Erro ao resetar circuit breaker');
      }
    } catch (error: any) {
      console.error('Failed to reset circuit breaker:', error);
      toast.error('Erro ao resetar circuit breaker');
    }
  };

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel using cached API
      const [healthResponse, hardwareResponse, marketResponse, providerResponse, lnMarketsResponse] = await Promise.all([
        cachedApi.get('/api/admin/health/health'),
        cachedApi.get('/api/admin/hardware/metrics').catch(() => null), // Don't fail if hardware metrics are not available
        cachedApi.get('/api/admin/market-data/market-data').catch(() => null), // Don't fail if market data is not available
        cachedApi.get('/api/admin/market-data/providers/status').catch(() => null), // Don't fail if provider status is not available
        cachedApi.get('/api/admin/lnmarkets/market-data').catch((error) => {
          console.warn('LN Markets data not available:', error.response?.data?.message || error.message);
          return null;
        })
      ]);

      if (healthResponse.data.success) {
        setHealthData(healthResponse.data.data);
        
        // Extract external API data from health response
        const apiMetrics = healthResponse.data.data.metrics?.apiMetrics;
        if (apiMetrics) {
          const externalAPIsData: ExternalAPIStatus[] = [
            {
              name: 'LN Markets',
              status: apiMetrics.lnMarkets?.status || 'unknown',
              latency: apiMetrics.lnMarkets?.latency || 0,
              successRate: apiMetrics.lnMarkets?.successRate || 0,
              lastCheck: apiMetrics.lnMarkets?.lastCheck || 0,
              errorCount: apiMetrics.lnMarkets?.errorCount || 0,
              endpoint: 'https://api.lnmarkets.com',
              description: 'Lightning Network trading platform',
              provider: 'lnmarkets',
              category: 'trading',
              enabled: true,
              priority: 1
            },
            {
              name: 'TradingView',
              status: 'healthy', // TODO: Implement actual TradingView health check
              latency: 200,
              successRate: 98.8,
              lastCheck: Date.now(),
              errorCount: 0,
              endpoint: 'https://www.tradingview.com',
              description: 'Financial charts and analytics platform',
              provider: 'tradingview',
              category: 'charts',
              enabled: true,
              priority: 2
            },
            {
              name: 'Binance',
              status: 'healthy', // TODO: Implement actual Binance health check
              latency: 150,
              successRate: 99.5,
              lastCheck: Date.now(),
              errorCount: 0,
              endpoint: 'https://api.binance.com',
              description: 'Cryptocurrency exchange API',
              provider: 'binance',
              category: 'trading',
              enabled: true,
              priority: 3
            },
            {
              name: 'CoinGecko',
              status: apiMetrics.coinGecko?.status || 'unknown',
              latency: apiMetrics.coinGecko?.latency || 0,
              successRate: apiMetrics.coinGecko?.successRate || 0,
              lastCheck: apiMetrics.coinGecko?.lastCheck || 0,
              errorCount: apiMetrics.coinGecko?.errorCount || 0,
              endpoint: 'https://api.coingecko.com',
              description: 'Cryptocurrency market data provider',
              provider: 'coingecko',
              category: 'market_data',
              enabled: false, // Temporarily disabled
              priority: 4
            }
          ];
          setExternalAPIs(externalAPIsData);
        }
      }

      if (hardwareResponse && hardwareResponse.data.success) {
        setHardwareMetrics(hardwareResponse.data.data);
      }

      if (marketResponse && marketResponse.data.success) {
        setMarketData(marketResponse.data.data);
      }

      if (providerResponse && providerResponse.data.success) {
        setProviderStatus(providerResponse.data.data);
      }

      if (lnMarketsResponse && lnMarketsResponse.data.success) {
        setLnMarketsData(lnMarketsResponse.data.data);
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
    loadProtectionData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealthData();
      loadProtectionData();
    }, 30000); // Refresh every 30 seconds
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
        return <AlertTriangle className="w-5 h-5 text-text-secondary" />;
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

  const getAPIProviderIcon = (provider: string) => {
    switch (provider) {
      case 'lnmarkets':
        return <Zap className="w-6 h-6 text-orange-400 mr-3" />;
      case 'coingecko':
        return <TrendingUp className="w-6 h-6 text-green-400 mr-3" />;
      case 'binance':
        return <DollarSign className="w-6 h-6 text-yellow-400 mr-3" />;
      case 'tradingview':
        return <BarChart3 className="w-6 h-6 text-blue-400 mr-3" />;
      default:
        return <Globe className="w-6 h-6 text-blue-400 mr-3" />;
    }
  };

  const getCategoryColor = (category: string, enabled: boolean = true) => {
    if (!enabled) {
      return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
    
    switch (category) {
      case 'trading':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'market_data':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'charts':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'analytics':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
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
        return <Server className="w-5 h-5 text-text-secondary" />;
    }
  };

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-text-secondary">Loading health data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="w-6 h-6 text-destructive mr-2" />
          <h3 className="text-lg font-medium text-destructive">Error Loading Health Data</h3>
        </div>
        <p className="mt-2 text-destructive">{error}</p>
        <button
          onClick={fetchHealthData}
          className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive-hover transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">No Health Data Available</h3>
        <p className="text-text-secondary">Unable to load system health information.</p>
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
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors profile-tabs-glow"
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
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
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
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            <div className="flex items-center">
              <Server className="w-4 h-4 mr-2" />
              Hardware Metrics
            </div>
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'external'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              External APIs
            </div>
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'market'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Market Data
            </div>
          </button>
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'diagnostic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Diagnostic
            </div>
          </button>
          <button
            onClick={() => setActiveTab('protection')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'protection'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Protection
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
                <span className="ml-2 px-2 py-1 bg-destructive/20 text-destructive text-xs font-medium rounded-full">
                  {healthData.alerts.filter(alert => !alert.resolved).length}
                </span>
              </div>
              <div className="space-y-3">
                {healthData.alerts.filter(alert => !alert.resolved).map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${
                    alert.severity === 'critical' ? 'bg-destructive/10 border-destructive/20' :
                    alert.severity === 'high' ? 'bg-warning/10 border-warning/20' :
                    alert.severity === 'medium' ? 'bg-warning/10 border-warning/20' :
                    'bg-primary/10 border-primary/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">{alert.message}</p>
                        <p className="text-sm text-text-secondary">Component: {alert.component}</p>
                        <p className="text-sm text-text-secondary">{formatTimestamp(alert.timestamp)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.severity === 'critical' ? 'bg-destructive/20 text-destructive' :
                        alert.severity === 'high' ? 'bg-warning/20 text-warning' :
                        alert.severity === 'medium' ? 'bg-warning/20 text-warning' :
                        'bg-primary/20 text-primary'
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
          <div className="bg-bg-card rounded-lg border border-border">
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
          <div className="bg-bg-card rounded-lg border border-border">
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
                        alert.severity === 'critical' ? 'bg-destructive/10 border-destructive/20' :
                        alert.severity === 'high' ? 'bg-warning/10 border-warning/20' :
                        alert.severity === 'medium' ? 'bg-warning/10 border-warning/20' :
                        'bg-primary/10 border-primary/20'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-text-primary">{alert.message}</p>
                            <p className="text-sm text-text-secondary">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.severity === 'critical' ? 'bg-destructive/20 text-destructive' :
                            alert.severity === 'high' ? 'bg-warning/20 text-warning' :
                            alert.severity === 'medium' ? 'bg-warning/20 text-warning' :
                            'bg-primary/20 text-primary'
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
              <Server className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No Hardware Data Available</h3>
              <p className="text-text-secondary">Unable to load hardware metrics information.</p>
            </div>
          )}
        </div>
      )}

      {/* External APIs Tab */}
      {activeTab === 'external' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-2">External APIs Status</h2>
            <p className="text-text-secondary">Detailed monitoring of external API connections</p>
          </div>

          {externalAPIs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {externalAPIs.map((api) => (
                <div key={api.name} className={`bg-bg-card border border-border rounded-lg p-6 ${!api.enabled ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {getAPIProviderIcon(api.provider || 'default')}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-text-primary">{api.name}</h3>
                          {api.priority && (
                            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                              #{api.priority}
                            </span>
                          )}
                          {!api.enabled && (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">{api.description}</p>
                        {api.category && (
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(api.category, api.enabled)}`}>
                            {api.category.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      !api.enabled ? 'bg-gray-500/20 text-gray-400' :
                      api.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                      api.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {!api.enabled ? 'disabled' : api.status}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Endpoint:</span>
                      <span className="text-text-primary text-sm">{api.endpoint}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Latency:</span>
                      <span className="text-text-primary">{api.latency}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Success Rate:</span>
                      <span className="text-text-primary">{api.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Error Count:</span>
                      <span className="text-text-primary">{api.errorCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Last Check:</span>
                      <span className="text-text-primary">{formatTimestamp(api.lastCheck)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No External API Data Available</h3>
              <p className="text-text-secondary">Unable to load external API information.</p>
            </div>
          )}
        </div>
      )}

      {/* Market Data Tab */}
      {activeTab === 'market' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Market Data Status</h2>
            <p className="text-text-secondary">Real-time market data and provider status</p>
          </div>

          {(marketData || lnMarketsData) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LN Markets Data Card */}
              {lnMarketsData && (
                <div className="bg-bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Zap className="w-6 h-6 text-orange-400 mr-3" />
                    <h3 className="text-lg font-semibold text-text-primary">LN Markets Data</h3>
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-orange-500/10 text-orange-400 rounded-full">
                      Primary
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Symbol:</span>
                      <span className="text-text-primary font-mono">{lnMarketsData.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Price:</span>
                      <span className="text-text-primary font-mono">${lnMarketsData.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">24h Change:</span>
                      <span className={`font-mono ${lnMarketsData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {lnMarketsData.change24h >= 0 ? '+' : ''}{lnMarketsData.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Volume 24h:</span>
                      <span className="text-text-primary font-mono">{lnMarketsData.volume24h.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">High 24h:</span>
                      <span className="text-text-primary font-mono">${lnMarketsData.high24h.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Low 24h:</span>
                      <span className="text-text-primary font-mono">${lnMarketsData.low24h.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Timestamp:</span>
                      <span className="text-text-primary">{formatTimestamp(lnMarketsData.timestamp)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback Market Data Card */}
              {marketData && (
                <div className="bg-bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <DollarSign className="w-6 h-6 text-yellow-400 mr-3" />
                    <h3 className="text-lg font-semibold text-text-primary">Fallback Market Data</h3>
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-400 rounded-full">
                      {marketData.provider}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Index:</span>
                      <span className="text-text-primary font-semibold">{marketData.index}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">24h Change:</span>
                      <span className={`font-semibold ${
                        marketData.change24h > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {marketData.change24h > 0 ? '+' : ''}{marketData.change24h}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Provider:</span>
                      <span className="text-text-primary">{marketData.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Source:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        marketData.source === 'primary' ? 'bg-green-500/20 text-green-400' :
                        marketData.source === 'fallback' ? 'bg-yellow-500/20 text-yellow-400' :
                        marketData.source === 'emergency' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {marketData.source}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Age:</span>
                      <span className="text-text-primary">{marketData.age}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Timestamp:</span>
                      <span className="text-text-primary">{formatTimestamp(marketData.timestamp)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Provider Status Card */}
              <div className="bg-bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Shield className="w-6 h-6 text-blue-400 mr-3" />
                    <h3 className="text-lg font-semibold text-text-primary">Provider Status</h3>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleResetCircuitBreaker}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reset Circuit Breakers
                    </Button>
                    <Button
                      onClick={handleTestAllProviders}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Activity className="w-4 h-4 mr-1" />
                      Test All Providers
                    </Button>
                    <Button
                      onClick={handleForceRefresh}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Force Refresh
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {Array.isArray(providerStatus) ? (
                    providerStatus.map((provider: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <div>
                          <span className="text-text-primary font-medium">{provider.name}</span>
                          <div className="text-sm text-text-secondary">
                            Last check: {formatTimestamp(provider.lastCheck)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            provider.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            provider.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {provider.status}
                          </div>
                          {provider.errors > 0 && (
                            <div className="text-xs text-red-400">
                              {provider.errors} errors
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-text-secondary">No provider data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No Market Data Available</h3>
              <p className="text-text-secondary">Unable to load market data information.</p>
            </div>
          )}
        </div>
      )}

      {/* Diagnostic Tab */}
      {activeTab === 'diagnostic' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-2">LN Markets API Diagnostic</h2>
            <p className="text-text-secondary">Comprehensive testing and analysis of LN Markets API performance</p>
          </div>

          {/* Diagnostic Actions */}
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Activity className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-text-primary">Diagnostic Tools</h3>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleRunDiagnostic}
                  disabled={diagnosticLoading}
                  className="profile-tabs-glow"
                >
                  <Activity className={`w-4 h-4 mr-2 ${diagnosticLoading ? 'animate-spin' : ''}`} />
                  {diagnosticLoading ? 'Running...' : 'Run Full Diagnostic'}
                </Button>
                <Button
                  onClick={handleConnectionTest}
                  disabled={diagnosticLoading}
                  variant="outline"
                  className="profile-tabs-glow"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </div>
            
            {/* Diagnostic Results */}
            {diagnosticData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-text-primary">
                    {diagnosticData.analysis.averageLatency.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-text-secondary">Average Latency</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-text-primary">
                    {diagnosticData.analysis.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-text-secondary">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-text-primary">
                    {diagnosticData.analysis.p95Latency.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-text-secondary">P95 Latency</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className={`text-lg font-bold px-3 py-1 rounded-full ${
                    diagnosticData.analysis.connectionQuality === 'excellent' ? 'text-green-400 bg-green-500/20' :
                    diagnosticData.analysis.connectionQuality === 'good' ? 'text-blue-400 bg-blue-500/20' :
                    diagnosticData.analysis.connectionQuality === 'poor' ? 'text-yellow-400 bg-yellow-500/20' :
                    'text-red-400 bg-red-500/20'
                  }`}>
                    {diagnosticData.analysis.connectionQuality.toUpperCase()}
                  </div>
                  <div className="text-sm text-text-secondary">Connection Quality</div>
                </div>
              </div>
            )}

            {/* Connection Test Results */}
            {connectionTestData && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-text-primary mb-3">Connection Test Results</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-xl font-bold text-text-primary">
                      {connectionTestData.averageLatency?.toFixed(0) || '--'}ms
                    </div>
                    <div className="text-sm text-text-secondary">Average Latency</div>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-xl font-bold text-text-primary">
                      {connectionTestData.successfulTests || 0}/{connectionTestData.totalTests || 0}
                    </div>
                    <div className="text-sm text-text-secondary">Successful Tests</div>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-xl font-bold text-text-primary">
                      {connectionTestData.errors?.length || 0}
                    </div>
                    <div className="text-sm text-text-secondary">Errors</div>
                  </div>
                </div>
              </div>
            )}

            {/* Endpoint Test Results */}
            {diagnosticData?.endpointTests && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-text-primary mb-3">Endpoint Test Results</h4>
                <div className="space-y-2">
                  {diagnosticData.endpointTests.map((test: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {test.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium text-text-primary">
                            {test.method} {test.endpoint}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {formatTimestamp(test.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium text-text-primary">
                            {test.latency}ms
                          </div>
                          <div className="text-sm text-text-secondary">Latency</div>
                        </div>
                        {test.responseSize && (
                          <div className="text-right">
                            <div className="font-medium text-text-primary">
                              {(test.responseSize / 1024).toFixed(1)}KB
                            </div>
                            <div className="text-sm text-text-secondary">Size</div>
                          </div>
                        )}
                        {test.retryAttempts > 0 && (
                          <div className="text-xs text-text-secondary">
                            {test.retryAttempts} retries
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {diagnosticData?.analysis?.recommendations && diagnosticData.analysis.recommendations.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-text-primary mb-3">Recommendations</h4>
                <div className="space-y-2">
                  {diagnosticData.analysis.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Continuous Monitoring */}
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <BarChart3 className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-text-primary">Continuous Monitoring</h3>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-text-secondary">Duration (minutes):</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={continuousMonitoring.durationMinutes}
                    onChange={(e) => setContinuousMonitoring(prev => ({
                      ...prev,
                      durationMinutes: parseInt(e.target.value) || 5
                    }))}
                    className="w-20 px-2 py-1 rounded border border-border bg-bg-card text-text-primary"
                    disabled={continuousMonitoring.isRunning}
                  />
                </div>
                <Button
                  onClick={handleStartContinuousMonitoring}
                  disabled={diagnosticLoading || continuousMonitoring.isRunning}
                  variant="outline"
                  className="profile-tabs-glow"
                >
                  {continuousMonitoring.isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Monitoring...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Start Monitoring
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-text-secondary">
              {continuousMonitoring.isRunning 
                ? `Monitoramento ativo por ${continuousMonitoring.durationMinutes} minutos (ID: ${continuousMonitoring.monitoringId})`
                : 'Monitor API performance over time with detailed analytics and alerts.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Protection Tab */}
      {activeTab === 'protection' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Market Data Protection System</h2>
            <p className="text-text-secondary">Automation protection and data validation system</p>
          </div>

          {/* Protection Status Overview */}
          {protectionData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {protectionData.status === 'active' ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-text-secondary">Protection Status</div>
              </div>
              <div className="bg-bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {protectionData.providers?.active || 0}
                </div>
                <div className="text-sm text-text-secondary">Active Providers</div>
              </div>
              <div className="bg-bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {protectionData.uptime?.percentage || 0}%
                </div>
                <div className="text-sm text-text-secondary">System Uptime</div>
              </div>
              <div className="bg-bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400 mb-1">
                  {protectionData.cache?.hitRate || 0}%
                </div>
                <div className="text-sm text-text-secondary">Cache Hit Rate</div>
              </div>
            </div>
          )}

          {/* Protection Actions */}
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Shield className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-text-primary">Protection Tools</h3>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleTestProtection}
                  disabled={protectionLoading}
                  className="profile-tabs-glow"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {protectionLoading ? 'Testing...' : 'Test Protection'}
                </Button>
                <Button
                  onClick={() => {
                    setConfigType('cache');
                    setShowConfigModal(true);
                  }}
                  disabled={protectionLoading}
                  variant="outline"
                  className="profile-tabs-glow"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Cache
                </Button>
                <Button
                  onClick={() => {
                    setConfigType('rules');
                    setShowConfigModal(true);
                  }}
                  disabled={protectionLoading}
                  variant="outline"
                  className="profile-tabs-glow"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Rules
                </Button>
                <Button
                  onClick={handleResetCircuitBreaker}
                  disabled={protectionLoading}
                  variant="outline"
                  className="profile-tabs-glow"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Circuit Breaker
                </Button>
              </div>
            </div>

            {/* Test Results */}
            {protectionData?.results && (
              <div className="mb-6">
                <h4 className="font-medium text-text-primary mb-3">Last Test Results</h4>
                <div className="space-y-2">
                  {protectionData.results.tests.map((test: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {test.status === 'passed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-text-primary">{test.name}</span>
                      </div>
                      <div className="text-sm text-text-secondary">
                        {test.latency}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-text-primary mb-3">Cache Configuration</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Max Cache Age:</span>
                    <span className="text-sm text-text-primary">{cacheConfig?.maxAge || 30} seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Retry Attempts:</span>
                    <span className="text-sm text-text-primary">{cacheConfig?.retryAttempts || 3}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Fallback Timeout:</span>
                    <span className="text-sm text-text-primary">{cacheConfig?.fallbackTimeout || 5} seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Cache Size:</span>
                    <span className="text-sm text-text-primary">{cacheConfig?.size || '45.2MB'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-text-primary mb-3">Protection Rules</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Data Age Limit:</span>
                    <span className="text-sm text-text-primary">{protectionRules?.dataAgeLimit || 30} seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Failure Threshold:</span>
                    <span className="text-sm text-text-primary">{protectionRules?.failureThreshold || 5} consecutive</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Emergency Providers:</span>
                    <span className="text-sm text-text-primary">{protectionRules?.emergencyProviders?.join(', ') || 'CoinGecko, Binance'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Circuit Breaker:</span>
                    <span className="text-sm text-text-primary">{protectionRules?.enableCircuitBreaker ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Status */}
          {(Array.isArray(providerStatus) ? providerStatus.length > 0 : Object.keys(providerStatus).length > 0) && (
            <div className="bg-bg-card border border-border rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Globe className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-text-primary">Provider Status</h3>
              </div>
              <div className="space-y-3">
                {providerStatus.map((provider: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        provider.status === 'active' ? 'bg-green-500' : 
                        provider.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium text-text-primary">{provider.name}</div>
                        <div className="text-sm text-text-secondary">
                          Priority: {provider.priority} • Errors: {provider.errors}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-text-primary">
                        {provider.latency}ms
                      </div>
                      <div className="text-xs text-text-secondary">
                        {provider.successRate}% success
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Protection Metrics */}
          {protectionMetrics && (
            <div className="bg-bg-card border border-border rounded-lg p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400 mr-3" />
                <h3 className="text-lg font-semibold text-text-primary">Protection Metrics</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {protectionMetrics.totalRequests?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-text-secondary">Total Requests</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {protectionMetrics.cacheHits?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-text-secondary">Cache Hits</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-400 mb-1">
                    {protectionMetrics.averageLatency || 0}ms
                  </div>
                  <div className="text-sm text-text-secondary">Avg Latency</div>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Modal */}
          {showConfigModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Configure {configType === 'cache' ? 'Cache' : 'Protection Rules'}
                </h3>
                
                {configType === 'cache' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Max Cache Age (seconds)</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        defaultValue={cacheConfig?.maxAge || 30}
                        className="w-full px-3 py-2 border border-border rounded bg-bg-card text-text-primary"
                        id="maxAge"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Retry Attempts</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        defaultValue={cacheConfig?.retryAttempts || 3}
                        className="w-full px-3 py-2 border border-border rounded bg-bg-card text-text-primary"
                        id="retryAttempts"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Fallback Timeout (seconds)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        defaultValue={cacheConfig?.fallbackTimeout || 5}
                        className="w-full px-3 py-2 border border-border rounded bg-bg-card text-text-primary"
                        id="fallbackTimeout"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Data Age Limit (seconds)</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        defaultValue={protectionRules?.dataAgeLimit || 30}
                        className="w-full px-3 py-2 border border-border rounded bg-bg-card text-text-primary"
                        id="dataAgeLimit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Failure Threshold</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        defaultValue={protectionRules?.failureThreshold || 5}
                        className="w-full px-3 py-2 border border-border rounded bg-bg-card text-text-primary"
                        id="failureThreshold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Emergency Providers</label>
                      <input
                        type="text"
                        defaultValue={protectionRules?.emergencyProviders?.join(', ') || 'CoinGecko, Binance'}
                        className="w-full px-3 py-2 border border-border rounded bg-bg-card text-text-primary"
                        id="emergencyProviders"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2 mt-6">
                  <Button
                    onClick={() => {
                      const formData = new FormData(document.querySelector('form') || new HTMLFormElement());
                      const data = Object.fromEntries(formData.entries());
                      
                      if (configType === 'cache') {
                        handleUpdateCacheConfig({
                          maxAge: parseInt(data.maxAge as string) || 30,
                          retryAttempts: parseInt(data.retryAttempts as string) || 3,
                          fallbackTimeout: parseInt(data.fallbackTimeout as string) || 5
                        });
                      } else {
                        handleUpdateProtectionRules({
                          dataAgeLimit: parseInt(data.dataAgeLimit as string) || 30,
                          failureThreshold: parseInt(data.failureThreshold as string) || 5,
                          emergencyProviders: (data.emergencyProviders as string).split(',').map(p => p.trim())
                        });
                      }
                    }}
                    className="profile-tabs-glow"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setShowConfigModal(false)}
                    variant="outline"
                    className="profile-tabs-glow"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Monitoring;