import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Zap, Copy, RotateCcw, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';

interface PositionCreationModalProps {
  onCreatePosition: (positionData: any) => void;
  disabled?: boolean;
}

export function PositionCreationModal({ onCreatePosition, disabled }: PositionCreationModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { price: btcPrice, changePercent24h, formatPrice, getPriceVariation, isLoading: priceLoading } = useBitcoinPrice();

  // Form state
  const [formData, setFormData] = useState({
    side: 'long', // 'long' or 'short'
    quantity: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    margin: '',
    leverage: '10',
    notes: ''
  });

  const [autoFillUsed, setAutoFillUsed] = useState(false);

  // Auto-fill data templates using real BTC price
  const getAutoFillTemplates = () => {
    const currentPrice = btcPrice || 65000;
    const price5Percent = currentPrice * 0.05;
    const price10Percent = currentPrice * 0.10;
    
    return {
      conservative: {
        side: 'long',
        quantity: '100',
        entryPrice: currentPrice.toString(),
        stopLoss: (currentPrice - price5Percent).toString(),
        takeProfit: (currentPrice + price5Percent).toString(),
        margin: '1000',
        leverage: '10',
        notes: `Conservative long position - BTC @ ${formatPrice(currentPrice)}`
      },
      aggressive: {
        side: 'short',
        quantity: '500',
        entryPrice: currentPrice.toString(),
        stopLoss: (currentPrice + price10Percent).toString(),
        takeProfit: (currentPrice - price10Percent).toString(),
        margin: '5000',
        leverage: '20',
        notes: `Aggressive short position - BTC @ ${formatPrice(currentPrice)}`
      },
      scalping: {
        side: 'long',
        quantity: '50',
        entryPrice: currentPrice.toString(),
        stopLoss: (currentPrice - (currentPrice * 0.003)).toString(), // 0.3%
        takeProfit: (currentPrice + (currentPrice * 0.003)).toString(), // 0.3%
        margin: '500',
        leverage: '5',
        notes: `Quick scalp trade - BTC @ ${formatPrice(currentPrice)}`
      },
      swing: {
        side: 'long',
        quantity: '200',
        entryPrice: (currentPrice * 0.98).toString(), // 2% below current
        stopLoss: (currentPrice * 0.92).toString(), // 8% below current
        takeProfit: (currentPrice * 1.15).toString(), // 15% above current
        margin: '2000',
        leverage: '15',
        notes: `Swing trade - BTC @ ${formatPrice(currentPrice)}`
      }
    };
  };

  const handleAutoFill = (template: keyof ReturnType<typeof getAutoFillTemplates>) => {
    const templates = getAutoFillTemplates();
    const templateData = templates[template];
    setFormData(templateData);
    setAutoFillUsed(true);
    
    toast({
      title: "Auto-fill aplicado!",
      description: `Template ${template} carregado com preço atual do BTC.`,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.quantity || !formData.entryPrice || !formData.margin) {
        toast({
          title: "Erro",
          description: "Preencha pelo menos: Quantidade, Preço de Entrada e Margin.",
          variant: "destructive",
        });
        return;
      }

      // Create position data
      const positionData = {
        side: formData.side,
        quantity: parseFloat(formData.quantity),
        entry_price: parseFloat(formData.entryPrice),
        stop_loss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
        take_profit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
        margin: parseFloat(formData.margin),
        leverage: parseInt(formData.leverage),
        notes: formData.notes,
        created_at: new Date().toISOString(),
        status: 'open'
      };

      // Call parent function to create position
      await onCreatePosition(positionData);

      // Reset form
      setFormData({
        side: 'long',
        quantity: '',
        entryPrice: '',
        stopLoss: '',
        takeProfit: '',
        margin: '',
        leverage: '10',
        notes: ''
      });
      setAutoFillUsed(false);
      setOpen(false);

      toast({
        title: "Posição criada!",
        description: "Nova posição foi criada com sucesso.",
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar posição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateRisk = () => {
    if (!formData.entryPrice || !formData.stopLoss || !formData.quantity) return null;
    
    const entryPrice = parseFloat(formData.entryPrice);
    const stopLoss = parseFloat(formData.stopLoss);
    const quantity = parseFloat(formData.quantity);
    const side = formData.side;
    
    let riskAmount;
    if (side === 'long') {
      riskAmount = Math.abs(entryPrice - stopLoss) * quantity;
    } else {
      riskAmount = Math.abs(stopLoss - entryPrice) * quantity;
    }
    
    return riskAmount.toFixed(2);
  };

  const calculateReward = () => {
    if (!formData.entryPrice || !formData.takeProfit || !formData.quantity) return null;
    
    const entryPrice = parseFloat(formData.entryPrice);
    const takeProfit = parseFloat(formData.takeProfit);
    const quantity = parseFloat(formData.quantity);
    const side = formData.side;
    
    let rewardAmount;
    if (side === 'long') {
      rewardAmount = Math.abs(takeProfit - entryPrice) * quantity;
    } else {
      rewardAmount = Math.abs(entryPrice - takeProfit) * quantity;
    }
    
    return rewardAmount.toFixed(2);
  };

  const riskRewardRatio = () => {
    const risk = calculateRisk();
    const reward = calculateReward();
    
    if (!risk || !reward) return null;
    
    const ratio = parseFloat(reward) / parseFloat(risk);
    return ratio.toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Posição
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Criar Nova Posição
          </DialogTitle>
          <DialogDescription>
            Crie uma nova posição usando preços reais do mercado ou templates automáticos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current BTC Price */}
          <Card className="bg-[#1A1A1A] border-[#2A3441]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#E6E6E6]" />
                  <span className="text-[#E6E6E6] font-medium">Preço Atual do BTC</span>
                </div>
                <div className="text-right">
                  {priceLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span className="text-[#B8BCC8]">Carregando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-[#E6E6E6]">
                        {formatPrice(btcPrice)}
                      </span>
                      <div className={`flex items-center gap-1 text-sm ${getPriceVariation().color}`}>
                        <span>{getPriceVariation().icon}</span>
                        <span>{getPriceVariation().sign}{Math.abs(changePercent24h).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#B8BCC8] mt-2">
                Os templates automáticos usam este preço como base para cálculos
              </p>
            </CardContent>
          </Card>

          {/* Auto-fill Templates */}
          <Card className="bg-[#1A1A1A] border-[#2A3441]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Templates Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAutoFill('conservative')}
                  className="text-xs"
                >
                  Conservative
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAutoFill('aggressive')}
                  className="text-xs"
                >
                  Aggressive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAutoFill('scalping')}
                  className="text-xs"
                >
                  Scalping
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAutoFill('swing')}
                  className="text-xs"
                >
                  Swing Trade
                </Button>
              </div>
              {autoFillUsed && (
                <Badge variant="secondary" className="mt-2">
                  Template aplicado ✓
                </Badge>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Position Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="side" className="text-[#E6E6E6]">Lado da Posição</Label>
                <Select
                  value={formData.side}
                  onValueChange={(value) => handleInputChange('side', value)}
                >
                  <SelectTrigger className="bg-[#1A1A1A] border-[#2A3441] text-[#E6E6E6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#2A3441]">
                    <SelectItem value="long" className="text-[#E6E6E6] hover:bg-[#2A3441]">Long (Compra)</SelectItem>
                    <SelectItem value="short" className="text-[#E6E6E6] hover:bg-[#2A3441]">Short (Venda)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leverage" className="text-[#E6E6E6]">Leverage</Label>
                <Select
                  value={formData.leverage}
                  onValueChange={(value) => handleInputChange('leverage', value)}
                >
                  <SelectTrigger className="bg-[#1A1A1A] border-[#2A3441] text-[#E6E6E6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#2A3441]">
                    <SelectItem value="1" className="text-[#E6E6E6] hover:bg-[#2A3441]">1x</SelectItem>
                    <SelectItem value="2" className="text-[#E6E6E6] hover:bg-[#2A3441]">2x</SelectItem>
                    <SelectItem value="5" className="text-[#E6E6E6] hover:bg-[#2A3441]">5x</SelectItem>
                    <SelectItem value="10" className="text-[#E6E6E6] hover:bg-[#2A3441]">10x</SelectItem>
                    <SelectItem value="20" className="text-[#E6E6E6] hover:bg-[#2A3441]">20x</SelectItem>
                    <SelectItem value="50" className="text-[#E6E6E6] hover:bg-[#2A3441]">50x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Position Size */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-[#E6E6E6]">Quantidade (USD)</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="100"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className="bg-[#1A1A1A] border-[#2A3441] text-[#E6E6E6] placeholder:text-[#B8BCC8]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin" className="text-[#E6E6E6]">Margin (Sats)</Label>
                <Input
                  id="margin"
                  type="number"
                  placeholder="1000"
                  value={formData.margin}
                  onChange={(e) => handleInputChange('margin', e.target.value)}
                  className="bg-[#1A1A1A] border-[#2A3441] text-[#E6E6E6] placeholder:text-[#B8BCC8]"
                  required
                />
              </div>
            </div>

            {/* Entry Price */}
            <div className="space-y-2">
              <Label htmlFor="entryPrice" className="text-[#E6E6E6]">Preço de Entrada (USD)</Label>
              <div className="relative">
                <Input
                  id="entryPrice"
                  type="number"
                  placeholder={btcPrice ? btcPrice.toString() : "65000"}
                  value={formData.entryPrice}
                  onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                  className="bg-[#1A1A1A] border-[#2A3441] text-[#E6E6E6] placeholder:text-[#B8BCC8]"
                  required
                />
                {btcPrice && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange('entryPrice', btcPrice.toString())}
                    className="absolute right-1 top-1 h-8 px-2 text-xs bg-[#2A3441] hover:bg-[#3A4451] text-[#E6E6E6]"
                  >
                    Usar Preço Atual
                  </Button>
                )}
              </div>
            </div>

            {/* Stop Loss & Take Profit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stopLoss" className="text-[#E6E6E6]">Stop Loss (USD)</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  placeholder="62000"
                  value={formData.stopLoss}
                  onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                  className="bg-[#1A1A1A] border-[#2A3441] text-[#E6E6E6] placeholder:text-[#B8BCC8]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="takeProfit" className="text-[#E6E6E6]">Take Profit (USD)</Label>
                <Input
                  id="takeProfit"
                  type="number"
                  placeholder="68000"
                  value={formData.takeProfit}
                  onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                  className="bg-[#1A1A1A] border-[#2A3441] text-[#E6E6E6] placeholder:text-[#B8BCC8]"
                />
              </div>
            </div>

            {/* Risk/Reward Analysis */}
            {(calculateRisk() || calculateReward()) && (
              <Card className="bg-[#1A1A1A] border-[#2A3441]">
                <CardHeader>
                  <CardTitle className="text-sm text-[#E6E6E6]">Análise Risk/Reward</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-[#B8BCC8]">Risco</div>
                      <div className="font-semibold text-red-400">
                        ${calculateRisk() || '0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#B8BCC8]">Reward</div>
                      <div className="font-semibold text-green-400">
                        ${calculateReward() || '0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#B8BCC8]">Ratio</div>
                      <div className="font-semibold text-[#E6E6E6]">
                        1:{riskRewardRatio() || '0'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[#E6E6E6]">Observações</Label>
              <Input
                id="notes"
                placeholder="Ex: Trade baseado em análise técnica..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="bg-[#1A1A1A] border-[#2A3441] text-[#E6E6E6] placeholder:text-[#B8BCC8]"
              />
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Criar Posição
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
