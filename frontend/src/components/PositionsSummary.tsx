// Componente de exemplo para demonstrar o uso do contexto global de posições
import React from 'react';
import { useTotalPL, useTotalMargin, usePositionCount, useLongPositions, useShortPositions } from '@/hooks/usePositions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

export const PositionsSummary = () => {
  const totalPL = useTotalPL();
  const totalMargin = useTotalMargin();
  const positionCount = usePositionCount();
  const longPositions = useLongPositions();
  const shortPositions = useShortPositions();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* P&L Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">P&L Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-2">
            {totalPL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={totalPL >= 0 ? 'text-green-500' : 'text-red-500'}>
              {totalPL >= 0 ? '+' : ''}{totalPL.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">sats</p>
        </CardContent>
      </Card>

      {/* Margem Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Margem Total</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalMargin.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">sats</p>
        </CardContent>
      </Card>

      {/* Total de Posições */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Posições</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {positionCount}
          </div>
          <p className="text-xs text-muted-foreground">ativas</p>
        </CardContent>
      </Card>

      {/* Resumo Long/Short */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Long/Short</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              Long: {longPositions.length}
            </Badge>
            <Badge variant="default" className="bg-red-100 text-red-800">
              Short: {shortPositions.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

