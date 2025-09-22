import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Settings,
  Info,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  MessageSquare,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DashboardCard {
  id: string;
  key: string;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
  order_index: number;
  is_active: boolean;
  is_admin_only: boolean;
  created_at: string;
  updated_at: string;
}

interface TooltipConfig {
  id: string;
  card_key: string;
  tooltip_text: string;
  tooltip_position: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function Tooltips() {
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [tooltips, setTooltips] = useState<TooltipConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('cards');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all'
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DashboardCard | null>(null);
  const [selectedTooltip, setSelectedTooltip] = useState<TooltipConfig | null>(null);

  const [cardForm, setCardForm] = useState({
    key: '',
    title: '',
    description: '',
    icon: '',
    category: '',
    order_index: 0,
    is_active: true,
    is_admin_only: false
  });

  const [tooltipForm, setTooltipForm] = useState({
    card_key: '',
    tooltip_text: '',
    tooltip_position: 'top',
    is_enabled: true
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Simular dados de cards e tooltips
      const mockCards: DashboardCard[] = [
        {
          id: '1',
          key: 'total_balance',
          title: 'Saldo Total',
          description: 'Saldo total estimado da conta',
          icon: 'DollarSign',
          category: 'financial',
          order_index: 1,
          is_active: true,
          is_admin_only: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          key: 'success_rate',
          title: 'Taxa de Sucesso',
          description: 'Percentual de trades bem-sucedidos',
          icon: 'TrendingUp',
          category: 'performance',
          order_index: 2,
          is_active: true,
          is_admin_only: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          key: 'active_positions',
          title: 'Posições Ativas',
          description: 'Número de posições abertas',
          icon: 'Activity',
          category: 'trading',
          order_index: 3,
          is_active: true,
          is_admin_only: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockTooltips: TooltipConfig[] = [
        {
          id: '1',
          card_key: 'total_balance',
          tooltip_text: 'Este valor representa o saldo total estimado da sua conta, incluindo posições abertas e saldo disponível.',
          tooltip_position: 'top',
          is_enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          card_key: 'success_rate',
          tooltip_text: 'A taxa de sucesso é calculada baseada no número de trades lucrativos dividido pelo total de trades realizados.',
          tooltip_position: 'right',
          is_enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          card_key: 'active_positions',
          tooltip_text: 'Mostra o número atual de posições abertas na LN Markets.',
          tooltip_position: 'bottom',
          is_enabled: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      setTimeout(() => {
        setCards(mockCards);
        setTooltips(mockTooltips);
        setLoading(false);
        setRefreshing(false);
        toast.success('Dados carregados com sucesso!');
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      setRefreshing(false);
      toast.error('Erro ao carregar dados');
    }
  };

  const handleSaveCard = async () => {
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Card salvo com sucesso!');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar card');
    }
  };

  const handleSaveTooltip = async () => {
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Tooltip salvo com sucesso!');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar tooltip');
    }
  };

  const handleToggleCardStatus = async (card: DashboardCard) => {
    try {
      // Simular toggle
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`Card ${card.is_active ? 'desativado' : 'ativado'} com sucesso!`);
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar status do card');
    }
  };

  const handleToggleTooltipStatus = async (tooltip: TooltipConfig) => {
    try {
      // Simular toggle
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`Tooltip ${tooltip.is_enabled ? 'desabilitado' : 'habilitado'} com sucesso!`);
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar status do tooltip');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'performance':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'trading':
        return <Activity className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial':
        return 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25';
      case 'performance':
        return 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25';
      case 'trading':
        return 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'top':
        return <ArrowUp className="h-4 w-4" />;
      case 'bottom':
        return <ArrowDown className="h-4 w-4" />;
      case 'left':
        return <ArrowLeft className="h-4 w-4" />;
      case 'right':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getStats = () => {
    const totalCards = cards.length;
    const activeCards = cards.filter(card => card.is_active).length;
    const totalTooltips = tooltips.length;
    const activeTooltips = tooltips.filter(tooltip => tooltip.is_enabled).length;

    return { totalCards, activeCards, totalTooltips, activeTooltips };
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
                  <h3 className="text-xl font-semibold text-text-primary">Carregando Tooltips</h3>
                  <p className="text-text-secondary">Aguarde enquanto carregamos os dados...</p>
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
                        <HelpCircle className="h-6 w-6 text-primary" />
                      </div>
          <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Gerenciamento de Tooltips
                        </h1>
                        <p className="text-text-secondary">Configure tooltips e cards do dashboard</p>
                      </div>
                    </div>
          </div>
                  <div className="flex items-center space-x-4">
            <Button
                      onClick={fetchData}
                      disabled={refreshing}
                      className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
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
                    <p className="text-sm font-medium text-text-secondary">Total Cards</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalCards}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-green profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Cards Ativos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.activeCards}</p>
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
                    <p className="text-sm font-medium text-text-secondary">Total Tooltips</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalTooltips}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 backdrop-blur-sm">
                    <MessageSquare className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-purple profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Tooltips Ativos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.activeTooltips}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 backdrop-blur-sm">
                    <Lightbulb className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Tabs */}
          <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 profile-sidebar-glow backdrop-blur-sm bg-background/50 border-border/50">
                  <TabsTrigger 
                    value="cards" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Cards do Dashboard
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tooltips" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Tooltips
                  </TabsTrigger>
          </TabsList>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-6">
                  {/* Filters */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                      <Filter className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary">Filtros</h3>
                      </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar cards..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="pl-10 backdrop-blur-sm bg-background/50 border-border/50"
                      />
                    </div>
                    <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="inactive">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="financial">Financeiro</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="trading">Trading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cards Table */}
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/20">
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Card
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Categoria
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <ArrowUp className="h-4 w-4" />
                              Ordem
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
                        {cards.map((card, index) => (
                          <TableRow
                            key={card.id}
                            className={cn(
                              "hover:bg-background/50 transition-colors",
                              index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                            )}
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-text-primary">{card.title}</div>
                                <div className="text-sm text-text-secondary">{card.description}</div>
                                <div className="text-xs text-text-secondary font-mono">{card.key}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getCategoryColor(card.category || 'default')}>
                                <div className="flex items-center gap-1">
                                  {getCategoryIcon(card.category || 'default')}
                                  {card.category?.toUpperCase() || 'DEFAULT'}
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-text-primary">{card.order_index}</div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "font-semibold px-3 py-1 rounded-full border-0",
                                  card.is_active
                                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                                    : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
                                )}
                              >
                                {card.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleCardStatus(card)}
                                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                                >
                                  {card.is_active ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                          </Button>
                          <Button
                                  variant="ghost"
                            size="sm"
                                  onClick={() => {
                                    setSelectedCard(card);
                                    setEditDialogOpen(true);
                                  }}
                                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                          </Button>
                      </div>
                            </TableCell>
                          </TableRow>
              ))}
                      </TableBody>
                    </Table>
            </div>
          </TabsContent>

          {/* Tooltips Tab */}
          <TabsContent value="tooltips" className="space-y-6">
                  {/* Tooltips Table */}
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/20">
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Card
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Posição
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Texto
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
                        {tooltips.map((tooltip, index) => (
                          <TableRow
                            key={tooltip.id}
                            className={cn(
                              "hover:bg-background/50 transition-colors",
                              index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                            )}
                          >
                            <TableCell>
                              <div className="font-medium text-text-primary font-mono">
                                {tooltip.card_key}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getPositionIcon(tooltip.tooltip_position)}
                                <span className="text-sm text-text-primary capitalize">
                                  {tooltip.tooltip_position}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-text-primary max-w-xs truncate">
                                {tooltip.tooltip_text}
                    </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "font-semibold px-3 py-1 rounded-full border-0",
                                  tooltip.is_enabled
                                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                                    : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
                                )}
                              >
                                {tooltip.is_enabled ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                      <Button
                                  variant="ghost"
                        size="sm"
                                  onClick={() => handleToggleTooltipStatus(tooltip)}
                                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                                >
                                  {tooltip.is_enabled ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                        variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTooltip(tooltip);
                                    setEditDialogOpen(true);
                                  }}
                                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
            </div>
          </TabsContent>
        </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
          <DialogHeader>
            <DialogTitle className="text-vibrant">
              {activeTab === 'cards' ? 'Editar Card' : 'Editar Tooltip'}
            </DialogTitle>
            <DialogDescription className="text-vibrant-secondary">
              {activeTab === 'cards' 
                ? 'Ajuste as configurações do card do dashboard.'
                : 'Ajuste as configurações do tooltip.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {activeTab === 'cards' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card_key">Chave do Card</Label>
                    <Input
                      id="card_key"
                      value={cardForm.key}
                      onChange={(e) => setCardForm({ ...cardForm, key: e.target.value })}
                      className="backdrop-blur-sm bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card_title">Título</Label>
                    <Input
                      id="card_title"
                      value={cardForm.title}
                      onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                      className="backdrop-blur-sm bg-background/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card_description">Descrição</Label>
                  <Textarea
                    id="card_description"
                    value={cardForm.description}
                    onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                    className="backdrop-blur-sm bg-background/50 border-border/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card_icon">Ícone</Label>
                    <Input
                      id="card_icon"
                      value={cardForm.icon}
                      onChange={(e) => setCardForm({ ...cardForm, icon: e.target.value })}
                      className="backdrop-blur-sm bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card_category">Categoria</Label>
                    <Select value={cardForm.category} onValueChange={(value) => setCardForm({ ...cardForm, category: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financial">Financeiro</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="trading">Trading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card_order">Ordem</Label>
                    <Input
                      id="card_order"
                      type="number"
                      value={cardForm.order_index}
                      onChange={(e) => setCardForm({ ...cardForm, order_index: parseInt(e.target.value) })}
                      className="backdrop-blur-sm bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="card_active"
                      checked={cardForm.is_active}
                      onCheckedChange={(checked) => setCardForm({ ...cardForm, is_active: checked })}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-500"
                    />
                    <Label htmlFor="card_active">Card Ativo</Label>
                  </div>
                </div>
                </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tooltip_card_key">Card</Label>
                  <Select value={tooltipForm.card_key} onValueChange={(value) => setTooltipForm({ ...tooltipForm, card_key: value })}>
                    <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map(card => (
                        <SelectItem key={card.id} value={card.key}>{card.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tooltip_text">Texto do Tooltip</Label>
                  <Textarea
                    id="tooltip_text"
                    value={tooltipForm.tooltip_text}
                    onChange={(e) => setTooltipForm({ ...tooltipForm, tooltip_text: e.target.value })}
                    className="backdrop-blur-sm bg-background/50 border-border/50"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tooltip_position">Posição</Label>
                    <Select value={tooltipForm.tooltip_position} onValueChange={(value) => setTooltipForm({ ...tooltipForm, tooltip_position: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Topo</SelectItem>
                        <SelectItem value="bottom">Inferior</SelectItem>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="tooltip_enabled"
                      checked={tooltipForm.is_enabled}
                      onCheckedChange={(checked) => setTooltipForm({ ...tooltipForm, is_enabled: checked })}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-500"
                    />
                    <Label htmlFor="tooltip_enabled">Tooltip Ativo</Label>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
                  <Button
                    variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="backdrop-blur-sm bg-background/50 border-border/50 hover:bg-background/70"
            >
                    Cancelar
                  </Button>
                  <Button
              onClick={activeTab === 'cards' ? handleSaveCard : handleSaveTooltip}
              className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                  >
                    <Save className="h-4 w-4 mr-2" />
              Salvar
                  </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}