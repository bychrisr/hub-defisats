import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Activity,
  BarChart3,
  Clock,
  Bot,
  Play,
  Pause,
  Settings,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { apiGet } from '@/lib/fetch';

interface TradeLog {
  id: string;
  trade_id: string;
  automation_id?: string;
  status: 'success' | 'app_error' | 'exchange_error';
  error_message?: string;
  executed_at: string;
  created_at: string;
  automation?: {
    id: string;
    type: string;
    config: any;
  };
}

interface AutomationExecution {
  id: string;
  automation_id: string;
  automation_type: string;
  status: 'success' | 'app_error' | 'exchange_error';
  error_message?: string;
  executed_at: string;
  created_at: string;
  automation: {
    id: string;
    type: string;
    config: any;
    is_active: boolean;
  };
}

interface AutomationStatistics {
  total_executions: number;
  success_count: number;
  error_count: number;
  success_rate: number;
  recent_executions_24h: number;
}

interface ActiveAutomation {
  id: string;
  type: string;
  config: any;
  created_at: string;
  updated_at: string;
}

interface AutomationReportsData {
  executions: AutomationExecution[];
  statistics: AutomationStatistics;
  active_automations: ActiveAutomation[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

interface AutomationStateChange {
  id: string;
  action: string;
  automation_id: string;
  old_state: boolean;
  new_state: boolean;
  config_changes?: {
    old: any;
    new: any;
  };
  automation_type: string;
  change_type: string;
  reason: string;
  timestamp: string;
}

interface AutomationExecutionDetail {
  id: string;
  action: string;
  automation_id: string;
  trade_id: string;
  status: 'success' | 'error';
  automation_action: string;
  trigger_data: {
    currentPrice: number;
    triggerPrice: number;
    distanceToLiquidation: number;
    marginThreshold: number;
    positionSide: 'b' | 's';
    entryPrice: number;
    liquidationPrice: number;
    currentMargin: number;
  };
  execution_result?: {
    marginAdded?: number;
    newMarginAmount?: number;
    apiResponse?: any;
  };
  error_message?: string;
  execution_time_ms: number;
  automation_type: string;
  timestamp: string;
}

interface TradeLogsResponse {
  success: boolean;
  data: {
    tradeLogs: TradeLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface TradeLogStats {
  success: boolean;
  data: {
    total: number;
    success: number;
    errors: number;
    successRate: number;
    recent: number;
    byStatus: Record<string, number>;
    byAutomation: number;
  };
}

export default function Reports() {
  const { theme } = useTheme();
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const [automationReports, setAutomationReports] = useState<AutomationReportsData | null>(null);
  const [stateChanges, setStateChanges] = useState<AutomationStateChange[]>([]);
  const [executionDetails, setExecutionDetails] = useState<AutomationExecutionDetail[]>([]);
  const [stats, setStats] = useState<TradeLogStats['data'] | null>(null);
  const [activeTab, setActiveTab] = useState<'trades' | 'automations'>('trades');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    automation_id: 'all',
  });
  const [automationFilters, setAutomationFilters] = useState({
    type: 'all',
    status: 'all',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomationReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (automationFilters.type !== 'all') {
        params.append('type', automationFilters.type);
      }
      if (automationFilters.status !== 'all') {
        params.append('status', automationFilters.status);
      }
      params.append('limit', '50');
      params.append('offset', '0');

      const response = await apiGet(`/api/automation-reports?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setAutomationReports(data.data);
        console.log('✅ AUTOMATION REPORTS - Data fetched successfully:', data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch automation reports');
      }
    } catch (err: any) {
      console.error('❌ AUTOMATION REPORTS - Error fetching reports:', err);
      setError(err.message || 'Failed to fetch automation reports');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStateChanges = async () => {
    try {
      const response = await apiGet('/api/automations/state-history?limit=50');
      const data = await response.json();
      if (data.success) {
        setStateChanges(data.data.history);
        console.log('✅ STATE CHANGES - Data fetched successfully:', data.data);
      }
    } catch (err: any) {
      console.error('❌ STATE CHANGES - Error fetching state changes:', err);
    }
  };

  const fetchExecutionDetails = async () => {
    try {
      const response = await apiGet('/api/automations/execution-history?limit=50');
      const data = await response.json();
      if (data.success) {
        setExecutionDetails(data.data.history);
        console.log('✅ EXECUTION DETAILS - Data fetched successfully:', data.data);
      }
    } catch (err: any) {
      console.error('❌ EXECUTION DETAILS - Error fetching execution details:', err);
    }
  };

  const fetchTradeLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 TRADE LOGS - Fetching trade logs...');
      console.log('📊 Filters:', filters);
      console.log('📊 Pagination:', pagination);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }

      if (filters.automation_id !== 'all') {
        params.append('automation_id', filters.automation_id);
      }

      const response = await apiGet(`/api/trade-logs?${params.toString()}`);
      const data: TradeLogsResponse = await response.json();

      console.log('✅ TRADE LOGS - Received data:', data);

      if (data && data.data && data.data.tradeLogs && data.data.pagination) {
        setTradeLogs(data.data.tradeLogs);
        setPagination(data.data.pagination);
      } else {
        console.error('❌ TRADE LOGS - Invalid data structure:', data);
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      console.error('❌ TRADE LOGS - Error fetching trade logs:', err);
      setError(err.message || 'Failed to fetch trade logs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('🔍 TRADE LOG STATS - Fetching stats...');
      const response = await apiGet('/api/trade-logs/stats');
      const data: TradeLogStats = await response.json();

      console.log('✅ TRADE LOG STATS - Received stats:', data);
      
      if (data && data.data) {
        setStats(data.data);
      } else {
        console.error('❌ TRADE LOG STATS - Invalid stats data:', data);
      }
    } catch (err: any) {
      console.error('❌ TRADE LOG STATS - Error fetching stats:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'trades') {
      fetchTradeLogs();
      fetchStats();
    } else {
      fetchAutomationReports();
      fetchStateChanges();
      fetchExecutionDetails();
    }
  }, [activeTab, filters, pagination.page, automationFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleAutomationFilterChange = (key: string, value: string) => {
    setAutomationFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'app_error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'exchange_error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'app_error':
        return <Badge variant="destructive">App Error</Badge>;
      case 'exchange_error':
        return <Badge variant="secondary" className="bg-orange-500">Exchange Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAutomationType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading && tradeLogs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">View your automation trade history and execution reports</p>
          </div>
          <Button 
            onClick={activeTab === 'trades' ? fetchTradeLogs : fetchAutomationReports} 
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'trades' | 'automations')} className="w-full">
          <TabsList className={cn(
            "grid w-full grid-cols-2 h-12",
            theme === 'dark' ? 'profile-tabs-glow' : 'profile-tabs-glow-light'
          )}>
            <TabsTrigger 
              value="trades" 
              className="profile-tab-trigger text-sm font-medium"
            >
              Trade Logs
            </TabsTrigger>
            <TabsTrigger 
              value="automations" 
              className="profile-tab-trigger text-sm font-medium"
            >
              Automation Reports
            </TabsTrigger>
          </TabsList>

          {/* Trade Logs Tab Content */}
          <TabsContent value="trades" className="space-y-6">
            {/* Stats Cards */}
            {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.recent} in last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.success} successful trades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.errors}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.byStatus.app_error || 0} app, {stats.byStatus.exchange_error || 0} exchange
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Automations</CardTitle>
                <AlertCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.byAutomation}</div>
                <p className="text-xs text-muted-foreground">
                  Active automations
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="app_error">App Error</SelectItem>
                    <SelectItem value="exchange_error">Exchange Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Automation</label>
                <Select
                  value={filters.automation_id}
                  onValueChange={(value) => handleFilterChange('automation_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by automation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Automations</SelectItem>
                    <SelectItem value="auto_001">Margin Guard</SelectItem>
                    <SelectItem value="auto_002">TP/SL</SelectItem>
                    <SelectItem value="auto_003">Auto Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Trade History</CardTitle>
            <CardDescription>
              Showing {tradeLogs.length} of {pagination.total} trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 mb-2">Error loading trade logs</p>
                <p className="text-sm text-gray-500">{error}</p>
                <Button onClick={fetchTradeLogs} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : tradeLogs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No trade logs found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create your first automation to start trading
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Trade ID</TableHead>
                      <TableHead>Automation</TableHead>
                      <TableHead>Error Message</TableHead>
                      <TableHead>Executed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeLogs.map((tradeLog) => (
                      <TableRow key={tradeLog.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(tradeLog.status)}
                            {getStatusBadge(tradeLog.status)}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {tradeLog.trade_id}
                        </TableCell>
                        <TableCell>
                          {tradeLog.automation ? (
                            <div>
                              <div className="font-medium">
                                {formatAutomationType(tradeLog.automation.type)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {tradeLog.automation.id}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Manual</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tradeLog.error_message ? (
                            <div className="max-w-xs truncate" title={tradeLog.error_message}>
                              {tradeLog.error_message}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(tradeLog.executed_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext || isLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Automation Reports Tab Content */}
          <TabsContent value="automations" className="space-y-6">
            {/* Automation Statistics */}
            {automationReports?.statistics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{automationReports.statistics.total_executions}</div>
                    <p className="text-xs text-muted-foreground">
                      {automationReports.statistics.recent_executions_24h} in last 24h
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{automationReports.statistics.success_rate}%</div>
                    <p className="text-xs text-muted-foreground">
                      {automationReports.statistics.success_count} successful
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Errors</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{automationReports.statistics.error_count}</div>
                    <p className="text-xs text-muted-foreground">
                      {automationReports.statistics.error_count > 0 ? 'Need attention' : 'All good'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
                    <Bot className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{automationReports.active_automations.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently running
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Automation Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">Automation Type</label>
                    <Select
                      value={automationFilters.type}
                      onValueChange={(value) => handleAutomationFilterChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="margin_guard">Margin Guard</SelectItem>
                        <SelectItem value="tp_sl">Take Profit / Stop Loss</SelectItem>
                        <SelectItem value="auto_entry">Auto Entry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select
                      value={automationFilters.status}
                      onValueChange={(value) => handleAutomationFilterChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="app_error">App Error</SelectItem>
                        <SelectItem value="exchange_error">Exchange Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Automation Executions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Automation Executions</CardTitle>
                <CardDescription>
                  Detailed view of your automation executions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600">{error}</p>
                  </div>
                ) : !automationReports?.executions.length ? (
                  <div className="text-center py-8">
                    <Bot className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No automation executions found</p>
                    <p className="text-sm text-gray-400">
                      Create your first automation to start seeing execution reports
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Automation</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Error Message</TableHead>
                          <TableHead>Executed At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {automationReports.executions.map((execution) => (
                          <TableRow key={execution.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(execution.status)}
                                {getStatusBadge(execution.status)}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {execution.automation_id}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  {formatAutomationType(execution.automation_type)}
                                </span>
                                {execution.automation.is_active ? (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-600 border-gray-600">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {execution.error_message ? (
                                <div className="max-w-xs truncate" title={execution.error_message}>
                                  {execution.error_message}
                                </div>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(execution.executed_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Margin Guard Execution Details */}
            {executionDetails.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Margin Guard Execution Details
                  </CardTitle>
                  <CardDescription>
                    Detailed logs of Margin Guard executions with trigger data and results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {executionDetails.map((execution) => (
                      <div key={execution.id} className="p-4 rounded-lg border bg-card/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {execution.status === 'success' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className="font-medium">
                              {execution.automation_action === 'add_margin' ? 'Add Margin' : execution.automation_action}
                            </span>
                            <Badge 
                              className={cn(
                                "text-xs",
                                execution.status === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                              )}
                            >
                              {execution.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(execution.timestamp)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium mb-2">Trigger Data</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Current Price:</span>
                                <span className="font-mono">${execution.trigger_data.currentPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Trigger Price:</span>
                                <span className="font-mono">${execution.trigger_data.triggerPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Entry Price:</span>
                                <span className="font-mono">${execution.trigger_data.entryPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Liquidation Price:</span>
                                <span className="font-mono">${execution.trigger_data.liquidationPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Current Margin:</span>
                                <span className="font-mono">{execution.trigger_data.currentMargin} sats</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Margin Threshold:</span>
                                <span className="font-mono">{execution.trigger_data.marginThreshold}%</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Execution Result</h4>
                            {execution.status === 'success' && execution.execution_result ? (
                              <div className="space-y-1">
                                {execution.execution_result.marginAdded && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Margin Added:</span>
                                    <span className="font-mono text-green-600">
                                      +{execution.execution_result.marginAdded} sats
                                    </span>
                                  </div>
                                )}
                                {execution.execution_result.newMarginAmount && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">New Margin Total:</span>
                                    <span className="font-mono">
                                      {execution.execution_result.newMarginAmount} sats
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Execution Time:</span>
                                  <span className="font-mono">{execution.execution_time_ms}ms</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Error:</span>
                                  <span className="text-red-600 text-xs">
                                    {execution.error_message || 'Unknown error'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Execution Time:</span>
                                  <span className="font-mono">{execution.execution_time_ms}ms</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Trade ID: {execution.trade_id}</span>
                            <span>Automation ID: {execution.automation_id}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* State Changes History */}
            {stateChanges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-500" />
                    Automation State Changes
                  </CardTitle>
                  <CardDescription>
                    History of automation activations, deactivations, and configuration changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stateChanges.map((change) => (
                      <div key={change.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                        <div className="flex items-center gap-3">
                          {change.change_type === 'activation' ? (
                            <Play className="h-4 w-4 text-green-500" />
                          ) : change.change_type === 'deactivation' ? (
                            <Pause className="h-4 w-4 text-red-500" />
                          ) : (
                            <Settings className="h-4 w-4 text-blue-500" />
                          )}
                          <div>
                            <p className="font-medium">
                              {change.change_type === 'activation' ? 'Activated' :
                               change.change_type === 'deactivation' ? 'Deactivated' : 'Configuration Updated'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {change.automation_type === 'margin_guard' ? 'Margin Guard' :
                               change.automation_type === 'tp_sl' ? 'Take Profit / Stop Loss' :
                               change.automation_type === 'auto_entry' ? 'Auto Entry' : change.automation_type}
                            </p>
                            {change.config_changes && (
                              <p className="text-xs text-muted-foreground">
                                Config values updated
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {change.old_state ? 'Active' : 'Inactive'} → {change.new_state ? 'Active' : 'Inactive'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(change.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}