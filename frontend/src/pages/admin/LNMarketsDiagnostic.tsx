import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Activity,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface DiagnosticResult {
  endpoint: string;
  method: string;
  latency: number;
  status: 'success' | 'error' | 'timeout';
  responseSize?: number;
  error?: string;
  timestamp: number;
  retryAttempts: number;
}

interface ConnectionTest {
  dnsResolution: number;
  tcpConnection: number;
  tlsHandshake: number;
  firstByte: number;
  totalTime: number;
}

interface APIAnalysis {
  averageLatency: number;
  successRate: number;
  errorRate: number;
  timeoutRate: number;
  p95Latency: number;
  p99Latency: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
  recommendations: string[];
}

interface DiagnosticData {
  connectionTest: ConnectionTest;
  endpointTests: DiagnosticResult[];
  analysis: APIAnalysis;
  timestamp: number;
}

const LNMarketsDiagnostic: React.FC = () => {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [continuousMonitoring, setContinuousMonitoring] = useState<{
    isRunning: boolean;
    monitoringId?: string;
    durationMinutes: number;
  }>({ isRunning: false, durationMinutes: 5 });

  const runFullDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/admin/lnmarkets/diagnostic/full');
      
      if (response.data.success) {
        setDiagnosticData(response.data.data);
      } else {
        setError(response.data.message || 'Diagnostic failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runConnectionTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/admin/lnmarkets/diagnostic/connection-test');
      
      if (response.data.success) {
        // Update diagnostic data with connection test results
        setDiagnosticData(prev => prev ? {
          ...prev,
          connectionTest: {
            dnsResolution: 0,
            tcpConnection: 0,
            tlsHandshake: 0,
            firstByte: response.data.data.averageLatency,
            totalTime: response.data.data.averageLatency
          }
        } : null);
      } else {
        setError(response.data.message || 'Connection test failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startContinuousMonitoring = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/lnmarkets/diagnostic/continuous-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: continuousMonitoring.durationMinutes })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setContinuousMonitoring({
          isRunning: true,
          monitoringId: result.data.monitoringId,
          durationMinutes: continuousMonitoring.durationMinutes
        });
      } else {
        setError(result.message || 'Failed to start monitoring');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'timeout':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return <Badge className="bg-green-500">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-500">Good</Badge>;
      case 'poor':
        return <Badge className="bg-yellow-500">Poor</Badge>;
      case 'critical':
        return <Badge className="bg-red-500">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatLatency = (latency: number) => {
    if (latency < 1000) {
      return `${latency}ms`;
    } else {
      return `${(latency / 1000).toFixed(2)}s`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6 bg-bg-primary min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">LN Markets API Diagnostic</h1>
          <p className="text-text-secondary">Comprehensive testing and analysis of LN Markets API performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={runFullDiagnostic}
            disabled={loading}
            className="profile-tabs-glow"
          >
            <Play className="w-4 h-4 mr-2" />
            Run Full Diagnostic
          </Button>
          <Button
            onClick={runConnectionTest}
            disabled={loading}
            variant="outline"
            className="profile-tabs-glow"
          >
            <Activity className="w-4 h-4 mr-2" />
            Test Connection
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-400">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continuous Monitoring */}
      <Card className="bg-bg-card border-border profile-tabs-glow">
        <CardHeader>
          <CardTitle className="text-text-primary">Continuous Monitoring</CardTitle>
          <CardDescription>Monitor API performance over time</CardDescription>
        </CardHeader>
        <CardContent>
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
              onClick={startContinuousMonitoring}
              disabled={loading || continuousMonitoring.isRunning}
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
        </CardContent>
      </Card>

      {/* Diagnostic Results */}
      {diagnosticData && (
        <>
          {/* Overall Analysis */}
          <Card className="bg-bg-card border-border profile-tabs-glow">
            <CardHeader>
              <CardTitle className="text-text-primary">Overall Analysis</CardTitle>
              <CardDescription>Performance summary and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {formatLatency(diagnosticData.analysis.averageLatency)}
                  </div>
                  <div className="text-sm text-text-secondary">Average Latency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {diagnosticData.analysis.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-text-secondary">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {formatLatency(diagnosticData.analysis.p95Latency)}
                  </div>
                  <div className="text-sm text-text-secondary">P95 Latency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {getQualityBadge(diagnosticData.analysis.connectionQuality)}
                  </div>
                  <div className="text-sm text-text-secondary">Connection Quality</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Test Details */}
          <Card className="bg-bg-card border-border profile-tabs-glow">
            <CardHeader>
              <CardTitle className="text-text-primary">Connection Test Details</CardTitle>
              <CardDescription>Detailed breakdown of connection phases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary">
                    {diagnosticData.connectionTest.dnsResolution}ms
                  </div>
                  <div className="text-sm text-text-secondary">DNS Resolution</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary">
                    {diagnosticData.connectionTest.tcpConnection}ms
                  </div>
                  <div className="text-sm text-text-secondary">TCP Connection</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary">
                    {diagnosticData.connectionTest.tlsHandshake}ms
                  </div>
                  <div className="text-sm text-text-secondary">TLS Handshake</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary">
                    {diagnosticData.connectionTest.firstByte}ms
                  </div>
                  <div className="text-sm text-text-secondary">First Byte</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary">
                    {diagnosticData.connectionTest.totalTime}ms
                  </div>
                  <div className="text-sm text-text-secondary">Total Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endpoint Test Results */}
          <Card className="bg-bg-card border-border profile-tabs-glow">
            <CardHeader>
              <CardTitle className="text-text-primary">Endpoint Test Results</CardTitle>
              <CardDescription>Individual endpoint performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnosticData.endpointTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(test.status)}
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
                          {formatLatency(test.latency)}
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
                        <Badge variant="outline">
                          {test.retryAttempts} retries
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {diagnosticData.analysis.recommendations.length > 0 && (
            <Card className="bg-bg-card border-border profile-tabs-glow">
              <CardHeader>
                <CardTitle className="text-text-primary">Recommendations</CardTitle>
                <CardDescription>Suggested improvements based on test results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diagnosticData.analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default LNMarketsDiagnostic;
