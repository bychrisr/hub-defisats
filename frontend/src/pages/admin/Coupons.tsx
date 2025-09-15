import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, Plus, Gift, Calendar, Users, Edit, Trash2, Power, PowerOff, Eye, BarChart3 } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  plan_type: 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime';
  usage_limit: number;
  used_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Novos campos para o sistema de cupons
  value_type: 'fixed' | 'percentage';
  value_amount: number;
  time_type: 'fixed' | 'lifetime';
  time_days?: number;

  // Campos para administração
  is_active: boolean;
  description?: string;
  created_by?: string;
  
  // Métricas
  total_revenue_saved: number;
  new_users_count: number;
  conversion_rate: number;

  usage_history: Array<{
    used_at: string;
    user_email: string;
  }>;
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    plan_type: 'basic' as 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime',
    usage_limit: 1,
    expires_at: '',
    value_type: 'fixed' as 'fixed' | 'percentage',
    value_amount: 1000,
    time_type: 'fixed' as 'fixed' | 'lifetime',
    time_days: 30,
    description: '',
    is_active: true
  });

  const fetchCoupons = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/coupons', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch coupons');
      }

      const data = await response.json();
      setCoupons(data.coupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async () => {
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newCoupon,
          expires_at: newCoupon.expires_at ? new Date(newCoupon.expires_at).toISOString() : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create coupon');
      }

      setCreateDialogOpen(false);
      setNewCoupon({
        code: '',
        plan_type: 'basic',
        usage_limit: 1,
        expires_at: '',
        value_type: 'fixed',
        value_amount: 1000,
        time_type: 'fixed',
        time_days: 30,
        description: '',
        is_active: true
      });
      fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setEditDialogOpen(true);
  };

  const handleUpdateCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      const response = await fetch(`/api/admin/coupons/${selectedCoupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...selectedCoupon,
          expires_at: selectedCoupon.expires_at ? new Date(selectedCoupon.expires_at).toISOString() : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update coupon');
      }

      setEditDialogOpen(false);
      setSelectedCoupon(null);
      fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon:', error);
    }
  };

  const handleDeleteCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      const response = await fetch(`/api/admin/coupons/${selectedCoupon.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete coupon');
      }

      setDeleteDialogOpen(false);
      setSelectedCoupon(null);
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          is_active: !coupon.is_active
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle coupon status');
      }

      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'default';
      case 'advanced':
        return 'secondary';
      case 'basic':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <p className="text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={fetchCoupons} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
                <DialogDescription>
                  Create a new discount coupon for users
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    placeholder="e.g., WELCOME2024"
                  />
                </div>
                <div>
                  <Label htmlFor="plan_type">Plan Type</Label>
                  <Select value={newCoupon.plan_type} onValueChange={(value: any) => setNewCoupon({ ...newCoupon, plan_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
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
                <div>
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="1"
                    max="1000"
                    value={newCoupon.usage_limit}
                    onChange={(e) => setNewCoupon({ ...newCoupon, usage_limit: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at">Expires At (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={newCoupon.expires_at}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                  />
                </div>
                
                {/* Novos campos para o sistema de cupons */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="value_type">Tipo de Valor</Label>
                    <Select value={newCoupon.value_type} onValueChange={(value: any) => setNewCoupon({ ...newCoupon, value_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Valor Fixo (sats)</SelectItem>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value_amount">
                      {newCoupon.value_type === 'fixed' ? 'Valor (sats)' : 'Percentual (%)'}
                    </Label>
                    <Input
                      id="value_amount"
                      type="number"
                      min="1"
                      max={newCoupon.value_type === 'percentage' ? '100' : '1000000'}
                      value={newCoupon.value_amount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, value_amount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time_type">Tipo de Tempo</Label>
                    <Select value={newCoupon.time_type} onValueChange={(value: any) => setNewCoupon({ ...newCoupon, time_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Tempo Fixo (dias)</SelectItem>
                        <SelectItem value="lifetime">Vitalício</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newCoupon.time_type === 'fixed' && (
                    <div>
                      <Label htmlFor="time_days">Duração (dias)</Label>
                      <Input
                        id="time_days"
                        type="number"
                        min="1"
                        max="3650"
                        value={newCoupon.time_days}
                        onChange={(e) => setNewCoupon({ ...newCoupon, time_days: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCoupon} disabled={!newCoupon.code}>
                  Create Coupon
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="h-5 w-5" />
                <span>Coupons ({coupons.length})</span>
              </CardTitle>
              <CardDescription>
                Manage discount coupons and track usage
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => window.open('/admin/coupons/dashboard', '_blank')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Métricas</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="font-mono font-medium">{coupon.code}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(coupon.plan_type)}>
                      {coupon.plan_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {coupon.value_type === 'fixed' ? (
                        <span className="font-mono">{coupon.value_amount.toLocaleString()} sats</span>
                      ) : (
                        <span className="font-mono">{coupon.value_amount}%</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {coupon.time_type === 'lifetime' ? (
                        <Badge variant="outline">Vitalício</Badge>
                      ) : (
                        <span>{coupon.time_days} dias</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{coupon.used_count}/{coupon.usage_limit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {coupon.is_active ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Power className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          <PowerOff className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                      {isExpired(coupon.expires_at) && (
                        <Badge variant="destructive">Expirado</Badge>
                      )}
                      {coupon.used_count >= coupon.usage_limit && (
                        <Badge variant="secondary">Esgotado</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">{coupon.total_revenue_saved.toLocaleString()} sats</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{coupon.new_users_count} novos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span>{coupon.conversion_rate.toFixed(1)}% conversão</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.expires_at ? (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={isExpired(coupon.expires_at) ? 'text-red-500' : ''}>
                          {formatDate(coupon.expires_at)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(coupon.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCoupon(coupon)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(coupon)}
                        className={coupon.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {coupon.is_active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCoupon(coupon)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>

          {coupons.length === 0 && (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No coupons found</h3>
              <p className="text-muted-foreground">Create your first coupon to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Coupon Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cupom</DialogTitle>
            <DialogDescription>
              Edite as informações do cupom
            </DialogDescription>
          </DialogHeader>
          {selectedCoupon && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-code">Código do Cupom</Label>
                  <Input
                    id="edit-code"
                    value={selectedCoupon.code}
                    onChange={(e) => setSelectedCoupon({ ...selectedCoupon, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-plan">Tipo de Plano</Label>
                  <Select 
                    value={selectedCoupon.plan_type} 
                    onValueChange={(value: any) => setSelectedCoupon({ ...selectedCoupon, plan_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-value-type">Tipo de Valor</Label>
                  <Select 
                    value={selectedCoupon.value_type} 
                    onValueChange={(value: any) => setSelectedCoupon({ ...selectedCoupon, value_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Valor Fixo (sats)</SelectItem>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-value-amount">
                    {selectedCoupon.value_type === 'fixed' ? 'Valor (sats)' : 'Percentual (%)'}
                  </Label>
                  <Input
                    id="edit-value-amount"
                    type="number"
                    value={selectedCoupon.value_amount}
                    onChange={(e) => setSelectedCoupon({ ...selectedCoupon, value_amount: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-time-type">Tipo de Tempo</Label>
                  <Select 
                    value={selectedCoupon.time_type} 
                    onValueChange={(value: any) => setSelectedCoupon({ ...selectedCoupon, time_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Tempo Fixo (dias)</SelectItem>
                      <SelectItem value="lifetime">Vitalício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedCoupon.time_type === 'fixed' && (
                  <div>
                    <Label htmlFor="edit-time-days">Duração (dias)</Label>
                    <Input
                      id="edit-time-days"
                      type="number"
                      value={selectedCoupon.time_days || 0}
                      onChange={(e) => setSelectedCoupon({ ...selectedCoupon, time_days: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="edit-description">Descrição (Opcional)</Label>
                <Input
                  id="edit-description"
                  value={selectedCoupon.description || ''}
                  onChange={(e) => setSelectedCoupon({ ...selectedCoupon, description: e.target.value })}
                  placeholder="Descrição do cupom"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCoupon}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Coupon Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cupom</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cupom <strong>{selectedCoupon?.code}</strong>? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCoupon}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
