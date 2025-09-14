import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Crown, Zap, Star, Gem, Gift } from 'lucide-react';
import { apiPut } from '@/lib/fetch';

interface User {
  id: string;
  email: string;
  username: string;
  plan_type: 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime';
  is_active: boolean;
}

interface UserUpgradeModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const planConfig = {
  free: {
    name: 'Free',
    icon: Gift,
    color: 'bg-gray-100 text-gray-800',
    description: 'Plano gratuito básico'
  },
  basic: {
    name: 'Basic',
    icon: Zap,
    color: 'bg-blue-100 text-blue-800',
    description: 'Plano básico com recursos limitados'
  },
  advanced: {
    name: 'Advanced',
    icon: Star,
    color: 'bg-purple-100 text-purple-800',
    description: 'Plano avançado com recursos premium'
  },
  pro: {
    name: 'Pro',
    icon: Crown,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Plano profissional com todos os recursos'
  },
  lifetime: {
    name: 'Lifetime',
    icon: Gem,
    color: 'bg-green-100 text-green-800',
    description: 'Acesso vitalício a todos os recursos'
  }
};

export default function UserUpgradeModal({ user, isOpen, onClose, onSuccess }: UserUpgradeModalProps) {
  const [newPlan, setNewPlan] = useState<string>('');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen && user) {
      setNewPlan('');
      setReason('');
      setEffectiveDate(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM format
      setError(null);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlan || !reason.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Converter data do formato datetime-local para ISO string
      let formattedEffectiveDate = effectiveDate;
      if (effectiveDate && !effectiveDate.includes('.')) {
        // Se não tem milissegundos, adicionar .000Z
        formattedEffectiveDate = effectiveDate + '.000Z';
      } else if (!effectiveDate) {
        formattedEffectiveDate = new Date().toISOString();
      }

      const payload = {
        newPlan,
        reason: reason.trim(),
        effectiveDate: formattedEffectiveDate
      };

      console.log('🔄 USER UPGRADE - Iniciando upgrade:', {
        userId: user.id,
        newPlan,
        reason,
        effectiveDate,
        payload
      });

      const token = localStorage.getItem('access_token');
      console.log('🔑 USER UPGRADE - Token:', token ? `${token.substring(0, 20)}...` : 'MISSING');

      const response = await apiPut(`/api/admin/users/${user.id}/upgrade`, payload);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ USER UPGRADE - Erro da API:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.message || 'Erro ao fazer upgrade do usuário');
      }

      const result = await response.json();
      console.log('✅ USER UPGRADE - Upgrade realizado:', result);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ USER UPGRADE - Erro:', error);
      setError(error.message || 'Erro ao fazer upgrade do usuário');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const currentPlanConfig = planConfig[user.plan_type];
  const selectedPlanConfig = newPlan ? planConfig[newPlan as keyof typeof planConfig] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Upgrade de Plano
          </DialogTitle>
          <DialogDescription>
            Alterar plano do usuário <strong>{user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plano Atual */}
          <div className="space-y-2">
            <Label>Plano Atual</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg border">
              <currentPlanConfig.icon className="h-4 w-4" />
              <Badge className={currentPlanConfig.color}>
                {currentPlanConfig.name}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentPlanConfig.description}
              </span>
            </div>
          </div>

          {/* Novo Plano */}
          <div className="space-y-2">
            <Label htmlFor="newPlan">Novo Plano *</Label>
            <Select value={newPlan} onValueChange={setNewPlan} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo plano" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(planConfig).map(([key, config]) => {
                  if (key === user.plan_type) return null; // Skip current plan
                  const Icon = config.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{config.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Preview do Novo Plano */}
          {selectedPlanConfig && (
            <div className="space-y-2">
              <Label>Novo Plano</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <selectedPlanConfig.icon className="h-4 w-4" />
                <Badge className={selectedPlanConfig.color}>
                  {selectedPlanConfig.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedPlanConfig.description}
                </span>
              </div>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do Upgrade *</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo do upgrade (mínimo 10 caracteres)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={10}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 caracteres
            </p>
          </div>

          {/* Data de Efetivação */}
          <div className="space-y-2">
            <Label htmlFor="effectiveDate">Data de Efetivação</Label>
            <Input
              id="effectiveDate"
              type="datetime-local"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para efetivar imediatamente
            </p>
          </div>

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !newPlan || !reason.trim() || reason.length < 10}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Upgrade
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
