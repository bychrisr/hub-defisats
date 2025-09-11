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

export default function Trades() {
  const [positions, setPositions] = useState<LNPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
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
  const formatSats = (value: number) => {
    return (
      <span className="flex items-center gap-1">
        {value.toLocaleString()}
        <SatsIcon size={14} className="text-orange-500" />
      </span>
    );
  };

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

  const fetchPositions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 TRADES - Fetching LN Markets positions...');
      
      const response = await api.get('/api/lnmarkets/positions');
      const data = response.data;
      
      console.log('✅ TRADES - Received positions:', data);
      console.log('🔍 TRADES - Full response data:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data && data.data.positions) {
        // Transform LN Markets data to our interface
        const transformedPositions: LNPosition[] = data.data.positions.map((pos: any) => {
          console.log('🔍 TRADES - Transforming position:', pos);
          
          // Calculate P&L percentage
          const pnlPercentage = pos.margin > 0 ? (pos.pl / pos.margin) * 100 : 0;
          
          // Calculate margin ratio (maintenance_margin / (margin + pl))
          const marginRatio = pos.margin > 0 ? (pos.maintenance_margin / (pos.margin + pos.pl)) * 100 : 0;
          
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
            tradingFees: (pos.opening_fee || 0) + (pos.closing_fee || 0),
            fundingCost: pos.sum_carry_fees || 0,
            status: pos.running ? 'open' as const : 'closed' as const,
            side: pos.side === 'b' ? 'long' as const : 'short' as const,
            asset: 'BTC', // LN Markets only trades BTC futures
            createdAt: new Date(pos.creation_ts || Date.now()).toISOString(),
            updatedAt: new Date(pos.market_filled_ts || Date.now()).toISOString(),
          };
        });

        setPositions(transformedPositions);
        
        // Calculate totals from actual positions data
        const totalValue = transformedPositions.reduce((sum, pos) => sum + (pos.quantity * pos.price), 0);
        const totalPnl = transformedPositions.reduce((sum, pos) => sum + pos.pnl, 0);
        const totalMargin = transformedPositions.reduce((sum, pos) => sum + pos.margin, 0);
        
        setTotalValue(totalValue);
        setTotalPnl(totalPnl);
        setTotalMargin(totalMargin);
        
        console.log('📊 TRADES - Calculated totals:', {
          totalValue,
          totalPnl,
          totalMargin,
          positionsCount: transformedPositions.length
        });
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPnlIcon = (pnl: number) => {
    if (pnl > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (pnl < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
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
            <Button onClick={fetchPositions} variant="outline">
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
            <h1 className="text-3xl font-bold text-gray-900">Positions</h1>
            <p className="text-gray-600">Monitor your active positions on LN Markets</p>
          </div>
          <Button onClick={fetchPositions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Total portfolio value
              </p>
            </CardContent>
          </Card>
          
          <Card>
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
          
          <Card>
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
        <Card>
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
                <div className="text-gray-500 mb-4">
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
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => sortPositions('side')}
                      >
                        <div className="flex items-center gap-2">
                          Side
                          {getSortIcon('side')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => sortPositions('quantity')}
                      >
                        <div className="flex items-center gap-2">
                          Quantity
                          {getSortIcon('quantity')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => sortPositions('price')}
                      >
                        <div className="flex items-center gap-2">
                          Price
                          {getSortIcon('price')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => sortPositions('liquidation')}
                      >
                        <div className="flex items-center gap-2">
                          Liquidation
                          {getSortIcon('liquidation')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => sortPositions('leverage')}
                      >
                        <div className="flex items-center gap-2">
                          Leverage
                          {getSortIcon('leverage')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => sortPositions('margin')}
                      >
                        <div className="flex items-center gap-2">
                          Margin
                          {getSortIcon('margin')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => sortPositions('pnl')}
                      >
                        <div className="flex items-center gap-2">
                          P&L
                          {getSortIcon('pnl')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => sortPositions('marginRatio')}
                      >
                        <div className="flex items-center gap-2">
                          Margin Ratio
                          {getSortIcon('marginRatio')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => sortPositions('tradingFees')}
                      >
                        <div className="flex items-center gap-2">
                          Fees
                          {getSortIcon('tradingFees')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
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
                            className={position.side === 'long' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}
                          >
                            {position.side === 'long' ? 'LONG' : 'SHORT'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(position.quantity)}</TableCell>
                        <TableCell>{formatCurrency(position.price)}</TableCell>
                        <TableCell>{formatCurrency(position.liquidation)}</TableCell>
                        <TableCell>{position.leverage}x</TableCell>
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
                        <TableCell>{position.marginRatio.toFixed(1)}%</TableCell>
                        <TableCell>{formatSats(position.tradingFees)}</TableCell>
                        <TableCell>{formatSats(position.fundingCost)}</TableCell>
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
