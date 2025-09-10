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

  const fetchPositions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 TRADES - Fetching LN Markets positions...');
      
      const response = await api.get('/api/lnmarkets/positions');
      const data = response.data;
      
      console.log('✅ TRADES - Received positions:', data);
      
      if (data.success && data.data && data.data.positions) {
        // Transform LN Markets data to our interface
        const transformedPositions: LNPosition[] = data.data.positions.map((pos: any) => ({
          id: pos.id,
          quantity: pos.quantity || pos.size,
          price: pos.price || pos.entryPrice,
          liquidation: pos.liquidation || pos.liquidationPrice,
          leverage: pos.leverage || 1,
          margin: 0, // Will be calculated from margin info
          pnl: pos.unrealizedPnl,
          pnlPercentage: 0, // Will be calculated
          marginRatio: 0, // Will be calculated
          tradingFees: 0, // Not available in positions
          fundingCost: 0, // Not available in positions
          status: 'open' as const,
          side: pos.side === 'b' ? 'long' as const : 'short' as const,
          asset: pos.market,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        setPositions(transformedPositions);
        setTotalValue(data.data.marginInfo?.totalValue || 0);
        setTotalPnl(data.data.marginInfo?.totalUnrealizedPnl || 0);
        setTotalMargin(data.data.marginInfo?.margin || 0);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Trades</h1>
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
                {formatCurrency(totalPnl)}
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
              <div className="text-2xl font-bold">{formatCurrency(totalMargin)}</div>
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
                      <TableHead>Asset</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Liquidation</TableHead>
                      <TableHead>Leverage</TableHead>
                      <TableHead>Margin</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Margin Ratio</TableHead>
                      <TableHead>Fees</TableHead>
                      <TableHead>Funding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell className="font-medium">
                          {position.asset}
                        </TableCell>
                        <TableCell>
                          <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                            {position.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{position.quantity} $</TableCell>
                        <TableCell>{formatCurrency(position.price)}</TableCell>
                        <TableCell>{formatCurrency(position.liquidation)}</TableCell>
                        <TableCell>{position.leverage}x</TableCell>
                        <TableCell>{formatCurrency(position.margin)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getPnlIcon(position.pnl)}
                            <span className={getPnlColor(position.pnl)}>
                              {formatCurrency(position.pnl)}
                            </span>
                            <span className={`text-sm ${getPnlColor(position.pnl)}`}>
                              ({formatPercentage(position.pnlPercentage)})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{position.marginRatio.toFixed(1)}%</TableCell>
                        <TableCell>{formatCurrency(position.tradingFees)}</TableCell>
                        <TableCell>{formatCurrency(position.fundingCost)}</TableCell>
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
