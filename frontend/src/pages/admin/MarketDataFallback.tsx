import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Activity,
  TrendingUp,
  Shield,
  Database,
  Globe
} from 'lucide-react';

interface MarketData {
  index: number;
  change24h: number;
  timestamp: number;
  provider: string;
  source: 'primary' | 'fallback' | 'emergency' | 'cache';
  age: number;
}

interface ProviderStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  failureCount: number;
}

interface ProtectionResult {
  allowed: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction?: string;
  retryAfter?: number;
}

const MarketDataFallback: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [providerStatus, setProviderStatus] = useState<Record<string, ProviderStatus>>({});
  const [protectionResult, setProtectionResult] = useState<ProtectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/admin/market-data/market-data');
      
      if (response.data.success) {
        setMarketData(response.data.data);
        setLastUpdate(new Date());
      } else {
        setError(response.data.message || 'Failed to fetch market data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderStatus = async () => {
    try {
      const response = await api.get('/api/admin/market-data/providers/status');
      
      if (response.data.success) {
        setProviderStatus(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch provider status:', err);
    }
  };

  const testProtection = async () => {
    try {
      const response = await api.post('/api/admin/market-data/protection/check', {
        userId: 'test-user',
        automationId: 'test-automation'
      });
      
      if (response.data.success) {
        setProtectionResult(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to test protection:', err);
    }
  };

  const testAllProviders = async () => {
    setLoading(true);
    
    try {
      const response = await api.post('/api/admin/market-data/providers/test');
      
      if (response.data.success) {
        console.log('Provider test results:', response.data.data);
        // Atualizar status dos provedores
        await fetchProviderStatus();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = async () => {
    setLoading(true);
    
    try {
      const response = await api.post('/api/admin/market-data/market-data/refresh');
      
      if (response.data.success) {
        setMarketData(response.data.data);
        setLastUpdate(new Date());
      } else {
        setError(response.data.message || 'Failed to refresh market data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    fetchProviderStatus();
    testProtection();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAge = (age: number) => {
    if (age < 1000) {
      return `${age}ms`;
    } else {
      return `${(age / 1000).toFixed(1)}s`;
    }
  };

  return (
    <div className="space-y-6 bg-bg-primary min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Market Data Fallback System</h1>
          <p className="text-text-secondary">Sistema crítico de proteção contra falhas de API</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={testAllProviders}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors profile-tabs-glow"
          >
            <Activity className="w-4 h-4 mr-2" />
            Test All Providers
          </button>
          <button
            onClick={forceRefresh}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors profile-tabs-glow"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Force Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Current Market Data */}
      {marketData && (
        <div className="bg-bg-card rounded-lg border border-border profile-tabs-glow">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary">Current Market Data</h3>
            <p className="text-sm text-text-secondary">
              Last updated: {lastUpdate ? formatTimestamp(lastUpdate.getTime()) : 'Never'}
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">
                  ${marketData.index.toLocaleString()}
                </div>
                <div className="text-sm text-text-secondary">Bitcoin Price</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  marketData.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(2)}%
                </div>
                <div className="text-sm text-text-secondary">24h Change</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">
                  {formatAge(marketData.age)}
                </div>
                <div className="text-sm text-text-secondary">Data Age</div>
              </div>
              <div className="text-center">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  marketData.source === 'primary' ? 'text-green-400 bg-green-900/20 border-green-500/30' :
                  marketData.source === 'fallback' ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30' :
                  marketData.source === 'emergency' ? 'text-red-400 bg-red-900/20 border-red-500/30' :
                  'text-blue-400 bg-blue-900/20 border-blue-500/30'
                }`}>
                  {marketData.source} ({marketData.provider})
                </div>
                <div className="text-sm text-text-secondary">Source</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Status */}
      <div className="bg-bg-card rounded-lg border border-border profile-tabs-glow">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Provider Status</h3>
          <p className="text-sm text-text-secondary">Status of all market data providers</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(providerStatus).map(([name, status]) => (
              <div key={name} className="bg-bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-text-primary capitalize">
                    {name === 'lnMarkets' ? 'LN Markets' : 
                     name === 'coinGecko' ? 'CoinGecko' : 
                     name === 'binance' ? 'Binance' : name}
                  </h4>
                  {getStatusIcon(status.status)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status.status)}`}>
                      {status.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Failures:</span>
                    <span className="text-sm text-text-primary">{status.failureCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Last Check:</span>
                    <span className="text-sm text-text-primary">
                      {formatTimestamp(status.lastCheck)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Protection System */}
      {protectionResult && (
        <div className="bg-bg-card rounded-lg border border-border profile-tabs-glow">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary">Protection System</h3>
            <p className="text-sm text-text-secondary">Automation protection status</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-500 mr-2" />
                <span className="font-medium text-text-primary">Automation Protection</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                protectionResult.allowed ? 'text-green-400 bg-green-900/20 border-green-500/30' : 
                'text-red-400 bg-red-900/20 border-red-500/30'
              }`}>
                {protectionResult.allowed ? 'ALLOWED' : 'BLOCKED'}
              </div>
            </div>
            
            {protectionResult.reason && (
              <div className="mb-4">
                <div className="text-sm text-text-secondary mb-2">Reason:</div>
                <div className="text-text-primary">{protectionResult.reason}</div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  protectionResult.severity === 'critical' ? 'text-red-400' :
                  protectionResult.severity === 'high' ? 'text-orange-400' :
                  protectionResult.severity === 'medium' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>
                  {protectionResult.severity.toUpperCase()}
                </div>
                <div className="text-sm text-text-secondary">Severity</div>
              </div>
              
              {protectionResult.suggestedAction && (
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">
                    {protectionResult.suggestedAction}
                  </div>
                  <div className="text-sm text-text-secondary">Suggested Action</div>
                </div>
              )}
              
              {protectionResult.retryAfter && (
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">
                    {Math.round(protectionResult.retryAfter / 1000)}s
                  </div>
                  <div className="text-sm text-text-secondary">Retry After</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="bg-bg-card rounded-lg border border-border profile-tabs-glow">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">System Information</h3>
          <p className="text-sm text-text-secondary">Fallback system configuration</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-text-primary mb-3">Cache Configuration</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Max Cache Age:</span>
                  <span className="text-sm text-text-primary">30 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Retry Attempts:</span>
                  <span className="text-sm text-text-primary">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Fallback Timeout:</span>
                  <span className="text-sm text-text-primary">5 seconds</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-text-primary mb-3">Protection Rules</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Data Age Limit:</span>
                  <span className="text-sm text-text-primary">30 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Failure Threshold:</span>
                  <span className="text-sm text-text-primary">5 consecutive</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Emergency Providers:</span>
                  <span className="text-sm text-text-primary">CoinGecko, Binance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDataFallback;
