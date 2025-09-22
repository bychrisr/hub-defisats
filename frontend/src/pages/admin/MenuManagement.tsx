import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown,
  Save,
  X,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Menu,
  Navigation,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GripVertical,
  ExternalLink,
  Home,
  BarChart3,
  Shield,
  Activity,
  Users,
  Gift,
  MessageSquare,
  HelpCircle,
  Bell,
  Zap,
  Star,
  Crown,
  Gem
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  mobileName?: string;
  href: string;
  icon: string;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  target: string;
  badge?: string;
  badgeColor?: string;
  description?: string;
  menuType: {
    id: string;
    name: string;
    displayName: string;
  };
}

interface MenuType {
  id: string;
  name: string;
  displayName: string;
  description?: string;
}

const ICON_OPTIONS = [
  'Home', 'Settings', 'BarChart3', 'Shield', 'Activity',
  'Users', 'Gift', 'MessageSquare', 'HelpCircle', 'Bell',
  'Zap', 'Star', 'Crown', 'Gem', 'Menu', 'Navigation'
];

const BADGE_COLORS = [
  'blue', 'green', 'yellow', 'red', 'purple', 'gray'
];

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuTypes, setMenuTypes] = useState<MenuType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    menuType: 'all'
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const [itemForm, setItemForm] = useState({
    name: '',
    mobileName: '',
    href: '',
    icon: 'Home',
    order: 0,
    isActive: true,
    isVisible: true,
    target: '_self',
    badge: '',
    badgeColor: 'blue',
    description: '',
    menuType: ''
  });

  const [typeForm, setTypeForm] = useState({
    name: '',
    displayName: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Simular dados de menu
      const mockMenuTypes: MenuType[] = [
        {
          id: '1',
          name: 'main',
          displayName: 'Menu Principal',
          description: 'Menu de navegação principal da aplicação'
        },
        {
          id: '2',
          name: 'admin',
          displayName: 'Menu Administrativo',
          description: 'Menu específico para administradores'
        },
        {
          id: '3',
          name: 'footer',
          displayName: 'Menu do Rodapé',
          description: 'Links do rodapé da aplicação'
        }
      ];

      const mockMenuItems: MenuItem[] = [
        {
          id: '1',
          name: 'Dashboard',
          mobileName: 'Dashboard',
          href: '/dashboard',
          icon: 'BarChart3',
          order: 1,
          isActive: true,
          isVisible: true,
          target: '_self',
          description: 'Página principal do dashboard',
          menuType: mockMenuTypes[0]
        },
        {
          id: '2',
          name: 'Posições',
          mobileName: 'Posições',
          href: '/positions',
          icon: 'Activity',
          order: 2,
          isActive: true,
          isVisible: true,
          target: '_self',
          description: 'Visualizar posições ativas',
          menuType: mockMenuTypes[0]
        },
        {
          id: '3',
          name: 'Automações',
          mobileName: 'Automações',
          href: '/automations',
          icon: 'Zap',
          order: 3,
          isActive: true,
          isVisible: true,
          target: '_self',
          description: 'Gerenciar automações de trading',
          menuType: mockMenuTypes[0]
        },
        {
          id: '4',
          name: 'Perfil',
          mobileName: 'Perfil',
          href: '/profile',
          icon: 'Users',
          order: 4,
          isActive: true,
          isVisible: true,
          target: '_self',
          description: 'Configurações do perfil',
          menuType: mockMenuTypes[0]
        },
        {
          id: '5',
          name: 'Admin Panel',
          mobileName: 'Admin',
          href: '/admin',
          icon: 'Shield',
          order: 1,
          isActive: true,
          isVisible: true,
          target: '_self',
          badge: 'Admin',
          badgeColor: 'red',
          description: 'Painel administrativo',
          menuType: mockMenuTypes[1]
        }
      ];

      setTimeout(() => {
        setMenuTypes(mockMenuTypes);
        setMenuItems(mockMenuItems);
        setLoading(false);
        setRefreshing(false);
        toast.success('Dados do menu carregados com sucesso!');
      }, 1000);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      setLoading(false);
      setRefreshing(false);
      toast.error('Erro ao carregar dados do menu');
    }
  };

  const handleSaveItem = async () => {
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Item do menu salvo com sucesso!');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar item do menu');
    }
  };

  const handleSaveType = async () => {
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Tipo de menu salvo com sucesso!');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar tipo de menu');
    }
  };

  const handleDeleteItem = async () => {
    try {
      // Simular exclusão
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Item do menu excluído com sucesso!');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir item do menu');
    }
  };

  const handleToggleItemStatus = async (item: MenuItem) => {
    try {
      // Simular toggle
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`Item ${item.isActive ? 'desativado' : 'ativado'} com sucesso!`);
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar status do item');
    }
  };

  const handleToggleVisibility = async (item: MenuItem) => {
    try {
      // Simular toggle
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`Item ${item.isVisible ? 'ocultado' : 'exibido'} com sucesso!`);
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar visibilidade do item');
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      Home, Settings, BarChart3, Shield, Activity,
      Users, Gift, MessageSquare, HelpCircle, Bell,
      Zap, Star, Crown, Gem, Menu, Navigation
    };
    const IconComponent = iconMap[iconName] || Home;
    return <IconComponent className="h-4 w-4" />;
  };

  const getBadgeColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25',
      green: 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25',
      yellow: 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25',
      red: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25',
      purple: 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25',
      gray: 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
    };
    return colorMap[color] || colorMap.blue;
  };

  const getStats = () => {
    const totalItems = menuItems.length;
    const activeItems = menuItems.filter(item => item.isActive).length;
    const visibleItems = menuItems.filter(item => item.isVisible).length;
    const totalTypes = menuTypes.length;

    return { totalItems, activeItems, visibleItems, totalTypes };
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
                  <h3 className="text-xl font-semibold text-text-primary">Carregando Menu</h3>
                  <p className="text-text-secondary">Aguarde enquanto carregamos os dados do menu...</p>
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
                        <Menu className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Gerenciamento de Menu
                        </h1>
                        <p className="text-text-secondary">Configure os menus de navegação da aplicação</p>
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
                    <Button
                      onClick={() => setEditDialogOpen(true)}
                      className="backdrop-blur-sm bg-green-600/90 hover:bg-green-600 text-white shadow-lg shadow-green-600/25"
                    >
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
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
                    <p className="text-sm font-medium text-text-secondary">Total Itens</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalItems}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                    <Menu className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-green profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Itens Ativos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.activeItems}</p>
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
                    <p className="text-sm font-medium text-text-secondary">Itens Visíveis</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.visibleItems}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 backdrop-blur-sm">
                    <Eye className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-purple profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Tipos de Menu</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalTypes}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 backdrop-blur-sm">
                    <Navigation className="h-6 w-6 text-purple-500" />
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
                    value="items" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Itens do Menu
                  </TabsTrigger>
                  <TabsTrigger 
                    value="types" 
                    className="profile-sidebar-item data-[state=active]:active data-[state=active]:text-white"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Tipos de Menu
            </TabsTrigger>
        </TabsList>

                {/* Items Tab */}
                <TabsContent value="items" className="space-y-6">
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
                        placeholder="Buscar itens..."
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
                    <Select value={filters.menuType} onValueChange={(value) => setFilters({ ...filters, menuType: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue placeholder="Tipo de Menu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
        {menuTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.displayName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/20">
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Menu className="h-4 w-4" />
                              Item
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Navigation className="h-4 w-4" />
                              Tipo
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
                        {menuItems.map((item, index) => (
                          <TableRow
                            key={item.id}
                            className={cn(
                              "hover:bg-background/50 transition-colors",
                              index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                            )}
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {getIconComponent(item.icon)}
                                  <span className="font-medium text-text-primary">{item.name}</span>
                        {item.badge && (
                                    <Badge className={getBadgeColor(item.badgeColor || 'blue')}>
                            {item.badge}
                          </Badge>
                        )}
                                </div>
                                <div className="text-sm text-text-secondary">{item.description}</div>
                                <div className="text-xs text-text-secondary font-mono">{item.href}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25">
                                {item.menuType.displayName}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-text-primary">{item.order}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn(
                                    "font-semibold px-3 py-1 rounded-full border-0",
                                    item.isActive
                                      ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                                      : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
                                  )}
                                >
                            {item.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                                <Badge
                                  className={cn(
                                    "font-semibold px-3 py-1 rounded-full border-0",
                                    item.isVisible
                                      ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25'
                                      : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
                                  )}
                                >
                            {item.isVisible ? 'Visível' : 'Oculto'}
                          </Badge>
                        </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleItemStatus(item)}
                                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                                >
                                  {item.isActive ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                                  onClick={() => handleToggleVisibility(item)}
                                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                                >
                                  {item.isVisible ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                                  onClick={() => {
                                    setSelectedItem(item);
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
                                    setSelectedItem(item);
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
                </TabsContent>

                {/* Types Tab */}
                <TabsContent value="types" className="space-y-6">
                  {/* Types Table */}
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/20">
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Navigation className="h-4 w-4" />
                              Tipo
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Nome
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
                        {menuTypes.map((type, index) => (
                          <TableRow
                            key={type.id}
                            className={cn(
                              "hover:bg-background/50 transition-colors",
                              index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                            )}
                          >
                            <TableCell>
                              <div className="font-medium text-text-primary font-mono">
                                {type.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-text-primary">{type.displayName}</div>
                                {type.description && (
                                  <div className="text-sm text-text-secondary">{type.description}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setTypeForm({
                                      name: type.name,
                                      displayName: type.displayName,
                                      description: type.description || ''
                                    });
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
              {activeTab === 'items' ? 'Editar Item do Menu' : 'Editar Tipo de Menu'}
            </DialogTitle>
            <DialogDescription className="text-vibrant-secondary">
              {activeTab === 'items' 
                ? 'Ajuste as configurações do item do menu.'
                : 'Ajuste as configurações do tipo de menu.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {activeTab === 'items' ? (
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item_name">Nome</Label>
                    <Input
                      id="item_name"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      className="backdrop-blur-sm bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item_mobile_name">Nome Mobile</Label>
                  <Input
                      id="item_mobile_name"
                      value={itemForm.mobileName}
                      onChange={(e) => setItemForm({ ...itemForm, mobileName: e.target.value })}
                      className="backdrop-blur-sm bg-background/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item_href">URL</Label>
                  <Input
                    id="item_href"
                    value={itemForm.href}
                    onChange={(e) => setItemForm({ ...itemForm, href: e.target.value })}
                    className="backdrop-blur-sm bg-background/50 border-border/50"
                    placeholder="/dashboard"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item_icon">Ícone</Label>
                    <Select value={itemForm.icon} onValueChange={(value) => setItemForm({ ...itemForm, icon: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map(icon => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="item_order">Ordem</Label>
                  <Input
                      id="item_order"
                      type="number"
                      value={itemForm.order}
                      onChange={(e) => setItemForm({ ...itemForm, order: parseInt(e.target.value) })}
                      className="backdrop-blur-sm bg-background/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item_badge">Badge</Label>
                    <Input
                      id="item_badge"
                      value={itemForm.badge}
                      onChange={(e) => setItemForm({ ...itemForm, badge: e.target.value })}
                      className="backdrop-blur-sm bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item_badge_color">Cor do Badge</Label>
                    <Select value={itemForm.badgeColor} onValueChange={(value) => setItemForm({ ...itemForm, badgeColor: value })}>
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BADGE_COLORS.map(color => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item_description">Descrição</Label>
                  <Textarea
                    id="item_description"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="backdrop-blur-sm bg-background/50 border-border/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="item_active"
                      checked={itemForm.isActive}
                      onCheckedChange={(checked) => setItemForm({ ...itemForm, isActive: checked })}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-500"
                    />
                    <Label htmlFor="item_active">Item Ativo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="item_visible"
                      checked={itemForm.isVisible}
                      onCheckedChange={(checked) => setItemForm({ ...itemForm, isVisible: checked })}
                      className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-500"
                    />
                    <Label htmlFor="item_visible">Item Visível</Label>
                </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type_name">Nome</Label>
                  <Input
                    id="type_name"
                    value={typeForm.name}
                    onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                    className="backdrop-blur-sm bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type_display_name">Nome de Exibição</Label>
                <Input
                    id="type_display_name"
                    value={typeForm.displayName}
                    onChange={(e) => setTypeForm({ ...typeForm, displayName: e.target.value })}
                    className="backdrop-blur-sm bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type_description">Descrição</Label>
                  <Textarea
                    id="type_description"
                    value={typeForm.description}
                    onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                    className="backdrop-blur-sm bg-background/50 border-border/50"
                  />
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
              onClick={activeTab === 'items' ? handleSaveItem : handleSaveType}
              className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
            >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
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
              Tem certeza que deseja excluir o item "{selectedItem?.name}"? Esta ação não pode ser desfeita.
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
              onClick={handleDeleteItem}
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