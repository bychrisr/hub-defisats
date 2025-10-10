// frontend/src/pages/Positions/components/PositionModal.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Shield, 
  AlertTriangle,
  X,
  Save,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';
import { PositionModalProps } from '../types/positions.types';
import { cn } from '../../../lib/utils';

export const PositionModal: React.FC<PositionModalProps> = ({
  position,
  isOpen,
  onClose,
  onAction
}) => {
  const [editingSL, setEditingSL] = useState(false);
  const [editingTP, setEditingTP] = useState(false);
  const [newSL, setNewSL] = useState(position?.stopLoss || 0);
  const [newTP, setNewTP] = useState(position?.takeProfit || 0);
  const [marginAmount, setMarginAmount] = useState(0);

  if (!position) return null;

  const isLong = position.type === 'LONG';
  const isProfit = position.currentPL >= 0;
  const isHighRisk = position.liquidationRisk === 'high';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatSats = (value: number) => {
    return `${value.toLocaleString('pt-BR')} sats`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleSaveSL = async () => {
    if (newSL > 0) {
      await onAction('updateStopLoss', { positionId: position.id, stopLoss: newSL });
      setEditingSL(false);
    }
  };

  const handleSaveTP = async () => {
    if (newTP > 0) {
      await onAction('updateTakeProfit', { positionId: position.id, takeProfit: newTP });
      setEditingTP(false);
    }
  };

  const handleAddMargin = async () => {
    if (marginAmount > 0) {
      await onAction('addMargin', { positionId: position.id, amount: marginAmount });
      setMarginAmount(0);
    }
  };

  const handleClosePosition = async () => {
    await onAction('closePosition', { positionId: position.id });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#1A1F2E] border-[#2A3441] text-[#E6E6E6]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge 
                variant={isLong ? 'default' : 'destructive'}
                className={cn(
                  'flex items-center space-x-1 px-3 py-1',
                  isLong ? 'bg-[#0ECB81] text-black' : 'bg-[#F6465D] text-white'
                )}
              >
                {isLong ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className="font-semibold">{position.type}</span>
              </Badge>
              
              <div className="text-right">
                <div className={cn(
                  'text-2xl font-mono font-bold',
                  isProfit ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                )}>
                  {formatCurrency(position.currentPL)}
                </div>
                <div className={cn(
                  'text-sm',
                  isProfit ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                )}>
                  {formatPercentage(position.plPercentage)}
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-[#2A3441]"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#242B3D] border border-[#2A3441]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-[#B8BCC8]">
                  <DollarSign className="h-4 w-4" />
                  <span>Quantity</span>
                </div>
                <div className="font-mono text-[#E6E6E6]">
                  {formatSats(position.quantity)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-[#B8BCC8]">
                  <Target className="h-4 w-4" />
                  <span>Entry Price</span>
                </div>
                <div className="font-mono text-[#E6E6E6]">
                  {formatCurrency(position.entryPrice)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-[#B8BCC8]">
                  <Shield className="h-4 w-4" />
                  <span>Liquidation</span>
                </div>
                <div className="font-mono text-[#E6E6E6]">
                  {formatCurrency(position.liquidationPrice)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-[#B8BCC8]">
                  <Target className="h-4 w-4" />
                  <span>Leverage</span>
                </div>
                <div className="font-mono text-[#E6E6E6]">
                  {position.leverage.toFixed(1)}x
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-[#B8BCC8]">
                  <DollarSign className="h-4 w-4" />
                  <span>Margin</span>
                </div>
                <div className="font-mono text-[#E6E6E6]">
                  {formatSats(position.margin)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-[#B8BCC8]">
                  <div className="w-2 h-2 bg-[#0ECB81] rounded-full"></div>
                  <span>Margin Ratio</span>
                </div>
                <div className="font-mono text-[#0ECB81]">
                  {position.marginRatio.toFixed(1)}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-[#B8BCC8]">Trading Fees</div>
                <div className="font-mono text-[#E6E6E6]">
                  {formatSats(position.tradingFees)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-[#B8BCC8]">Funding Cost</div>
                <div className="font-mono text-[#E6E6E6]">
                  {formatSats(position.fundingCost)}
                </div>
              </div>
            </div>

            {/* SL/TP Status */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2A3441]">
              <div className="space-y-2">
                <div className="text-sm text-[#B8BCC8]">Stop Loss</div>
                <div className={cn(
                  'font-mono text-sm',
                  position.stopLoss ? 'text-[#F6465D]' : 'text-[#B8BCC8]'
                )}>
                  {position.stopLoss ? formatCurrency(position.stopLoss) : 'Not set'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-[#B8BCC8]">Take Profit</div>
                <div className={cn(
                  'font-mono text-sm',
                  position.takeProfit ? 'text-[#0ECB81]' : 'text-[#B8BCC8]'
                )}>
                  {position.takeProfit ? formatCurrency(position.takeProfit) : 'Not set'}
                </div>
              </div>
            </div>

            {/* Alerta de risco */}
            {isHighRisk && (
              <div className="flex items-center space-x-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div>
                  <div className="text-sm font-medium text-red-400">
                    Risco de liquidação alto
                  </div>
                  <div className="text-xs text-red-300">
                    Considere adicionar margem ou fechar a posição
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
              {/* Stop Loss */}
              <div className="space-y-2">
                <Label htmlFor="stopLoss">Stop Loss</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="stopLoss"
                    type="number"
                    value={editingSL ? newSL : position.stopLoss || 0}
                    onChange={(e) => setNewSL(Number(e.target.value))}
                    onFocus={() => setEditingSL(true)}
                    className="bg-[#242B3D] border-[#2A3441] text-[#E6E6E6]"
                    placeholder="Enter stop loss price"
                  />
                  {editingSL && (
                    <Button
                      size="sm"
                      onClick={handleSaveSL}
                      className="bg-[#0ECB81] hover:bg-[#0ECB81]/90"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Take Profit */}
              <div className="space-y-2">
                <Label htmlFor="takeProfit">Take Profit</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="takeProfit"
                    type="number"
                    value={editingTP ? newTP : position.takeProfit || 0}
                    onChange={(e) => setNewTP(Number(e.target.value))}
                    onFocus={() => setEditingTP(true)}
                    className="bg-[#242B3D] border-[#2A3441] text-[#E6E6E6]"
                    placeholder="Enter take profit price"
                  />
                  {editingTP && (
                    <Button
                      size="sm"
                      onClick={handleSaveTP}
                      className="bg-[#0ECB81] hover:bg-[#0ECB81]/90"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Add Margin */}
              <div className="space-y-2">
                <Label htmlFor="marginAmount">Add Margin</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="marginAmount"
                    type="number"
                    value={marginAmount}
                    onChange={(e) => setMarginAmount(Number(e.target.value))}
                    className="bg-[#242B3D] border-[#2A3441] text-[#E6E6E6]"
                    placeholder="Amount in sats"
                  />
                  <Button
                    onClick={handleAddMargin}
                    className="bg-[#3773F5] hover:bg-[#3773F5]/90"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Cash In Margin */}
              <div className="space-y-2">
                <Label htmlFor="cashInAmount">Cash In Margin</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="cashInAmount"
                    type="number"
                    className="bg-[#242B3D] border-[#2A3441] text-[#E6E6E6]"
                    placeholder="Amount in sats"
                  />
                  <Button
                    variant="outline"
                    className="border-[#2A3441] hover:bg-[#2A3441]"
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Cash In
                  </Button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-[#2A3441]">
              <div className="space-y-2">
                <Label className="text-red-400">Danger Zone</Label>
                <Button
                  variant="destructive"
                  onClick={handleClosePosition}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Close Position
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
