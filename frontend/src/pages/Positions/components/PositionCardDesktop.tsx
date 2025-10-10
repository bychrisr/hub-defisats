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
  X
} from 'lucide-react';
import { PositionCardProps } from '../types/positions.types';
import { cn } from '../../../lib/utils';
import SatsIcon from '../../../components/SatsIcon';

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
    return value.toLocaleString('pt-BR');
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
                'text-2xl font-mono font-bold flex items-center justify-end gap-2',
                isProfit ? 'text-[#0ECB81]' : 'text-[#F6465D]'
              )}>
                {formatSats(position.currentPL)}
                <SatsIcon 
                  size={22} 
                  variant={isProfit ? 'positive' : 'negative'}
                />
                <Badge 
                  variant="outline"
                  className={cn(
                    'text-xs font-medium px-2 py-1',
                    isProfit 
                      ? 'bg-green-600/20 border-green-600/50 text-green-400' 
                      : 'bg-red-600/20 border-red-600/50 text-red-400'
                  )}
                >
                  {formatPercentage(position.plPercentage)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(position.id);
              }}
              title="Add Margin"
            >
              <Plus className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(position.id);
              }}
              title="Cash In"
            >
              <Minus className="h-3 w-3" />
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
              ${position.quantity.toLocaleString('pt-BR')}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-[#B8BCC8]">
              <Target className="h-3 w-3" />
              <span>Price</span>
            </div>
            <div className="font-mono text-[#E6E6E6]">
              ${position.entryPrice.toLocaleString('pt-BR')}
            </div>
          </div>

          {/* Liquidation */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-[#B8BCC8]">
              <Shield className="h-3 w-3" />
              <span>Liquidation</span>
            </div>
            <div className="font-mono text-[#E6E6E6]">
              ${position.liquidationPrice ? position.liquidationPrice.toLocaleString('pt-BR') : 'N/A'}
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
            <div className="font-mono text-[#E6E6E6] flex items-center gap-1">
              {formatSats(position.margin)}
              <SatsIcon size={14} variant="neutral" />
            </div>
          </div>

          {/* Margin Ratio */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-[#B8BCC8]">
              <div className="w-2 h-2 bg-[#0ECB81] rounded-full"></div>
              <span>Ratio</span>
            </div>
            <div className="font-mono text-[#0ECB81]">
              {position.marginRatio ? position.marginRatio.toFixed(3) : '0.000'}%
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
            <span className="flex items-center gap-1">
              Trading Fees: {formatSats(position.tradingFees)}
              <SatsIcon size={12} variant="neutral" />
            </span>
            <span className="flex items-center gap-1">
              Funding Cost: {formatSats(position.fundingCost)}
              <SatsIcon size={12} variant="neutral" />
            </span>
          </div>
          
          <div className="text-xs">
            Created: {position.createdAt ? new Date(position.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
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
