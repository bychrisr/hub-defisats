// Componente de exemplo para demonstrar o uso do contexto global de posições
import React from 'react';
import { useTotalPL, useTotalMargin, usePositionCount, useLongPositions, useShortPositions } from '@/hooks/usePositions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { useFormatSats } from '@/hooks/useFormatSats';

export const PositionsSummary = () => {
  const { formatSats } = useFormatSats();
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
          <div className="number-lg flex items-center gap-2">
            {totalPL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            {formatSats(totalPL, { size: 28, variant: 'auto' })}
          </div>
        </CardContent>
      </Card>

      {/* Margem Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Margem Total</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="number-lg">
            {formatSats(totalMargin, { size: 28, variant: 'default' })}
          </div>
        </CardContent>
      </Card>

      {/* Total de Posições */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Posições</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="number-lg">
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
            <Badge variant="default" className="bg-green-100 text-green-800 number-sm">
              Long: {longPositions.length}
            </Badge>
            <Badge variant="default" className="bg-red-100 text-red-800 number-sm">
              Short: {shortPositions.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

