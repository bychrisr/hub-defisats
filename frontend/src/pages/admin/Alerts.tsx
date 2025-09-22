import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Clock,
  Loader2,
  Search,
  Filter,
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  XCircle,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Alert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_global: boolean;
  created_at: string;
  updated_at?: string;
  expires_at?: string;
  is_active: boolean;
  category?: string;
  description?: string;
  action_required?: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    severity: 'all',
    status: 'all',
    category: 'all'
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const [alertForm, setAlertForm] = useState({
    message: '',
    severity: 'info' as const,
    is_global: false,
    category: '',
    description: '',
    action_required: false,
    expires_at: ''
  });

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchAlerts = async () => {
    setRefreshing(true);
    try {
      // Simular dados de alertas
      const mockAlerts: Alert[] = [
        {
          id: '1',
          message: 'Sistema de autenticação com alta latência',
          severity: 'warning',
          is_global: true,
          created_at: '2024-01-22T10:30:00Z',
          updated_at: '2024-01-22T10:30:00Z',
          is_active: true,
          category: 'performance',
          description: 'A latência do sistema de autenticação está acima do normal',
          action_required: true
        },
        {
          id: '2',
          message: 'Falha na conexão com LN Markets',
          severity: 'critical',
          is_global: true,
          created_at: '2024-01-22T09:15:00Z',
          updated_at: '2024-01-22T09:15:00Z',
          is_active: true,
          category: 'api',
          description: 'Não foi possível conectar com a API da LN Markets',
          action_required: true
        },
        {
          id: '3',
          message: 'Novo usuário registrado',
          severity: 'info',
          is_global: false,
          created_at: '2024-01-22T08:45:00Z',
          updated_at: '2024-01-22T08:45:00Z',
          is_active: true,
          category: 'user',
          description: 'Um novo usuário se registrou na plataforma',
          action_required: false
        },
        {
          id: '4',
          message: 'Backup diário concluído com sucesso',
          severity: 'info',
          is_global: true,
          created_at: '2024-01-22T02:00:00Z',
          updated_at: '2024-01-22T02:00:00Z',
          is_active: false,
          category: 'system',
          description: 'Backup automático do banco de dados concluído',
          action_required: false,
          resolved_at: '2024-01-22T02:05:00Z',
          resolved_by: 'system'
        },
        {
          id: '5',
          message: 'Uso de memória acima de 80%',
          severity: 'warning',
          is_global: true,
          created_at: '2024-01-22T07:20:00Z',
          updated_at: '2024-01-22T07:20:00Z',
          is_active: true,
          category: 'system',
          description: 'O uso de memória do servidor está acima de 80%',
          action_required: true
        }
      ];

      setTimeout(() => {
        setAlerts(mockAlerts);
        setLoading(false);
        setRefreshing(false);
        toast.success('Alertas carregados com sucesso!');
      }, 1000);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
      setRefreshing(false);
      toast.error('Erro ao carregar alertas');
    }
  };

  const handleCreateAlert = async () => {
    try {
      // Simular criação
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Alerta criado com sucesso!');
      setCreateDialogOpen(false);
      fetchAlerts();
    } catch (error) {
      toast.error('Erro ao criar alerta');
    }
  };

  const handleEditAlert = async () => {
    try {
      // Simular edição
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Alerta atualizado com sucesso!');
      setEditDialogOpen(false);
      fetchAlerts();
    } catch (error) {
      toast.error('Erro ao atualizar alerta');
    }
  };

  const handleDeleteAlert = async () => {
    try {
      // Simular exclusão
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Alerta excluído com sucesso!');
      setDeleteDialogOpen(false);
      fetchAlerts();
    } catch (error) {
      toast.error('Erro ao excluir alerta');
    }
  };

  const handleResolveAlert = async (alert: Alert) => {
    try {
      // Simular resolução
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Alerta resolvido com sucesso!');
      fetchAlerts();
    } catch (error) {
      toast.error('Erro ao resolver alerta');
    }
  };

  const handleToggleAlertStatus = async (alert: Alert) => {
    try {
      // Simular toggle
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`Alerta ${alert.is_active ? 'desativado' : 'ativado'} com sucesso!`);
      fetchAlerts();
    } catch (error) {
      toast.error('Erro ao alterar status do alerta');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25';
      case 'warning':
        return 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25';
      case 'info':
        return 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'api':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'user':
        return <Bell className="h-4 w-4 text-green-500" />;
      case 'system':
        return <Shield className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance':
        return 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25';
      case 'api':
        return 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25';
      case 'user':
        return 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25';
      case 'system':
        return 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const getStats = () => {
    const totalAlerts = alerts.length;
    const activeAlerts = alerts.filter(alert => alert.is_active).length;
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && alert.is_active).length;
    const resolvedAlerts = alerts.filter(alert => !alert.is_active).length;

    return { totalAlerts, activeAlerts, criticalAlerts, resolvedAlerts };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <h3 className="text-xl font-semibold text-text-primary">Carregando Alertas</h3>
                  <p className="text-text-secondary">Aguarde enquanto carregamos os alertas do sistema...</p>
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
                          Gerenciamento de Alertas
                        </h1>
                        <p className="text-text-secondary">Monitore e gerencie alertas do sistema</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={fetchAlerts}
                      disabled={refreshing}
                      className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      onClick={() => setCreateDialogOpen(true)}
                      className="backdrop-blur-sm bg-green-600/90 hover:bg-green-600 text-white shadow-lg shadow-green-600/25"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Alerta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="gradient-card-blue profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Total Alertas</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalAlerts}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                    <Bell className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-green profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Alertas Ativos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.activeAlerts}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-yellow profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Críticos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.criticalAlerts}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 backdrop-blur-sm">
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-purple profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Resolvidos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.resolvedAlerts}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Filtros</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar alertas..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 backdrop-blur-sm bg-background/50 border-border/50"
                  />
                </div>
                <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                  <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="info">Informação</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="resolved">Resolvidos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                  <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Table */}
          <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Lista de Alertas</h3>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background/20">
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Alerta
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Severidade
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Categoria
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Criado
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Status
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Ações
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert, index) => (
                      <TableRow
                        key={alert.id}
                        className={cn(
                          "hover:bg-background/50 transition-colors",
                          index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                        )}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-text-primary">{alert.message}</div>
                            {alert.description && (
                              <div className="text-sm text-text-secondary">{alert.description}</div>
                            )}
                            {alert.action_required && (
                              <Badge className="bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25">
                                Ação Necessária
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(alert.severity)}>
                            <div className="flex items-center gap-1">
                              {getSeverityIcon(alert.severity)}
                              {alert.severity.toUpperCase()}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(alert.category || 'default')}>
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(alert.category || 'default')}
                              {alert.category?.toUpperCase() || 'DEFAULT'}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-text-primary">
                            {new Date(alert.created_at).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                "font-semibold px-3 py-1 rounded-full border-0",
                                alert.is_active
                                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                                  : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
                              )}
                            >
                              {alert.is_active ? 'Ativo' : 'Resolvido'}
                            </Badge>
                            {alert.is_global && (
                              <Badge className="bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25">
                                Global
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {alert.is_active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResolveAlert(alert)}
                                className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAlertStatus(alert)}
                              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              {alert.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAlert(alert);
                                setEditDialogOpen(true);
                              }}
                              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAlert(alert);
                                setDeleteDialogOpen(true);
                              }}
                              className="hover:bg-destructive hover:text-destructive-foreground cursor-pointer transition-colors text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Create Alert Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
          <DialogHeader>
            <DialogTitle className="text-vibrant">Criar Novo Alerta</DialogTitle>
            <DialogDescription className="text-vibrant-secondary">
              Preencha os detalhes para criar um novo alerta do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="alert_message">Mensagem</Label>
              <Input
                id="alert_message"
                value={alertForm.message}
                onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                className="backdrop-blur-sm bg-background/50 border-border/50"
                placeholder="Digite a mensagem do alerta"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alert_severity">Severidade</Label>
                <Select value={alertForm.severity} onValueChange={(value: any) => setAlertForm({ ...alertForm, severity: value })}>
                  <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert_category">Categoria</Label>
                <Select value={alertForm.category} onValueChange={(value) => setAlertForm({ ...alertForm, category: value })}>
                  <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert_description">Descrição</Label>
              <Textarea
                id="alert_description"
                value={alertForm.description}
                onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                className="backdrop-blur-sm bg-background/50 border-border/50"
                placeholder="Descrição detalhada do alerta"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="alert_global"
                  checked={alertForm.is_global}
                  onCheckedChange={(checked) => setAlertForm({ ...alertForm, is_global: checked })}
                  className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-500"
                />
                <Label htmlFor="alert_global">Alerta Global</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="alert_action_required"
                  checked={alertForm.action_required}
                  onCheckedChange={(checked) => setAlertForm({ ...alertForm, action_required: checked })}
                  className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-gray-500"
                />
                <Label htmlFor="alert_action_required">Ação Necessária</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="backdrop-blur-sm bg-background/50 border-border/50 hover:bg-background/70"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAlert}
              className="backdrop-blur-sm bg-green-600/90 hover:bg-green-600 text-white shadow-lg shadow-green-600/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
          <DialogHeader>
            <DialogTitle className="text-vibrant">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-vibrant-secondary">
              Tem certeza que deseja excluir o alerta "{selectedAlert?.message}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="backdrop-blur-sm bg-background/50 border-border/50 hover:bg-background/70"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteAlert}
              className="backdrop-blur-sm bg-destructive/90 hover:bg-destructive text-white shadow-lg shadow-destructive/25"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}