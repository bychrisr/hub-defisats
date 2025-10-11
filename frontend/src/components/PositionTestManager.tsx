import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Zap, Database, Trash2, Plus, Settings } from 'lucide-react';
import { usePositionCreation } from '@/hooks/usePositionCreation';
import { useToast } from '@/hooks/use-toast';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';

interface PositionTestManagerProps {
  disabled?: boolean;
}

export function PositionTestManager({ disabled }: PositionTestManagerProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { generateTestPositions, createMultiplePositions, loading } = usePositionCreation();
  const { price: btcPrice, formatPrice } = useBitcoinPrice();

  const getPredefinedSets = () => {
    const currentPrice = btcPrice || 65000;
    const priceVariation = currentPrice * 0.05; // 5% variation
    
    return [
      {
        name: 'Conjunto Básico',
        description: `5 posições variadas para teste básico @ ${formatPrice(currentPrice)}`,
        count: 5,
        positions: [
          { side: 'long', quantity: 100, entry_price: currentPrice, margin: 1000, leverage: 10, notes: 'Long básico' },
          { side: 'short', quantity: 200, entry_price: currentPrice + priceVariation, margin: 2000, leverage: 15, notes: 'Short básico' },
          { side: 'long', quantity: 50, entry_price: currentPrice, margin: 500, leverage: 5, notes: 'Scalping' },
          { side: 'long', quantity: 300, entry_price: currentPrice - priceVariation, margin: 3000, leverage: 20, notes: 'Swing trade' },
          { side: 'short', quantity: 150, entry_price: currentPrice + priceVariation, margin: 1500, leverage: 12, notes: 'Short médio prazo' }
        ]
      },
      {
        name: 'Conjunto Agressivo',
        description: `8 posições com leverage alto @ ${formatPrice(currentPrice)}`,
        count: 8,
        positions: [
          { side: 'long', quantity: 500, entry_price: currentPrice, margin: 5000, leverage: 50, notes: 'Long 50x' },
          { side: 'short', quantity: 300, entry_price: currentPrice + priceVariation, margin: 3000, leverage: 30, notes: 'Short 30x' },
          { side: 'long', quantity: 200, entry_price: currentPrice, margin: 2000, leverage: 25, notes: 'Long 25x' },
          { side: 'short', quantity: 400, entry_price: currentPrice + priceVariation, margin: 4000, leverage: 40, notes: 'Short 40x' },
          { side: 'long', quantity: 100, entry_price: currentPrice - priceVariation, margin: 1000, leverage: 20, notes: 'Long 20x' },
          { side: 'short', quantity: 250, entry_price: currentPrice + priceVariation, margin: 2500, leverage: 35, notes: 'Short 35x' },
          { side: 'long', quantity: 350, entry_price: currentPrice, margin: 3500, leverage: 45, notes: 'Long 45x' },
          { side: 'short', quantity: 150, entry_price: currentPrice, margin: 1500, leverage: 28, notes: 'Short 28x' }
        ]
      },
      {
        name: 'Conjunto Conservador',
        description: `6 posições com leverage baixo @ ${formatPrice(currentPrice)}`,
        count: 6,
        positions: [
          { side: 'long', quantity: 100, entry_price: currentPrice, margin: 1000, leverage: 1, notes: 'Long 1x' },
          { side: 'short', quantity: 150, entry_price: currentPrice + priceVariation, margin: 1500, leverage: 2, notes: 'Short 2x' },
          { side: 'long', quantity: 200, entry_price: currentPrice, margin: 2000, leverage: 3, notes: 'Long 3x' },
          { side: 'short', quantity: 120, entry_price: currentPrice + priceVariation, margin: 1200, leverage: 4, notes: 'Short 4x' },
          { side: 'long', quantity: 180, entry_price: currentPrice - priceVariation, margin: 1800, leverage: 5, notes: 'Long 5x' },
          { side: 'short', quantity: 220, entry_price: currentPrice, margin: 2200, leverage: 6, notes: 'Short 6x' }
        ]
      }
    ];
  };

  const handleGenerateSet = async (set: ReturnType<typeof getPredefinedSets>[0]) => {
    try {
      const positionsData = set.positions.map(pos => ({
        ...pos,
        stop_loss: pos.side === 'long' 
          ? pos.entry_price * 0.95 // 5% below entry for long
          : pos.entry_price * 1.05, // 5% above entry for short
        take_profit: pos.side === 'long'
          ? pos.entry_price * 1.1 // 10% above entry for long
          : pos.entry_price * 0.9, // 10% below entry for short
        created_at: new Date().toISOString(),
        status: 'open' as const
      }));

      await createMultiplePositions(positionsData);
      setOpen(false);
    } catch (error) {
      console.error('Error generating position set:', error);
    }
  };

  const handleQuickGenerate = async () => {
    try {
      await generateTestPositions();
      setOpen(false);
    } catch (error) {
      console.error('Error generating quick test positions:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Gerar Posições de Teste
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerador de Posições de Teste
          </DialogTitle>
          <DialogDescription>
            Crie múltiplas posições de teste usando templates predefinidos com preços reais do mercado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Generate */}
          <Card className="bg-[#1A1A1A] border-[#2A3441]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-[#E6E6E6]">
                <Zap className="h-4 w-4" />
                Geração Rápida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#B8BCC8] mb-4">
                Cria 5 posições variadas automaticamente para teste rápido.
              </p>
              <Button 
                onClick={handleQuickGenerate}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Gerar 5 Posições Rápidas
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Predefined Sets */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Conjuntos Predefinidos</h3>
            
            <div className="grid gap-4">
              {getPredefinedSets().map((set, index) => (
                <Card key={index} className="bg-[#1A1A1A] border-[#2A3441]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2 text-[#E6E6E6]">
                          <Plus className="h-4 w-4" />
                          {set.name}
                        </CardTitle>
                        <p className="text-sm text-[#B8BCC8] mt-1">
                          {set.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-[#2A3441] text-[#E6E6E6]">
                        {set.count} posições
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Show first few positions as preview */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {set.positions.slice(0, 4).map((pos, posIndex) => (
                          <div key={posIndex} className="flex justify-between p-2 bg-[#2A3441] rounded">
                            <span className="font-medium text-[#E6E6E6]">
                              {pos.side === 'long' ? '📈' : '📉'} {pos.quantity} @ {pos.entry_price}
                            </span>
                            <span className="text-[#B8BCC8]">
                              {pos.leverage}x
                            </span>
                          </div>
                        ))}
                        {set.positions.length > 4 && (
                          <div className="flex justify-center p-2 bg-[#2A3441] rounded">
                            <span className="text-[#B8BCC8]">
                              +{set.positions.length - 4} mais...
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => handleGenerateSet(set)}
                        disabled={loading}
                        size="sm"
                        className="w-full"
                      >
                        {loading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Database className="h-4 w-4" />
                        )}
                        Gerar {set.count} Posições
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Warning */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <div className="text-yellow-600 mt-0.5">⚠️</div>
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">
                    Aviso sobre Posições de Teste
                  </p>
                  <p className="text-yellow-700">
                    Estas posições são criadas para fins de teste e desenvolvimento. 
                    Elas podem não refletir condições reais de mercado e devem ser usadas 
                    apenas em ambiente de desenvolvimento/testnet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
