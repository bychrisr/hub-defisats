import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Crown,
  DollarSign,
  Users,
  Zap,
  Shield,
  Star,
  Gem,
  Gift,
  Check,
  X,
  Loader2,
  RefreshCw,
  Filter,
  Search,
  BarChart3,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { plansService, Plan, PlanWithUsers } from '@/services/plans.service';


export const Plans = () => {
  const [plans, setPlans] = useState<PlanWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setRefreshing(true);
    try {
      const plansWithUsers = await plansService.getPlansWithUsers();
      setPlans(plansWithUsers);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to fetch plans');
      setLoading(false);
      setRefreshing(false);
    }
  };


  const getPlanStats = () => {
    const totalPlans = plans.length;
    const activePlans = plans.filter(plan => plan.is_active).length;
    const totalUsers = plans.reduce((sum, plan) => sum + plan.users, 0);
    const totalRevenue = plans.reduce((sum, plan) => {
      // Calcular receita baseada no preço mensal (em sats)
      const monthlyRevenue = (plan.price_monthly || 0) * plan.users;
      return sum + monthlyRevenue;
    }, 0);

    return {
      totalPlans,
      activePlans,
      totalUsers,
      totalRevenue,
    };
  };

  const getPlanIcon = (planId: string) => {
    switch (planId.toLowerCase()) {
      case 'free':
        return <Gift className="h-4 w-4" />;
      case 'basic':
        return <Zap className="h-4 w-4" />;
      case 'advanced':
        return <Star className="h-4 w-4" />;
      case 'pro':
        return <Crown className="h-4 w-4" />;
      case 'lifetime':
        return <Gem className="h-4 w-4" />;
      default:
        return <Crown className="h-4 w-4" />;
    }
  };

  const handleEdit = (plan: Plan) => {
    toast.info('Funcionalidade de edição em desenvolvimento');
  };

  const handleDelete = async (planId: string) => {
    try {
      setPlans(plans.filter(plan => plan.id !== planId));
      toast.success('Plano excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Erro ao excluir plano');
    }
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         plan.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && plan.is_active) ||
                         (filters.status === 'inactive' && !plan.is_active);
    return matchesSearch && matchesStatus;
  });

  const stats = getPlanStats();

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
                    <h3 className="text-lg font-semibold text-text-primary">Carregando Planos</h3>
                    <p className="text-text-secondary">Aguarde enquanto carregamos os dados...</p>
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
                        <Crown className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Gerenciamento de Planos
                        </h1>
                        <p className="text-text-secondary">Configure planos, preços e funcionalidades para usuários</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button 
                      onClick={fetchPlans} 
                      disabled={refreshing}
                      className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                      className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Plano
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
                    <p className="text-sm font-medium text-text-secondary">Total Planos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalPlans}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                    <Crown className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-green profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Planos Ativos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.activePlans}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 backdrop-blur-sm">
                    <Check className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-yellow profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Usuários Ativos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 backdrop-blur-sm">
                    <Users className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-purple profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Receita Total</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalRevenue.toLocaleString()} sats</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 backdrop-blur-sm">
                    <DollarSign className="h-6 w-6 text-purple-500" />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar planos..."
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
                <Button
                  variant="outline"
                  onClick={() => setFilters({ search: '', status: 'all' })}
                  className="backdrop-blur-sm bg-background/50 border-border/50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Plans Table */}
          <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Lista de Planos</h3>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background/20">
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Nome
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Preço
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Usuários
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
                    {filteredPlans.map((plan, index) => (
                      <TableRow 
                        key={plan.id}
                        className={cn(
                          "hover:bg-background/50 transition-colors",
                          index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                              {getPlanIcon(plan.id)}
                            </div>
                            <div>
                              <div className="font-medium text-text-primary">{plan.name}</div>
                              <div className="text-sm text-text-secondary">{plan.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-text-primary font-medium">
                              {formatPlanPrice(plan)}
                            </div>
                            {plan.price_monthly > 0 && plan.price_yearly > 0 && (
                              <div className="text-xs text-text-secondary">
                                {plan.price_yearly.toLocaleString()} sats/year
                              </div>
                            )}
                            {plan.price_lifetime > 0 && (
                              <div className="text-xs text-text-secondary">
                                One-time payment
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-text-primary">
                            {plan.users.toLocaleString()} usuários
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={plan.is_active ? 'default' : 'secondary'}
                            className={cn(
                              "font-semibold px-3 py-1 rounded-full border-0",
                              plan.is_active 
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25' 
                                : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
                            )}
                          >
                            {plan.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(plan)}
                              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(plan.id)}
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
    </div>
  );
};

export default Plans;
