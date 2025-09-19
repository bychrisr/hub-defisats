import { useState } from 'react';
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

interface MarginGuardSettings {
  enabled: boolean;
  threshold: number;
  action: 'reduce' | 'close';
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
    action: 'reduce',
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
  
  // Hook para buscar preço do BTC
  const { data: btcPrice, loading: btcLoading, error: btcError, refetch: refetchBtc } = useBtcPrice();

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
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
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Configuração de Automações
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
                  Configure suas proteções automáticas e estratégias de trading inteligentes
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isLoading ? 'Salvando...' : 'Salvar Configurações'}
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
                      <CardTitle className="text-xl sm:text-2xl">Margin Guard</CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        Proteção automática contra liquidação de posições
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={marginGuard.enabled ? "default" : "secondary"}
                      className="px-3 py-1"
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
                      <p className="text-sm text-muted-foreground">
                        O Margin Guard irá executar ações automáticas quando o
                        limite for atingido. Certifique-se de configurar os
                        parâmetros adequadamente.
                      </p>
                    </div>
                  </div>
                </div>

                {marginGuard.enabled && (
                  <div className="space-y-6">
                    {/* Margin Threshold Slider */}
                    <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">
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
                      <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                        <span>Conservador (70%)</span>
                        <span>Moderado (85%)</span>
                        <span>Agressivo (95%)</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Action Selection */}
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4 p-4 bg-muted/20 rounded-xl">
                        <Label className="text-base font-medium">
                          Ação ao Atingir Limite
                        </Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 p-3 rounded-lg border border-muted/50 hover:border-primary/50 transition-colors">
                            <input
                              type="radio"
                              id="reduce"
                              name="action"
                              checked={marginGuard.action === 'reduce'}
                              onChange={() =>
                                setMarginGuard({
                                  ...marginGuard,
                                  action: 'reduce',
                                })
                              }
                              className="w-4 h-4 text-primary"
                            />
                            <Label htmlFor="reduce" className="cursor-pointer flex-1">
                              <div className="font-medium">Reduzir Posição</div>
                              <div className="text-sm text-muted-foreground">
                                Diminuir tamanho da posição
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 rounded-lg border border-muted/50 hover:border-primary/50 transition-colors">
                            <input
                              type="radio"
                              id="close"
                              name="action"
                              checked={marginGuard.action === 'close'}
                              onChange={() =>
                                setMarginGuard({
                                  ...marginGuard,
                                  action: 'close',
                                })
                              }
                              className="w-4 h-4 text-primary"
                            />
                            <Label htmlFor="close" className="cursor-pointer flex-1">
                              <div className="font-medium">Fechar Posição</div>
                              <div className="text-sm text-muted-foreground">
                                Fechar posição completamente
                              </div>
                            </Label>
                          </div>
                        </div>
                      </div>

                      {marginGuard.action === 'reduce' && (
                        <div className="space-y-4 p-4 bg-muted/20 rounded-xl">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">
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
                          <p className="text-sm text-muted-foreground">
                            Reduzir a posição em {marginGuard.reduction}% quando o
                            limite for atingido
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Simulation Card */}
                    <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <h4 className="font-medium text-success">Simulação</h4>
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
                      
                      <div className="space-y-3 text-sm">
                        {/* Preço atual do BTC */}
                        <div className="p-3 bg-background/50 rounded-lg border border-success/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground">Preço atual BTC:</span>
                            {btcLoading ? (
                              <div className="flex items-center gap-2">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                <span className="text-muted-foreground">Carregando...</span>
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
                            <div className="text-xs text-muted-foreground">
                              Atualizado: {btcPrice.lastUpdated}
                            </div>
                          )}
                        </div>

                        {/* Simulação da posição */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Posição simulada:</span>
                            <span className="font-medium">
                              Long BTC/USD {btcPrice ? `$${btcPrice.price.toLocaleString('pt-BR')}` : '$50,000'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Margem atual:</span>
                            <span className="font-medium">85% ($2,845)</span>
                          </div>
                          <div className="pt-2 border-t border-success/20">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Se atingir {marginGuard.threshold}%:</span>
                            </div>
                            <div className="mt-1 font-medium text-success">
                              {marginGuard.action === 'reduce'
                                ? `Reduzir posição em ${marginGuard.reduction}% ($${
                                    btcPrice 
                                      ? ((btcPrice.price * 0.1) * marginGuard.reduction / 100).toLocaleString('pt-BR')
                                      : ((50000 * 0.1) * marginGuard.reduction / 100).toLocaleString('pt-BR')
                                  })`
                                : 'Fechar posição completamente'}
                            </div>
                          </div>
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
                    <CardTitle>Take Profit / Stop Loss</CardTitle>
                    <CardDescription>
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
                      <Label className="text-base font-medium">
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
                      <p className="text-sm text-muted-foreground">
                        Realizar lucros quando a posição atingir +
                        {tpsl.takeProfitPercent}%
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">
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
                      <p className="text-sm text-muted-foreground">
                        Limitar perdas quando a posição atingir -
                        {tpsl.stopLossPercent}%
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">
                          Trailing Stop
                        </Label>
                        <p className="text-sm text-muted-foreground">
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
                        <Label className="text-base font-medium">
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
                        <p className="text-sm text-muted-foreground">
                          Manter stop loss a {tpsl.trailingDistance}% do preço
                          máximo atingido
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <h4 className="font-medium text-primary mb-2">Exemplo</h4>
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
                  <CardTitle className="text-muted-foreground">
                    Entradas Automáticas
                  </CardTitle>
                  <CardDescription>
                    Abrir posições automaticamente baseado em sinais (Em
                    desenvolvimento)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Em Breve</h3>
                <p className="text-muted-foreground mb-4">
                  Esta funcionalidade estará disponível em uma próxima
                  atualização. Você poderá configurar entradas automáticas
                  baseadas em:
                </p>
                <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
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
