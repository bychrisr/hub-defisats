import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Plus, 
  Gift, 
  Calendar, 
  Users, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  Eye, 
  BarChart3,
  Loader2,
  DollarSign,
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Settings,
  Crown,
  Zap,
  Star,
  Gem
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAdminCoupons, type Coupon, type CreateCouponData, type CouponFilters } from '@/hooks/useAdminCoupons';

export default function Coupons() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [filters, setFilters] = useState<CouponFilters>({
    search: '',
    status: 'all',
    plan_type: 'all'
  });

  const [formData, setFormData] = useState<CreateCouponData>({
    code: '',
    plan_type: 'basic',
    value_type: 'percentage',
    value_amount: 0,
    time_type: 'fixed',
    time_days: 30,
    usage_limit: 100,
    description: '',
    is_active: true
  });

  const { 
    coupons, 
    loading, 
    error, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon, 
    refresh 
  } = useAdminCoupons(filters);

  const resetForm = () => {
    setFormData({
      code: '',
      plan_type: 'basic',
      value_type: 'percentage',
      value_amount: 0,
      time_type: 'fixed',
      time_days: 30,
      usage_limit: 100,
      description: '',
      is_active: true
    });
  };

  const handleCreateCoupon = async () => {
    try {
      await createCoupon(formData);
      toast.success('Coupon created successfully!');
      setCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast.error(error.response?.data?.message || 'Error creating coupon');
    }
  };

  const handleEditCoupon = async () => {
    if (!selectedCoupon) return;
    
    try {
      await updateCoupon(selectedCoupon.id, formData);
      toast.success('Coupon updated successfully!');
      setEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      toast.error(error.response?.data?.message || 'Error updating coupon');
    }
  };

  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return;
    
    try {
      await deleteCoupon(selectedCoupon.id);
      toast.success('Coupon deleted successfully!');
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast.error(error.response?.data?.message || 'Error deleting coupon');
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      plan_type: coupon.plan_type,
      value_type: coupon.value_type,
      value_amount: coupon.value_amount,
      time_type: coupon.time_type,
      time_days: coupon.time_days || 30,
      usage_limit: coupon.usage_limit || 100,
      description: coupon.description || '',
      is_active: coupon.is_active
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await updateCoupon(coupon.id, { is_active: !coupon.is_active });
      toast.success(`Coupon ${coupon.is_active ? 'deactivated' : 'activated'} successfully!`);
    } catch (error: any) {
      console.error('Error toggling coupon status:', error);
      toast.error(error.response?.data?.message || 'Error updating coupon status');
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic':
        return <Zap className="h-4 w-4" />;
      case 'advanced':
        return <Star className="h-4 w-4" />;
      case 'pro':
        return <Crown className="h-4 w-4" />;
      case 'lifetime':
        return <Gem className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'basic':
        return 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25';
      case 'advanced':
        return 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25';
      case 'pro':
        return 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25';
      case 'lifetime':
        return 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25';
    }
  };

  const getCouponStats = () => {
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(coupon => coupon.is_active).length;
    const totalUsage = coupons.reduce((sum, coupon) => sum + coupon.used_count, 0);
    const totalRevenueSaved = coupons.reduce((sum, coupon) => sum + coupon.total_revenue_saved, 0);

    return { totalCoupons, activeCoupons, totalUsage, totalRevenueSaved };
  };

  const stats = getCouponStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <h3 className="text-xl font-semibold text-text-primary">Carregando Cupons</h3>
                  <p className="text-text-secondary">Aguarde enquanto carregamos os cupons...</p>
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
                        <Gift className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Gerenciamento de Cupons
                        </h1>
                        <p className="text-text-secondary">Crie e gerencie cupons de desconto para usuários</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={refresh}
                      disabled={loading}
                      className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      onClick={() => setCreateDialogOpen(true)}
                      className="backdrop-blur-sm bg-green-600/90 hover:bg-green-600 text-white shadow-lg shadow-green-600/25"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Cupom
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
                    <p className="text-sm font-medium text-text-secondary">Total Cupons</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalCoupons}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 backdrop-blur-sm">
                    <Gift className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card-green profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Cupons Ativos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.activeCoupons}</p>
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
                    <p className="text-sm font-medium text-text-secondary">Total de Usos</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalUsage}</p>
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
                    <p className="text-sm font-medium text-text-secondary">Receita Economizada</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalRevenueSaved.toLocaleString()} sats</p>
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
                    placeholder="Buscar cupons..."
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
                <Select value={filters.plan_type} onValueChange={(value) => setFilters({ ...filters, plan_type: value })}>
                  <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                    <SelectValue placeholder="Tipo de Plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Coupons Table */}
          <Card className="profile-sidebar-glow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Lista de Cupons</h3>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background/20">
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Código
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Plano
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Desconto
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Uso
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Expiração
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
                    {coupons.map((coupon, index) => (
                      <TableRow
                        key={coupon.id}
                        className={cn(
                          "hover:bg-background/50 transition-colors",
                          index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                        )}
                      >
                        <TableCell>
                          <div className="font-medium text-text-primary font-mono">
                            {coupon.code}
                          </div>
                          {coupon.description && (
                            <div className="text-sm text-text-secondary">
                              {coupon.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPlanColor(coupon.plan_type)}>
                            <div className="flex items-center gap-1">
                              {getPlanIcon(coupon.plan_type)}
                              {coupon.plan_type.toUpperCase()}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {coupon.value_type === 'percentage' ? (
                              <Percent className="h-4 w-4 text-blue-500" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium text-text-primary">
                              {coupon.value_type === 'percentage' 
                                ? `${coupon.value_amount}%` 
                                : `${coupon.value_amount.toLocaleString()} sats`
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-text-primary">
                            {coupon.used_count} / {coupon.usage_limit}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {((coupon.used_count / coupon.usage_limit) * 100).toFixed(1)}% usado
                          </div>
                        </TableCell>
                        <TableCell>
                          {coupon.expires_at ? (
                            <div className="text-sm text-text-primary">
                              {new Date(coupon.expires_at).toLocaleDateString()}
                            </div>
                          ) : (
                            <Badge className="bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25">
                              <Clock className="h-3 w-3 mr-1" />
                              Sem expiração
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "font-semibold px-3 py-1 rounded-full border-0",
                              coupon.is_active
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                                : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
                            )}
                          >
                            {coupon.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(coupon)}
                              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              {coupon.is_active ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCoupon(coupon);
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
                                setSelectedCoupon(coupon);
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

      {/* Create Coupon Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
          <DialogHeader>
            <DialogTitle className="text-vibrant">Criar Novo Cupom</DialogTitle>
            <DialogDescription className="text-vibrant-secondary">
              Preencha os detalhes para criar um novo cupom de desconto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código do Cupom</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="WELCOME20"
                  className="backdrop-blur-sm bg-background/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan_type">Tipo de Plano</Label>
                <Select value={formData.plan_type} onValueChange={(value: any) => setFormData({ ...formData, plan_type: value })}>
                  <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value_type">Tipo de Valor</Label>
                <Select value={formData.value_type} onValueChange={(value: any) => setFormData({ ...formData, value_type: value })}>
                  <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (sats)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value_amount">Valor do Desconto</Label>
                <Input
                  id="value_amount"
                  type="number"
                  value={formData.value_amount}
                  onChange={(e) => setFormData({ ...formData, value_amount: parseInt(e.target.value) })}
                  placeholder={formData.value_type === 'percentage' ? '20' : '10000'}
                  className="backdrop-blur-sm bg-background/50 border-border/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time_type">Tipo de Tempo</Label>
                <Select value={formData.time_type} onValueChange={(value: any) => setFormData({ ...formData, time_type: value })}>
                  <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Tempo Fixo</SelectItem>
                    <SelectItem value="lifetime">Vitalício</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.time_type === 'fixed' && (
                <div className="space-y-2">
                  <Label htmlFor="time_days">Dias de Validade</Label>
                  <Input
                    id="time_days"
                    type="number"
                    value={formData.time_days}
                    onChange={(e) => setFormData({ ...formData, time_days: parseInt(e.target.value) })}
                    placeholder="30"
                    className="backdrop-blur-sm bg-background/50 border-border/50"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Limite de Uso</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                  placeholder="100"
                  className="backdrop-blur-sm bg-background/50 border-border/50"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-500"
                />
                <Label htmlFor="is_active">Cupom Ativo</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o propósito deste cupom..."
                className="backdrop-blur-sm bg-background/50 border-border/50"
              />
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
              onClick={handleCreateCoupon}
              className="backdrop-blur-sm bg-green-600/90 hover:bg-green-600 text-white shadow-lg shadow-green-600/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Cupom
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
              Tem certeza que deseja excluir o cupom "{selectedCoupon?.code}"? Esta ação não pode ser desfeita.
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
              onClick={handleDeleteCoupon}
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