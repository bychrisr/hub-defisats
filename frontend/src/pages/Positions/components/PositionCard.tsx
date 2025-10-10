// frontend/src/pages/Positions/components/PositionCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
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

export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  variant = 'mobile',
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
        'bg-[#1A1F2E] border-[#2A3441] hover:shadow-lg transition-all duration-300 cursor-pointer',
        isHighRisk && 'border-red-500/50 bg-red-500/5',
        className
      )}
      onClick={() => onDetails(position)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Badge tipo + PL */}
          <div className="flex items-center space-x-3">
            <Badge 
              variant={isLong ? 'default' : 'destructive'}
              className={cn(
                'flex items-center space-x-1',
                isLong ? 'bg-[#0ECB81] text-black' : 'bg-[#F6465D] text-white'
              )}
            >
              {isLong ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="font-semibold">{position.type}</span>
            </Badge>
            
            <div className="text-right">
              <div className={cn(
                'text-3xl font-mono font-bold flex items-center justify-end gap-2',
                isProfit ? 'text-[#0ECB81]' : 'text-[#F6465D]'
              )}>
                {formatSats(position.currentPL)}
                <SatsIcon 
                  size={24} 
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

          {/* Ações rápidas */}
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-[#2A3441]"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(position.id);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                onClose(position.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métricas principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-[#B8BCC8]">
              <DollarSign className="h-4 w-4" />
              <span>Quantity</span>
            </div>
            <div className="font-mono text-[#E6E6E6]">
              ${position.quantity.toLocaleString('pt-BR')}
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
              <span>Price</span>
            </div>
            <div className="font-mono text-[#E6E6E6]">
              ${position.entryPrice.toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-[#B8BCC8]">
              <Shield className="h-4 w-4" />
              <span>Liquidation</span>
            </div>
            <div className="font-mono text-[#E6E6E6]">
              ${position.liquidationPrice ? position.liquidationPrice.toLocaleString('pt-BR') : 'N/A'}
            </div>
          </div>
        </div>

        {/* SL/TP se definidos */}
        {(position.stopLoss || position.takeProfit) && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#2A3441]">
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

        {/* Footer com métricas e ações */}
        <div className="pt-3 border-t border-[#2A3441]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-2 text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-[#0ECB81] rounded-full"></div>
                  <span className="text-[#B8BCC8]">Ratio</span>
                  <span className="font-mono text-[#0ECB81]">
                    {position.marginRatio ? position.marginRatio.toFixed(3) : '0.000'}%
                  </span>
                </div>
                
                <div className="text-[#B8BCC8] flex items-center gap-1">
                  Fees: {formatSats(position.tradingFees)}
                  <SatsIcon size={12} variant="neutral" />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-[#B8BCC8] flex items-center gap-1">
                  Funding: {formatSats(position.fundingCost)}
                  <SatsIcon size={12} variant="neutral" />
                </div>
                
                <div className="text-[#B8BCC8] text-xs">
                  Created: {position.createdAt ? new Date(position.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
              </div>
            </div>

            {/* Ações inline */}
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white"
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
                className="h-7 w-7 p-0 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(position.id);
                }}
                title="Cash In"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Alerta de liquidação próxima */}
        {isHighRisk && (
          <div className="flex items-center space-x-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">
              Risco de liquidação alto
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
