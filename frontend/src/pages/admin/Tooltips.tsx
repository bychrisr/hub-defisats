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
  GripVertical
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

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

interface CardWithTooltip extends DashboardCard {
  tooltip?: TooltipConfig | null;
}

export default function TooltipsAdmin() {
  const { user } = useAuthStore();
  const [cards, setCards] = useState<CardWithTooltip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<DashboardCard | null>(null);
  const [editingTooltip, setEditingTooltip] = useState<TooltipConfig | null>(null);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [showCreateTooltip, setShowCreateTooltip] = useState(false);
  const [selectedCardKey, setSelectedCardKey] = useState<string>('');

  // Form states
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
    fetchCardsWithTooltips();
  }, []);

  const fetchCardsWithTooltips = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/cards-with-tooltips');
      if (response.data.success) {
        setCards(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cards with tooltips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async () => {
    try {
      const response = await api.post('/api/dashboard-cards', cardForm);
      if (response.data.success) {
        await fetchCardsWithTooltips();
        setShowCreateCard(false);
        resetCardForm();
      }
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleUpdateCard = async (cardKey: string) => {
    try {
      const response = await api.put(`/api/dashboard-cards/${cardKey}`, cardForm);
      if (response.data.success) {
        await fetchCardsWithTooltips();
        setEditingCard(null);
        resetCardForm();
      }
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  const handleDeleteCard = async (cardKey: string) => {
    if (window.confirm('Tem certeza que deseja deletar este card?')) {
      try {
        await api.delete(`/api/dashboard-cards/${cardKey}`);
        await fetchCardsWithTooltips();
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const handleCreateTooltip = async () => {
    try {
      const response = await api.post('/api/tooltips', tooltipForm);
      if (response.data.success) {
        await fetchCardsWithTooltips();
        setShowCreateTooltip(false);
        resetTooltipForm();
      }
    } catch (error) {
      console.error('Error creating tooltip:', error);
    }
  };

  const handleUpdateTooltip = async (cardKey: string) => {
    try {
      const response = await api.put(`/api/tooltips/${cardKey}`, tooltipForm);
      if (response.data.success) {
        await fetchCardsWithTooltips();
        setEditingTooltip(null);
        resetTooltipForm();
      }
    } catch (error) {
      console.error('Error updating tooltip:', error);
    }
  };

  const handleDeleteTooltip = async (cardKey: string) => {
    if (window.confirm('Tem certeza que deseja deletar este tooltip?')) {
      try {
        await api.delete(`/api/tooltips/${cardKey}`);
        await fetchCardsWithTooltips();
      } catch (error) {
        console.error('Error deleting tooltip:', error);
      }
    }
  };

  const handleReorderCards = async (newOrder: string[]) => {
    try {
      await api.put('/api/dashboard-cards/reorder', { cardKeys: newOrder });
      await fetchCardsWithTooltips();
    } catch (error) {
      console.error('Error reordering cards:', error);
    }
  };

  const resetCardForm = () => {
    setCardForm({
      key: '',
      title: '',
      description: '',
      icon: '',
      category: '',
      order_index: 0,
      is_active: true,
      is_admin_only: false
    });
  };

  const resetTooltipForm = () => {
    setTooltipForm({
      card_key: '',
      tooltip_text: '',
      tooltip_position: 'top',
      is_enabled: true
    });
  };

  const startEditCard = (card: DashboardCard) => {
    setEditingCard(card);
    setCardForm({
      key: card.key,
      title: card.title,
      description: card.description || '',
      icon: card.icon || '',
      category: card.category || '',
      order_index: card.order_index,
      is_active: card.is_active,
      is_admin_only: card.is_admin_only
    });
  };

  const startEditTooltip = (tooltip: TooltipConfig) => {
    setEditingTooltip(tooltip);
    setTooltipForm({
      card_key: tooltip.card_key,
      tooltip_text: tooltip.tooltip_text,
      tooltip_position: tooltip.tooltip_position,
      is_enabled: tooltip.is_enabled
    });
  };

  const startCreateTooltip = (cardKey: string) => {
    setSelectedCardKey(cardKey);
    setTooltipForm({
      card_key: cardKey,
      tooltip_text: '',
      tooltip_position: 'top',
      is_enabled: true
    });
    setShowCreateTooltip(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant mx-auto mb-4"></div>
          <p className="text-vibrant-secondary">Carregando tooltips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-vibrant">Gerenciar Tooltips</h1>
            <p className="text-vibrant-secondary mt-2">
              Configure tooltips e cards do dashboard
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateCard(true)}
              className="btn-modern-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Card
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards">Cards do Dashboard</TabsTrigger>
            <TabsTrigger value="tooltips">Configurações de Tooltips</TabsTrigger>
          </TabsList>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid gap-4">
              {cards.map((card) => (
                <Card key={card.id} className="card-modern">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-vibrant-secondary cursor-move" />
                      <div>
                        <CardTitle className="text-lg font-semibold text-vibrant">
                          {card.title}
                        </CardTitle>
                        <p className="text-sm text-vibrant-secondary">
                          Chave: {card.key} | Categoria: {card.category || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={card.is_active ? 'default' : 'secondary'}>
                        {card.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {card.is_admin_only && (
                        <Badge variant="outline">Admin Only</Badge>
                      )}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditCard(card)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCard(card.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-vibrant-secondary mb-4">
                      {card.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-vibrant-secondary">Tooltip:</span>
                        {card.tooltip ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Eye className="h-3 w-3 mr-1" />
                            Configurado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Não configurado
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {card.tooltip ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditTooltip(card.tooltip!)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Editar Tooltip
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startCreateTooltip(card.key)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Criar Tooltip
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tooltips Tab */}
          <TabsContent value="tooltips" className="space-y-6">
            <div className="grid gap-4">
              {cards.filter(card => card.tooltip).map((card) => (
                <Card key={card.id} className="card-modern">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg font-semibold text-vibrant">
                        {card.title}
                      </CardTitle>
                      <p className="text-sm text-vibrant-secondary">
                        Posição: {card.tooltip?.tooltip_position} | 
                        Status: {card.tooltip?.is_enabled ? 'Habilitado' : 'Desabilitado'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditTooltip(card.tooltip!)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTooltip(card.key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-vibrant-secondary">
                      {card.tooltip?.tooltip_text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Card Modal */}
        {(showCreateCard || editingCard) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle className="text-vibrant">
                  {editingCard ? 'Editar Card' : 'Criar Novo Card'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="key">Chave do Card</Label>
                    <Input
                      id="key"
                      value={cardForm.key}
                      onChange={(e) => setCardForm({ ...cardForm, key: e.target.value })}
                      placeholder="ex: total_margin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={cardForm.title}
                      onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                      placeholder="ex: Margem Total"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={cardForm.description}
                    onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                    placeholder="Descrição do card..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icon">Ícone</Label>
                    <Input
                      id="icon"
                      value={cardForm.icon}
                      onChange={(e) => setCardForm({ ...cardForm, icon: e.target.value })}
                      placeholder="ex: Wallet"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={cardForm.category}
                      onValueChange={(value) => setCardForm({ ...cardForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positions">Posições</SelectItem>
                        <SelectItem value="balance">Saldo</SelectItem>
                        <SelectItem value="history">Histórico</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="order_index">Ordem</Label>
                    <Input
                      id="order_index"
                      type="number"
                      value={cardForm.order_index}
                      onChange={(e) => setCardForm({ ...cardForm, order_index: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={cardForm.is_active}
                      onCheckedChange={(checked) => setCardForm({ ...cardForm, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Ativo</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_admin_only"
                    checked={cardForm.is_admin_only}
                    onCheckedChange={(checked) => setCardForm({ ...cardForm, is_admin_only: checked })}
                  />
                  <Label htmlFor="is_admin_only">Apenas Admin</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateCard(false);
                      setEditingCard(null);
                      resetCardForm();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => editingCard ? handleUpdateCard(editingCard.key) : handleCreateCard()}
                    className="btn-modern-primary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingCard ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create/Edit Tooltip Modal */}
        {(showCreateTooltip || editingTooltip) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle className="text-vibrant">
                  {editingTooltip ? 'Editar Tooltip' : 'Criar Novo Tooltip'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="card_key">Card</Label>
                  <Select
                    value={tooltipForm.card_key}
                    onValueChange={(value) => setTooltipForm({ ...tooltipForm, card_key: value })}
                    disabled={!!editingTooltip}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um card" />
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map((card) => (
                        <SelectItem key={card.key} value={card.key}>
                          {card.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tooltip_text">Texto do Tooltip</Label>
                  <Textarea
                    id="tooltip_text"
                    value={tooltipForm.tooltip_text}
                    onChange={(e) => setTooltipForm({ ...tooltipForm, tooltip_text: e.target.value })}
                    placeholder="Texto explicativo do tooltip..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tooltip_position">Posição</Label>
                    <Select
                      value={tooltipForm.tooltip_position}
                      onValueChange={(value) => setTooltipForm({ ...tooltipForm, tooltip_position: value })}
                    >
                      <SelectTrigger>
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
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_enabled"
                      checked={tooltipForm.is_enabled}
                      onCheckedChange={(checked) => setTooltipForm({ ...tooltipForm, is_enabled: checked })}
                    />
                    <Label htmlFor="is_enabled">Habilitado</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateTooltip(false);
                      setEditingTooltip(null);
                      resetTooltipForm();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => editingTooltip ? handleUpdateTooltip(editingTooltip.card_key) : handleCreateTooltip()}
                    className="btn-modern-primary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingTooltip ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
