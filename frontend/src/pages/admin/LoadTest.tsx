import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  BarChart3, 
  Clock, 
  Users, 
  Zap, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  TrendingUp,
  Server,
  Wifi
} from 'lucide-react';
import { api } from '@/lib/api';

interface LoadTestConfig {
  concurrentUsers: number;
  requestsPerUser: number;
  durationSeconds: number;
  rampUpSeconds: number;
  testType: 'dashboard' | 'positions' | 'websocket' | 'full';
}

interface LoadTestResult {
  id: string;
  config: LoadTestConfig;
  startTime: number;
  endTime: number;
  duration: number;
  metrics: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      responseTimes: number[];
    };
    websocket: {
      connections: number;
      messages: number;
      errors: number;
      latency: number[];
    };
    errors: Array<{
      userId: string;
      endpoint?: string;
      type?: string;
      error: string;
      timestamp: string;
    }>;
  };
  summary: {
    successRate: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    requestsPerSecond: number;
    status: 'excellent' | 'good' | 'critical';
  };
}

interface ActiveTest {
  testId: string;
  status: 'running' | 'completed' | 'failed';
  duration: number;
  startTime: string;
}

export default function LoadTest() {
  const [config, setConfig] = useState<LoadTestConfig>({
    concurrentUsers: 10,
    requestsPerUser: 20,
    durationSeconds: 60,
    rampUpSeconds: 10,
    testType: 'full'
  });

  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [testResults, setTestResults] = useState<LoadTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar histórico de testes
  useEffect(() => {
    loadTestHistory();
  }, []);

  // Polling para teste ativo
  useEffect(() => {
    if (activeTest && activeTest.status === 'running') {
      const interval = setInterval(() => {
        checkTestStatus(activeTest.testId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeTest]);

  const loadTestHistory = async () => {
    try {
      const response = await api.get('/admin/load-test/history?limit=20');
      setTestResults(response.data.results || []);
    } catch (error: any) {
      console.error('Error loading test history:', error);
    }
  };

  const executeLoadTest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/admin/load-test/execute', config);
      
      if (response.data.success) {
        setActiveTest({
          testId: response.data.testId,
          status: 'running',
          duration: 0,
          startTime: new Date().toISOString()
        });
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to start load test');
    } finally {
      setIsLoading(false);
    }
  };

  const checkTestStatus = async (testId: string) => {
    try {
      const response = await api.get(`/admin/load-test/status/${testId}`);
      
      if (response.data.success) {
        const status = response.data.status;
        
        if (status === 'completed' || status === 'failed') {
          // Teste finalizado, carregar resultados
          await loadTestResults(testId);
          setActiveTest(null);
          await loadTestHistory();
        } else {
          // Atualizar status do teste ativo
          setActiveTest(prev => prev ? {
            ...prev,
            duration: response.data.duration
          } : null);
        }
      }
    } catch (error: any) {
      console.error('Error checking test status:', error);
    }
  };

  const loadTestResults = async (testId: string) => {
    try {
      const response = await api.get(`/admin/load-test/results/${testId}`);
      if (response.data.success) {
        setTestResults(prev => [response.data.result, ...prev]);
      }
    } catch (error: any) {
      console.error('Error loading test results:', error);
    }
  };

  const getStatusColor = (status: 'excellent' | 'good' | 'critical') => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: 'excellent' | 'good' | 'critical') => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-vibrant">Load Testing</h1>
          <p className="text-muted-foreground mt-2">
            Execute and monitor performance tests for the application
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Server className="w-4 h-4 mr-2" />
          Performance Testing Suite
        </Badge>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="concurrentUsers">Concurrent Users</Label>
              <Input
                id="concurrentUsers"
                type="number"
                min="1"
                max="100"
                value={config.concurrentUsers}
                onChange={(e) => setConfig(prev => ({ ...prev, concurrentUsers: parseInt(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requestsPerUser">Requests per User</Label>
              <Input
                id="requestsPerUser"
                type="number"
                min="1"
                max="100"
                value={config.requestsPerUser}
                onChange={(e) => setConfig(prev => ({ ...prev, requestsPerUser: parseInt(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="durationSeconds">Duration (seconds)</Label>
              <Input
                id="durationSeconds"
                type="number"
                min="10"
                max="300"
                value={config.durationSeconds}
                onChange={(e) => setConfig(prev => ({ ...prev, durationSeconds: parseInt(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testType">Test Type</Label>
              <Select value={config.testType} onValueChange={(value: any) => setConfig(prev => ({ ...prev, testType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Test</SelectItem>
                  <SelectItem value="dashboard">Dashboard Only</SelectItem>
                  <SelectItem value="positions">Positions Only</SelectItem>
                  <SelectItem value="websocket">WebSocket Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <Button 
              onClick={executeLoadTest} 
              disabled={isLoading || activeTest !== null}
              className="flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              {isLoading ? 'Starting...' : 'Start Load Test'}
            </Button>
            
            {activeTest && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Running for {formatDuration(activeTest.duration)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Test Status */}
      {activeTest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Active Test Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Test ID: {activeTest.testId}</span>
                <Badge variant={activeTest.status === 'running' ? 'default' : 'secondary'}>
                  {activeTest.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{formatDuration(activeTest.duration)} / {formatDuration(config.durationSeconds + config.rampUpSeconds)}</span>
                </div>
                <Progress 
                  value={(activeTest.duration / (config.durationSeconds + config.rampUpSeconds)) * 100} 
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Test Results History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No test results yet. Run your first load test to see results here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testResults.map((result) => (
                <Card key={result.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Status */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.summary.status)}
                          <span className="font-medium">Status</span>
                        </div>
                        <Badge className={`${getStatusColor(result.summary.status)} text-white`}>
                          {result.summary.status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Success Rate */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Success Rate</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {result.summary.successRate.toFixed(1)}%
                        </div>
                      </div>

                      {/* Response Time */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">Avg Response</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {result.summary.avgResponseTime.toFixed(0)}ms
                        </div>
                      </div>

                      {/* Throughput */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-medium">Throughput</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {result.summary.requestsPerSecond.toFixed(1)} req/s
                        </div>
                      </div>
                    </div>

                    {/* Detailed Metrics */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Requests:</span>
                          <div className="font-medium">{result.metrics.requests.total}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Successful:</span>
                          <div className="font-medium text-green-600">{result.metrics.requests.successful}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failed:</span>
                          <div className="font-medium text-red-600">{result.metrics.requests.failed}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">P95 Response:</span>
                          <div className="font-medium">{result.summary.p95ResponseTime.toFixed(0)}ms</div>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        Test ID: {result.id} | Started: {formatTimestamp(result.startTime)} | 
                        Duration: {formatDuration(Math.floor(result.duration / 1000))} | 
                        Users: {result.config.concurrentUsers} | 
                        Type: {result.config.testType}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
