import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  Zap,
  Shield,
  Star,
  Crown,
  Gem,
  Gift,
  Bot,
  Cpu,
  MemoryStick,
  Network,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AutomationLog {
  id: string;
  userId: string;
  accountId: string;
  automationId: string;
  automationName: string;
  action: 'started' | 'completed' | 'failed' | 'paused' | 'resumed' | 'stopped' | 'error';
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'RUNNING';
  details: Record<string, any>;
  errorMessage?: string;
  duration?: number;
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    executionTime: number;
    networkRequests: number;
  };
  exchangeName: string;
  accountName: string;
  userEmail: string;
  planType: string;
}

interface AutomationLogStats {
  totalLogs: number;
  successfulLogs: number;
  failedLogs: number;
  averageExecutionTime: number;
  averageCpuUsage: number;
  averageMemoryUsage: number;
  errorRate: number;
  automationStats: Array<{
    automationId: string;
    automationName: string;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
  }>;
  accountStats: Array<{
    accountId: string;
    accountName: string;
    exchangeName: string;
    totalExecutions: number;
    successRate: number;
  }>;
  timeRange: {
    start: string;
    end: string;
  };
}

export default function AutomationLogs() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [stats, setStats] = useState<AutomationLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    action: 'all',
    planType: 'all',
    dateRange: '7d',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [selectedLog, setSelectedLog] = useState<AutomationLog | null>(null);

  // Ref para controlar se é o carregamento inicial
  const isInitialLoad = useRef(true);

  // Carregar dados iniciais
  useEffect(() => {
    if (isInitialLoad.current) {
      loadData();
      isInitialLoad.current = false;
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.action !== 'all') queryParams.append('action', filters.action);
      if (filters.planType !== 'all') queryParams.append('planType', filters.planType);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      const [logsResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/automation-logs?${queryParams.toString()}`),
        fetch('/api/admin/automation-logs/stats')
      ]);

      if (!logsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const logsData = await logsResponse.json();
      const statsData = await statsResponse.json();

      setLogs(logsData.data.logs || []);
      setStats(statsData.data || null);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load automation logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExport = useCallback(async (format: 'csv' | 'json' | 'xlsx') => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.action !== 'all') queryParams.append('action', filters.action);
      if (filters.planType !== 'all') queryParams.append('planType', filters.planType);
      queryParams.append('format', format);

      const response = await fetch(`/api/admin/automation-logs/export?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automation-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Automation logs exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export logs');
    }
  }, [filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'RUNNING':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'started':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'resumed':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'lifetime':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'pro':
        return <Gem className="h-4 w-4 text-blue-500" />;
      case 'advanced':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'basic':
        return <Gift className="h-4 w-4 text-green-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading automation logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Logs</h1>
          <p className="text-muted-foreground">
            Monitor and analyze automation execution logs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
              <p className="text-xs text-muted-foreground">
                All automation events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalLogs > 0 ? ((stats.successfulLogs / stats.totalLogs) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.successfulLogs} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Execution</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(stats.averageExecutionTime)}
              </div>
              <p className="text-xs text-muted-foreground">
                Average execution time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.errorRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.failedLogs} failed executions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="resumed">Resumed</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planType">Plan Type</Label>
              <Select value={filters.planType} onValueChange={(value) => handleFilterChange('planType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Logs</CardTitle>
          <CardDescription>
            {logs.length} logs found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Automation</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.status)}
                        <Badge variant={log.status === 'SUCCESS' ? 'default' : log.status === 'FAILED' ? 'destructive' : 'secondary'}>
                          {log.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.automationName}</div>
                      <div className="text-sm text-muted-foreground">{log.automationId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.accountName}</div>
                      <div className="text-sm text-muted-foreground">{log.exchangeName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(log.action)}
                        <span className="capitalize">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.duration ? formatDuration(log.duration) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center space-x-1">
                          <Cpu className="h-3 w-3" />
                          <span>{log.performance.cpuUsage}%</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MemoryStick className="h-3 w-3" />
                          <span>{log.performance.memoryUsage}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getPlanIcon(log.planType)}
                        <div>
                          <div className="font-medium">{log.userEmail}</div>
                          <div className="text-sm text-muted-foreground capitalize">{log.planType}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Log Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="absolute right-4 top-4"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Automation</Label>
                  <p className="text-sm">{selectedLog.automationName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account</Label>
                  <p className="text-sm">{selectedLog.accountName} ({selectedLog.exchangeName})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <p className="text-sm capitalize">{selectedLog.action}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm">{selectedLog.status}</p>
                </div>
                {selectedLog.duration && (
                  <div>
                    <Label className="text-sm font-medium">Duration</Label>
                    <p className="text-sm">{formatDuration(selectedLog.duration)}</p>
                  </div>
                )}
                {selectedLog.errorMessage && (
                  <div>
                    <Label className="text-sm font-medium">Error Message</Label>
                    <p className="text-sm text-red-600">{selectedLog.errorMessage}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Performance</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>CPU: {selectedLog.performance.cpuUsage}%</div>
                    <div>Memory: {selectedLog.performance.memoryUsage}%</div>
                    <div>Execution: {formatDuration(selectedLog.performance.executionTime)}</div>
                    <div>Network: {selectedLog.performance.networkRequests} requests</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Details</Label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
