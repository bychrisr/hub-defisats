import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { Plan } from '@/services/plans.service';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: PlanFormData) => Promise<void>;
  plan?: Plan | null;
  loading?: boolean;
}

export interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  price_sats: number;
  price_monthly?: number;
  price_yearly?: number;
  features: string[];
  is_active: boolean;
  has_api_access: boolean;
  has_advanced: boolean;
  has_priority: boolean;
  max_notifications: number;
  sort_order: number;
}

export const PlanModal = ({ isOpen, onClose, onSave, plan, loading = false }: PlanModalProps) => {
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    slug: '',
    description: '',
    price_sats: 0,
    price_monthly: undefined,
    price_yearly: undefined,
    features: [],
    is_active: true,
    has_api_access: false,
    has_advanced: false,
    has_priority: false,
    max_notifications: 0,
    sort_order: 0,
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        slug: plan.slug || '',
        description: plan.description || '',
        price_sats: plan.price_sats || 0,
        price_monthly: plan.price_monthly || undefined,
        price_yearly: plan.price_yearly || undefined,
        features: plan.features || [],
        is_active: plan.is_active || false,
        has_api_access: plan.has_api_access || false,
        has_advanced: plan.has_advanced || false,
        has_priority: plan.has_priority || false,
        max_notifications: plan.max_notifications || 0,
        sort_order: plan.sort_order || 0,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        price_sats: 0,
        price_monthly: undefined,
        price_yearly: undefined,
        features: [],
        is_active: true,
        has_api_access: false,
        has_advanced: false,
        has_priority: false,
        max_notifications: 0,
        sort_order: 0,
      });
    }
  }, [plan, isOpen]);

  const handleInputChange = (field: keyof PlanFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {plan ? 'Editar Plano' : 'Novo Plano'}
          </DialogTitle>
          <DialogDescription>
            {plan ? 'Edite as informações do plano' : 'Preencha as informações do novo plano'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Plano Pro"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="Ex: plano-pro"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o plano..."
                rows={3}
              />
            </div>
          </div>

          {/* Preços */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preços</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_sats">Preço em Sats *</Label>
                <Input
                  id="price_sats"
                  type="number"
                  value={formData.price_sats}
                  onChange={(e) => handleInputChange('price_sats', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Preço Mensal (Sats)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  value={formData.price_monthly || ''}
                  onChange={(e) => handleInputChange('price_monthly', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Opcional"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price_yearly">Preço Anual (Sats)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  value={formData.price_yearly || ''}
                  onChange={(e) => handleInputChange('price_yearly', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>

          {/* Funcionalidades */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Funcionalidades</h3>
            
            <div className="space-y-2">
              <Label>Recursos do Plano</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Adicionar recurso..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                />
                <Button type="button" onClick={handleAddFeature} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Configurações */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_notifications">Máx. Notificações</Label>
                <Input
                  id="max_notifications"
                  type="number"
                  value={formData.max_notifications}
                  onChange={(e) => handleInputChange('max_notifications', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordem</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Plano Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="has_api_access">Acesso à API</Label>
                <Switch
                  id="has_api_access"
                  checked={formData.has_api_access}
                  onCheckedChange={(checked) => handleInputChange('has_api_access', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="has_advanced">Recursos Avançados</Label>
                <Switch
                  id="has_advanced"
                  checked={formData.has_advanced}
                  onCheckedChange={(checked) => handleInputChange('has_advanced', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="has_priority">Suporte Prioritário</Label>
                <Switch
                  id="has_priority"
                  checked={formData.has_priority}
                  onCheckedChange={(checked) => handleInputChange('has_priority', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {plan ? 'Salvar Alterações' : 'Criar Plano'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
