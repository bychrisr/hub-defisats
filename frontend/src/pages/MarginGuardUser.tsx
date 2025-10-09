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
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Percent,
  Target,
  Zap,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// Schema de validação baseado nas limitações do plano
const marginGuardSchema = z.object({
  enabled: z.boolean(),
  margin_threshold: z.number().min(0.1).max(100),
  action: z.enum(['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance']),
  reduce_percentage: z.number().min(1).max(100).optional(),
  add_margin_amount: z.number().min(0).optional(),
  new_liquidation_distance: z.number().min(0.1).max(100).optional(),
  selected_positions: z.array(z.string()).optional(),
  protection_mode: z.enum(['unitario', 'total', 'both']).optional(),
  individual_configs: z.record(z.string(), z.object({
    margin_threshold: z.number().min(0.1).max(100),
    action: z.enum(['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance']),
    reduce_percentage: z.number().min(1).max(100).optional(),
    add_margin_amount: z.number().min(0).optional(),
    new_liquidation_distance: z.number().min(0.1).max(100).optional(),
  })).optional(),
  notifications: z.object({
    push: z.boolean(),
    email: z.boolean(),
    telegram: z.boolean(),
    whatsapp: z.boolean(),
    webhook: z.boolean(),
  }).optional(),
});

type MarginGuardForm = z.infer<typeof marginGuardSchema>;

interface PlanLimitations {
  maxPositions: number | 'unlimited';
  allowedActions: string[];
  maxMarginThreshold: number;
  minMarginThreshold: number;
  allowedNotifications: string[];
  individualConfigs: boolean;
  protectionModes: string[];
}

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  margin: number;
  liquidation_price: number;
  current_price: number;
  pnl: number;
  distance_to_liquidation: number;
}

export default function MarginGuardUser() {
  const [planLimitations, setPlanLimitations] = useState<PlanLimitations | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<MarginGuardForm>({
    resolver: zodResolver(marginGuardSchema),
    defaultValues: {
      enabled: false,
      margin_threshold: 75,
      action: 'reduce_position',
      reduce_percentage: 50,
      notifications: {
        push: true,
        email: false,
        telegram: false,
        whatsapp: false,
        webhook: false,
      },
    },
  });

  const enabled = watch('enabled');
  const marginThreshold = watch('margin_threshold');
  const action = watch('action');
  const reducePercentage = watch('reduce_percentage');

  useEffect(() => {
    fetchUserPlanLimitations();
    fetchUserPositions();
    fetchCurrentPrice();
  }, []);

  const fetchUserPlanLimitations = async () => {
    try {
      const response = await fetch('/api/margin-guard/plan-features');
      const data = await response.json();
      
      if (data.success) {
        setPlanLimitations(data.data.limitations);
        // Aplicar limitações do plano
        applyPlanLimitations(data.data.limitations);
      }
    } catch (error) {
      console.error('Error fetching plan limitations:', error);
      toast.error('Erro ao carregar limitações do plano');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPositions = async () => {
    try {
      // TODO: Implementar chamada real para posições do usuário
      const mockPositions: Position[] = [
        {
          id: 'pos_1',
          symbol: 'BTCUSD',
          side: 'long',
          size: 1000,
          margin: 100,
          liquidation_price: 107456,
          current_price: 112778,
          pnl: 500,
          distance_to_liquidation: 4.7,
        },
        {
          id: 'pos_2',
          symbol: 'ETCUSD',
          side: 'long',
          size: 500,
          margin: 50,
          liquidation_price: 2500,
          current_price: 3000,
          pnl: 250,
          distance_to_liquidation: 16.7,
        }
      ];
      setPositions(mockPositions);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const fetchCurrentPrice = async () => {
    try {
      // TODO: Implementar chamada real para preço atual
      setCurrentPrice(112778);
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
  };

  const applyPlanLimitations = (limitations: PlanLimitations) => {
    // Aplicar limitações baseadas no plano do usuário
    if (limitations.maxMarginThreshold) {
      setValue('margin_threshold', Math.min(marginThreshold, limitations.maxMarginThreshold));
    }
    if (limitations.minMarginThreshold) {
      setValue('margin_threshold', Math.max(marginThreshold, limitations.minMarginThreshold));
    }
  };

  const onSubmit = async (data: MarginGuardForm) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/margin-guard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Margin Guard configurado com sucesso!');
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

  const getRiskLevel = (threshold: number) => {
    if (threshold <= 70) return { level: 'Conservador', color: 'green' };
    if (threshold <= 85) return { level: 'Moderado', color: 'yellow' };
    return { level: 'Agressivo', color: 'red' };
  };

  const getClosestPosition = () => {
    return positions.reduce((closest, position) => 
      position.distance_to_liquidation < closest.distance_to_liquidation ? position : closest
    );
  };

  const calculateActivationPrice = (position: Position, threshold: number) => {
    const distance = (position.current_price - position.liquidation_price) * (threshold / 100);
    return position.liquidation_price + distance;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  const closestPosition = getClosestPosition();
  const activationPrice = calculateActivationPrice(closestPosition, marginThreshold);
  const riskLevel = getRiskLevel(marginThreshold);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            Margin Guard
          </h1>
          <p className="text-muted-foreground">
            Proteção automática contra liquidação de posições
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Label htmlFor="enabled" className="text-sm font-medium">
            Ativo
          </Label>
          <Switch
            id="enabled"
            checked={enabled}
            onCheckedChange={(checked) => setValue('enabled', checked)}
          />
        </div>
      </div>

      {/* Warning Alert */}
      {enabled && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Atenção:</strong> O Margin Guard irá executar ações automáticas quando o limite for atingido. 
            Certifique-se de configurar os parâmetros adequadamente.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Configuração do Margin Guard
            </CardTitle>
            <CardDescription>
              Configure os parâmetros de proteção baseados no seu plano: {planLimitations ? 'Plano detectado' : 'Carregando...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Limite de Margem */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Limite de Margem</Label>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  {marginThreshold}%
                </Badge>
              </div>
              
              <div className="space-y-4">
                <Slider
                  value={[marginThreshold]}
                  onValueChange={(value) => setValue('margin_threshold', value[0])}
                  min={planLimitations?.minMarginThreshold || 10}
                  max={planLimitations?.maxMarginThreshold || 95}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Conservador (70%)</span>
                  <span>Moderado (85%)</span>
                  <span>Agressivo (95%)</span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Quando o preço do Bitcoin chegar na distância de {marginThreshold}% do preço de liquidação
                </p>
              </div>
            </div>

            {/* Ação a Ser Executada */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Ação a Ser Executada</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={action === 'reduce_position' ? 'default' : 'outline'}
                  onClick={() => setValue('action', 'reduce_position')}
                  className="h-20 flex flex-col items-center space-y-2"
                >
                  <Percent className="h-6 w-6" />
                  <span>Reduzir Posição</span>
                </Button>
                
                <Button
                  type="button"
                  variant={action === 'add_margin' ? 'default' : 'outline'}
                  onClick={() => setValue('action', 'add_margin')}
                  className="h-20 flex flex-col items-center space-y-2"
                >
                  <DollarSign className="h-6 w-6" />
                  <span>Adicionar Margem</span>
                </Button>
              </div>

              {/* Configuração específica da ação */}
              {action === 'reduce_position' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Percentual de Redução</Label>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      {reducePercentage}%
                    </Badge>
                  </div>
                  
                  <Slider
                    value={[reducePercentage || 50]}
                    onValueChange={(value) => setValue('reduce_percentage', value[0])}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Conservador (10%)</span>
                    <span>Moderado (50%)</span>
                    <span>Agressivo (100%)</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Reduzir a posição em {reducePercentage}% quando o limite for atingido
                  </p>
                </div>
              )}

              {action === 'add_margin' && (
                <div className="space-y-4">
                  <Label htmlFor="add_margin_amount">Quantidade de Margem (sats)</Label>
                  <Input
                    id="add_margin_amount"
                    type="number"
                    min="0"
                    {...register('add_margin_amount', { valueAsNumber: true })}
                    placeholder="Ex: 1000"
                  />
                  <p className="text-sm text-muted-foreground">
                    Adicionar margem quando o limite for atingido
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exemplo e Simulação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exemplo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Exemplo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Minha posição mais próxima de ser liquidada:</p>
                <p className="text-lg font-bold">{closestPosition.side.toUpperCase()} - {closestPosition.symbol}</p>
                <p className="text-sm">Preço atual do Bitcoin: $ {currentPrice.toLocaleString()}</p>
                <p className="text-sm">Preço de liquidação: $ {closestPosition.liquidation_price.toLocaleString()}</p>
                <p className="text-sm font-semibold text-blue-600">
                  Valor de ativação ({marginThreshold}%): ${activationPrice.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Simulação Real */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Simulação Real
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Preço atual BTC:</span>
                  <span className="font-bold">${currentPrice.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm">Posição mais próxima de ser liquidada:</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{closestPosition.side.toUpperCase()} ${closestPosition.liquidation_price.toLocaleString()}</span>
                    <Badge 
                      variant={closestPosition.distance_to_liquidation < 10 ? 'destructive' : 'secondary'}
                    >
                      {closestPosition.distance_to_liquidation}% distância
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} size="lg">
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>
      </form>
    </div>
  );
}

