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
import { useAutomationStore } from '@/stores/automation';
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
  const {
    automations,
    fetchAutomations,
    createAutomation,
    updateAutomation,
    isLoading: storeLoading,
    error: storeError,
  } = useAutomationStore();

  const [marginGuard, setMarginGuard] = useState<MarginGuardSettings>({
    enabled: true,
    threshold: 90,
    reduction: 20,
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [originalValues, setOriginalValues] = useState<{
    marginGuard: MarginGuardSettings | null;
    tpsl: TakeProfitStopLossSettings | null;
  }>({ marginGuard: null, tpsl: null });
  
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
    
    // Encontrar a posição mais próxima de ser liquidada considerando a direção do movimento
    const closestPosition = openPositions.reduce((closestToLiquidation, current) => {
      const currentLiquidationPrice = current.liquidation || 0;
      const closestLiquidationPrice = closestToLiquidation.liquidation || 0;
      
      // Calcular a distância considerando a direção do movimento
      let currentRisk = 0;
      let closestRisk = 0;
      
      if (current.side === 'long') {
        // LONG: risco aumenta quando preço cai (liquidação abaixo do preço atual)
        currentRisk = currentLiquidationPrice > currentBtcPrice ? 
          currentLiquidationPrice - currentBtcPrice : // Ainda não atingiu liquidação
          currentBtcPrice - currentLiquidationPrice; // Já passou da liquidação (muito arriscado)
      } else {
        // SHORT: risco aumenta quando preço sobe (liquidação acima do preço atual)
        currentRisk = currentLiquidationPrice < currentBtcPrice ? 
          currentBtcPrice - currentLiquidationPrice : // Ainda não atingiu liquidação
          currentLiquidationPrice - currentBtcPrice; // Já passou da liquidação (muito arriscado)
      }
      
      if (closestToLiquidation.side === 'long') {
        closestRisk = closestLiquidationPrice > currentBtcPrice ? 
          closestLiquidationPrice - currentBtcPrice :
          currentBtcPrice - closestLiquidationPrice;
      } else {
        closestRisk = closestLiquidationPrice < currentBtcPrice ? 
          currentBtcPrice - closestLiquidationPrice :
          closestLiquidationPrice - currentBtcPrice;
      }
      
      console.log('🔍 AUTOMATION - Comparing positions with direction:', {
        current: {
          id: current.id,
          side: current.side,
          liquidation: currentLiquidationPrice,
          risk: currentRisk,
          btcPrice: currentBtcPrice
        },
        closest: {
          id: closestToLiquidation.id,
          side: closestToLiquidation.side,
          liquidation: closestLiquidationPrice,
          risk: closestRisk,
          btcPrice: currentBtcPrice
        }
      });
      
      // Menor risco = mais próximo de liquidar
      return currentRisk < closestRisk ? current : closestToLiquidation;
    });
    
    // Calcular o risco final da posição selecionada
    const finalRisk = closestPosition.side === 'long' ? 
      (closestPosition.liquidation || 0) > currentBtcPrice ? 
        (closestPosition.liquidation || 0) - currentBtcPrice :
        currentBtcPrice - (closestPosition.liquidation || 0) :
      (closestPosition.liquidation || 0) < currentBtcPrice ? 
        currentBtcPrice - (closestPosition.liquidation || 0) :
        (closestPosition.liquidation || 0) - currentBtcPrice;
    
    console.log('✅ AUTOMATION - Closest position found:', {
      id: closestPosition.id,
      side: closestPosition.side,
      liquidation: closestPosition.liquidation,
      btcPrice: currentBtcPrice,
      risk: finalRisk,
      riskDescription: closestPosition.side === 'long' ? 
        'Liquidação abaixo do preço atual' : 
        'Liquidação acima do preço atual'
    });
    
    return closestPosition;
  };

  // Obter a posição mais arriscada para simulação
  const mostRiskyPosition = getMostRiskyPosition();

  // Calcular o preço de ativação baseado no threshold
  const getActivationPrice = () => {
    if (!mostRiskyPosition || !btcPrice) return null;
    
    const liquidationPrice = mostRiskyPosition.liquidation || 0;
    const currentPrice = btcPrice.price;
    const threshold = marginGuard.threshold / 100; // Converter para decimal
    
    if (mostRiskyPosition.side === 'long') {
      // LONG: ativação quando preço cai para X% da distância até liquidação
      // Fórmula: preço_atual - (preço_atual - liquidação) * threshold
      const distanceToLiquidation = currentPrice - liquidationPrice;
      return currentPrice - (distanceToLiquidation * threshold);
    } else {
      // SHORT: ativação quando preço sobe para X% da distância até liquidação
      // Fórmula: preço_atual + (liquidação - preço_atual) * threshold
      const distanceToLiquidation = liquidationPrice - currentPrice;
      return currentPrice + (distanceToLiquidation * threshold);
    }
  };

  const activationPrice = getActivationPrice();

  // Calcular distância percentual até a liquidação
  const getLiquidationDistance = () => {
    if (!mostRiskyPosition || !btcPrice) return null;
    
    const currentPrice = btcPrice.price;
    const liquidationPrice = mostRiskyPosition.liquidation || 0;
    
    if (mostRiskyPosition.side === 'long') {
      // LONG: distância quando preço cai até liquidação
      // Fórmula: ((preço_atual - liquidação) / preço_atual) * 100
      return ((currentPrice - liquidationPrice) / currentPrice) * 100;
    } else {
      // SHORT: distância quando preço sobe até liquidação
      // Fórmula: ((liquidação - preço_atual) / preço_atual) * 100
      return ((liquidationPrice - currentPrice) / currentPrice) * 100;
    }
  };

  const liquidationDistance = getLiquidationDistance();

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

  // Carregar automações existentes
  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  // Carregar configurações existentes das automações
  useEffect(() => {
    console.log('🔍 AUTOMATION - Loading configurations from store:', {
      automations,
      automationsLength: automations.length,
      storeLoading
    });

    const marginGuardAutomation = automations.find(a => a.type === 'margin_guard');
    const tpslAutomation = automations.find(a => a.type === 'tp_sl');

    console.log('🔍 AUTOMATION - Found automations:', {
      marginGuardAutomation,
      tpslAutomation
    });

    const newMarginGuard = {
      enabled: marginGuardAutomation?.is_active || false,
      threshold: marginGuardAutomation?.config.margin_threshold || 90,
      reduction: marginGuardAutomation?.config.new_liquidation_distance || 20,
    };

    const newTpsl = {
      enabled: tpslAutomation?.is_active || false,
      takeProfitPercent: tpslAutomation?.config.take_profit_percentage || 8,
      stopLossPercent: tpslAutomation?.config.stop_loss_percentage || 3,
      trailingEnabled: tpslAutomation?.config.trailing_stop || false,
      trailingDistance: tpslAutomation?.config.trailing_percentage || 2,
    };

    console.log('🔍 AUTOMATION - New configurations:', {
      newMarginGuard,
      newTpsl
    });

    if (marginGuardAutomation) {
      setMarginGuard(newMarginGuard);
    }

    if (tpslAutomation) {
      setTpsl(newTpsl);
    }

    // Salvar valores originais para comparação
    setOriginalValues({
      marginGuard: marginGuardAutomation ? newMarginGuard : null,
      tpsl: tpslAutomation ? newTpsl : null,
    });

    // Reset hasUnsavedChanges quando carregar configurações do banco
    setHasUnsavedChanges(false);
    setIsInitialLoad(false);
    
    console.log('🔍 AUTOMATION - After loading - hasUnsavedChanges: false, isInitialLoad: false');
  }, [automations]);

  // Reset do estado quando as automações são carregadas
  useEffect(() => {
    if (automations.length > 0 && !storeLoading) {
      setHasUnsavedChanges(false);
      setIsInitialLoad(false);
    }
  }, [automations, storeLoading]);

  // Detectar mudanças nas configurações (apenas após carregamento inicial)
  useEffect(() => {
    console.log('🔍 AUTOMATION - Change detection triggered:', {
      isInitialLoad,
      storeLoading,
      hasOriginalValues: !!(originalValues.marginGuard && originalValues.tpsl),
      marginGuard,
      tpsl,
      originalValues,
      automationsLength: automations.length
    });
    
    // Só marca como não salvo se não for carregamento inicial e não estiver carregando
    if (!isInitialLoad && !storeLoading && originalValues.marginGuard && originalValues.tpsl) {
      let hasRealChanges = false;
      
      // Comparar Margin Guard com valores originais
      if (originalValues.marginGuard) {
        const mgChanged = marginGuard.enabled !== originalValues.marginGuard.enabled || 
            marginGuard.threshold !== originalValues.marginGuard.threshold || 
            marginGuard.reduction !== originalValues.marginGuard.reduction;
        
        console.log('🔍 AUTOMATION - Margin Guard comparison:', {
          current: marginGuard,
          original: originalValues.marginGuard,
          changed: mgChanged
        });
        
        if (mgChanged) {
          hasRealChanges = true;
        }
      }
      
      // Comparar TP/SL com valores originais
      if (originalValues.tpsl) {
        const tpslChanged = tpsl.enabled !== originalValues.tpsl.enabled || 
            tpsl.takeProfitPercent !== originalValues.tpsl.takeProfitPercent || 
            tpsl.stopLossPercent !== originalValues.tpsl.stopLossPercent ||
            tpsl.trailingEnabled !== originalValues.tpsl.trailingEnabled ||
            tpsl.trailingDistance !== originalValues.tpsl.trailingDistance;
        
        console.log('🔍 AUTOMATION - TP/SL comparison:', {
          current: tpsl,
          original: originalValues.tpsl,
          changed: tpslChanged
        });
        
        if (tpslChanged) {
          hasRealChanges = true;
        }
      }
      
      console.log('🔍 AUTOMATION - Final change detection result:', hasRealChanges);
      setHasUnsavedChanges(hasRealChanges);
    } else {
      console.log('🔍 AUTOMATION - Skipping change detection:', {
        reason: !isInitialLoad ? 'isInitialLoad is true' : 
                storeLoading ? 'storeLoading is true' : 
                !originalValues.marginGuard ? 'no original marginGuard' :
                !originalValues.tpsl ? 'no original tpsl' : 'unknown'
      });
    }
  }, [marginGuard, tpsl, isInitialLoad, storeLoading, originalValues, automations.length]);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Salvar Margin Guard
      const marginGuardAutomation = automations.find(a => a.type === 'margin_guard');
      const marginGuardConfig = {
        margin_threshold: marginGuard.threshold,
        action: 'increase_liquidation_distance',
        new_liquidation_distance: marginGuard.reduction,
        enabled: marginGuard.enabled,
      };

      if (marginGuardAutomation) {
        await updateAutomation(marginGuardAutomation.id, {
          config: marginGuardConfig,
          is_active: marginGuard.enabled,
        });
      } else {
        await createAutomation({
          type: 'margin_guard',
          config: marginGuardConfig,
          is_active: marginGuard.enabled,
        });
      }

      // Salvar TP/SL
      const tpslAutomation = automations.find(a => a.type === 'tp_sl');
      const tpslConfig = {
        take_profit_percentage: tpsl.takeProfitPercent,
        stop_loss_percentage: tpsl.stopLossPercent,
        trailing_stop: tpsl.trailingEnabled,
        trailing_percentage: tpsl.trailingDistance,
        enabled: tpsl.enabled,
      };

      if (tpslAutomation) {
        await updateAutomation(tpslAutomation.id, {
          config: tpslConfig,
          is_active: tpsl.enabled,
        });
      } else {
        await createAutomation({
          type: 'tp_sl',
          config: tpslConfig,
          is_active: tpsl.enabled,
        });
      }
      
      // Atualizar valores originais após salvar
      const newOriginalValues = {
        marginGuard: { ...marginGuard },
        tpsl: { ...tpsl },
      };
      
      console.log('🔍 AUTOMATION - Updating original values after save:', newOriginalValues);
      setOriginalValues(newOriginalValues);
      
      setHasUnsavedChanges(false);
      setIsInitialLoad(false); // Permitir detecção de mudanças futuras
      console.log('🔍 AUTOMATION - After save - hasUnsavedChanges: false, isInitialLoad: false');
      toast.success('Configurações salvas com sucesso!', {
        description: 'Suas configurações de automação foram salvas e estão ativas.',
        duration: 4000,
      });
      
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações', {
        description: error.message || 'Ocorreu um erro ao salvar suas configurações. Tente novamente.',
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
                  disabled={isLoading || storeLoading || !hasUnsavedChanges}
                  className={`flex-1 sm:flex-none ${
                    hasUnsavedChanges 
                      ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isLoading || storeLoading ? 'Salvando...' : hasUnsavedChanges ? 'Salvar Configurações' : 'Configurações Salvas'}
                </Button>
                {/* Debug info */}
                <div className="text-xs text-gray-500 mt-2">
                  Debug: hasUnsavedChanges={hasUnsavedChanges.toString()}, isLoading={isLoading.toString()}, storeLoading={storeLoading.toString()}
                </div>
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
                          Quando o preço do Bitcoin chegar na distância de {marginGuard.threshold}% do preço de liquidação
                        </p>
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-muted/50">
                          <p className="text-xs font-medium text-vibrant mb-2">Exemplo:</p>
                          <div className="space-y-1 text-xs text-vibrant-secondary">
                            <p>• Minha posição mais próxima de ser liquidada: {mostRiskyPosition ? `${mostRiskyPosition.side === 'long' ? 'LONG' : 'SHORT'} - ${mostRiskyPosition.symbol || 'BTC/USD'}` : 'LONG - BTC/USD'}</p>
                            <p>• Preço atual do Bitcoin: $ {btcPrice ? btcPrice.price.toLocaleString('pt-BR') : 'XXXX'}</p>
                            <p>• Preço de liquidação: $ {mostRiskyPosition ? (mostRiskyPosition.liquidation || 0).toLocaleString('pt-BR') : 'XXXX'}</p>
                            <p>• Valor de ativação ({marginGuard.threshold}%): $ {activationPrice ? activationPrice.toLocaleString('pt-BR') : 'XXXX'}</p>
                          </div>
                        </div>
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
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Posição mais próxima de ser liquidada */}
                        {mostRiskyPosition && (
                          <div className="p-3 bg-background/50 rounded-lg border border-warning/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-vibrant-secondary">Posição mais próxima de ser liquidada:</span>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={mostRiskyPosition.side === 'long' ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {mostRiskyPosition.side === 'long' ? 'LONG' : 'SHORT'}
                                </Badge>
                                <span className="font-bold text-lg text-warning">
                                  ${(mostRiskyPosition.liquidation || 0).toLocaleString('pt-BR')}
                                </span>
                                {liquidationDistance !== null && (
                                  <Badge 
                                    variant={liquidationDistance < 5 ? "destructive" : liquidationDistance < 10 ? "secondary" : "default"}
                                    className="text-xs"
                                  >
                                    {liquidationDistance.toFixed(1)}% distância
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TODO: Simulação Real - Seção comentada para futuras modificações */}
                        {/* 
                        <div className="space-y-2">
                          {mostRiskyPosition ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-vibrant-secondary">Margem atual:</span>
                                <span className={`font-medium ${(mostRiskyPosition.marginRatio || 0) < 20 ? 'text-destructive' : (mostRiskyPosition.marginRatio || 0) < 50 ? 'text-warning' : 'text-success'}`}>
                                  {(mostRiskyPosition.margin || 0).toLocaleString('pt-BR')} sats (${((mostRiskyPosition.margin || 0) * (btcPrice?.price || 0) / 100000000).toFixed(2)} × {(mostRiskyPosition.leverage || 0).toFixed(0)}x alavancado)
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-vibrant-secondary">P&L atual:</span>
                                <span className={`font-medium ${(mostRiskyPosition.pnl || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  ${(mostRiskyPosition.pnl || 0).toLocaleString('pt-BR')} ({(mostRiskyPosition.pnlPercent || 0).toFixed(1)}%)
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
                        */}
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
