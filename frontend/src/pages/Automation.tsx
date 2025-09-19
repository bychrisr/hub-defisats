import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useBtcPrice } from '@/hooks/useBtcPrice';
import { useUserPositions } from '@/contexts/RealtimeDataContext';
import { toast } from 'sonner';

interface MarginGuardSettings {
  enabled: boolean;
  threshold: number;
  reduction: number;
}

interface TakeProfitStopLossSettings {
  enabled: boolean;
  takeProfitPercent: number;
  stopLossPercent: number;
  trailingEnabled: boolean;
  trailingDistance: number;
}

export const Automation = () => {
  const [marginGuard, setMarginGuard] = useState<MarginGuardSettings>({
    enabled: true,
    threshold: 90,
    reduction: 50,
  });

  const [tpsl, setTpsl] = useState<TakeProfitStopLossSettings>({
    enabled: true,
    takeProfitPercent: 8,
    stopLossPercent: 3,
    trailingEnabled: true,
    trailingDistance: 2,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Hook para buscar preço do BTC
  const { data: btcPrice, loading: btcLoading, error: btcError, refetch: refetchBtc } = useBtcPrice();
  
  // Hook para acessar posições do usuário
  const userPositions = useUserPositions();

  // Função para encontrar a posição mais próxima de liquidar
  const getMostRiskyPosition = () => {
    console.log('🔍 AUTOMATION - getMostRiskyPosition called:', {
      userPositions: userPositions?.length || 0,
      btcPrice: btcPrice?.price
    });
    
    if (!userPositions || userPositions.length === 0) {
      console.log('❌ AUTOMATION - No user positions found');
      return null;
    }
    
    // Log da primeira posição para ver a estrutura
    if (userPositions.length > 0) {
      console.log('🔍 AUTOMATION - First position structure:', {
        id: userPositions[0].id,
        status: userPositions[0].status,
        keys: Object.keys(userPositions[0])
      });
    }
    
    // Filtrar apenas posições abertas (ou todas se não houver status)
    const openPositions = userPositions.filter(pos => !pos.status || pos.status === 'open');
    console.log('🔍 AUTOMATION - Open positions:', openPositions.length);
    
    if (openPositions.length === 0) {
      console.log('❌ AUTOMATION - No open positions found');
      return null;
    }
    
    // Log das posições para debug
    openPositions.forEach((pos, index) => {
      console.log(`🔍 AUTOMATION - Position ${index}:`, {
        id: pos.id,
        side: pos.side,
        liquidation: pos.liquidation,
        currentPrice: pos.currentPrice,
        marginRatio: pos.marginRatio
      });
    });
    
    // Se não temos preço do BTC, usar a primeira posição
    if (!btcPrice?.price) {
      console.log('⚠️ AUTOMATION - No BTC price, using first position');
      return openPositions[0];
    }
    
    const currentBtcPrice = btcPrice.price;
    console.log('🔍 AUTOMATION - Current BTC price:', currentBtcPrice);
    
    // Encontrar a posição cujo preço de liquidação está mais próximo do preço atual do BTC
    const closestPosition = openPositions.reduce((closestToLiquidation, current) => {
      const currentLiquidationPrice = current.liquidation || 0;
      const closestLiquidationPrice = closestToLiquidation.liquidation || 0;
      
      // Calcular a diferença absoluta entre preço de liquidação e preço atual do BTC
      const currentDifference = Math.abs(currentLiquidationPrice - currentBtcPrice);
      const closestDifference = Math.abs(closestLiquidationPrice - currentBtcPrice);
      
      console.log('🔍 AUTOMATION - Comparing positions:', {
        current: {
          id: current.id,
          liquidation: currentLiquidationPrice,
          difference: currentDifference
        },
        closest: {
          id: closestToLiquidation.id,
          liquidation: closestLiquidationPrice,
          difference: closestDifference
        }
      });
      
      // Menor diferença = mais próximo de liquidar
      return currentDifference < closestDifference ? current : closestToLiquidation;
    });
    
    console.log('✅ AUTOMATION - Closest position found:', {
      id: closestPosition.id,
      liquidation: closestPosition.liquidation,
      difference: Math.abs((closestPosition.liquidation || 0) - currentBtcPrice)
    });
    
    return closestPosition;
  };

  // Obter a posição mais arriscada para simulação
  const mostRiskyPosition = getMostRiskyPosition();

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    const savedMarginGuard = localStorage.getItem('marginGuardSettings');
    const savedTpsl = localStorage.getItem('tpslSettings');
    
    if (savedMarginGuard) {
      try {
        const parsed = JSON.parse(savedMarginGuard);
        setMarginGuard(parsed);
      } catch (error) {
        console.error('Erro ao carregar configurações do Margin Guard:', error);
      }
    }
    
    if (savedTpsl) {
      try {
        const parsed = JSON.parse(savedTpsl);
        setTpsl(parsed);
      } catch (error) {
        console.error('Erro ao carregar configurações do TP/SL:', error);
      }
    }
  }, []);

  // Detectar mudanças nas configurações
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [marginGuard, tpsl]);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Salvar no localStorage
      localStorage.setItem('marginGuardSettings', JSON.stringify(marginGuard));
      localStorage.setItem('tpslSettings', JSON.stringify(tpsl));
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasUnsavedChanges(false);
      toast.success('Configurações salvas com sucesso!', {
        description: 'Suas configurações de automação foram salvas e estão ativas.',
        duration: 4000,
      });
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações', {
        description: 'Ocorreu um erro ao salvar suas configurações. Tente novamente.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/20">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-vibrant">
                    Configuração de Automações
                  </h1>
                </div>
                <p className="text-vibrant-secondary text-sm sm:text-base max-w-2xl">
                  Configure suas proteções automáticas e estratégias de trading inteligentes
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-sm text-warning">
                    <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                    <span>Mudanças não salvas</span>
                  </div>
                )}
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={isLoading || !hasUnsavedChanges}
                  className={`flex-1 sm:flex-none ${
                    hasUnsavedChanges 
                      ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isLoading ? 'Salvando...' : hasUnsavedChanges ? 'Salvar Configurações' : 'Configurações Salvas'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="margin-guard" className="space-y-6">
          {/* Mobile-First Tab Navigation */}
          <div className="relative">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 p-1 h-auto bg-muted/30 rounded-xl">
              <TabsTrigger 
                value="margin-guard" 
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Margin Guard</span>
                <span className="sm:hidden">Margin</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tp-sl" 
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Take Profit / Stop Loss</span>
                <span className="sm:hidden">TP/SL</span>
              </TabsTrigger>
              <TabsTrigger 
                value="entry" 
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Entradas Automáticas</span>
                <span className="sm:hidden">Entradas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Margin Guard Tab */}
          <TabsContent value="margin-guard" className="space-y-6">
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/20">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-warning/5"></div>
              <CardHeader className="relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl text-vibrant">Margin Guard</CardTitle>
                      <CardDescription className="text-sm sm:text-base text-vibrant-secondary">
                        Proteção automática contra liquidação de posições
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={marginGuard.enabled ? "default" : "destructive"}
                      className={`px-3 py-1 ${marginGuard.enabled ? "bg-success text-success-foreground hover:bg-success/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}`}
                    >
                      {marginGuard.enabled ? "Ativo" : "Inativo"}
                    </Badge>
                    <Switch
                      checked={marginGuard.enabled}
                      onCheckedChange={enabled =>
                        setMarginGuard({ ...marginGuard, enabled })
                      }
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-warning">Atenção</p>
                      <p className="text-sm text-vibrant-secondary">
                        O Margin Guard irá executar ações automáticas quando o
                        limite for atingido. Certifique-se de configurar os
                        parâmetros adequadamente.
                      </p>
                    </div>
                  </div>
                </div>

                {marginGuard.enabled && (
                  <div className="space-y-6">
                    {/* Two Column Layout */}
                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Limite de Margem */}
                      <div className="space-y-4 p-4 bg-muted/20 rounded-xl">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium text-vibrant">
                            Limite de Margem
                          </Label>
                          <Badge variant="outline" className="text-lg font-bold">
                            {marginGuard.threshold}%
                          </Badge>
                        </div>
                        <Slider
                          value={[marginGuard.threshold]}
                          onValueChange={([value]) =>
                            setMarginGuard({ ...marginGuard, threshold: value })
                          }
                          max={95}
                          min={70}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs sm:text-sm text-vibrant-secondary">
                          <span>Conservador (70%)</span>
                          <span>Moderado (85%)</span>
                          <span>Agressivo (95%)</span>
                        </div>
                        <p className="text-sm text-vibrant-secondary">
                          Reduzir posição quando margem atingir {marginGuard.threshold}%
                        </p>
                      </div>

                      {/* Percentual de Redução */}
                      <div className="space-y-4 p-4 bg-muted/20 rounded-xl">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium text-vibrant">
                            Percentual de Redução
                          </Label>
                          <Badge variant="outline" className="text-lg font-bold">
                            {marginGuard.reduction}%
                          </Badge>
                        </div>
                        <Slider
                          value={[marginGuard.reduction]}
                          onValueChange={([value]) =>
                            setMarginGuard({ ...marginGuard, reduction: value })
                          }
                          max={100}
                          min={10}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs sm:text-sm text-vibrant-secondary">
                          <span>Conservador (10%)</span>
                          <span>Moderado (50%)</span>
                          <span>Agressivo (100%)</span>
                        </div>
                        <p className="text-sm text-vibrant-secondary">
                          Reduzir a posição em {marginGuard.reduction}% quando o
                          limite for atingido
                        </p>
                      </div>
                    </div>

                    {/* Simulation Card */}
                    <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <h4 className="font-medium text-success text-vibrant">
                            {mostRiskyPosition ? 'Simulação Real' : 'Simulação'}
                          </h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={refetchBtc}
                          disabled={btcLoading}
                          className="h-8 w-8 p-0"
                        >
                          <RefreshCw className={`h-4 w-4 ${btcLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                      
                      {!mostRiskyPosition && (
                        <div className="mb-3 p-2 bg-warning/10 border border-warning/20 rounded-lg">
                          <p className="text-sm text-warning">
                            ℹ️ Nenhuma posição aberta encontrada. Usando simulação padrão.
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-3 text-sm">
                        {/* Preço atual do BTC */}
                        <div className="p-3 bg-background/50 rounded-lg border border-success/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-vibrant-secondary">Preço atual BTC:</span>
                            {btcLoading ? (
                              <div className="flex items-center gap-2">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                <span className="text-vibrant-secondary">Carregando...</span>
                              </div>
                            ) : btcError ? (
                              <span className="text-destructive text-xs">Erro ao carregar</span>
                            ) : btcPrice ? (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">
                                  ${btcPrice.price.toLocaleString('pt-BR')}
                                </span>
                                {btcPrice.changePercent24h !== 0 && (
                                  <Badge 
                                    variant={btcPrice.changePercent24h > 0 ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {btcPrice.changePercent24h > 0 ? (
                                      <TrendingUpIcon className="h-3 w-3 mr-1" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                    )}
                                    {Math.abs(btcPrice.changePercent24h).toFixed(2)}%
                                  </Badge>
                                )}
                              </div>
                            ) : null}
                          </div>
                          {btcPrice && (
                            <div className="text-xs text-vibrant-secondary">
                              Atualizado: {btcPrice.lastUpdated}
                            </div>
                          )}
                        </div>

                        {/* Simulação da posição */}
                        <div className="space-y-2">
                          {mostRiskyPosition ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-vibrant-secondary">Posição mais arriscada:</span>
                                <span className="font-medium">
                                  {mostRiskyPosition.side === 'long' ? 'Long' : 'Short'} {mostRiskyPosition.symbol} 
                                  {btcPrice ? ` $${btcPrice.price.toLocaleString('pt-BR')}` : ` $${mostRiskyPosition.currentPrice.toLocaleString('pt-BR')}`}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-vibrant-secondary">Margem atual:</span>
                                <span className={`font-medium ${(mostRiskyPosition.marginRatio || 0) < 20 ? 'text-destructive' : (mostRiskyPosition.marginRatio || 0) < 50 ? 'text-warning' : 'text-success'}`}>
                                  {(mostRiskyPosition.marginRatio || 0).toFixed(1)}% (${(mostRiskyPosition.margin || 0).toLocaleString('pt-BR')})
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-vibrant-secondary">P&L atual:</span>
                                <span className={`font-medium ${(mostRiskyPosition.pnl || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  ${(mostRiskyPosition.pnl || 0).toLocaleString('pt-BR')} ({(mostRiskyPosition.pnlPercentage || 0).toFixed(1)}%)
                                </span>
                              </div>
                              <div className="pt-2 border-t border-success/20">
                                <div className="flex justify-between">
                                  <span className="text-vibrant-secondary">Se atingir {marginGuard.threshold}%:</span>
                                </div>
                                <div className="mt-1 font-medium text-success">
                                  Reduzir posição em {marginGuard.reduction}% ($${
                                    ((mostRiskyPosition.quantity || 0) * (mostRiskyPosition.currentPrice || 0) * marginGuard.reduction / 100).toLocaleString('pt-BR')
                                  })
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-vibrant-secondary">Posição simulada:</span>
                                <span className="font-medium">
                                  Long BTC/USD {btcPrice ? `$${btcPrice.price.toLocaleString('pt-BR')}` : '$50,000'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-vibrant-secondary">Margem atual:</span>
                                <span className="font-medium">85% ($2,845)</span>
                              </div>
                              <div className="pt-2 border-t border-success/20">
                                <div className="flex justify-between">
                                  <span className="text-vibrant-secondary">Se atingir {marginGuard.threshold}%:</span>
                                </div>
                                <div className="mt-1 font-medium text-success">
                                  Reduzir posição em {marginGuard.reduction}% ($${
                                    btcPrice 
                                      ? ((btcPrice.price * 0.1) * marginGuard.reduction / 100).toLocaleString('pt-BR')
                                      : ((50000 * 0.1) * marginGuard.reduction / 100).toLocaleString('pt-BR')
                                  })
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        {/* Take Profit / Stop Loss Tab */}
        <TabsContent value="tp-sl" className="space-y-6">
          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-vibrant">Take Profit / Stop Loss</CardTitle>
                    <CardDescription className="text-vibrant-secondary">
                      Automatize suas saídas de posições com TP/SL inteligente
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={tpsl.enabled}
                  onCheckedChange={enabled => setTpsl({ ...tpsl, enabled })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {tpsl.enabled && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-base font-medium text-vibrant">
                        Take Profit ({tpsl.takeProfitPercent}%)
                      </Label>
                      <Slider
                        value={[tpsl.takeProfitPercent]}
                        onValueChange={([value]) =>
                          setTpsl({ ...tpsl, takeProfitPercent: value })
                        }
                        max={20}
                        min={1}
                        step={0.5}
                        className="w-full"
                      />
                      <p className="text-sm text-vibrant-secondary">
                        Realizar lucros quando a posição atingir +
                        {tpsl.takeProfitPercent}%
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium text-vibrant">
                        Stop Loss ({tpsl.stopLossPercent}%)
                      </Label>
                      <Slider
                        value={[tpsl.stopLossPercent]}
                        onValueChange={([value]) =>
                          setTpsl({ ...tpsl, stopLossPercent: value })
                        }
                        max={10}
                        min={0.5}
                        step={0.5}
                        className="w-full"
                      />
                      <p className="text-sm text-vibrant-secondary">
                        Limitar perdas quando a posição atingir -
                        {tpsl.stopLossPercent}%
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium text-vibrant">
                          Trailing Stop
                        </Label>
                        <p className="text-sm text-vibrant-secondary">
                          Ajustar stop loss automaticamente conforme o lucro
                          aumenta
                        </p>
                      </div>
                      <Switch
                        checked={tpsl.trailingEnabled}
                        onCheckedChange={trailingEnabled =>
                          setTpsl({ ...tpsl, trailingEnabled })
                        }
                      />
                    </div>

                    {tpsl.trailingEnabled && (
                      <div className="space-y-4">
                        <Label className="text-base font-medium text-vibrant">
                          Distância do Trailing ({tpsl.trailingDistance}%)
                        </Label>
                        <Slider
                          value={[tpsl.trailingDistance]}
                          onValueChange={([value]) =>
                            setTpsl({ ...tpsl, trailingDistance: value })
                          }
                          max={5}
                          min={0.5}
                          step={0.5}
                          className="w-full"
                        />
                        <p className="text-sm text-vibrant-secondary">
                          Manter stop loss a {tpsl.trailingDistance}% do preço
                          máximo atingido
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <h4 className="font-medium text-primary text-vibrant mb-2">Exemplo</h4>
                    <div className="text-sm space-y-1">
                      <p>Posição: Long BTC/USD a $50,000</p>
                      <p>Take Profit: $54,000 (+{tpsl.takeProfitPercent}%)</p>
                      <p>Stop Loss: $48,500 (-{tpsl.stopLossPercent}%)</p>
                      {tpsl.trailingEnabled && (
                        <p>Trailing: Ajustar SL conforme preço sobe</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entry Automation Tab */}
        <TabsContent value="entry" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-muted-foreground" />
                <div>
                  <CardTitle className="text-muted-foreground text-vibrant">
                    Entradas Automáticas
                  </CardTitle>
                  <CardDescription className="text-vibrant-secondary">
                    Abrir posições automaticamente baseado em sinais (Em
                    desenvolvimento)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-vibrant">Em Breve</h3>
                <p className="text-vibrant-secondary mb-4">
                  Esta funcionalidade estará disponível em uma próxima
                  atualização. Você poderá configurar entradas automáticas
                  baseadas em:
                </p>
                <div className="space-y-2 text-sm text-vibrant-secondary max-w-md mx-auto">
                  <p>• Indicadores técnicos (RSI, MACD, MA)</p>
                  <p>• Breakouts de suporte/resistência</p>
                  <p>• Sinais de volume anômalo</p>
                  <p>• Integração com TradingView</p>
                </div>
                <Button variant="outline" className="mt-6" disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar Estratégias
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};
