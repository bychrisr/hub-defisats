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
import { useUserPositions, useUserBalance, useConnectionStatus, useRealtimeData } from '@/contexts/RealtimeDataContext';
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
} from 'lucide-react';
import { api } from '@/lib/api';

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
  // Dados em tempo real
  const realtimePositions = useUserPositions();
  const userBalance = useUserBalance();
  const { isConnected } = useConnectionStatus();
  const { loadRealPositions, updatePositions } = useRealtimeData();
  
  const [positions, setPositions] = useState<LNPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [totalMargin, setTotalMargin] = useState(0);
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

  // Função para formatar valores USD de forma mais amigável
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
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
          <SatsIcon size={18} className="text-secondary" />
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1">
        {value.toLocaleString()}
        <SatsIcon size={18} className="text-secondary" />
      </span>
    );
  };

  // Sincronizar dados em tempo real - apenas quando há mudanças nas posições do contexto
  useEffect(() => {
    if (realtimePositions.length > 0) {
      console.log('📊 TRADES - Atualizando posições em tempo real:', realtimePositions.length);
      
      // Converter dados de tempo real para formato da página
      const convertedPositions: LNPosition[] = realtimePositions.map(pos => ({
        id: pos.id,
        quantity: pos.quantity,
        price: pos.price,
        liquidation: pos.price * 0.1, // Calcular liquidação baseada no preço
        leverage: pos.leverage,
        margin: pos.margin,
        pnl: pos.pnl,
        pnlPercentage: pos.pnlPercent,
        marginRatio: (pos as any).marginRatio || (pos.leverage > 0 ? (100 / pos.leverage) : 0),
        tradingFees: (pos as any).tradingFees || 0,
        fundingCost: (pos as any).fundingCost || 0,
        status: 'open' as const,
        side: pos.side,
        asset: pos.symbol,
        createdAt: new Date(pos.timestamp).toISOString(),
        updatedAt: new Date(pos.timestamp).toISOString()
      }));
      
      setPositions(convertedPositions);
      
      // Calcular totais
      const totalPnlValue = convertedPositions.reduce((sum, pos) => sum + pos.pnl, 0);
      const totalMarginValue = convertedPositions.reduce((sum, pos) => sum + pos.margin, 0);
      
      setTotalPnl(totalPnlValue);
      setTotalMargin(totalMarginValue);
      setTotalValue(totalMarginValue); // Total Value agora é Total Margin
    }
  }, [realtimePositions]);

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

  const fetchPositions = async (isInitialLoad = false) => {
    try {
      // Só mostrar loading no carregamento inicial
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsUpdating(true);
      }
      setError(null);
      
      console.log('🔍 TRADES - Fetching LN Markets positions...', isInitialLoad ? '(Initial Load)' : '(Background Update)');
      
      const response = await api.get('/api/lnmarkets/positions');
      const data = response.data;
      
      console.log('✅ TRADES - Received positions:', data);
      console.log('🔍 TRADES - Full response data:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data && data.data.positions) {
        // Transform LN Markets data to our interface
        const transformedPositions: LNPosition[] = data.data.positions.map((pos: any) => {
          console.log('🔍 TRADES - Transforming position:', pos);
          console.log('🔍 TRADES - TEST LOG - Position ID:', pos.id);
          console.log('🔍 TRADES - TEST LOG - Opening Fee:', pos.opening_fee);
          console.log('🔍 TRADES - TEST LOG - Closing Fee:', pos.closing_fee);
          console.log('🔍 TRADES - TEST LOG - Sum Carry Fees:', pos.sum_carry_fees);
          console.log('🔍 TRADES - TEST LOG - Maintenance Margin:', pos.maintenance_margin);
          
          // Teste simples
          console.log('🔍 TRADES - SIMPLE TEST - marginRatio calculation:', {
            maintenance_margin: pos.maintenance_margin,
            margin: pos.margin,
            pl: pos.pl,
            leverage: pos.leverage
          });
          
          // Calculate P&L percentage
          const pnlPercentage = pos.margin > 0 ? (pos.pl / pos.margin) * 100 : 0;
          
          // Calculate margin ratio (maintenance_margin / (margin + pl))
          // Se maintenance_margin não estiver disponível, calcular baseado no leverage
          const marginRatio = pos.maintenance_margin > 0 
            ? (pos.maintenance_margin / (pos.margin + pos.pl)) * 100 
            : pos.leverage > 0 
              ? (100 / pos.leverage) 
              : 0;
          
          console.log('🔍 TRADES - Margin ratio calculation:', {
            maintenance_margin: pos.maintenance_margin,
            margin: pos.margin,
            pl: pos.pl,
            leverage: pos.leverage,
            calculated_marginRatio: marginRatio,
            formula: pos.maintenance_margin > 0 
              ? `(${pos.maintenance_margin} / (${pos.margin} + ${pos.pl})) * 100 = ${marginRatio}`
              : `100 / ${pos.leverage} = ${marginRatio}`
          });
          
          const tradingFees = (pos.opening_fee || 0) + (pos.closing_fee || 0);
          const fundingCost = pos.sum_carry_fees || 0;
          
          console.log('🔍 TRADES - Fees calculation:', {
            opening_fee: pos.opening_fee,
            closing_fee: pos.closing_fee,
            sum_carry_fees: pos.sum_carry_fees,
            calculated_tradingFees: tradingFees,
            calculated_fundingCost: fundingCost,
            formula_trading: `${pos.opening_fee || 0} + ${pos.closing_fee || 0} = ${tradingFees}`,
            formula_funding: `sum_carry_fees = ${fundingCost}`
          });

          return {
            id: pos.id,
            quantity: pos.quantity || 0,
            price: pos.price || 0,
            liquidation: pos.liquidation || 0,
            leverage: pos.leverage || 1,
            margin: pos.margin || 0,
            pnl: pos.pl || 0,
            pnlPercentage: pnlPercentage,
            marginRatio: marginRatio,
            tradingFees: tradingFees,
            fundingCost: fundingCost,
            status: pos.running ? 'open' as const : 'closed' as const,
            side: pos.side === 'b' ? 'long' as const : 'short' as const, // 'b' = buy = long, 's' = sell = short
            asset: 'BTC', // LN Markets only trades BTC futures
            createdAt: new Date(pos.creation_ts || Date.now()).toISOString(),
            updatedAt: new Date(pos.market_filled_ts || Date.now()).toISOString(),
          };
        });

        setPositions(transformedPositions);
        
        // Calculate totals from actual positions data
        // Total value should be the sum of all margins (total capital at risk)
        const totalValue = transformedPositions.reduce((sum, pos) => sum + pos.margin, 0);
        const totalPnl = transformedPositions.reduce((sum, pos) => sum + pos.pnl, 0);
        const totalMargin = transformedPositions.reduce((sum, pos) => sum + pos.margin, 0);
        
        setTotalValue(totalValue);
        setTotalPnl(totalPnl);
        setTotalMargin(totalMargin);

        // Atualizar contexto de tempo real com dados reais (dados brutos da LN Markets)
        if (isInitialLoad) {
          console.log('🔄 TRADES - Carregando posições iniciais no contexto de tempo real');
          loadRealPositions(data.data.positions); // Passar dados brutos da LN Markets
        } else {
          console.log('🔄 TRADES - Atualizando posições no contexto de tempo real (silent)');
          updatePositions(data.data.positions); // Passar dados brutos da LN Markets
        }
      } else {
        console.error('❌ TRADES - Invalid data structure:', data);
        setError('Invalid response format from LN Markets');
      }
    } catch (err: any) {
      console.error('❌ TRADES - Error fetching positions:', err);
      let errorMessage = 'Failed to fetch positions from LN Markets';
      
      if (err.response?.status === 400) {
        if (err.response?.data?.error === 'MISSING_CREDENTIALS') {
          errorMessage = 'MISSING_CREDENTIALS';
        } else if (err.response?.data?.error === 'INVALID_CREDENTIALS') {
          errorMessage = 'INVALID_CREDENTIALS';
        } else if (err.response?.data?.error === 'INSUFFICIENT_PERMISSIONS') {
          errorMessage = 'INSUFFICIENT_PERMISSIONS';
        } else {
          errorMessage = err.response?.data?.message || errorMessage;
        }
      } else if (err.response?.status === 429) {
        errorMessage = 'RATE_LIMIT';
      } else {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      // Só parar loading no carregamento inicial
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsUpdating(false);
      }
    }
  };

  useEffect(() => {
    fetchPositions(true); // Carregamento inicial
  }, []);

  // Atualizar posições periodicamente com dados reais da LN Markets
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // Aguardar 3 segundos após o carregamento inicial antes de começar as atualizações automáticas
    const initialDelay = setTimeout(() => {
      intervalId = setInterval(() => {
        console.log('🔄 TRADES - Atualizando posições automaticamente...');
        fetchPositions(false); // Atualização periódica
      }, 5000); // Atualizar a cada 5 segundos (mais responsivo)
    }, 3000);

    return () => {
      clearTimeout(initialDelay);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);


  // REMOVED: Este useEffect estava duplicando a lógica de atualização
  // A atualização agora é feita diretamente na função fetchPositions

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-success';
    if (pnl < 0) return 'text-destructive';
    return 'text-text-secondary';
  };

  // Função wrapper para o botão de refresh
  const handleRefresh = () => {
    fetchPositions(false);
  };

  const getPnlIcon = (pnl: number) => {
    if (pnl > 0) return <TrendingUp className="h-4 w-4 text-success" />;
    if (pnl < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading positions from LN Markets...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <LNMarketsError 
            error={error}
            onConfigure={() => window.location.href = '/profile'}
            showConfigureButton={error.includes('MISSING_CREDENTIALS') || error.includes('INVALID_CREDENTIALS')}
          />
          <div className="mt-4 text-center">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LNMarketsGuard>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Positions</h1>
            <p className="text-text-secondary">Monitor your active positions on LN Markets</p>
            <div className="flex items-center gap-4 mt-2">
              <RealtimeStatus />
              {isUpdating && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Updating data...</span>
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isUpdating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Updating...' : 'Refresh'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={`transition-opacity duration-300 ${isUpdating ? 'opacity-75' : 'opacity-100'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSats(totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Total margin at risk
              </p>
            </CardContent>
          </Card>
          
          <Card className={`transition-opacity duration-300 ${isUpdating ? 'opacity-75' : 'opacity-100'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPnlColor(totalPnl)}`}>
                {formatSats(totalPnl)}
              </div>
              <p className="text-xs text-muted-foreground">
                Unrealized profit/loss
              </p>
            </CardContent>
          </Card>
          
          <Card className={`transition-opacity duration-300 ${isUpdating ? 'opacity-75' : 'opacity-100'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSats(totalMargin)}</div>
              <p className="text-xs text-muted-foreground">
                Total margin used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Positions Table */}
        <Card className={`transition-opacity duration-300 ${isUpdating ? 'opacity-75' : 'opacity-100'}`}>
          <CardHeader>
            <CardTitle>Active Positions</CardTitle>
            <CardDescription>
              {positions.length === 0 
                ? 'No active positions found' 
                : `Showing ${positions.length} active position${positions.length !== 1 ? 's' : ''}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-text-secondary mb-4">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                  <p>No active positions</p>
                  <p className="text-sm">Your positions from LN Markets will appear here</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-bg-header select-none"
                        onClick={() => sortPositions('side')}
                      >
                        <div className="flex items-center gap-2">
                          Side
                          {getSortIcon('side')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-bg-header select-none"
                        onClick={() => sortPositions('quantity')}
                      >
                        <div className="flex items-center gap-2">
                          Quantity
                          {getSortIcon('quantity')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-bg-header select-none"
                        onClick={() => sortPositions('price')}
                      >
                        <div className="flex items-center gap-2">
                          Price
                          {getSortIcon('price')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-bg-header select-none"
                        onClick={() => sortPositions('liquidation')}
                      >
                        <div className="flex items-center gap-2">
                          Liquidation
                          {getSortIcon('liquidation')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-bg-header select-none"
                        onClick={() => sortPositions('leverage')}
                      >
                        <div className="flex items-center gap-2">
                          Leverage
                          {getSortIcon('leverage')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-bg-header select-none"
                        onClick={() => sortPositions('margin')}
                      >
                        <div className="flex items-center gap-2">
                          Margin
                          {getSortIcon('margin')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-bg-header select-none"
                        onClick={() => sortPositions('pnl')}
                      >
                        <div className="flex items-center gap-2">
                          P&L
                          {getSortIcon('pnl')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-bg-header select-none"
                        onClick={() => sortPositions('marginRatio')}
                      >
                        <div className="flex items-center gap-2">
                          Margin Ratio
                          {getSortIcon('marginRatio')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-bg-header select-none"
                        onClick={() => sortPositions('tradingFees')}
                      >
                        <div className="flex items-center gap-2">
                          Fees
                          {getSortIcon('tradingFees')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-bg-header select-none"
                        onClick={() => sortPositions('fundingCost')}
                      >
                        <div className="flex items-center gap-2">
                          Funding
                          {getSortIcon('fundingCost')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedPositions().map((position) => (
                      <TableRow key={position.id}>
                        <TableCell>
                          <Badge 
                            variant={position.side === 'long' ? 'default' : 'destructive'}
                            className={position.side === 'long' ? 'bg-success/20 text-success hover:bg-success/30' : 'bg-destructive/20 text-destructive hover:bg-destructive/30'}
                          >
                            {position.side === 'long' ? 'LONG' : 'SHORT'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(position.quantity)}</TableCell>
                        <TableCell>{formatCurrency(position.price)}</TableCell>
                        <TableCell>{formatCurrency(position.liquidation)}</TableCell>
                        <TableCell>{position.leverage.toFixed(1)}x</TableCell>
                        <TableCell>{formatSats(position.margin)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getPnlIcon(position.pnl)}
                            <span className={getPnlColor(position.pnl)}>
                              {formatSats(position.pnl)}
                            </span>
                            <span className={`text-sm ${getPnlColor(position.pnl)}`}>
                              ({formatPercentage(position.pnlPercentage)})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            console.log('🔍 TRADES - DISPLAY - marginRatio:', position.marginRatio);
                            return position.marginRatio.toFixed(1) + '%';
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            console.log('🔍 TRADES - DISPLAY - tradingFees:', position.tradingFees);
                            return formatSats(position.tradingFees);
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            console.log('🔍 TRADES - DISPLAY - fundingCost:', position.fundingCost);
                            return formatSats(position.fundingCost);
                          })()}
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
    </LNMarketsGuard>
  );
}
