import React, { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PositionRowProps {
  position: {
    id: string;
    side: 'long' | 'short';
    quantity: number;
    price: number;
    liquidation: number;
    leverage: number;
    margin: number;
    pnl: number;
    pnlPercentage: number;
    marginRatio: number;
    tradingFees: number;
    fundingCost: number;
    status: 'open' | 'closed';
    asset: string;
    createdAt: string;
    updatedAt: string;
  };
  index: number;
}

// ✅ COMPONENTE OTIMIZADO COM REACT.MEMO
const PositionRow = memo<PositionRowProps>(({ position, index }) => {
  // Função para formatar valores USD como na LN Markets
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  // Função para formatar sats com ícone
  const formatSats = (value: number) => {
    if (value >= 1000) {
      return `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} sats`;
    } else {
      return `${value.toFixed(0)} sats`;
    }
  };

  // Função para formatar porcentagem
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00%';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Função para obter cor do PnL
  const getPnlColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-text-primary';
  };

  return (
    <TableRow 
      key={position.id}
      className={cn(
        "hover:bg-background/50 transition-colors duration-200",
        index % 2 === 0 ? "bg-background/20" : "bg-background/10"
      )}
    >
      <TableCell className="font-medium">
        <Badge 
          variant={position.side === 'long' ? 'default' : 'destructive'}
          className={cn(
            "font-semibold px-3 py-1 rounded-full border-0",
            position.side === 'long' 
              ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25' 
              : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25'
          )}
        >
          {position.side === 'long' ? 'LONG' : 'SHORT'}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-text-primary">
        {formatCurrency(position.quantity)}
      </TableCell>
      <TableCell className="font-mono text-text-primary">
        {formatCurrency(position.price)}
      </TableCell>
      <TableCell className="font-mono text-text-primary">
        {formatCurrency(position.liquidation)}
      </TableCell>
      <TableCell className="font-mono">
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold">
          {position.leverage.toFixed(2)}x
        </span>
      </TableCell>
      <TableCell className="font-mono text-text-primary">
        {formatSats(position.margin)}
      </TableCell>
      <TableCell className={cn("font-mono font-semibold", getPnlColor(position.pnl))}>
        {formatSats(position.pnl)}
      </TableCell>
      <TableCell className={cn("font-mono font-semibold", getPnlColor(position.pnlPercentage))}>
        {formatPercentage(position.pnlPercentage)}
      </TableCell>
      <TableCell className="font-mono text-text-primary">
        {formatPercentage(position.marginRatio)}
      </TableCell>
      <TableCell className="font-mono text-text-primary">
        {formatSats(position.tradingFees)}
      </TableCell>
      <TableCell className="font-mono text-text-primary">
        {formatSats(position.fundingCost)}
      </TableCell>
    </TableRow>
  );
});

PositionRow.displayName = 'PositionRow';

export default PositionRow;
