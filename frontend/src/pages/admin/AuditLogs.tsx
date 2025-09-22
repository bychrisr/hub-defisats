import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Target,
  Clock,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  PieChart,
  LineChart,
  BarChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Crown,
  Gem,
  Gift,
  Settings,
  Play,
  Pause,
  Square,
  RotateCcw,
  Bot,
  Cpu,
  Database,
  BarChart2,
  Edit,
  Trash2,
  Copy,
  Power,
  PowerOff,
  MoreHorizontal,
  FileText,
  Server,
  HardDrive,
  MemoryStick,
  Network,
  Monitor,
  Globe,
  Database2,
  Activity2,
  History,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Key,
  Fingerprint,
  AlertCircle,
  Info
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failed' | 'warning';
  ipAddress: string;
  userAgent: string;
  details: {
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
  };
  sessionId: string;
  requestId: string;
  duration?: number; // in milliseconds
  errorMessage?: string;
}

interface AuditMetrics {
  totalLogs: number;
  criticalLogs: number;
  failedActions: number;
  uniqueUsers: number;
  avgResponseTime: number;
  mostActiveUser: string;
  mostCommonAction: string;
  lastActivity: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    severity: 'all',
    status: 'all',
    userRole: 'all',
    dateRange: '24h',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });

  // Ref para controlar se é o carregamento inicial
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  // Apenas carrega uma vez no início
  useEffect(() => {
    console.log('🔍 AUDIT LOGS - Initial load useEffect triggered');
    fetchLogs();
    isInitialLoad.current = false;
  }, []);

  // Recarrega quando os filtros mudam (mas não em loop)
  useEffect(() => {
    console.log('🔍 AUDIT LOGS - Filter change useEffect triggered', { 
      isInitialLoad: isInitialLoad.current,
      filters: { search: filters.search, action: filters.action, severity: filters.severity, status: filters.status, userRole: filters.userRole, dateRange: filters.dateRange, sortBy: filters.sortBy, sortOrder: filters.sortOrder },
      lastFilters: lastFilters.current
    });
    
    // Só executa se não for o carregamento inicial e se os filtros realmente mudaram
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.action !== filters.action ||
        lastFilters.current.severity !== filters.severity ||
        lastFilters.current.status !== filters.status ||
        lastFilters.current.userRole !== filters.userRole ||
        lastFilters.current.dateRange !== filters.dateRange ||
        lastFilters.current.sortBy !== filters.sortBy ||
        lastFilters.current.sortOrder !== filters.sortOrder;
      
      if (filtersChanged) {
        console.log('🔍 AUDIT LOGS - Filters changed, executing fetchLogs');
        lastFilters.current = { ...filters };
        fetchLogs();
      }
    }
  }, [filters.search, filters.action, filters.severity, filters.status, filters.userRole, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const fetchLogs = async () => {
    setRefreshing(true);
    try {
      // Simular dados de logs de auditoria
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: '2025-01-15T14:30:00Z',
          userId: 'user1',
          userEmail: 'admin@defisats.com',
          userRole: 'superadmin',
          action: 'user_login',
          resource: 'authentication',
          severity: 'medium',
          status: 'success',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          details: {
            metadata: {
              loginMethod: 'password',
              twoFactorEnabled: true
            }
          },
          sessionId: 'sess_123456789',
          requestId: 'req_abc123',
          duration: 250
        },
        {
          id: '2',
          timestamp: '2025-01-15T14:25:00Z',
          userId: 'user2',
          userEmail: 'trader1@example.com',
          userRole: 'user',
          action: 'trade_execution',
          resource: 'trading',
          resourceId: 'trade_789',
          severity: 'high',
          status: 'success',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          details: {
            oldValues: { balance: 10000 },
            newValues: { balance: 10250 },
            metadata: {
              symbol: 'BTCUSD',
              amount: 0.1,
              price: 45000
            }
          },
          sessionId: 'sess_987654321',
          requestId: 'req_def456',
          duration: 1200
        },
        {
          id: '3',
          timestamp: '2025-01-15T14:20:00Z',
          userId: 'user3',
          userEmail: 'trader2@example.com',
          userRole: 'user',
          action: 'password_change',
          resource: 'user_profile',
          resourceId: 'user_456',
          severity: 'medium',
          status: 'success',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          details: {
            metadata: {
              passwordStrength: 'strong',
              changeReason: 'user_request'
            }
          },
          sessionId: 'sess_456789123',
          requestId: 'req_ghi789',
          duration: 800
        },
        {
          id: '4',
          timestamp: '2025-01-15T14:15:00Z',
          userId: 'user4',
          userEmail: 'trader3@example.com',
          userRole: 'user',
          action: 'api_access',
          resource: 'api',
          resourceId: 'api_key_123',
          severity: 'low',
          status: 'failed',
          ipAddress: '192.168.1.103',
          userAgent: 'Python/3.9 requests/2.28.1',
          details: {
            metadata: {
              endpoint: '/api/trades',
              method: 'POST',
              rateLimitExceeded: true
            }
          },
          sessionId: 'sess_789123456',
          requestId: 'req_jkl012',
          duration: 50,
          errorMessage: 'Rate limit exceeded'
        },
        {
          id: '5',
          timestamp: '2025-01-15T14:10:00Z',
          userId: 'user1',
          userEmail: 'admin@defisats.com',
          userRole: 'superadmin',
          action: 'user_deletion',
          resource: 'user_management',
          resourceId: 'user_789',
          severity: 'critical',
          status: 'success',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          details: {
            oldValues: { 
              userEmail: 'deleted@example.com',
              isActive: true,
              planType: 'pro'
            },
            newValues: { 
              isActive: false,
              deletedAt: '2025-01-15T14:10:00Z'
            },
            metadata: {
              deletionReason: 'account_closure_request',
              dataRetention: '30_days'
            }
          },
          sessionId: 'sess_123456789',
          requestId: 'req_mno345',
          duration: 2000
        }
      ];

      const mockMetrics: AuditMetrics = {
        totalLogs: 5,
        criticalLogs: 1,
        failedActions: 1,
        uniqueUsers: 4,
        avgResponseTime: 660,
        mostActiveUser: 'admin@defisats.com',
        mostCommonAction: 'user_login',
        lastActivity: '2025-01-15T14:30:00Z'
      };

      setLogs(mockLogs);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_login':
        return <Lock className="h-4 w-4 text-green-500" />;
      case 'user_logout':
        return <Unlock className="h-4 w-4 text-orange-500" />;
      case 'trade_execution':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'password_change':
        return <Key className="h-4 w-4 text-purple-500" />;
      case 'api_access':
        return <Globe className="h-4 w-4 text-cyan-500" />;
      case 'user_deletion':
        return <UserX className="h-4 w-4 text-red-500" />;
      case 'user_creation':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'data_export':
        return <Download className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge className="bg-green-500 text-white">Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">High</Badge>;
      case 'critical':
        return <Badge className="bg-red-500 text-white">Critical</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500 text-white">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-white">Warning</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl"></div>
                    <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-text-primary">Loading Audit Logs</h3>
                    <p className="text-sm text-text-secondary">Fetching audit data...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-3xl"></div>
            <Card className="relative backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Audit Logs
                        </h1>
                        <p className="text-text-secondary">Monitor system activities and security events</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => fetchLogs()} 
                      disabled={refreshing}
                      className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button 
                      className="backdrop-blur-sm bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Total Logs</p>
                      <p className="text-2xl font-bold text-text-primary">{metrics.totalLogs}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                      <Shield className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Critical Events</p>
                      <p className="text-2xl font-bold text-red-500">{metrics.criticalLogs}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/10">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Failed Actions</p>
                      <p className="text-2xl font-bold text-orange-500">{metrics.failedActions}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10">
                      <XCircle className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Unique Users</p>
                      <p className="text-2xl font-bold text-text-primary">{metrics.uniqueUsers}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10">
                      <Users className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="user_login">User Login</SelectItem>
                    <SelectItem value="user_logout">User Logout</SelectItem>
                    <SelectItem value="trade_execution">Trade Execution</SelectItem>
                    <SelectItem value="password_change">Password Change</SelectItem>
                    <SelectItem value="api_access">API Access</SelectItem>
                    <SelectItem value="user_deletion">User Deletion</SelectItem>
                    <SelectItem value="user_creation">User Creation</SelectItem>
                    <SelectItem value="data_export">Data Export</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last hour</SelectItem>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ search: '', action: 'all', severity: 'all', status: 'all', userRole: 'all', dateRange: '24h', sortBy: 'timestamp', sortOrder: 'desc' })}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Audit Logs</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Showing {logs.length} log entries
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Timestamp
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          User
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Action
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Resource
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Severity
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Status
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          IP Address
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary w-[50px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, index) => (
                      <TableRow 
                        key={log.id}
                        className={cn(
                          "hover:bg-background/50 transition-colors duration-200",
                          index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                        )}
                      >
                        <TableCell className="font-medium text-text-primary">
                          <div className="text-sm">
                            {formatDate(log.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{log.userEmail}</div>
                            <div className="text-xs text-text-secondary">{log.userRole}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="text-sm font-medium">{getActionLabel(log.action)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.resource}</div>
                            {log.resourceId && (
                              <div className="text-xs text-text-secondary">ID: {log.resourceId}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(log.severity)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            {getStatusBadge(log.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">{log.ipAddress}</div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="hover:bg-accent hover:text-accent-foreground"
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

          {/* Log Details Dialog */}
          {selectedLog && (
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    Audit Log Details
                  </DialogTitle>
                  <DialogDescription>
                    Detailed information about this audit log entry
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Event Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Timestamp:</span>
                          <span className="font-medium">{formatDate(selectedLog.timestamp)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Action:</span>
                          <span className="font-medium">{getActionLabel(selectedLog.action)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Resource:</span>
                          <span className="font-medium">{selectedLog.resource}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Severity:</span>
                          <span className="font-medium">{getSeverityBadge(selectedLog.severity)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">User Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">User Email:</span>
                          <span className="font-medium">{selectedLog.userEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">User Role:</span>
                          <span className="font-medium">{selectedLog.userRole}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">IP Address:</span>
                          <span className="font-medium font-mono">{selectedLog.ipAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Session ID:</span>
                          <span className="font-medium font-mono text-xs">{selectedLog.sessionId}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Technical Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Technical Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">User Agent</Label>
                        <div className="mt-1 p-3 bg-background/50 rounded-lg border">
                          <code className="text-sm break-all">{selectedLog.userAgent}</code>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Request ID</Label>
                        <div className="mt-1 p-3 bg-background/50 rounded-lg border">
                          <code className="text-sm font-mono">{selectedLog.requestId}</code>
                        </div>
                      </div>
                      {selectedLog.duration && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Duration:</span>
                          <span className="font-medium">{formatDuration(selectedLog.duration)}</span>
                        </div>
                      )}
                      {selectedLog.errorMessage && (
                        <div>
                          <Label className="text-sm font-medium text-red-500">Error Message</Label>
                          <div className="mt-1 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <code className="text-sm text-red-500">{selectedLog.errorMessage}</code>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Changes Details */}
                  {(selectedLog.details.oldValues || selectedLog.details.newValues) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Data Changes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedLog.details.oldValues && (
                            <div>
                              <Label className="text-sm font-medium text-orange-500">Old Values</Label>
                              <div className="mt-1 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                <pre className="text-sm text-orange-500 overflow-auto">
                                  {JSON.stringify(selectedLog.details.oldValues, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          {selectedLog.details.newValues && (
                            <div>
                              <Label className="text-sm font-medium text-green-500">New Values</Label>
                              <div className="mt-1 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                <pre className="text-sm text-green-500 overflow-auto">
                                  {JSON.stringify(selectedLog.details.newValues, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Metadata */}
                  {selectedLog.details.metadata && Object.keys(selectedLog.details.metadata).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Metadata</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-3 bg-background/50 rounded-lg border">
                          <pre className="text-sm text-text-secondary overflow-auto">
                            {JSON.stringify(selectedLog.details.metadata, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
