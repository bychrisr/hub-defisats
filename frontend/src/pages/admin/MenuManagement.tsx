import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  'Coins', 'TrendingUp', 'Image', 'Info', 'Package', 'Code',
  'Candy', 'Star', 'User', 'Menu', 'Search', 'Bell'
];

const BADGE_COLORS = [
  'blue', 'green', 'yellow', 'red', 'purple', 'pink', 'indigo', 'gray'
];

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuTypes, setMenuTypes] = useState<MenuType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
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
    menuTypeId: ''
  });

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      
      // Obter token de autenticação
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [itemsResponse, typesResponse] = await Promise.all([
        fetch('http://localhost:13010/api/admin/menu/items', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('http://localhost:13010/api/admin/menu/types', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (itemsResponse.ok && typesResponse.ok) {
        const itemsData = await itemsResponse.json();
        const typesData = await typesResponse.json();
        
        setMenuItems(itemsData.data);
        setMenuTypes(typesData.data);
      } else {
        throw new Error('Failed to fetch menu data');
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados do menu',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingItem(null);
    setFormData({
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
      menuTypeId: menuTypes[0]?.id || ''
    });
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsCreating(false);
    setFormData({
      name: item.name,
      mobileName: item.mobileName || '',
      href: item.href,
      icon: item.icon,
      order: item.order,
      isActive: item.isActive,
      isVisible: item.isVisible,
      target: item.target,
      badge: item.badge || '',
      badgeColor: item.badgeColor || 'blue',
      description: item.description || '',
      menuTypeId: item.menuTypeId
    });
  };

  const handleSave = async () => {
    try {
      const url = isCreating 
        ? '/api/admin/menu/item'
        : `/api/admin/menu/item/${editingItem?.id}`;
      
      const method = isCreating ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: isCreating ? 'Item criado com sucesso' : 'Item atualizado com sucesso'
        });
        await fetchMenuData();
        setEditingItem(null);
        setIsCreating(false);
      } else {
        throw new Error('Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar item',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return;

    try {
      const response = await fetch(`/api/admin/menu/item/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Item deletado com sucesso'
        });
        await fetchMenuData();
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao deletar item',
        variant: 'destructive'
      });
    }
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      const response = await fetch(`/api/admin/menu/item/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ isVisible })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: `Item ${isVisible ? 'ativado' : 'desativado'} com sucesso`
        });
        await fetchMenuData();
      } else {
        throw new Error('Failed to toggle visibility');
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao alterar visibilidade',
        variant: 'destructive'
      });
    }
  };

  const groupedItems = menuTypes.reduce((acc, type) => {
    acc[type.name] = {
      type,
      items: menuItems.filter(item => item.menuTypeId === type.id).sort((a, b) => a.order - b.order)
    };
    return acc;
  }, {} as Record<string, { type: MenuType; items: MenuItem[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciamento de Menus</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      <Tabs defaultValue="main" className="space-y-4">
        <TabsList>
          {menuTypes.map(type => (
            <TabsTrigger key={type.name} value={type.name}>
              {type.displayName}
            </TabsTrigger>
          ))}
        </TabsList>

        {menuTypes.map(type => (
          <TabsContent key={type.name} value={type.name} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{type.displayName}</CardTitle>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {groupedItems[type.name]?.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-muted-foreground">
                          #{item.order}
                        </div>
                        <div className="text-lg">{item.icon}</div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.href}
                          </div>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className={item.badgeColor}>
                            {item.badge}
                          </Badge>
                        )}
                        <div className="flex space-x-1">
                          <Badge variant={item.isActive ? 'default' : 'secondary'}>
                            {item.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant={item.isVisible ? 'default' : 'secondary'}>
                            {item.isVisible ? 'Visível' : 'Oculto'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(item.id, !item.isVisible)}
                        >
                          {item.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal de Edição/Criação */}
      {(editingItem || isCreating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Criar Item' : 'Editar Item'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="mobileName">Nome Mobile (opcional)</Label>
                  <Input
                    id="mobileName"
                    value={formData.mobileName}
                    onChange={(e) => setFormData({ ...formData, mobileName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="href">URL/Rota</Label>
                  <Input
                    id="href"
                    value={formData.href}
                    onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Ícone</Label>
                  <select
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {ICON_OPTIONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="order">Ordem</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="target">Target</Label>
                  <select
                    id="target"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="_self">_self</option>
                    <option value="_blank">_blank</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="menuTypeId">Tipo de Menu</Label>
                  <select
                    id="menuTypeId"
                    value={formData.menuTypeId}
                    onChange={(e) => setFormData({ ...formData, menuTypeId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {menuTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="badge">Badge (opcional)</Label>
                  <Input
                    id="badge"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="badgeColor">Cor do Badge</Label>
                  <select
                    id="badgeColor"
                    value={formData.badgeColor}
                    onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {BADGE_COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex space-x-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <Label htmlFor="isActive">Ativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isVisible"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  />
                  <Label htmlFor="isVisible">Visível</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreating(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
