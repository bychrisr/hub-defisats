import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bot, Plus, Shield, TrendingUp, Zap, AlertTriangle, Activity, TrendingDown, Target, ArrowRight, CheckCircle } from 'lucide-react';
import { useRealtimeData } from '@/contexts/RealtimeDataContext';
import { useOptimizedPositions } from '@/hooks/useOptimizedDashboardData';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';
import { useLiquidGlassAnimation } from '@/hooks/useLiquidGlassAnimation';
import { apiFetch } from '@/lib/fetch';

interface MarginGuardConfig {
  id?: string;
  mode: 'unitario' | 'global';
  margin_threshold: number;
  add_margin_percentage: number;
  selected_positions: string[];
  is_active: boolean;
}

interface Position {
  trade_id: string;
  side: 'b' | 's';
  entry_price: number;
  liquidation_price: number;
  current_price: number;
  margin: number;
  fees: {
    opening_fee: number;
    closing_fee: number;
    maintenance_margin: number;
    sum_carry_fees: number;
  };
  distance_percentage: number;
}

interface PlanFeatures {
  maxPositions: number;
  modes: string[];
  features: string[];
  limitations: string[];
}

interface UpgradePlan {
  slug: string;
  name: string;
  price: number;
  features: string[];
}

export const Automations = () => {
  const { marketData } = useRealtimeData();
  const { positions: optimizedPositions, isLoading: positionsLoading } = useOptimizedPositions();
  const { price: btcPrice, isLoading: btcLoading } = useBitcoinPrice();
  
  // Hook de animação para o preço BTC (sempre chamado no nível superior)
  const btcAnimation = useLiquidGlassAnimation({
    variant: 'info',
    value: btcPrice || 0,
    isPositive: (btcPrice || 0) > 0,
    isNegative: false,
    isNeutral: (btcPrice || 0) === 0
  });
  
  // Debug: Verificar tema atual
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const currentClass = document.documentElement.className;
    console.log('🔍 MARGIN GUARD - Tema atual:', { currentTheme, currentClass });
  }, []);
  
  // Estados para Margin Guard
  const [marginGuardConfig, setMarginGuardConfig] = useState<MarginGuardConfig>({
    mode: 'global',
    margin_threshold: 10,
    add_margin_percentage: 20,
    selected_positions: [],
    is_active: false
  });

  const [positions, setPositions] = useState<Position[]>([]);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  const [availableUpgrades, setAvailableUpgrades] = useState<UpgradePlan[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isLimitedByPlan, setIsLimitedByPlan] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadMarginGuardData();
  }, []);

  // Calcular preview quando configuração mudar
  useEffect(() => {
    if (positions.length > 0 && marginGuardConfig.margin_threshold && marginGuardConfig.add_margin_percentage) {
      calculatePreview();
    }
  }, [marginGuardConfig.margin_threshold, marginGuardConfig.add_margin_percentage, positions]);

  const loadMarginGuardData = async () => {
    try {
      setLoading(true);
      
      // ✅ USAR API AUTENTICADA: Usar apiFetch que inclui automaticamente o token Bearer
      
      // Carregar configuração atual
      const configResponse = await apiFetch('/api/user/margin-guard');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        if (configData.config) {
          setMarginGuardConfig(configData.config);
        }
      }

      // Carregar features do plano
      const featuresResponse = await apiFetch('/api/user/margin-guard/plan-features');
      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json();
        setPlanFeatures(featuresData.features);
      }

      // Carregar posições running
      const positionsResponse = await apiFetch('/api/user/margin-guard/positions');
      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json();
        setPositions(positionsData.data?.positions || []);
      }

      // Carregar upgrades disponíveis
      const upgradesResponse = await apiFetch('/api/user/margin-guard/available-upgrades');
      if (upgradesResponse.ok) {
        const upgradesData = await upgradesResponse.json();
        setAvailableUpgrades(upgradesData.available_upgrades || []);
        setIsLimitedByPlan(upgradesData.available_upgrades?.length > 0);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do Margin Guard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePreview = async (selectedPosition?: Position) => {
    if (!selectedPosition && positions.length === 0) return;

    const position = selectedPosition || positions[0];
    if (!position) return;

    try {
      // ✅ USAR API AUTENTICADA: Usar apiFetch que inclui automaticamente o token Bearer
      
      const response = await apiFetch('/api/user/margin-guard/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position_id: position.trade_id,
          margin_threshold: marginGuardConfig.margin_threshold,
          add_margin_percentage: marginGuardConfig.add_margin_percentage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.preview);
      }
    } catch (error) {
      console.error('Erro ao calcular preview:', error);
    }
  };

  const saveConfiguration = async () => {
    try {
      setLoading(true);
      
      // Validar limitações do plano antes de salvar
      if (planFeatures) {
        // Validar modo
        if (!isModeAllowed(marginGuardConfig.mode)) {
          toast.error(`Modo ${marginGuardConfig.mode} não disponível no seu plano atual`);
          return;
        }
        
        // Validar número de posições selecionadas
        if (marginGuardConfig.mode === 'unitario' && marginGuardConfig.selected_positions.length > planFeatures.maxPositions && planFeatures.maxPositions !== -1) {
          toast.error(`Máximo ${planFeatures.maxPositions} posições permitidas no seu plano atual`);
          return;
        }
      }
      
      // ✅ USAR API AUTENTICADA: Usar apiFetch que inclui automaticamente o token Bearer
      
      const response = await apiFetch('/api/user/margin-guard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marginGuardConfig)
      });

      if (response.ok) {
        const data = await response.json();
        setMarginGuardConfig(data.config);
        await calculatePreview();
        toast.success('Configuração salva com sucesso!');
      } else {
        const errorData = await response.json();
        if (errorData.limitations && errorData.availableUpgrades) {
          // Mostrar toast com sugestão de upgrade
          toast.error(errorData.error, {
            description: `Upgrades disponíveis: ${errorData.availableUpgrades.map((u: any) => u.name).join(', ')}`,
            action: {
              label: 'Ver Upgrades',
              onClick: () => {
                // Scroll para a seção de upgrades
                const upgradesSection = document.querySelector('[data-upgrades]');
                if (upgradesSection) {
                  upgradesSection.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }
          });
        } else {
          toast.error(errorData.error || 'Erro ao salvar configuração');
        }
        console.error('Erro ao salvar configuração:', errorData);
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  const togglePosition = (tradeId: string) => {
    const currentSelected = marginGuardConfig.selected_positions;
    const newSelected = currentSelected.includes(tradeId)
      ? currentSelected.filter(id => id !== tradeId)
      : [...currentSelected, tradeId];
    
    setMarginGuardConfig(prev => ({
      ...prev,
      selected_positions: newSelected
    }));
  };

  const canSelectMore = () => {
    if (!planFeatures) return false;
    if (planFeatures.maxPositions === -1) return true;
    return marginGuardConfig.selected_positions.length < planFeatures.maxPositions;
  };

  const isModeAllowed = (mode: string) => {
    return planFeatures?.modes.includes(mode) || false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                  Automations
                </h1>
                <p className="text-text-secondary">Manage trading automations and bots</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </div>
        </div>

        <Tabs defaultValue="margin-guard" className="space-y-6">
          {/* Mobile-First Tab Navigation */}
          <div className="relative">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 p-1 h-auto bg-muted/30 rounded-xl profile-sidebar-glow">
              <TabsTrigger 
                value="margin-guard" 
                className="flex items-center gap-2 px-4 py-3 profile-sidebar-item data-[state=active]:active data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Margin Guard</span>
                <span className="sm:hidden">Margin</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tp-sl" 
                className="flex items-center gap-2 px-4 py-3 profile-sidebar-item data-[state=active]:active data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Take Profit / Stop Loss</span>
                <span className="sm:hidden">TP/SL</span>
              </TabsTrigger>
              <TabsTrigger 
                value="entry" 
                className="flex items-center gap-2 px-4 py-3 profile-sidebar-item data-[state=active]:active data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Entradas Automáticas</span>
                <span className="sm:hidden">Entradas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Margin Guard Tab */}
          <TabsContent value="margin-guard" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando Margin Guard...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna Esquerda - Configuração */}
                <div className="space-y-6">
                  {/* Card de Configuração Principal */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Configuração do Margin Guard
                      </CardTitle>
                      <CardDescription>
                        Configure quando e quanto de margem adicionar automaticamente
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Switch de Ativação */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Ativar Margin Guard</Label>
                          <p className="text-sm text-muted-foreground">
                            Monitora posições e adiciona margem automaticamente
                          </p>
                        </div>
                        <Switch
                          checked={marginGuardConfig.is_active}
                          onCheckedChange={(checked) =>
                            setMarginGuardConfig(prev => ({ ...prev, is_active: checked }))
                          }
                        />
        </div>

                      <Separator />

                      {/* Slider: % de distância para acionar */}
                      <div className="space-y-3">
                        <Label className="text-base">Limite de Margem</Label>
                        <div className="px-3">
                          <Slider
                            value={[marginGuardConfig.margin_threshold]}
                            onValueChange={(value) =>
                              setMarginGuardConfig(prev => ({ ...prev, margin_threshold: value[0] }))
                            }
                            min={5}
                            max={25}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground mt-2">
                            <span>5%</span>
                            <span className="font-medium text-primary">
                              {marginGuardConfig.margin_threshold}%
                            </span>
                            <span>25%</span>
                          </div>
                    </div>
                        <p className="text-sm text-muted-foreground">
                          Quando o preço chegar a {marginGuardConfig.margin_threshold}% do preço de liquidação, o Margin Guard será acionado
                        </p>
                    </div>

                      {/* Slider: % de margem para adicionar */}
                      <div className="space-y-3">
                        <Label className="text-base">Margem a Adicionar</Label>
                        <div className="px-3">
                          <Slider
                            value={[marginGuardConfig.add_margin_percentage]}
                            onValueChange={(value) =>
                              setMarginGuardConfig(prev => ({ ...prev, add_margin_percentage: value[0] }))
                            }
                            min={10}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground mt-2">
                            <span>10%</span>
                            <span className="font-medium text-primary">
                              {marginGuardConfig.add_margin_percentage}%
                            </span>
                            <span>100%</span>
                  </div>
                </div>
                        <p className="text-sm text-muted-foreground">
                          Adicionará {marginGuardConfig.add_margin_percentage}% da margem atual da posição
                        </p>
          </div>

                      <Separator />

                      {/* Seleção de Modo */}
                      <div className="space-y-3">
                        <Label className="text-base">Modo de Operação</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant={marginGuardConfig.mode === 'global' ? 'default' : 'outline'}
                            onClick={() => setMarginGuardConfig(prev => ({ ...prev, mode: 'global' }))}
                            disabled={!isModeAllowed('global')}
                            className="h-auto p-4 flex flex-col items-center gap-2"
                          >
                            <Target className="h-4 w-4" />
                  <div className="text-center">
                              <div className="font-medium">Global</div>
                              <div className="text-xs opacity-70">Todas as posições</div>
                    </div>
                          </Button>
                          <Button
                            variant={marginGuardConfig.mode === 'unitario' ? 'default' : 'outline'}
                            onClick={() => setMarginGuardConfig(prev => ({ ...prev, mode: 'unitario' }))}
                            disabled={!isModeAllowed('unitario')}
                            className="h-auto p-4 flex flex-col items-center gap-2"
                          >
                            <Activity className="h-4 w-4" />
                  <div className="text-center">
                              <div className="font-medium">Unitário</div>
                              <div className="text-xs opacity-70">Posições específicas</div>
                    </div>
                          </Button>
                  </div>
                </div>

                      {/* Botão Salvar */}
                      <Button 
                        onClick={saveConfiguration}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Salvando...' : 'Salvar Configuração'}
                      </Button>
            </CardContent>
          </Card>
          
                  {/* Lista de Posições (Modo Unitário) */}
                  {marginGuardConfig.mode === 'unitario' && positions.length > 0 && (
                    <Card>
          <CardHeader>
                        <CardTitle>Posições Running</CardTitle>
                        <CardDescription>
                          Selecione quais posições monitorar
                          {planFeatures && planFeatures.maxPositions > 0 && (
                            <span className="text-orange-600 font-medium">
                              {' '}(Máximo {planFeatures.maxPositions})
                            </span>
                          )}
                </CardDescription>
          </CardHeader>
          <CardContent>
                  <Table>
                    <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Sel.</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Margem</TableHead>
                              <TableHead>Preço Liquidação</TableHead>
                              <TableHead>Distância</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                            {positions.map((position) => (
                              <TableRow key={position.trade_id}>
                                <TableCell>
                                  <Checkbox
                                    checked={marginGuardConfig.selected_positions.includes(position.trade_id)}
                                    onCheckedChange={() => togglePosition(position.trade_id)}
                                    disabled={!marginGuardConfig.selected_positions.includes(position.trade_id) && !canSelectMore()}
                                  />
                          </TableCell>
                          <TableCell>
                                  <Badge variant={position.side === 'b' ? 'default' : 'secondary'}>
                                    {position.side === 'b' ? 'LONG' : 'SHORT'}
                            </Badge>
                          </TableCell>
                                <TableCell>{position.margin.toLocaleString()} sats</TableCell>
                                <TableCell>${position.liquidation_price.toLocaleString()}</TableCell>
                          <TableCell>
                                  <Badge variant={position.distance_percentage < marginGuardConfig.margin_threshold ? 'destructive' : 'outline'}>
                                    {position.distance_percentage.toFixed(1)}%
                                    </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                                  )}
                                </div>

                {/* Coluna Direita - Preview e Status */}
                <div className="space-y-6">
                  {/* Preview de Cálculo em Tempo Real */}
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Preview em Tempo Real
                      </CardTitle>
                      <CardDescription>
                        Cálculo baseado nos dados atuais do mercado
                      </CardDescription>
                    </CardHeader>
                      <CardContent>
                        {(() => {
                          // Debug: Log dos dados disponíveis
                          console.log('🔍 MARGIN GUARD PREVIEW - Debug data:', {
                            marketData: marketData,
                            optimizedPositions: optimizedPositions,
                            positionsLoading: positionsLoading,
                            btcPrice: marketData?.['BTC']?.price,
                            positionsLength: optimizedPositions?.length
                          });

                          // Dados em tempo real
                          const currentBtcPrice = btcPrice || 0;
                          const positions = optimizedPositions || [];
                          const activePositions = positions.filter(pos => pos.quantity > 0);
                          
                          console.log('🔍 MARGIN GUARD PREVIEW - Filtered positions:', {
                            totalPositions: positions.length,
                            activePositions: activePositions.length,
                            positionsData: positions,
                            activePositionsData: activePositions
                          });
                          
                          if (positionsLoading || btcLoading) {
                            return (
                              <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-muted-foreground">
                                  Carregando dados...
                                </p>
                              </div>
                            );
                          }
                          
                          if (activePositions.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Nenhuma posição ativa encontrada
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Debug: {positions.length} posições totais, {activePositions.length} ativas
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Abra uma posição para ver o preview
                                </p>
                            </div>
                            );
                          }

                          // Usar a primeira posição para o exemplo
                          const examplePosition = activePositions[0];
                          const entryPrice = examplePosition.entry_price;
                          const liquidationPrice = examplePosition.liquidation;
                          const currentMargin = examplePosition.margin;
                          const side = examplePosition.side;
                          
                          // Calcular trigger price
                          const distanceToLiquidation = Math.abs(entryPrice - liquidationPrice);
                          const activationDistance = distanceToLiquidation * (marginGuardConfig.margin_threshold / 100);
                          const triggerPrice = side === 'b' 
                            ? liquidationPrice + activationDistance
                            : liquidationPrice - activationDistance;
                          
                          // Calcular margem a adicionar
                          const marginToAdd = currentMargin * (marginGuardConfig.add_margin_percentage / 100);
                          const newMargin = currentMargin + marginToAdd;
                          
                          // Calcular nova liquidação (aproximação)
                          const newLiquidationPrice = side === 'b' 
                            ? liquidationPrice - (marginToAdd / examplePosition.quantity)
                            : liquidationPrice + (marginToAdd / examplePosition.quantity);
                          
                          // Calcular melhoria da distância
                          const currentDistance = Math.abs(currentBtcPrice - liquidationPrice);
                          const newDistance = Math.abs(currentBtcPrice - newLiquidationPrice);
                          const distanceImprovement = newDistance > currentDistance ? 
                            ((newDistance - currentDistance) / currentDistance) * 100 : 0;

                          return (
                            <div className="space-y-4">
                              {/* Preço atual do BTC */}
                              <div 
                                className={`gradient-card border-2 rounded-lg transition-all duration-300 hover:shadow-xl cursor-default ${
                                  btcLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                                  'gradient-card-blue border-blue-500 hover:border-blue-400 hover:shadow-blue-500/30'
                                }`}
                                style={btcAnimation.dynamicStyle}
                                onMouseEnter={btcAnimation.onMouseEnter}
                                onMouseLeave={btcAnimation.onMouseLeave}
                                onMouseMove={btcAnimation.onMouseMove}
                              >
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm text-blue-100">Preço Atual BTC</Label>
                                    <Badge variant="outline" className="text-xs border-blue-400/60 text-blue-200 bg-blue-600/20">
                                      Tempo Real
                                    </Badge>
                                  </div>
                                  <p className="text-number-lg text-blue-200 font-bold">
                                    ${currentBtcPrice.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Informações da posição */}
                              <div className={`gradient-card border-2 rounded-lg transition-all duration-300 hover:shadow-xl cursor-default ${
                                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                                'gradient-card-purple border-purple-500 hover:border-purple-400 hover:shadow-purple-500/30'
                              }`}>
                                <div className="p-4">
                                  <Label className="text-sm text-purple-100">Posição Exemplo</Label>
                                  <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div>
                                      <p className="text-xs text-purple-200">Tipo</p>
                                      <Badge variant={side === 'b' ? 'default' : 'secondary'} className={`text-xs ${
                                        side === 'b' ? 'bg-green-600/20 border-green-400/60 text-green-200' : 
                                        'bg-red-600/20 border-red-400/60 text-red-200'
                                      }`}>
                                        {side === 'b' ? 'LONG' : 'SHORT'}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-xs text-purple-200">Margem Atual</p>
                                      <p className="text-number-md text-purple-200 font-bold">{currentMargin.toLocaleString()} sats</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Cálculo do trigger */}
                              <div className={`gradient-card border-2 rounded-lg transition-all duration-300 hover:shadow-xl cursor-default ${
                                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                                'gradient-card-orange border-orange-500 hover:border-orange-400 hover:shadow-orange-500/30'
                              }`}>
                                <div className="p-4">
                                  <Label className="text-sm text-orange-100">Quando o Margin Guard será acionado</Label>
                                  <div className="mt-2">
                                    <p className="text-number-lg text-orange-200 font-bold">
                                      ${triggerPrice.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-orange-200">
                                      {marginGuardConfig.margin_threshold}% do preço de liquidação (${liquidationPrice.toLocaleString()})
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Margem a adicionar */}
                              <div className={`gradient-card border-2 rounded-lg transition-all duration-300 hover:shadow-xl cursor-default ${
                                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                                'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30'
                              }`}>
                                <div className="p-4">
                                  <Label className="text-sm text-green-100">Margem a Adicionar</Label>
                                  <div className="mt-2">
                                    <p className="text-number-lg text-green-200 font-bold">
                                      {marginToAdd.toLocaleString()} sats
                                    </p>
                                    <p className="text-xs text-green-200">
                                      {marginGuardConfig.add_margin_percentage}% da margem atual
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Detalhamento de Taxas */}
                              <div className={`gradient-card border-2 rounded-lg transition-all duration-300 hover:shadow-xl cursor-default ${
                                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                                'gradient-card-purple border-purple-500 hover:border-purple-400 hover:shadow-purple-500/30'
                              }`}>
                                <div className="p-4">
                                  <Label className="text-sm text-purple-100">Custo Detalhado (LN Markets)</Label>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-purple-200">Margem base:</span>
                                      <span className="text-number-sm text-purple-200 font-bold">{marginToAdd.toLocaleString()} sats</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-purple-200">Opening fee (0.1%):</span>
                                      <span className="text-number-sm text-purple-200">{(marginToAdd * 0.001).toLocaleString()} sats</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-purple-200">Closing fee (0.1%):</span>
                                      <span className="text-number-sm text-purple-200">{(marginToAdd * 0.001).toLocaleString()} sats</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-purple-200">Maintenance margin:</span>
                                      <span className="text-number-sm text-purple-200">{(marginToAdd * 0.002).toLocaleString()} sats</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-purple-200">Carry fees (funding):</span>
                                      <span className="text-number-sm text-purple-200">{(marginToAdd * 0.0001).toLocaleString()} sats</span>
                                    </div>
                                    <Separator className="my-2 bg-purple-400/30" />
                                    <div className="flex justify-between text-sm">
                                      <span className="text-purple-100 font-medium">Total estimado:</span>
                                      <span className="text-number-md text-purple-100 font-bold">{(marginToAdd * 1.0041).toLocaleString()} sats</span>
                                    </div>
                                    <div className="text-xs text-purple-300 mt-1">
                                      * Baseado na documentação oficial LN Markets
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Resultado */}
                              <div className={`gradient-card border-2 rounded-lg transition-all duration-300 hover:shadow-xl cursor-default ${
                                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                                'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30'
                              }`}>
                                <div className="p-4">
                                  <Label className="text-sm text-green-100">Nova Proteção</Label>
                                  <div className="mt-2">
                                    <p className="text-number-lg text-green-200 font-bold">
                                      Nova Liquidação: ${newLiquidationPrice.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-green-200">
                                      +{distanceImprovement.toFixed(1)}% de proteção adicional
                                    </p>
                                    <p className="text-number-sm text-green-200 font-bold">
                                      Nova margem: {newMargin.toLocaleString()} sats
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Disclaimer */}
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  <strong>Importante:</strong> Cálculo baseado na documentação oficial da LN Markets:
                                  <br />• Taxa de negociação: 0.1% (Tier 1) para opening/closing fees
                                  <br />• Maintenance margin: 0.2% da margem adicionada
                                  <br />• Carry fees: Taxas de financiamento acumuladas
                                  <br />• Valores finais podem variar conforme volume e tier do usuário
                                </AlertDescription>
                              </Alert>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                  {/* Card de Sugestão de Upgrade */}
                  {availableUpgrades.length > 0 && (
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-blue-100/30" data-upgrades>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                          <TrendingUp className="h-5 w-5" />
                          Upgrades Disponíveis
                        </CardTitle>
                        <CardDescription className="text-blue-600">
                          Desbloqueie mais funcionalidades do Margin Guard
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-blue-700 mb-4">
                          {isLimitedByPlan 
                            ? 'Seu plano atual tem limitações. Veja os planos superiores:' 
                            : 'Explore planos com funcionalidades avançadas:'
                          }
                        </p>
                        <div className="space-y-3">
                          {availableUpgrades.slice(0, 3).map((plan) => (
                            <div key={plan.slug} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-white hover:bg-blue-50/50 transition-colors">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{plan.name}</p>
                                <p className="text-xs text-gray-600 mb-1">
                                  {plan.features && Object.keys(plan.features).length > 0 && (
                                    <span>
                                      {plan.features.margin_guard?.max_positions === -1 
                                        ? 'Posições ilimitadas' 
                                        : `Até ${plan.features.margin_guard?.max_positions} posições`
                                      }
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm font-medium text-blue-600">
                                  {plan.price_sats?.toLocaleString()} sats
                                </p>
                              </div>
                              <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Upgrade
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
                          💡 Upgrade agora e desbloqueie configurações avançadas do Margin Guard
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Informações do Plano */}
                  {planFeatures && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Plano Atual: {planFeatures.plan_info?.name || 'Desconhecido'}
                        </CardTitle>
                        <CardDescription>
                          {planFeatures.plan_info?.description || 'Informações do plano não disponíveis'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Recursos Disponíveis */}
                        <div>
                          <Label className="text-sm font-medium">Recursos Disponíveis</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>Modos: {planFeatures.modes?.join(', ') || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>Posições: {planFeatures.maxPositions === -1 ? 'Ilimitado' : planFeatures.maxPositions}</span>
                            </div>
                          </div>
                        </div>

                        {/* Limitações */}
                        {planFeatures.limitations && planFeatures.limitations.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-orange-600">Limitações</Label>
                            <ul className="space-y-1 mt-2">
                              {planFeatures.limitations.map((limitation, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-orange-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  {limitation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Take Profit / Stop Loss Tab */}
          <TabsContent value="tp-sl" className="space-y-6">
            {/* Conteúdo vazio - a ser implementado */}
          </TabsContent>

          {/* Automatic Entries Tab */}
          <TabsContent value="entry" className="space-y-6">
            {/* Conteúdo vazio - a ser implementado */}
              </TabsContent>
            </Tabs>
      </div>
    </div>
  );
};