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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  BarChart3,
  Zap,
  Bell,
  Shield,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  price_lifetime?: number;
  currency: string;
  is_active: boolean;
  max_automations: number;
  max_backtests: number;
  max_notifications: number;
  has_priority: boolean;
  has_advanced: boolean;
  has_api_access: boolean;
  features: {
    automations: string[];
    notifications: string[];
    backtests: string[];
    advanced: string[];
    support: string[];
  };
  stripe_price_id?: string;
  order: number;
  created_at: string;
  updated_at: string;
  _count?: {
    users: number;
  };
}

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  price_lifetime: number;
  currency: string;
  max_automations: number;
  max_backtests: number;
  max_notifications: number;
  has_priority: boolean;
  has_advanced: boolean;
  has_api_access: boolean;
  features: {
    automations: string[];
    notifications: string[];
    backtests: string[];
    advanced: string[];
    support: string[];
  };
  stripe_price_id: string;
  order: number;
}

const defaultFeatures = {
  automations: ['Margin Guard', 'Take Profit', 'Stop Loss'],
  notifications: ['Email', 'Telegram'],
  backtests: ['Historical Data', 'Performance Analysis'],
  advanced: ['API Access', 'Advanced Analytics'],
  support: ['Email Support'],
};

export const Plans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    slug: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    price_lifetime: 0,
    currency: 'BRL',
    max_automations: 0,
    max_backtests: 0,
    max_notifications: 0,
    has_priority: false,
    has_advanced: false,
    has_api_access: false,
    features: { ...defaultFeatures },
    stripe_price_id: '',
    order: 0,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/plans?include_inactive=true');
      setPlans(response.data.data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        price_monthly: formData.price_monthly || undefined,
        price_yearly: formData.price_yearly || undefined,
        price_lifetime: formData.price_lifetime || undefined,
      };

      if (editingPlan) {
        await axios.put(`/api/admin/plans/${editingPlan.id}`, data);
        toast.success('Plano atualizado com sucesso!');
      } else {
        await axios.post('/api/admin/plans', data);
        toast.success('Plano criado com sucesso!');
      }

      fetchPlans();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar plano');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      price_lifetime: 0,
      currency: 'BRL',
      max_automations: 0,
      max_backtests: 0,
      max_notifications: 0,
      has_priority: false,
      has_advanced: false,
      has_api_access: false,
      features: { ...defaultFeatures },
      stripe_price_id: '',
      order: 0,
    });
    setEditingPlan(null);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price_monthly: plan.price_monthly || 0,
      price_yearly: plan.price_yearly || 0,
      price_lifetime: plan.price_lifetime || 0,
      currency: plan.currency,
      max_automations: plan.max_automations,
      max_backtests: plan.max_backtests,
      max_notifications: plan.max_notifications,
      has_priority: plan.has_priority,
      has_advanced: plan.has_advanced,
      has_api_access: plan.has_api_access,
      features: plan.features,
      stripe_price_id: plan.stripe_price_id || '',
      order: plan.order,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/plans/${id}`);
      toast.success('Plano excluído com sucesso!');
      fetchPlans();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast.error(error.response?.data?.error || 'Erro ao excluir plano');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await axios.patch(`/api/admin/plans/${id}/toggle`);
      toast.success('Status do plano alterado!');
      fetchPlans();
    } catch (error: any) {
      console.error('Error toggling plan status:', error);
      toast.error('Erro ao alterar status do plano');
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (!price || price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Ilimitado';
    return limit.toString();
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const getPlanStats = () => {
    const activePlans = plans.filter(p => p.is_active);
    const totalUsers = plans.reduce((sum, plan) => sum + (plan._count?.users || 0), 0);
    const paidPlans = plans.filter(p => p.price_monthly && p.price_monthly > 0);
    const avgPrice = paidPlans.length > 0
      ? paidPlans.reduce((sum, plan) => sum + (plan.price_monthly || 0), 0) / paidPlans.length
      : 0;

    return {
      totalPlans: plans.length,
      activePlans: activePlans.length,
      totalUsers,
      avgPrice,
    };
  };

  const stats = getPlanStats();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Planos</h1>
            <p className="text-muted-foreground">
              Configure planos, preços e funcionalidades para usuários
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={fetchPlans}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlans}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activePlans} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Em todos os planos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.avgPrice)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por plano pago
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(
                  plans.reduce((sum, plan) =>
                    sum + ((plan.price_monthly || 0) * (plan._count?.users || 0)), 0
                  )
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita estimada
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Planos Cadastrados</CardTitle>
            <CardDescription>
              Gerencie todos os planos disponíveis na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum plano encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro plano para começar
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Plano
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Preço Mensal</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Automações</TableHead>
                      <TableHead>Backtests</TableHead>
                      <TableHead>Notificações</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-sm text-muted-foreground">{plan.slug}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatPrice(plan.price_monthly)}
                          </div>
                          {plan.price_yearly && (
                            <div className="text-sm text-muted-foreground">
                              Anual: {formatPrice(plan.price_yearly)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {plan._count?.users || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatLimit(plan.max_automations)}</TableCell>
                        <TableCell>{formatLimit(plan.max_backtests)}</TableCell>
                        <TableCell>{formatLimit(plan.max_notifications)}</TableCell>
                        <TableCell>
                          <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                            {plan.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPlan(plan)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(plan)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(plan.id)}
                            >
                              {plan.is_active ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o plano "{plan.name}"?
                                    Esta ação não pode ser desfeita.
                                    {plan._count?.users > 0 && (
                                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                        <strong>Atenção:</strong> Este plano possui {plan._count.users} usuário(s).
                                        Você deve migrar os usuários para outro plano antes de excluir.
                                      </div>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(plan.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Plan Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
              </DialogTitle>
              <DialogDescription>
                Configure as funcionalidades e preços do plano
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Select
                    value={formData.slug}
                    onValueChange={(value) => setFormData({ ...formData, slug: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o slug" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva os benefícios do plano..."
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price_monthly">Preço Mensal (R$)</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.01"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="price_yearly">Preço Anual (R$)</Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    step="0.01"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="price_lifetime">Preço Vitalício (R$)</Label>
                  <Input
                    id="price_lifetime"
                    type="number"
                    step="0.01"
                    value={formData.price_lifetime}
                    onChange={(e) => setFormData({ ...formData, price_lifetime: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_automations">Máx. Automações</Label>
                  <Input
                    id="max_automations"
                    type="number"
                    value={formData.max_automations}
                    onChange={(e) => setFormData({ ...formData, max_automations: parseInt(e.target.value) || 0 })}
                    placeholder="-1 para ilimitado"
                  />
                </div>
                <div>
                  <Label htmlFor="max_backtests">Máx. Backtests/Mês</Label>
                  <Input
                    id="max_backtests"
                    type="number"
                    value={formData.max_backtests}
                    onChange={(e) => setFormData({ ...formData, max_backtests: parseInt(e.target.value) || 0 })}
                    placeholder="-1 para ilimitado"
                  />
                </div>
                <div>
                  <Label htmlFor="max_notifications">Máx. Notificações/Mês</Label>
                  <Input
                    id="max_notifications"
                    type="number"
                    value={formData.max_notifications}
                    onChange={(e) => setFormData({ ...formData, max_notifications: parseInt(e.target.value) || 0 })}
                    placeholder="-1 para ilimitado"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="has_priority"
                    checked={formData.has_priority}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_priority: checked })}
                  />
                  <Label htmlFor="has_priority">Suporte Prioritário</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="has_advanced"
                    checked={formData.has_advanced}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_advanced: checked })}
                  />
                  <Label htmlFor="has_advanced">Funcionalidades Avançadas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="has_api_access"
                    checked={formData.has_api_access}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_api_access: checked })}
                  />
                  <Label htmlFor="has_api_access">Acesso à API</Label>
                </div>
              </div>

              {/* Order */}
              <div>
                <Label htmlFor="order">Ordem de Exibição</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Stripe Price ID */}
              <div>
                <Label htmlFor="stripe_price_id">Stripe Price ID (Opcional)</Label>
                <Input
                  id="stripe_price_id"
                  value={formData.stripe_price_id}
                  onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                  placeholder="price_..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Plan Details Dialog */}
        {selectedPlan && (
          <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedPlan.name}</DialogTitle>
                <DialogDescription>
                  Detalhes completos do plano
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Slug</Label>
                    <p className="text-sm font-medium">{selectedPlan.slug}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={selectedPlan.is_active ? 'default' : 'secondary'}>
                      {selectedPlan.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <Label>Preços</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground">Mensal</div>
                      <div className="font-medium">{formatPrice(selectedPlan.price_monthly)}</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground">Anual</div>
                      <div className="font-medium">{formatPrice(selectedPlan.price_yearly)}</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground">Vitalício</div>
                      <div className="font-medium">{formatPrice(selectedPlan.price_lifetime)}</div>
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div>
                  <Label>Limites</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground">Automações</div>
                      <div className="font-medium">{formatLimit(selectedPlan.max_automations)}</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground">Backtests</div>
                      <div className="font-medium">{formatLimit(selectedPlan.max_backtests)}</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground">Notificações</div>
                      <div className="font-medium">{formatLimit(selectedPlan.max_notifications)}</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <Label>Recursos Incluídos</Label>
                  <div className="space-y-3 mt-2">
                    {selectedPlan.has_priority && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Suporte Prioritário</span>
                      </div>
                    )}
                    {selectedPlan.has_advanced && (
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Funcionalidades Avançadas</span>
                      </div>
                    )}
                    {selectedPlan.has_api_access && (
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Acesso à API</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <div>
                  <Label>Funcionalidades Detalhadas</Label>
                  <div className="space-y-2 mt-2">
                    <div>
                      <div className="text-sm font-medium text-green-600">✓ Automações</div>
                      <div className="text-sm text-muted-foreground ml-4">
                        {selectedPlan.features.automations.join(', ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-600">✓ Notificações</div>
                      <div className="text-sm text-muted-foreground ml-4">
                        {selectedPlan.features.notifications.join(', ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-purple-600">✓ Backtests</div>
                      <div className="text-sm text-muted-foreground ml-4">
                        {selectedPlan.features.backtests.join(', ')}
                      </div>
                    </div>
                    {selectedPlan.features.advanced.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-orange-600">✓ Avançado</div>
                        <div className="text-sm text-muted-foreground ml-4">
                          {selectedPlan.features.advanced.join(', ')}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-indigo-600">✓ Suporte</div>
                      <div className="text-sm text-muted-foreground ml-4">
                        {selectedPlan.features.support.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
