import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Shield,
  Settings,
  BarChart3,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// Plan types
const PLAN_TYPES = [
  { value: 'free', label: 'Free', description: '2 posições limitadas' },
  { value: 'basic', label: 'Basic', description: 'Todas as posições' },
  { value: 'advanced', label: 'Advanced', description: 'Total + Unitário' },
  { value: 'pro', label: 'Pro', description: 'Personalizado completo' },
  { value: 'lifetime', label: 'Lifetime', description: 'Funcionalidade ilimitada' },
];

// Configuration schema
const planConfigSchema = z.object({
  plan_type: z.enum(['free', 'basic', 'advanced', 'pro', 'lifetime']),
  margin_threshold: z.number().min(0.1).max(100),
  action: z.enum(['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance']),
  reduce_percentage: z.number().min(1).max(100).optional(),
  add_margin_amount: z.number().min(0).optional(),
  new_liquidation_distance: z.number().min(0.1).max(100).optional(),
  enabled: z.boolean().default(true),
  selected_positions: z.array(z.string()).max(2).optional(),
  protection_mode: z.enum(['unitario', 'total', 'both']).optional(),
  individual_configs: z.record(z.string(), z.object({
    margin_threshold: z.number().min(0.1).max(100),
    action: z.enum(['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance']),
    reduce_percentage: z.number().min(1).max(100).optional(),
    add_margin_amount: z.number().min(0).optional(),
    new_liquidation_distance: z.number().min(0.1).max(100).optional(),
  })).optional(),
  notifications: z.object({
    push: z.boolean().default(true),
    email: z.boolean().default(false),
    telegram: z.boolean().default(false),
    whatsapp: z.boolean().default(false),
    webhook: z.boolean().default(false),
  }).optional(),
});

type PlanConfigForm = z.infer<typeof planConfigSchema>;

interface PlanConfiguration {
  planType: string;
  config: any;
  features: any;
  limitations: any;
  defaultConfig: any;
}

interface PlanStatistics {
  totalUsers: number;
  usersByPlan: {
    free: number;
    basic: number;
    advanced: number;
    pro: number;
    lifetime: number;
  };
  marginGuardUsage: {
    totalAutomations: number;
    activeAutomations: number;
    executionsToday: number;
    successRate: number;
  };
  planLimitations: any;
}

export default function MarginGuardPlans() {
  const [configurations, setConfigurations] = useState<PlanConfiguration[]>([]);
  const [statistics, setStatistics] = useState<PlanStatistics | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PlanConfigForm>({
    resolver: zodResolver(planConfigSchema),
    defaultValues: {
      plan_type: 'free',
      margin_threshold: 85,
      action: 'reduce_position',
      reduce_percentage: 50,
      enabled: true,
      notifications: {
        push: true,
        email: false,
        telegram: false,
        whatsapp: false,
        webhook: false,
      },
    },
  });

  const selectedAction = watch('action');
  const selectedPlanType = watch('plan_type');

  useEffect(() => {
    fetchConfigurations();
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (configurations.length > 0) {
      const config = configurations.find(c => c.planType === selectedPlan);
      if (config) {
        reset(config.defaultConfig);
      }
    }
  }, [selectedPlan, configurations, reset]);

  const fetchConfigurations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/margin-guard/plans');
      const data = await response.json();
      
      if (data.success) {
        setConfigurations(data.data);
      } else {
        toast.error('Erro ao carregar configurações');
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/margin-guard/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const onSubmit = async (data: PlanConfigForm) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/margin-guard/plans/${selectedPlan}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Configuração salva com sucesso!');
        fetchConfigurations();
      } else {
        toast.error(result.message || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = async () => {
    try {
      const response = await fetch(`/api/admin/margin-guard/plans/${selectedPlan}/reset`, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Configuração resetada para padrão!');
        fetchConfigurations();
      } else {
        toast.error(result.message || 'Erro ao resetar configuração');
      }
    } catch (error) {
      console.error('Error resetting configuration:', error);
      toast.error('Erro ao resetar configuração');
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'pro': return 'bg-orange-100 text-orange-800';
      case 'lifetime': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Margin Guard - Configurações de Planos</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do Margin Guard para cada tipo de plano
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchConfigurations}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations">Configurações</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Selecionar Plano
                </CardTitle>
                <CardDescription>
                  Escolha o plano para configurar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {PLAN_TYPES.map((plan) => (
                  <div
                    key={plan.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPlan === plan.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedPlan(plan.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{plan.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {plan.description}
                        </div>
                      </div>
                      <Badge className={getPlanBadgeColor(plan.value)}>
                        {plan.value}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Configuration Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configuração do Plano: {PLAN_TYPES.find(p => p.value === selectedPlan)?.label}
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros do Margin Guard para este plano
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Configuration */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="margin_threshold">Limite de Margem (%)</Label>
                        <Input
                          id="margin_threshold"
                          type="number"
                          min="0.1"
                          max="100"
                          step="0.1"
                          {...register('margin_threshold', { valueAsNumber: true })}
                        />
                        {errors.margin_threshold && (
                          <p className="text-sm text-red-500">
                            {errors.margin_threshold.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="action">Ação</Label>
                        <Select
                          value={selectedAction}
                          onValueChange={(value) => setValue('action', value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="close_position">Fechar Posição</SelectItem>
                            <SelectItem value="reduce_position">Reduzir Posição</SelectItem>
                            <SelectItem value="add_margin">Adicionar Margem</SelectItem>
                            <SelectItem value="increase_liquidation_distance">
                              Aumentar Distância de Liquidação
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Action-specific fields */}
                    {selectedAction === 'reduce_position' && (
                      <div>
                        <Label htmlFor="reduce_percentage">Percentual de Redução (%)</Label>
                        <Input
                          id="reduce_percentage"
                          type="number"
                          min="1"
                          max="100"
                          {...register('reduce_percentage', { valueAsNumber: true })}
                        />
                      </div>
                    )}

                    {selectedAction === 'add_margin' && (
                      <div>
                        <Label htmlFor="add_margin_amount">Quantidade de Margem (sats)</Label>
                        <Input
                          id="add_margin_amount"
                          type="number"
                          min="0"
                          {...register('add_margin_amount', { valueAsNumber: true })}
                        />
                      </div>
                    )}

                    {selectedAction === 'increase_liquidation_distance' && (
                      <div>
                        <Label htmlFor="new_liquidation_distance">
                          Nova Distância de Liquidação (%)
                        </Label>
                        <Input
                          id="new_liquidation_distance"
                          type="number"
                          min="0.1"
                          max="100"
                          step="0.1"
                          {...register('new_liquidation_distance', { valueAsNumber: true })}
                        />
                      </div>
                    )}

                    {/* Plan-specific fields */}
                    {selectedPlanType === 'free' && (
                      <div>
                        <Label>Posições Selecionadas (máx. 2)</Label>
                        <Input
                          placeholder="IDs das posições separados por vírgula"
                          {...register('selected_positions')}
                        />
                        <p className="text-sm text-muted-foreground">
                          Para o plano Free, selecione até 2 posições específicas
                        </p>
                      </div>
                    )}

                    {(selectedPlanType === 'advanced' || selectedPlanType === 'pro' || selectedPlanType === 'lifetime') && (
                      <div>
                        <Label htmlFor="protection_mode">Modo de Proteção</Label>
                        <Select
                          onValueChange={(value) => setValue('protection_mode', value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unitario">Unitário</SelectItem>
                            <SelectItem value="total">Total</SelectItem>
                            <SelectItem value="both">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Notification Settings */}
                    <div className="space-y-3">
                      <Label>Configurações de Notificação</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="push"
                            {...register('notifications.push')}
                          />
                          <Label htmlFor="push">Push Notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="email"
                            {...register('notifications.email')}
                          />
                          <Label htmlFor="email">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="telegram"
                            {...register('notifications.telegram')}
                          />
                          <Label htmlFor="telegram">Telegram</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="whatsapp"
                            {...register('notifications.whatsapp')}
                          />
                          <Label htmlFor="whatsapp">WhatsApp</Label>
                        </div>
                      </div>
                    </div>

                    {/* Enable/Disable */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        {...register('enabled')}
                      />
                      <Label htmlFor="enabled">Automação Ativa</Label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar Configuração
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetToDefault}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resetar para Padrão
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Automações Ativas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.marginGuardUsage.activeAutomations}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Execuções Hoje</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.marginGuardUsage.executionsToday}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.marginGuardUsage.successRate}%</div>
                </CardContent>
              </Card>
            </div>
          )}

          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plano</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(statistics.usersByPlan).map(([plan, count]) => (
                      <TableRow key={plan}>
                        <TableCell className="font-medium">
                          <Badge className={getPlanBadgeColor(plan)}>
                            {plan.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{count}</TableCell>
                        <TableCell>
                          {count > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configurations.map((config) => (
              <Card key={config.planType}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{PLAN_TYPES.find(p => p.value === config.planType)?.label}</span>
                    <Badge className={getPlanBadgeColor(config.planType)}>
                      {config.planType}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {config.limitations.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Limite de Posições:</span>
                      <span className="font-medium">
                        {config.limitations.positionLimit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tipo de Configuração:</span>
                      <span className="font-medium">
                        {config.limitations.configurationType}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Canais de Notificação:</span>
                      <span className="font-medium">
                        {config.limitations.notificationChannels}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPlan(config.planType)}
                      className="w-full"
                    >
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
