import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LNMarketsError } from '@/components/LNMarketsError';
import { LNMarketsGuard } from '@/components/LNMarketsGuard';
import SatsIcon from '@/components/SatsIcon';
import { useOptimizedPositions, useOptimizedDashboardMetrics } from '@/hooks/useOptimizedDashboardData';
import RealtimeStatus from '@/components/RealtimeStatus';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  DollarSign,
  Shield,
  Activity,
  Zap,
  Target,
  PieChart,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LNPosition {
  id: string;
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
  side: 'long' | 'short';
  asset: string;
  createdAt: string;
  updatedAt: string;
}

type SortField = 'side' | 'quantity' | 'price' | 'liquidation' | 'leverage' | 'margin' | 'pnl' | 'marginRatio' | 'tradingFees' | 'fundingCost';
type SortDirection = 'asc' | 'desc';

interface LNPositionsResponse {
  success: boolean;
  data: {
    positions: LNPosition[];
    totalValue: number;
    totalPnl: number;
    totalMargin: number;
  };
}

export default function Positions() {
  // Dados otimizados
  const { positions: realtimePositions, isLoading, error } = useOptimizedPositions();
  const { totalPL, totalMargin, positionCount } = useOptimizedDashboardMetrics();
  
  const [positions, setPositions] = useState<LNPosition[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [totalMarginValue, setTotalMarginValue] = useState(0);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Função para ordenar posições
  const sortPositions = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para obter ícone de ordenação
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-text-secondary" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  // Função para formatar valores USD como na LN Markets
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  // Função para formatar sats com ícone
  const formatSats = (value: number | undefined) => {
    if (value === undefined || value === null) {
      return (
        <span className="flex items-center gap-1">
          -
          <SatsIcon size={28} variant="neutral" />
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1">
        {value.toLocaleString()}
        <SatsIcon size={28} variant="default" />
      </span>
    );
  };

  // Sincronizar dados otimizados - apenas quando há mudanças nas posições
  useEffect(() => {
    if (realtimePositions.length > 0) {
      console.log('📊 POSITIONS - Atualizando posições com dados otimizados:', realtimePositions.length);
      
      // Filtrar posições vazias (objetos {})
      const validPositions = realtimePositions.filter(pos => 
        pos && typeof pos === 'object' && Object.keys(pos).length > 0
      );
      
      console.log('📊 POSITIONS - Posições válidas encontradas:', validPositions.length);
      
      if (validPositions.length === 0) {
        console.log('📊 POSITIONS - Nenhuma posição válida encontrada, limpando estado');
        setPositions([]);
        return;
      }
      
      // Converter dados otimizados para formato da página
      const convertedPositions: LNPosition[] = validPositions.map(pos => ({
        id: pos.id,
        quantity: pos.quantity,
        price: pos.price,
        liquidation: (pos as any).liquidation || 0,
        leverage: pos.leverage,
        margin: pos.margin,
        pnl: pos.pnl,
        pnlPercentage: pos.pnlPercent,
        marginRatio: (pos as any).marginRatio || 0,
        tradingFees: (pos as any).tradingFees || 0,
        fundingCost: (pos as any).fundingCost || 0,
        status: 'open' as const,
        side: pos.side,
        asset: pos.symbol,
        createdAt: pos.timestamp ? new Date(pos.timestamp).toISOString() : new Date().toISOString(),
        updatedAt: pos.timestamp ? new Date(pos.timestamp).toISOString() : new Date().toISOString()
      }));
      
      setPositions(convertedPositions);
      
      // Usar dados otimizados para totais
      setTotalPnl(totalPL);
      setTotalMarginValue(totalMargin);
      setTotalValue(totalMargin);
    }
  }, [realtimePositions, totalPL, totalMargin]);

  // Função para obter posições ordenadas
  const getSortedPositions = () => {
    if (!sortField) return positions;
    
    return [...positions].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Tratamento especial para side (string)
      if (sortField === 'side') {
        aValue = aValue === 'long' ? 1 : 0;
        bValue = bValue === 'long' ? 1 : 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Função para formatar porcentagem
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Função de refresh usando dados otimizados
  const handleRefresh = () => {
    console.log('🔄 POSITIONS - Refresh requested (using optimized data)');
    // Os dados são atualizados automaticamente pelo hook otimizado
  };

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-success';
    if (pnl < 0) return 'text-destructive';
    return 'text-text-secondary';
  };


  const getPnlIcon = (pnl: number) => {
    if (pnl > 0) return <TrendingUp className="h-4 w-4 text-success" />;
    if (pnl < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl"></div>
                    <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-text-primary">Loading Positions</h3>
                    <p className="text-sm text-text-secondary">Fetching data from LN Markets...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <LNMarketsError 
                  error={error}
                  onConfigure={() => window.location.href = '/profile'}
                  showConfigureButton={error.includes('MISSING_CREDENTIALS') || error.includes('INVALID_CREDENTIALS')}
                />
                <div className="mt-6 text-center">
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline"
                    className="backdrop-blur-sm bg-background/50 border-border/50 hover:bg-background/80 transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LNMarketsGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-3xl"></div>
              <Card className="relative backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                          <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                            Positions
                          </h1>
                          <p className="text-text-secondary">Monitor your active positions on LN Markets</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <RealtimeStatus />
                        {isUpdating && (
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Updating data...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={handleRefresh} 
                      variant="outline" 
                      size="sm" 
                      disabled={isUpdating}
                      className="backdrop-blur-sm bg-background/50 border-border/50 hover:bg-background/80 transition-all duration-200"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                      {isUpdating ? 'Updating...' : 'Refresh'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Margin Card */}
              <Card className={cn(
                "gradient-card-blue backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl",
                isUpdating ? 'opacity-75' : 'opacity-100'
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Total Margin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-text-primary">{formatSats(totalValue)}</div>
                  <p className="text-xs text-text-secondary mt-1">
                    Total margin at risk
                  </p>
                </CardContent>
              </Card>
              
              {/* Total P&L Card */}
              <Card className={cn(
                "gradient-card-green backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl",
                isUpdating ? 'opacity-75' : 'opacity-100'
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Total P&L
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPnlColor(totalPnl)}`}>
                    {formatSats(totalPnl)}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Unrealized profit/loss
                  </p>
                </CardContent>
              </Card>
              
              {/* Active Positions Card */}
              <Card className={cn(
                "gradient-card-purple backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl",
                isUpdating ? 'opacity-75' : 'opacity-100'
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    Active Positions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-text-primary">{positions.length}</div>
                  <p className="text-xs text-text-secondary mt-1">
                    {positions.length === 1 ? 'Position' : 'Positions'} open
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Positions Table */}
            <Card className={cn(
              "backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300",
              isUpdating ? 'opacity-75' : 'opacity-100'
            )}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                    <PieChart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">Active Positions</CardTitle>
                    <CardDescription className="text-text-secondary">
                      {positions.length === 0 
                        ? 'No active positions found' 
                        : `Showing ${positions.length} active position${positions.length !== 1 ? 's' : ''}`
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full blur-2xl"></div>
                      <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
                        <TrendingUp className="h-12 w-12 text-primary/60" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No Active Positions</h3>
                    <p className="text-text-secondary">Your positions from LN Markets will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
                          <TableHead 
                            className="cursor-pointer hover:bg-background/80 select-none transition-colors duration-200 font-semibold text-text-primary"
                            onClick={() => sortPositions('side')}
                          >
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              #
                              {getSortIcon('side')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-background/80 select-none transition-colors duration-200 font-semibold text-text-primary"
                            onClick={() => sortPositions('quantity')}
                          >
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Quantity
                              {getSortIcon('quantity')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-background/80 select-none transition-colors duration-200 font-semibold text-text-primary"
                            onClick={() => sortPositions('price')}
                          >
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Price
                              {getSortIcon('price')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-background/80 select-none transition-colors duration-200 font-semibold text-text-primary"
                            onClick={() => sortPositions('liquidation')}
                          >
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Liquidation
                              {getSortIcon('liquidation')}
                            </div>
                          </TableHead>
                          {/* <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Stoploss
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Takeprofit
                            </div>
                          </TableHead> */}
                          <TableHead 
                            className="cursor-pointer hover:bg-background/80 select-none transition-colors duration-200 font-semibold text-text-primary"
                            onClick={() => sortPositions('leverage')}
                          >
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Leverage
                              {getSortIcon('leverage')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-background/80 select-none transition-colors duration-200 font-semibold text-text-primary"
                            onClick={() => sortPositions('margin')}
                          >
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Margin
                              {getSortIcon('margin')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-background/80 select-none transition-colors duration-200 font-semibold text-text-primary"
                            onClick={() => sortPositions('pnl')}
                          >
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              PL
                              {getSortIcon('pnl')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-background/80 select-none transition-colors duration-200 font-semibold text-text-primary"
                            onClick={() => sortPositions('marginRatio')}
                          >
                            <div className="flex items-center gap-2">
                              <PieChart className="h-4 w-4" />
                              Margin Ratio
                              {getSortIcon('marginRatio')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-background/80 select-none transition-colors duration-200 font-semibold text-text-primary"
                            onClick={() => sortPositions('tradingFees')}
                          >
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Trading fees
                              {getSortIcon('tradingFees')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-background/80 select-none transition-colors duration-200 font-semibold text-text-primary"
                            onClick={() => sortPositions('fundingCost')}
                          >
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Funding cost
                              {getSortIcon('fundingCost')}
                            </div>
                          </TableHead>
                    </TableRow>
                  </TableHeader>
                      <TableBody>
                        {getSortedPositions().map((position, index) => (
                          <TableRow 
                            key={position.id || `position-${index}`}
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
                            {/* <TableCell className="text-center text-text-secondary">
                              <span className="text-lg">+</span>
                            </TableCell>
                            <TableCell className="text-center text-text-secondary">
                              <span className="text-lg">+</span>
                            </TableCell> */}
                            <TableCell className="font-mono">
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold">
                                {position.leverage.toFixed(2)}x
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-text-primary">
                              {formatSats(position.margin)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getPnlIcon(position.pnl)}
                                <div className="flex flex-col">
                                  <span className={cn("font-mono font-semibold", getPnlColor(position.pnl))}>
                                    {formatSats(position.pnl)}
                                  </span>
                                  <span className={cn("text-xs font-mono", getPnlColor(position.pnl))}>
                                    ({formatPercentage(position.pnlPercentage)})
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono">
                              <span className={cn(
                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold",
                                position.marginRatio > 50 
                                  ? "bg-red-500/20 text-red-600" 
                                  : position.marginRatio > 25 
                                    ? "bg-yellow-500/20 text-yellow-600"
                                    : "bg-green-500/20 text-green-600"
                              )}>
                                {position.marginRatio.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-text-primary">
                              {formatSats(position.tradingFees)}
                            </TableCell>
                            <TableCell className="font-mono text-text-primary">
                              {formatSats(position.fundingCost)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LNMarketsGuard>
  );
}
