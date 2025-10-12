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
      } else {
        const errorData = await response.json();
        console.error('Erro ao salvar configuração:', errorData);
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
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
                  {/* Preview de Cálculo */}
                  {preview && (
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-green-600" />
                          Simulação Real
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Preço Atual</Label>
                              <p className="text-lg font-semibold">${preview.current_price?.toLocaleString()}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Preço de Trigger</Label>
                              <p className="text-lg font-semibold text-orange-600">
                                ${preview.trigger_price?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <Label className="text-sm font-medium">Margem a Adicionar</Label>
                            <p className="text-xl font-bold text-green-600">
                              +{preview.margin_to_add?.toLocaleString()} sats
                            </p>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Taxas Incluídas</Label>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Opening Fee:</span>
                                <span>{preview.fees?.opening_fee?.toFixed(2)} sats</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Closing Fee:</span>
                                <span>{preview.fees?.closing_fee?.toFixed(2)} sats</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Maintenance Margin:</span>
                                <span>{preview.fees?.maintenance_margin?.toFixed(2)} sats</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Carry Fees:</span>
                                <span>{preview.fees?.sum_carry_fees?.toFixed(2)} sats</span>
                              </div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Custo Total</Label>
                              <p className="text-xl font-bold text-red-600">
                                {preview.total_cost?.toLocaleString()} sats
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Nova Margem</Label>
                              <p className="text-xl font-bold text-green-600">
                                {preview.new_margin?.toLocaleString()} sats
                              </p>
                            </div>
                          </div>
                          
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              As taxas da LN Markets são descontadas automaticamente. 
                              Certifique-se de ter saldo suficiente.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Card de Sugestão de Upgrade */}
                  {isLimitedByPlan && availableUpgrades.length > 0 && (
                    <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          Desbloqueie mais recursos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Seu plano atual tem limitações. Veja os planos superiores:
                        </p>
                        <div className="space-y-2">
                          {availableUpgrades.slice(0, 3).map((plan) => (
                            <div key={plan.slug} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                              <div>
                                <p className="font-semibold">{plan.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${plan.price}/mês
                                </p>
                              </div>
                              <Button variant="outline" size="sm">
                                Ver Plano
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Limitações do Plano */}
                  {planFeatures && planFeatures.limitations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Limitações do Plano</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {planFeatures.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                              {limitation}
                            </li>
                          ))}
                        </ul>
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