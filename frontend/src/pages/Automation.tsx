import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  TrendingUp, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Info
} from "lucide-react";
import { useForm } from "react-hook-form";

interface MarginGuardSettings {
  enabled: boolean;
  threshold: number;
  action: "reduce" | "close";
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
    action: "reduce",
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

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Automações</h1>
          <p className="text-muted-foreground">
            Configure suas proteções automáticas e estratégias de trading
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Info className="mr-2 h-4 w-4" />
            Ajuda
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isLoading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="margin-guard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="margin-guard">Margin Guard</TabsTrigger>
          <TabsTrigger value="tp-sl">Take Profit / Stop Loss</TabsTrigger>
          <TabsTrigger value="entry">Entradas Automáticas</TabsTrigger>
        </TabsList>

        {/* Margin Guard Tab */}
        <TabsContent value="margin-guard" className="space-y-6">
          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Margin Guard</CardTitle>
                    <CardDescription>
                      Proteção automática contra liquidação de posições
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={marginGuard.enabled}
                  onCheckedChange={(enabled) =>
                    setMarginGuard({ ...marginGuard, enabled })
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Atenção</p>
                    <p className="text-sm text-muted-foreground">
                      O Margin Guard irá executar ações automáticas quando o limite for atingido. 
                      Certifique-se de configurar os parâmetros adequadamente.
                    </p>
                  </div>
                </div>
              </div>

              {marginGuard.enabled && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">
                      Limite de Margem ({marginGuard.threshold}%)
                    </Label>
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
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Conservador (70%)</span>
                      <span>Moderado (85%)</span>
                      <span>Agressivo (95%)</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Ação ao Atingir Limite</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="reduce"
                            name="action"
                            checked={marginGuard.action === "reduce"}
                            onChange={() => setMarginGuard({ ...marginGuard, action: "reduce" })}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="reduce" className="cursor-pointer">
                            Reduzir Posição
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="close"
                            name="action"
                            checked={marginGuard.action === "close"}
                            onChange={() => setMarginGuard({ ...marginGuard, action: "close" })}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="close" className="cursor-pointer">
                            Fechar Posição Completamente
                          </Label>
                        </div>
                      </div>
                    </div>

                    {marginGuard.action === "reduce" && (
                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          Percentual de Redução ({marginGuard.reduction}%)
                        </Label>
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
                          Reduzir a posição em {marginGuard.reduction}% quando o limite for atingido
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <h4 className="font-medium text-success mb-2">Simulação</h4>
                    <div className="text-sm space-y-1">
                      <p>Posição atual: Long BTC/USD $15,000</p>
                      <p>Margem atual: 85% ($2,845)</p>
                      <p>
                        <strong>Se atingir {marginGuard.threshold}%:</strong>{" "}
                        {marginGuard.action === "reduce"
                          ? `Reduzir posição em ${marginGuard.reduction}% (${
                              (15000 * marginGuard.reduction) / 100
                            })`
                          : "Fechar posição completamente"}
                      </p>
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
                  onCheckedChange={(enabled) => setTpsl({ ...tpsl, enabled })}
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
                        Realizar lucros quando a posição atingir +{tpsl.takeProfitPercent}%
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
                        Limitar perdas quando a posição atingir -{tpsl.stopLossPercent}%
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Trailing Stop</Label>
                        <p className="text-sm text-muted-foreground">
                          Ajustar stop loss automaticamente conforme o lucro aumenta
                        </p>
                      </div>
                      <Switch
                        checked={tpsl.trailingEnabled}
                        onCheckedChange={(trailingEnabled) =>
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
                          Manter stop loss a {tpsl.trailingDistance}% do preço máximo atingido
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
                    Abrir posições automaticamente baseado em sinais (Em desenvolvimento)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Em Breve</h3>
                <p className="text-muted-foreground mb-4">
                  Esta funcionalidade estará disponível em uma próxima atualização.
                  Você poderá configurar entradas automáticas baseadas em:
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
  );
};