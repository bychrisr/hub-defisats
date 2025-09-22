import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface RouteRedirect {
  id: string;
  from_path: string;
  to_path: string;
  redirect_type: 'temporary' | 'permanent';
  is_active: boolean;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

interface RouteRedirectsResponse {
  redirects: RouteRedirect[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  metrics: {
    total: number;
    active: number;
    inactive: number;
    temporary: number;
    permanent: number;
    expired: number;
  };
}

const RouteRedirects: React.FC = () => {
  const [redirects, setRedirects] = useState<RouteRedirect[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<RouteRedirect | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    from_path: '',
    to_path: '',
    redirect_type: 'temporary' as 'temporary' | 'permanent',
    description: '',
    expires_at: ''
  });

  const fetchRedirects = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterActive !== 'all' && { is_active: filterActive }),
        ...(filterType !== 'all' && { redirect_type: filterType })
      });

      const response = await fetch(`/api/admin/route-redirects?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: RouteRedirectsResponse = await response.json();
      setRedirects(data.redirects);
      setMetrics(data.metrics);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching redirects:', error);
      toast.error('Erro ao carregar redirecionamentos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, [currentPage, searchTerm, filterActive, filterType]);

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/admin/route-redirects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          ...formData,
          expires_at: formData.expires_at || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar redirecionamento');
      }

      toast.success('Redirecionamento criado com sucesso!');
      setIsCreateDialogOpen(false);
      setFormData({
        from_path: '',
        to_path: '',
        redirect_type: 'temporary',
        description: '',
        expires_at: ''
      });
      fetchRedirects();
    } catch (error) {
      console.error('Error creating redirect:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar redirecionamento');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingRedirect) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/admin/route-redirects/${editingRedirect.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          ...formData,
          expires_at: formData.expires_at || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar redirecionamento');
      }

      toast.success('Redirecionamento atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setEditingRedirect(null);
      fetchRedirects();
    } catch (error) {
      console.error('Error updating redirect:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar redirecionamento');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este redirecionamento?')) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/route-redirects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir redirecionamento');
      }

      toast.success('Redirecionamento excluído com sucesso!');
      fetchRedirects();
    } catch (error) {
      console.error('Error deleting redirect:', error);
      toast.error('Erro ao excluir redirecionamento');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/route-redirects/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status do redirecionamento');
      }

      toast.success('Status alterado com sucesso!');
      fetchRedirects();
    } catch (error) {
      console.error('Error toggling redirect:', error);
      toast.error('Erro ao alterar status do redirecionamento');
    }
  };

  const openEditDialog = (redirect: RouteRedirect) => {
    setEditingRedirect(redirect);
    setFormData({
      from_path: redirect.from_path,
      to_path: redirect.to_path,
      redirect_type: redirect.redirect_type,
      description: redirect.description || '',
      expires_at: redirect.expires_at ? new Date(redirect.expires_at).toISOString().slice(0, 16) : ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      from_path: '',
      to_path: '',
      redirect_type: 'temporary',
      description: '',
      expires_at: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Redirecionamentos de Rotas</h1>
          <p className="text-muted-foreground">
            Gerencie redirecionamentos temporários e permanentes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Redirecionamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Redirecionamento</DialogTitle>
              <DialogDescription>
                Configure um novo redirecionamento de rota
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="from_path">Caminho de Origem</Label>
                <Input
                  id="from_path"
                  value={formData.from_path}
                  onChange={(e) => setFormData({ ...formData, from_path: e.target.value })}
                  placeholder="/old-path"
                />
              </div>
              <div>
                <Label htmlFor="to_path">Caminho de Destino</Label>
                <Input
                  id="to_path"
                  value={formData.to_path}
                  onChange={(e) => setFormData({ ...formData, to_path: e.target.value })}
                  placeholder="/new-path"
                />
              </div>
              <div>
                <Label htmlFor="redirect_type">Tipo de Redirecionamento</Label>
                <Select
                  value={formData.redirect_type}
                  onValueChange={(value: 'temporary' | 'permanent') => 
                    setFormData({ ...formData, redirect_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temporary">Temporário (302)</SelectItem>
                    <SelectItem value="permanent">Permanente (301)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do redirecionamento"
                />
              </div>
              <div>
                <Label htmlFor="expires_at">Expira em (Opcional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temporários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.temporary}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permanentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{metrics.permanent}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por caminho ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filterActive">Status</Label>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Ativos</SelectItem>
                  <SelectItem value="false">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterType">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="temporary">Temporário</SelectItem>
                  <SelectItem value="permanent">Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Redirecionamentos</CardTitle>
          <CardDescription>
            Lista de todos os redirecionamentos configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caminho de Origem</TableHead>
                    <TableHead>Caminho de Destino</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redirects.map((redirect) => (
                    <TableRow key={redirect.id}>
                      <TableCell className="font-mono">{redirect.from_path}</TableCell>
                      <TableCell className="font-mono">{redirect.to_path}</TableCell>
                      <TableCell>
                        <Badge variant={redirect.redirect_type === 'permanent' ? 'default' : 'secondary'}>
                          {redirect.redirect_type === 'permanent' ? 'Permanente' : 'Temporário'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={redirect.is_active}
                            onCheckedChange={() => handleToggle(redirect.id)}
                          />
                          <span className={redirect.is_active ? 'text-green-600' : 'text-gray-500'}>
                            {redirect.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {redirect.description || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(redirect.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(redirect)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(redirect.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {redirects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum redirecionamento encontrado
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Redirecionamento</DialogTitle>
            <DialogDescription>
              Atualize as configurações do redirecionamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_from_path">Caminho de Origem</Label>
              <Input
                id="edit_from_path"
                value={formData.from_path}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O caminho de origem não pode ser alterado
              </p>
            </div>
            <div>
              <Label htmlFor="edit_to_path">Caminho de Destino</Label>
              <Input
                id="edit_to_path"
                value={formData.to_path}
                onChange={(e) => setFormData({ ...formData, to_path: e.target.value })}
                placeholder="/new-path"
              />
            </div>
            <div>
              <Label htmlFor="edit_redirect_type">Tipo de Redirecionamento</Label>
              <Select
                value={formData.redirect_type}
                onValueChange={(value: 'temporary' | 'permanent') => 
                  setFormData({ ...formData, redirect_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporário (302)</SelectItem>
                  <SelectItem value="permanent">Permanente (301)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_description">Descrição</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do redirecionamento"
              />
            </div>
            <div>
              <Label htmlFor="edit_expires_at">Expira em</Label>
              <Input
                id="edit_expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RouteRedirects;
