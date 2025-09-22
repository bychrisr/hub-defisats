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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  Bell,
  Mail,
  MessageSquare,
  Webhook,
  Send,
  TestTube,
  History,
  Archive
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'telegram' | 'whatsapp' | 'push' | 'webhook';
  category: 'trading' | 'system' | 'payment' | 'automation' | 'security';
  subject: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  successRate: number;
  lastUsed?: string;
}

interface NotificationLog {
  id: string;
  templateId: string;
  templateName: string;
  userId: string;
  userEmail: string;
  type: string;
  category: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  createdAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  retryCount: number;
  channel: string;
}

interface NotificationMetrics {
  totalTemplates: number;
  activeTemplates: number;
  totalSent: number;
  successRate: number;
  avgDeliveryTime: number;
  failedNotifications: number;
  pendingNotifications: number;
  mostUsedTemplate: string;
  leastUsedTemplate: string;
}

export default function NotificationManagement() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<NotificationMetrics | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
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
    console.log('🔍 NOTIFICATION MANAGEMENT - Initial load useEffect triggered');
    fetchData();
    isInitialLoad.current = false;
  }, []);

  // Recarrega quando os filtros mudam (mas não em loop)
  useEffect(() => {
    console.log('🔍 NOTIFICATION MANAGEMENT - Filter change useEffect triggered', { 
      isInitialLoad: isInitialLoad.current,
      filters: { search: filters.search, type: filters.type, category: filters.category, status: filters.status, dateRange: filters.dateRange, sortBy: filters.sortBy, sortOrder: filters.sortOrder },
      lastFilters: lastFilters.current
    });
    
    // Só executa se não for o carregamento inicial e se os filtros realmente mudaram
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.type !== filters.type ||
        lastFilters.current.category !== filters.category ||
        lastFilters.current.status !== filters.status ||
        lastFilters.current.dateRange !== filters.dateRange ||
        lastFilters.current.sortBy !== filters.sortBy ||
        lastFilters.current.sortOrder !== filters.sortOrder;
      
      if (filtersChanged) {
        console.log('🔍 NOTIFICATION MANAGEMENT - Filters changed, executing fetchData');
        lastFilters.current = { ...filters };
        fetchData();
      }
    }
  }, [filters.search, filters.type, filters.category, filters.status, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Simular dados de templates e logs
      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'Trade Execution Alert',
          type: 'email',
          category: 'trading',
          subject: 'Trade Executed - {{symbol}}',
          content: 'Your {{action}} order for {{symbol}} has been executed at {{price}}',
          isActive: true,
          createdAt: '2025-01-15T10:30:00Z',
          updatedAt: '2025-01-15T10:30:00Z',
          usageCount: 1250,
          successRate: 98.5,
          lastUsed: '2025-01-15T14:30:00Z'
        },
        {
          id: '2',
          name: 'Payment Confirmation',
          type: 'telegram',
          category: 'payment',
          subject: 'Payment Received',
          content: 'Payment of {{amount}} sats has been received and confirmed',
          isActive: true,
          createdAt: '2025-01-15T09:15:00Z',
          updatedAt: '2025-01-15T09:15:00Z',
          usageCount: 890,
          successRate: 99.2,
          lastUsed: '2025-01-15T13:45:00Z'
        },
        {
          id: '3',
          name: 'System Maintenance',
          type: 'push',
          category: 'system',
          subject: 'Scheduled Maintenance',
          content: 'System will be under maintenance from {{startTime}} to {{endTime}}',
          isActive: false,
          createdAt: '2025-01-15T08:00:00Z',
          updatedAt: '2025-01-15T08:00:00Z',
          usageCount: 45,
          successRate: 100.0,
          lastUsed: '2025-01-14T20:00:00Z'
        }
      ];

      const mockLogs: NotificationLog[] = [
        {
          id: '1',
          templateId: '1',
          templateName: 'Trade Execution Alert',
          userId: 'user1',
          userEmail: 'trader1@example.com',
          type: 'email',
          category: 'trading',
          status: 'delivered',
          createdAt: '2025-01-15T14:30:00Z',
          deliveredAt: '2025-01-15T14:30:05Z',
          retryCount: 0,
          channel: 'smtp'
        },
        {
          id: '2',
          templateId: '2',
          templateName: 'Payment Confirmation',
          userId: 'user2',
          userEmail: 'trader2@example.com',
          type: 'telegram',
          category: 'payment',
          status: 'failed',
          createdAt: '2025-01-15T13:45:00Z',
          errorMessage: 'Invalid bot token',
          retryCount: 3,
          channel: 'telegram_api'
        },
        {
          id: '3',
          templateId: '1',
          templateName: 'Trade Execution Alert',
          userId: 'user3',
          userEmail: 'trader3@example.com',
          type: 'email',
          category: 'trading',
          status: 'pending',
          createdAt: '2025-01-15T15:00:00Z',
          retryCount: 0,
          channel: 'smtp'
        }
      ];

      const mockMetrics: NotificationMetrics = {
        totalTemplates: 3,
        activeTemplates: 2,
        totalSent: 2185,
        successRate: 99.1,
        avgDeliveryTime: 2.3,
        failedNotifications: 15,
        pendingNotifications: 8,
        mostUsedTemplate: 'Trade Execution Alert',
        leastUsedTemplate: 'System Maintenance'
      };

      setTemplates(mockTemplates);
      setLogs(mockLogs);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching notification data:', error);
      toast.error('Failed to fetch notification data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'telegram':
        return <MessageSquare className="h-4 w-4 text-cyan-500" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'push':
        return <Bell className="h-4 w-4 text-orange-500" />;
      case 'webhook':
        return <Webhook className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'telegram':
        return 'Telegram';
      case 'whatsapp':
        return 'WhatsApp';
      case 'push':
        return 'Push';
      case 'webhook':
        return 'Webhook';
      default:
        return 'Unknown';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'trading':
        return <Badge className="bg-blue-500 text-white">Trading</Badge>;
      case 'payment':
        return <Badge className="bg-green-500 text-white">Payment</Badge>;
      case 'system':
        return <Badge className="bg-orange-500 text-white">System</Badge>;
      case 'automation':
        return <Badge className="bg-purple-500 text-white">Automation</Badge>;
      case 'security':
        return <Badge className="bg-red-500 text-white">Security</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-500 text-white">Sent</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500 text-white">Delivered</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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
                    <h3 className="text-lg font-semibold text-text-primary">Loading Notifications</h3>
                    <p className="text-sm text-text-secondary">Fetching notification data...</p>
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
                        <Bell className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Notification Management
                        </h1>
                        <p className="text-text-secondary">Manage notification templates and monitor delivery</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => fetchData()} 
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
                      <Bell className="h-4 w-4 mr-2" />
                      New Template
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
                      <p className="text-sm font-medium text-text-secondary">Total Templates</p>
                      <p className="text-2xl font-bold text-text-primary">{metrics.totalTemplates}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                      <Bell className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Active Templates</p>
                      <p className="text-2xl font-bold text-green-500">{metrics.activeTemplates}</p>
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
                      <p className="text-sm font-medium text-text-secondary">Success Rate</p>
                      <p className="text-2xl font-bold text-text-primary">{formatPercentage(metrics.successRate)}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10">
                      <TrendingUp className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Total Sent</p>
                      <p className="text-2xl font-bold text-text-primary">{metrics.totalSent.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10">
                      <Send className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
              <TabsTrigger value="templates" className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white">
                <Bell className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="logs" className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white">
                <History className="h-4 w-4 mr-2" />
                Delivery Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
              {/* Templates Content */}
              <div className="space-y-6">
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
                          placeholder="Search templates..."
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
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="telegram">Telegram</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="push">Push</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="trading">Trading</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="automation">Automation</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
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
                        onClick={() => setFilters({ search: '', type: 'all', category: 'all', status: 'all', dateRange: '30d', sortBy: 'createdAt', sortOrder: 'desc' })}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Templates Table */}
                <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold">Templates</CardTitle>
                        <CardDescription className="text-text-secondary">
                          Showing {templates.length} templates
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
                                <Bell className="h-4 w-4" />
                                Template
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
                                <Target className="h-4 w-4" />
                                Category
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
                                <TrendingUp className="h-4 w-4" />
                                Usage
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Last Used
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary w-[50px]">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {templates.map((template, index) => (
                            <TableRow 
                              key={template.id}
                              className={cn(
                                "hover:bg-background/50 transition-colors duration-200",
                                index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                              )}
                            >
                              <TableCell className="font-medium text-text-primary">
                                <div>
                                  <div className="font-medium">{template.name}</div>
                                  <div className="text-sm text-text-secondary">{template.subject}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getTypeIcon(template.type)}
                                  <Badge variant="outline" className="font-semibold">
                                    {getTypeLabel(template.type)}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getCategoryBadge(template.category)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {template.isActive ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <Badge className={template.isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                                    {template.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{template.usageCount.toLocaleString()}</div>
                                  <div className="text-text-secondary">{formatPercentage(template.successRate)} success</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-text-secondary">
                                  {template.lastUsed ? formatDate(template.lastUsed) : 'Never'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTemplate(template)}
                                    className="hover:bg-accent hover:text-accent-foreground"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-accent hover:text-accent-foreground"
                                  >
                                    <TestTube className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              {/* Logs Content */}
              <div className="space-y-6">
                {/* Logs Table */}
                <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                        <History className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold">Delivery Logs</CardTitle>
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
                                <Bell className="h-4 w-4" />
                                Template
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
                                <Clock className="h-4 w-4" />
                                Created
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Channel
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
                                <div>
                                  <div className="font-medium">{log.templateName}</div>
                                  <div className="text-sm text-text-secondary">{log.category}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">{log.userEmail}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getTypeIcon(log.type)}
                                  <Badge variant="outline" className="font-semibold">
                                    {getTypeLabel(log.type)}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(log.status)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-text-secondary">
                                  {formatDate(log.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">{log.channel}</div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
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
              </div>
            </TabsContent>
          </Tabs>

          {/* Template Details Dialog */}
          {selectedTemplate && (
            <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Bell className="h-6 w-6 text-primary" />
                    {selectedTemplate.name}
                  </DialogTitle>
                  <DialogDescription>
                    Template configuration and usage statistics
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Type:</span>
                          <span className="font-medium">{getTypeLabel(selectedTemplate.type)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Category:</span>
                          <span className="font-medium">{selectedTemplate.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Status:</span>
                          <span className="font-medium">{selectedTemplate.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Created:</span>
                          <span className="font-medium">{formatDate(selectedTemplate.createdAt)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Usage Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Usage Count:</span>
                          <span className="font-medium">{selectedTemplate.usageCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Success Rate:</span>
                          <span className="font-medium text-green-500">{formatPercentage(selectedTemplate.successRate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Last Used:</span>
                          <span className="font-medium">{selectedTemplate.lastUsed ? formatDate(selectedTemplate.lastUsed) : 'Never'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Template Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Template Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Subject</Label>
                        <div className="mt-1 p-3 bg-background/50 rounded-lg border">
                          <code className="text-sm">{selectedTemplate.subject}</code>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Content</Label>
                        <div className="mt-1 p-3 bg-background/50 rounded-lg border">
                          <code className="text-sm whitespace-pre-wrap">{selectedTemplate.content}</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
