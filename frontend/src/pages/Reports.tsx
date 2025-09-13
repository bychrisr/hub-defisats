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
} from 'lucide-react';
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
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const [stats, setStats] = useState<TradeLogStats['data'] | null>(null);
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetchTradeLogs();
    fetchStats();
  }, [filters, pagination.page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
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
            <p className="text-gray-600">View your automation trade history</p>
          </div>
          <Button onClick={fetchTradeLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

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
      </div>
    </div>
  );
}