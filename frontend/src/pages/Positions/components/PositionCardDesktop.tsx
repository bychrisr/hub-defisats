// frontend/src/pages/Positions/components/PositionCardDesktop.tsx

import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Shield, 
  AlertTriangle,
  MoreHorizontal,
  Plus,
  Minus,
  X,
  ArrowUpDown
} from 'lucide-react';
import { PositionCardProps } from '../types/positions.types';
import { cn } from '../../../lib/utils';

export const PositionCardDesktop: React.FC<PositionCardProps> = ({
  position,
  onClose,
  onEdit,
  onDetails,
  className
}) => {
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

  return (
    <Card 
      className={cn(
        'bg-[#1A1F2E] border-[#2A3441] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer',
        isHighRisk && 'border-red-500/50 bg-red-500/5',
        className
      )}
      onClick={() => onDetails(position)}
    >
      <CardContent className="p-4">
        {/* Header horizontal */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
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
                'text-xl font-mono font-bold',
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

          {/* Ações */}
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs border-[#2A3441] hover:bg-[#2A3441]"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(position.id);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Margin
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs border-[#2A3441] hover:bg-[#2A3441]"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(position.id);
              }}
            >
              <Minus className="h-3 w-3 mr-1" />
              Cash In
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs border-[#2A3441] hover:bg-[#2A3441]"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(position.id);
              }}
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Update
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              className="h-8 px-3 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onClose(position.id);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Close
            </Button>
          </div>
        </div>

        {/* Grid de métricas */}
        <div className="grid grid-cols-6 gap-4 text-sm">
          {/* Quantity */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-[#B8BCC8]">
              <DollarSign className="h-3 w-3" />
              <span>Quantity</span>
            </div>
            <div className="font-mono text-[#E6E6E6]">
              {formatSats(position.quantity)}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-[#B8BCC8]">
              <Target className="h-3 w-3" />
              <span>Price</span>
            </div>
            <div className="font-mono text-[#E6E6E6]">
              {formatCurrency(position.entryPrice)}
            </div>
          </div>

          {/* Liquidation */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-[#B8BCC8]">
              <Shield className="h-3 w-3" />
              <span>Liquidation</span>
            </div>
            <div className="font-mono text-[#E6E6E6]">
              {formatCurrency(position.liquidationPrice)}
            </div>
          </div>

          {/* Leverage */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-[#B8BCC8]">
              <Target className="h-3 w-3" />
              <span>Leverage</span>
            </div>
            <div className="font-mono text-[#E6E6E6]">
              {position.leverage.toFixed(1)}x
            </div>
          </div>

          {/* Margin */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-[#B8BCC8]">
              <DollarSign className="h-3 w-3" />
              <span>Margin</span>
            </div>
            <div className="font-mono text-[#E6E6E6]">
              {formatSats(position.margin)}
            </div>
          </div>

          {/* Margin Ratio */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-[#B8BCC8]">
              <div className="w-2 h-2 bg-[#0ECB81] rounded-full"></div>
              <span>Margin Ratio</span>
            </div>
            <div className="font-mono text-[#0ECB81]">
              {position.marginRatio.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* SL/TP se definidos */}
        {(position.stopLoss || position.takeProfit) && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#2A3441]">
            {position.takeProfit && (
              <div className="space-y-1">
                <div className="text-xs text-[#B8BCC8]">Take Profit</div>
                <div className="font-mono text-sm text-[#0ECB81]">
                  {formatCurrency(position.takeProfit)}
                </div>
              </div>
            )}
            
            {position.stopLoss && (
              <div className="space-y-1">
                <div className="text-xs text-[#B8BCC8]">Stop Loss</div>
                <div className="font-mono text-sm text-[#F6465D]">
                  {formatCurrency(position.stopLoss)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer com fees e funding */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2A3441] text-sm text-[#B8BCC8]">
          <div className="flex items-center space-x-4">
            <span>Trading Fees: {formatSats(position.tradingFees)}</span>
            <span>Funding Cost: {formatSats(position.fundingCost)}</span>
          </div>
          
          <div className="text-xs">
            Created: {new Date(position.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>

        {/* Alerta de liquidação próxima */}
        {isHighRisk && (
          <div className="flex items-center space-x-2 p-2 mt-4 bg-red-500/10 border border-red-500/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">
              Risco de liquidação alto - Considere adicionar margem
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
