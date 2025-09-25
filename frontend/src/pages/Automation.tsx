import { useState, useEffect } from 'react';
import { useAutomationStore } from '@/stores/automation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Settings, Shield, Target, TrendingUp } from 'lucide-react';
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
    enabled: false,
    threshold: 90,
    reduction: 20,
  });

  const [tpsl, setTpsl] = useState<TakeProfitStopLossSettings>({
    enabled: false,
    takeProfitPercent: 8,
    stopLossPercent: 3,
    trailingEnabled: true,
    trailingDistance: 2,
  });

  const [originalMarginGuard, setOriginalMarginGuard] = useState<MarginGuardSettings | null>(null);
  const [originalTpsl, setOriginalTpsl] = useState<TakeProfitStopLossSettings | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Função para carregar dados do banco (reutilizável)
  const loadAutomationData = async () => {
    try {
      console.log('🔍 AUTOMATION - loadAutomationData iniciado');
      setIsDataLoaded(false); // Marcar como carregando novamente
      await fetchAutomations(); // Atualiza o store com dados do banco

      // Aguardar um pouco para o store ser atualizado
      await new Promise(resolve => setTimeout(resolve, 100));

      // Agora, com o store atualizado, atualize o estado local
      const marginGuardAutomation = automations.find((a) => a.type === 'margin_guard');
      const tpslAutomation = automations.find((a) => a.type === 'tp_sl');

      console.log('🔍 AUTOMATION - Automações encontradas após fetchAutomations:', {
        marginGuardAutomation,
        tpslAutomation,
        automationsCount: automations.length
      });

      const newMarginGuard = {
        enabled: marginGuardAutomation?.is_active ?? false,
        threshold: marginGuardAutomation?.config?.margin_threshold ?? 90,
        reduction: marginGuardAutomation?.config?.new_liquidation_distance ?? 20,
      };

      const newTpsl = {
        enabled: tpslAutomation?.is_active ?? false,
        takeProfitPercent: tpslAutomation?.config?.take_profit_percentage ?? 8,
        stopLossPercent: tpslAutomation?.config?.stop_loss_percentage ?? 3,
        trailingEnabled: tpslAutomation?.config?.trailing_stop ?? true,
        trailingDistance: tpslAutomation?.config?.trailing_distance ?? 2,
      };

      console.log('🔍 AUTOMATION - Novos valores calculados:', {
        newMarginGuard,
        newTpsl
      });

      setMarginGuard(newMarginGuard);
      setTpsl(newTpsl);

      // Atualizar os valores "originais" com os dados recém-carregados
      setOriginalMarginGuard(newMarginGuard);
      setOriginalTpsl(newTpsl);

      setIsDataLoaded(true);
      console.log('✅ AUTOMATION - Configurações recarregadas do banco após salvamento.');
    } catch (error) {
      console.error('❌ Erro ao recarregar dados após salvar:', error);
      toast.error('Erro ao recarregar configurações após salvar.');
    }
  };

  // Carregar dados iniciais apenas uma vez quando o componente monta
  useEffect(() => {
    loadAutomationData();
  }, []); // <- Executa apenas na montagem

  // Função para detectar mudanças
  const hasChanges = () => {
    if (!isDataLoaded || !originalMarginGuard || !originalTpsl) return false;

    const mgChanged =
      marginGuard.enabled !== originalMarginGuard.enabled ||
      marginGuard.threshold !== originalMarginGuard.threshold ||
      marginGuard.reduction !== originalMarginGuard.reduction;

    const tpslChanged =
      tpsl.enabled !== originalTpsl.enabled ||
      tpsl.takeProfitPercent !== originalTpsl.takeProfitPercent ||
      tpsl.stopLossPercent !== originalTpsl.stopLossPercent ||
      tpsl.trailingEnabled !== originalTpsl.trailingEnabled ||
      tpsl.trailingDistance !== originalTpsl.trailingDistance;

    const result = mgChanged || tpslChanged;
    console.log('🔍 AUTOMATION - Mudanças detectadas:', result, {
      marginGuard: { current: marginGuard, original: originalMarginGuard },
      tpsl: { current: tpsl, original: originalTpsl },
    });
    return result;
  };

  // Função de salvamento
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Salvar Margin Guard
      const marginGuardAutomation = automations.find((a) => a.type === 'margin_guard');
      const marginGuardConfig = {
        margin_threshold: marginGuard.threshold,
        action: 'add_margin',
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
        });
      }

      // Salvar TP/SL
      const tpslAutomation = automations.find((a) => a.type === 'tp_sl');
      const tpslConfig = {
        take_profit_percentage: tpsl.takeProfitPercent,
        stop_loss_percentage: tpsl.stopLossPercent,
        trailing_stop: tpsl.trailingEnabled,
        trailing_distance: tpsl.trailingDistance,
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
        });
      }

      // SALVAMENTO NO BANCO CONCLUÍDO COM SUCESSO
      console.log('✅ AUTOMATION - Salvamento no banco concluído com sucesso.');

      // ATUALIZAR ESTADO LOCAL COM DADOS DO BANCO (Mini Refresh)
      await loadAutomationData(); // <- CHAVE!

      // Opcional: Mostrar toast de sucesso
      toast.success('Configurações salvas com sucesso!', {
        description: 'Suas configurações de automação foram salvas e estão ativas.',
        duration: 4000,
      });
    } catch (error: any) {
      console.error('❌ Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações', {
        description: error.message || 'Tente novamente em alguns instantes.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (storeLoading && !isDataLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar configurações</p>
          <p className="text-sm text-muted-foreground">{storeError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automações</h1>
          <p className="text-muted-foreground">
            Configure suas automações de trading para maximizar lucros e minimizar riscos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges() && (
            <div className="flex items-center gap-2 text-sm text-warning">
              <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
              <span>Mudanças não salvas</span>
            </div>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isLoading || storeLoading || !hasChanges()}
            className={`flex items-center gap-2 ${
              hasChanges()
                ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            {isLoading || storeLoading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>

      {/* Seção de Margin Guard */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Margin Guard
                <Badge variant={marginGuard.enabled ? "default" : "secondary"}>
                  {marginGuard.enabled ? "Ativo" : "Inativo"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Adiciona margem automaticamente para afastar liquidação quando o preço se aproxima do limite
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Ativar Margin Guard</label>
              <p className="text-xs text-muted-foreground">
                {marginGuard.enabled 
                  ? "Margin Guard está ativo e monitorando suas posições" 
                  : "Margin Guard está desativado"
                }
              </p>
            </div>
            <Switch
              checked={marginGuard.enabled}
              onCheckedChange={(checked) => setMarginGuard(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {marginGuard.enabled && (
            <>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Trigger action when price reaches this percentage of distance to liquidation
                  </label>
                  <div className="mt-2 space-y-2">
                    <Slider
                      value={[marginGuard.threshold]}
                      onValueChange={([value]) => setMarginGuard(prev => ({ ...prev, threshold: value }))}
                      min={0.1}
                      max={100}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.1%</span>
                      <span className="font-medium">{marginGuard.threshold}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Margin Increase Percentage (%)
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Add this percentage of current margin to increase liquidation distance
                  </p>
                  <div className="mt-2 space-y-2">
                    <Slider
                      value={[marginGuard.reduction]}
                      onValueChange={([value]) => setMarginGuard(prev => ({ ...prev, reduction: value }))}
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1%</span>
                      <span className="font-medium">{marginGuard.reduction}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Exemplo:</strong> Adicionar {marginGuard.reduction}% da margem atual ($${
                    ((1000) * (50000) * marginGuard.reduction / 100).toLocaleString('pt-BR')
                  }) quando o preço atingir {marginGuard.threshold}% da distância para liquidação
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Seção de TP/SL */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Take Profit / Stop Loss
                <Badge variant={tpsl.enabled ? "default" : "secondary"}>
                  {tpsl.enabled ? "Ativo" : "Inativo"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Configure níveis de lucro e perda para fechar posições automaticamente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Ativar TP/SL</label>
              <p className="text-xs text-muted-foreground">
                {tpsl.enabled 
                  ? "Take Profit e Stop Loss estão ativos" 
                  : "Take Profit e Stop Loss estão desativados"
                }
              </p>
            </div>
            <Switch
              checked={tpsl.enabled}
              onCheckedChange={(checked) => setTpsl(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {tpsl.enabled && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Take Profit (%)</label>
                  <div className="space-y-2">
                    <Slider
                      value={[tpsl.takeProfitPercent]}
                      onValueChange={([value]) => setTpsl(prev => ({ ...prev, takeProfitPercent: value }))}
                      min={0.1}
                      max={100}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.1%</span>
                      <span className="font-medium">{tpsl.takeProfitPercent}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Stop Loss (%)</label>
                  <div className="space-y-2">
                    <Slider
                      value={[tpsl.stopLossPercent]}
                      onValueChange={([value]) => setTpsl(prev => ({ ...prev, stopLossPercent: value }))}
                      min={0.1}
                      max={100}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.1%</span>
                      <span className="font-medium">{tpsl.stopLossPercent}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Trailing Stop</label>
                    <p className="text-xs text-muted-foreground">
                      Ajusta automaticamente o stop loss conforme o preço se move a favor
                    </p>
                  </div>
                  <Switch
                    checked={tpsl.trailingEnabled}
                    onCheckedChange={(checked) => setTpsl(prev => ({ ...prev, trailingEnabled: checked }))}
                  />
                </div>

                {tpsl.trailingEnabled && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Distância Trailing (%)</label>
                    <div className="space-y-2">
                      <Slider
                        value={[tpsl.trailingDistance]}
                        onValueChange={([value]) => setTpsl(prev => ({ ...prev, trailingDistance: value }))}
                        min={0.1}
                        max={10}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0.1%</span>
                        <span className="font-medium">{tpsl.trailingDistance}%</span>
                        <span>10%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};