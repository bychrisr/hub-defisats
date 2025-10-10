import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DynamicPageConfig {
  id?: string;
  page_path: string;
  page_name: string;
  use_dynamic_title: boolean;
  use_dynamic_favicon: boolean;
  custom_title?: string;
  custom_favicon_url?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function DynamicPagesConfig() {
  const [configs, setConfigs] = useState<DynamicPageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<DynamicPageConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Configuração estática (temporária)
  const staticConfigs: DynamicPageConfig[] = [
    {
      id: '1',
      page_path: '/dashboard',
      page_name: 'Dashboard',
      use_dynamic_title: true,
      use_dynamic_favicon: true,
      description: 'Página principal do sistema - usa título e favicon dinâmicos',
      is_active: true,
    },
    {
      id: '2',
      page_path: '/automation',
      page_name: 'Automation',
      use_dynamic_title: true,
      use_dynamic_favicon: true,
      description: 'Página de automações - usa título e favicon dinâmicos',
      is_active: true,
    },
    {
      id: '3',
      page_path: '/positions',
      page_name: 'Positions',
      use_dynamic_title: true,
      use_dynamic_favicon: true,
      description: 'Página de posições - usa título e favicon dinâmicos',
      is_active: true,
    },
    {
      id: '4',
      page_path: '/backtests',
      page_name: 'Backtests',
      use_dynamic_title: true,
      use_dynamic_favicon: true,
      description: 'Página de backtests - usa título e favicon dinâmicos',
      is_active: true,
    },
    {
      id: '5',
      page_path: '/reports',
      page_name: 'Reports',
      use_dynamic_title: true,
      use_dynamic_favicon: true,
      description: 'Página de relatórios - usa título e favicon dinâmicos',
      is_active: true,
    },
    {
      id: '6',
      page_path: '/profile',
      page_name: 'Profile',
      use_dynamic_title: false,
      use_dynamic_favicon: false,
      custom_title: 'Profile - Axisor',
      custom_favicon_url: '/favicon.svg',
      description: 'Página de perfil - usa título e favicon estáticos',
      is_active: true,
    },
    {
      id: '7',
      page_path: '/admin',
      page_name: 'Admin Panel',
      use_dynamic_title: false,
      use_dynamic_favicon: false,
      custom_title: 'Admin Panel - Axisor',
      custom_favicon_url: '/favicon-admin.svg',
      description: 'Painel administrativo - usa título e favicon estáticos',
      is_active: true,
    },
    {
      id: '8',
      page_path: '/admin/menus',
      page_name: 'Menu Management',
      use_dynamic_title: false,
      use_dynamic_favicon: false,
      custom_title: 'Menu Management - Axisor',
      custom_favicon_url: '/favicon-admin.svg',
      description: 'Gerenciamento de menus - usa título e favicon estáticos',
      is_active: true,
    },
    {
      id: '9',
      page_path: '/login',
      page_name: 'Login',
      use_dynamic_title: false,
      use_dynamic_favicon: false,
      custom_title: 'Login - Axisor',
      custom_favicon_url: '/favicon.svg',
      description: 'Página de login - usa título e favicon estáticos',
      is_active: true,
    },
    {
      id: '10',
      page_path: '/register',
      page_name: 'Register',
      use_dynamic_title: false,
      use_dynamic_favicon: false,
      custom_title: 'Register - Axisor',
      custom_favicon_url: '/favicon.svg',
      description: 'Página de registro - usa título e favicon estáticos',
      is_active: true,
    },
  ];

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setConfigs(staticConfigs);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (config: DynamicPageConfig) => {
    setEditingConfig({ ...config });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingConfig) return;

    if (editingConfig.id) {
      // Atualizar existente
      setConfigs(prev => 
        prev.map(config => 
          config.id === editingConfig.id ? editingConfig : config
        )
      );
    } else {
      // Criar novo
      const newConfig = {
        ...editingConfig,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConfigs(prev => [...prev, newConfig]);
    }

    setIsDialogOpen(false);
    setEditingConfig(null);
    toast({
      title: 'Sucesso',
      description: 'Configuração salva com sucesso',
    });
  };

  const handleDelete = (id: string) => {
    setConfigs(prev => prev.filter(config => config.id !== id));
    toast({
      title: 'Sucesso',
      description: 'Configuração excluída com sucesso',
    });
  };

  const handleCreateNew = () => {
    setEditingConfig({
      page_path: '',
      page_name: '',
      use_dynamic_title: true,
      use_dynamic_favicon: true,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Páginas Dinâmicas</h1>
          <p className="text-muted-foreground">
            Gerencie quais páginas devem usar título e favicon dinâmicos
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Páginas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Página</TableHead>
                <TableHead>Caminho</TableHead>
                <TableHead>Título Dinâmico</TableHead>
                <TableHead>Favicon Dinâmico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">
                    {config.page_name}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {config.page_path}
                    </code>
                  </TableCell>
                  <TableCell>
                    {config.use_dynamic_title ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Eye className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Estático
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {config.use_dynamic_favicon ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Eye className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Estático
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.is_active ? 'default' : 'secondary'}>
                      {config.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(config.id!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingConfig?.id ? 'Editar Configuração' : 'Nova Configuração'}
            </DialogTitle>
            <DialogDescription>
              Configure o comportamento de título e favicon para esta página
            </DialogDescription>
          </DialogHeader>
          
          {editingConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="page_path">Caminho da Página</Label>
                  <Input
                    id="page_path"
                    value={editingConfig.page_path}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      page_path: e.target.value
                    })}
                    placeholder="/dashboard"
                  />
                </div>
                <div>
                  <Label htmlFor="page_name">Nome da Página</Label>
                  <Input
                    id="page_name"
                    value={editingConfig.page_name}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      page_name: e.target.value
                    })}
                    placeholder="Dashboard"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="use_dynamic_title">Usar Título Dinâmico</Label>
                    <p className="text-sm text-muted-foreground">
                      Se ativado, o título será baseado nas posições do usuário
                    </p>
                  </div>
                  <Switch
                    id="use_dynamic_title"
                    checked={editingConfig.use_dynamic_title}
                    onCheckedChange={(checked) => setEditingConfig({
                      ...editingConfig,
                      use_dynamic_title: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="use_dynamic_favicon">Usar Favicon Dinâmico</Label>
                    <p className="text-sm text-muted-foreground">
                      Se ativado, o favicon será baseado nas posições do usuário
                    </p>
                  </div>
                  <Switch
                    id="use_dynamic_favicon"
                    checked={editingConfig.use_dynamic_favicon}
                    onCheckedChange={(checked) => setEditingConfig({
                      ...editingConfig,
                      use_dynamic_favicon: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active">Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Se ativado, esta configuração será aplicada
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={editingConfig.is_active}
                    onCheckedChange={(checked) => setEditingConfig({
                      ...editingConfig,
                      is_active: checked
                    })}
                  />
                </div>
              </div>

              {!editingConfig.use_dynamic_title && (
                <div>
                  <Label htmlFor="custom_title">Título Customizado</Label>
                  <Input
                    id="custom_title"
                    value={editingConfig.custom_title || ''}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      custom_title: e.target.value
                    })}
                    placeholder="Título da Página - Axisor"
                  />
                </div>
              )}

              {!editingConfig.use_dynamic_favicon && (
                <div>
                  <Label htmlFor="custom_favicon_url">URL do Favicon Customizado</Label>
                  <Input
                    id="custom_favicon_url"
                    value={editingConfig.custom_favicon_url || ''}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      custom_favicon_url: e.target.value
                    })}
                    placeholder="/favicon-admin.svg"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={editingConfig.description || ''}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    description: e.target.value
                  })}
                  placeholder="Descrição da configuração..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
