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
  Activity2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SystemReport {
  id: string;
  name: string;
  type: 'performance' | 'usage' | 'security' | 'financial' | 'user_activity' | 'error_analysis';
  status: 'generating' | 'completed' | 'failed' | 'scheduled';
  createdAt: string;
  completedAt?: string;
  scheduledFor?: string;
  generatedBy: string;
  fileSize: number; // in bytes
  recordCount: number;
  parameters: {
    dateRange: string;
    filters: Record<string, any>;
    format: 'pdf' | 'excel' | 'csv' | 'json';
  };
  summary: {
    totalRecords: number;
    keyMetrics: Record<string, number>;
    insights: string[];
  };
}

interface SystemMetrics {
  totalReports: number;
  completedReports: number;
  failedReports: number;
  generatingReports: number;
  totalFileSize: number;
  avgGenerationTime: number;
  mostRequestedType: string;
  lastGenerated: string;
}

export default function SystemReports() {
  const [reports, setReports] = useState<SystemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [selectedReport, setSelectedReport] = useState<SystemReport | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    dateRange: '30d',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Ref para controlar se é o carregamento inicial
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  // Apenas carrega uma vez no início
  useEffect(() => {
    console.log('🔍 SYSTEM REPORTS - Initial load useEffect triggered');
    fetchReports();
    isInitialLoad.current = false;
  }, []);

  // Recarrega quando os filtros mudam (mas não em loop)
  useEffect(() => {
    console.log('🔍 SYSTEM REPORTS - Filter change useEffect triggered', { 
      isInitialLoad: isInitialLoad.current,
      filters: { search: filters.search, type: filters.type, status: filters.status, dateRange: filters.dateRange, sortBy: filters.sortBy, sortOrder: filters.sortOrder },
      lastFilters: lastFilters.current
    });
    
    // Só executa se não for o carregamento inicial e se os filtros realmente mudaram
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.type !== filters.type ||
        lastFilters.current.status !== filters.status ||
        lastFilters.current.dateRange !== filters.dateRange ||
        lastFilters.current.sortBy !== filters.sortBy ||
        lastFilters.current.sortOrder !== filters.sortOrder;
      
      if (filtersChanged) {
        console.log('🔍 SYSTEM REPORTS - Filters changed, executing fetchReports');
        lastFilters.current = { ...filters };
        fetchReports();
      }
    }
  }, [filters.search, filters.type, filters.status, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const fetchReports = async () => {
    setRefreshing(true);
    try {
      // Simular dados de relatórios do sistema
      const mockReports: SystemReport[] = [
        {
          id: '1',
          name: 'Monthly Performance Report',
          type: 'performance',
          status: 'completed',
          createdAt: '2025-01-15T10:30:00Z',
          completedAt: '2025-01-15T10:35:00Z',
          generatedBy: 'admin@defisats.com',
          fileSize: 2048576, // 2MB
          recordCount: 15420,
          parameters: {
            dateRange: '2025-01-01 to 2025-01-31',
            filters: { includeInactive: false },
            format: 'pdf'
          },
          summary: {
            totalRecords: 15420,
            keyMetrics: {
              totalUsers: 1250,
              activeUsers: 980,
              totalRevenue: 45000,
              avgSessionTime: 25.5
            },
            insights: [
              'User growth increased by 15% this month',
              'Revenue per user increased by 8%',
              'System uptime maintained at 99.9%'
            ]
          }
        },
        {
          id: '2',
          name: 'User Activity Analysis',
          type: 'user_activity',
          status: 'generating',
          createdAt: '2025-01-15T11:00:00Z',
          generatedBy: 'admin@defisats.com',
          fileSize: 0,
          recordCount: 0,
          parameters: {
            dateRange: '2025-01-01 to 2025-01-31',
            filters: { userType: 'all' },
            format: 'excel'
          },
          summary: {
            totalRecords: 0,
            keyMetrics: {},
            insights: []
          }
        },
        {
          id: '3',
          name: 'Security Audit Report',
          type: 'security',
          status: 'completed',
          createdAt: '2025-01-15T09:15:00Z',
          completedAt: '2025-01-15T09:20:00Z',
          generatedBy: 'admin@defisats.com',
          fileSize: 1024000, // 1MB
          recordCount: 3250,
          parameters: {
            dateRange: '2025-01-01 to 2025-01-31',
            filters: { severity: 'all' },
            format: 'pdf'
          },
          summary: {
            totalRecords: 3250,
            keyMetrics: {
              failedLogins: 45,
              suspiciousActivities: 12,
              securityAlerts: 3,
              blockedIPs: 8
            },
            insights: [
              'No critical security issues detected',
              'Failed login attempts decreased by 20%',
              'All security patches are up to date'
            ]
          }
        },
        {
          id: '4',
          name: 'Financial Summary Q4 2024',
          type: 'financial',
          status: 'scheduled',
          createdAt: '2025-01-15T08:00:00Z',
          scheduledFor: '2025-01-16T09:00:00Z',
          generatedBy: 'admin@defisats.com',
          fileSize: 0,
          recordCount: 0,
          parameters: {
            dateRange: '2024-10-01 to 2024-12-31',
            filters: { includeRefunds: true },
            format: 'excel'
          },
          summary: {
            totalRecords: 0,
            keyMetrics: {},
            insights: []
          }
        }
      ];

      const mockMetrics: SystemMetrics = {
        totalReports: 4,
        completedReports: 2,
        failedReports: 0,
        generatingReports: 1,
        totalFileSize: 3072576, // 3MB
        avgGenerationTime: 4.5,
        mostRequestedType: 'performance',
        lastGenerated: '2025-01-15T10:35:00Z'
      };

      setReports(mockReports);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching system reports:', error);
      toast.error('Failed to fetch system reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'usage':
        return <BarChart3 className="h-4 w-4 text-green-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'financial':
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      case 'user_activity':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'error_analysis':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'performance':
        return 'Performance';
      case 'usage':
        return 'Usage';
      case 'security':
        return 'Security';
      case 'financial':
        return 'Financial';
      case 'user_activity':
        return 'User Activity';
      case 'error_analysis':
        return 'Error Analysis';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case 'generating':
        return <Badge className="bg-blue-500 text-white">Generating</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      case 'scheduled':
        return <Badge className="bg-yellow-500 text-white">Scheduled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
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
                    <h3 className="text-lg font-semibold text-text-primary">Loading System Reports</h3>
                    <p className="text-sm text-text-secondary">Fetching report data...</p>
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
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          System Reports
                        </h1>
                        <p className="text-text-secondary">Generate and manage system reports</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => fetchReports()} 
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
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
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
                      <p className="text-sm font-medium text-text-secondary">Total Reports</p>
                      <p className="text-2xl font-bold text-text-primary">{metrics.totalReports}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Completed</p>
                      <p className="text-2xl font-bold text-green-500">{metrics.completedReports}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Generating</p>
                      <p className="text-2xl font-bold text-blue-500">{metrics.generatingReports}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Total Size</p>
                      <p className="text-2xl font-bold text-text-primary">{formatFileSize(metrics.totalFileSize)}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10">
                      <HardDrive className="h-6 w-6 text-purple-500" />
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="usage">Usage</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="user_activity">User Activity</SelectItem>
                    <SelectItem value="error_analysis">Error Analysis</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="generating">Generating</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ search: '', type: 'all', status: 'all', dateRange: '30d', sortBy: 'createdAt', sortOrder: 'desc' })}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">System Reports</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Showing {reports.length} reports
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
                          <FileText className="h-4 w-4" />
                          Report
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Type
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
                          <HardDrive className="h-4 w-4" />
                          Size
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Records
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Created
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary w-[50px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report, index) => (
                      <TableRow 
                        key={report.id}
                        className={cn(
                          "hover:bg-background/50 transition-colors duration-200",
                          index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                        )}
                      >
                        <TableCell className="font-medium text-text-primary">
                          <div>
                            <div className="font-medium">{report.name}</div>
                            <div className="text-sm text-text-secondary">
                              {report.parameters.format.toUpperCase()} • {report.parameters.dateRange}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(report.type)}
                            <Badge variant="outline" className="font-semibold">
                              {getTypeLabel(report.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(report.status)}
                            {getStatusBadge(report.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {report.fileSize > 0 ? formatFileSize(report.fileSize) : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {report.recordCount > 0 ? report.recordCount.toLocaleString() : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-text-secondary">
                            {formatDate(report.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                              className="hover:bg-accent hover:text-accent-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {report.status === 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-accent hover:text-accent-foreground"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Report Details Dialog */}
          {selectedReport && (
            <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    {selectedReport.name}
                  </DialogTitle>
                  <DialogDescription>
                    Report details and summary
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Report Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Type:</span>
                          <span className="font-medium">{getTypeLabel(selectedReport.type)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Status:</span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(selectedReport.status)}
                            {getStatusBadge(selectedReport.status)}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Format:</span>
                          <span className="font-medium">{selectedReport.parameters.format.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Generated By:</span>
                          <span className="font-medium">{selectedReport.generatedBy}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">File Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">File Size:</span>
                          <span className="font-medium">{formatFileSize(selectedReport.fileSize)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Record Count:</span>
                          <span className="font-medium">{selectedReport.recordCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Created:</span>
                          <span className="font-medium">{formatDate(selectedReport.createdAt)}</span>
                        </div>
                        {selectedReport.completedAt && (
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Completed:</span>
                            <span className="font-medium">{formatDate(selectedReport.completedAt)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Key Metrics */}
                  {selectedReport.summary.keyMetrics && Object.keys(selectedReport.summary.keyMetrics).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Key Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(selectedReport.summary.keyMetrics).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <div className="text-2xl font-bold text-text-primary">{value.toLocaleString()}</div>
                              <div className="text-sm text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Insights */}
                  {selectedReport.summary.insights && selectedReport.summary.insights.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Key Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedReport.summary.insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-text-secondary">{insight}</span>
                            </li>
                          ))}
                        </ul>
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
