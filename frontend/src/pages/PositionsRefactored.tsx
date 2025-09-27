/**
 * Positions Refatorado
 * 
 * Versão atualizada do Positions que utiliza os novos hooks refatorados
 * para consumir os endpoints da LN Markets API v2 refatorados
 */

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LNMarketsError } from '@/components/LNMarketsError';
import { LNMarketsGuard } from '@/components/LNMarketsGuard';
import SatsIcon from '@/components/SatsIcon';
import { useLNMarketsRefactoredPositions, useLNMarketsRefactoredMetrics, useLNMarketsRefactoredConnectionStatus } from '@/hooks/useLNMarketsRefactored';
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
  CheckCircle,
  XCircle,
  Clock,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RefactoredPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  price: number;
  margin: number;
  pnl: number;
  pnlPercentage: number;
  marginRatio: number;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  openingFee?: number;
  closingFee?: number;
  running?: boolean;
  closed?: boolean;
}

type SortField = 'side' | 'size' | 'price' | 'margin' | 'pnl' | 'marginRatio' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function PositionsRefactored() {
  // Dados refatorados
  const { positions: refactoredPositions, isLoading, error, refresh } = useLNMarketsRefactoredPositions();
  const { totalPL, totalMargin, positionCount } = useLNMarketsRefactoredMetrics();
  const { isConnected, error: connectionError } = useLNMarketsRefactoredConnectionStatus();
  
  const [positions, setPositions] = useState<RefactoredPosition[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [totalMarginValue, setTotalMarginValue] = useState(0);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showRefactoredData, setShowRefactoredData] = useState(true);

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
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-foreground" /> : 
      <ArrowDown className="h-4 w-4 text-foreground" />;
  };

  // Função para formatar valores
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(value);
  };

  // Função para formatar percentual
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Função para obter cor baseada no valor
  const getValueColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  // Função para obter ícone baseado no lado da posição
  const getSideIcon = (side: 'long' | 'short') => {
    return side === 'long' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // Função para obter badge de status
  const getStatusBadge = (position: RefactoredPosition) => {
    if (position.closed) {
      return <Badge variant="secondary">Fechada</Badge>;
    }
    if (position.running) {
      return <Badge variant="default">Ativa</Badge>;
    }
    return <Badge variant="outline">Aberta</Badge>;
  };

  // Função para atualizar posições
  const handleRefresh = async () => {
    setIsUpdating(true);
    try {
      await refresh();
      toast.success('Posições atualizadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar posições');
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para alternar entre dados antigos e refatorados
  const toggleDataSource = () => {
    setShowRefactoredData(!showRefactoredData);
    toast.info(`Mostrando dados ${showRefactoredData ? 'antigos' : 'refatorados'}`);
  };

  // Atualizar posições quando os dados mudarem
  useEffect(() => {
    if (refactoredPositions) {
      setPositions(refactoredPositions);
      
      // Calcular totais
      const totalPnlValue = refactoredPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
      const totalMarginValue = refactoredPositions.reduce((sum, pos) => sum + (pos.margin || 0), 0);
      const totalValue = refactoredPositions.reduce((sum, pos) => sum + (pos.price * pos.size), 0);
      
      setTotalPnl(totalPnlValue);
      setTotalMarginValue(totalMarginValue);
      setTotalValue(totalValue);
    }
  }, [refactoredPositions]);

  // Ordenar posições
  useEffect(() => {
    if (sortField && positions.length > 0) {
      const sorted = [...positions].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? 
            aValue.localeCompare(bValue) : 
            bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
      
      setPositions(sorted);
    }
  }, [sortField, sortDirection]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando posições...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || connectionError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar posições: {error || connectionError}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posições Refatoradas</h1>
          <p className="text-muted-foreground">
            Posições da LN Markets API v2 refatorada
            {isConnected && (
              <span className="ml-2 text-green-500">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                Conectado
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDataSource}
          >
            {showRefactoredData ? 'Mostrar Dados Antigos' : 'Mostrar Dados Refatorados'}
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isUpdating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status de Conexão */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-medium">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <Badge variant={showRefactoredData ? 'default' : 'secondary'}>
          {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
        </Badge>
        <RealtimeStatus />
      </div>

      {/* Métricas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Posições</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positionCount}</div>
            <p className="text-xs text-muted-foreground">
              {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P&L Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", getValueColor(totalPnl))}>
              {formatValue(totalPnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Total</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(totalMarginValue)}</div>
            <p className="text-xs text-muted-foreground">
              {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Posições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Posições Ativas</span>
            <Badge variant="outline">{positions.length}</Badge>
          </CardTitle>
          <CardDescription>
            {showRefactoredData ? 'Dados da API v2 Refatorada' : 'Dados da API v1 Antiga'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {positions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => sortPositions('side')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Lado</span>
                        {getSortIcon('side')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => sortPositions('symbol')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Símbolo</span>
                        {getSortIcon('symbol')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => sortPositions('size')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Tamanho</span>
                        {getSortIcon('size')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => sortPositions('price')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Preço</span>
                        {getSortIcon('price')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => sortPositions('margin')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Margem</span>
                        {getSortIcon('margin')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => sortPositions('pnl')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>P&L</span>
                        {getSortIcon('pnl')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => sortPositions('marginRatio')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Razão Margem</span>
                        {getSortIcon('marginRatio')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => sortPositions('createdAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Criado em</span>
                        {getSortIcon('createdAt')}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getSideIcon(position.side)}
                          <span className="font-medium">{position.side.toUpperCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{position.symbol}</TableCell>
                      <TableCell>{formatValue(position.size)}</TableCell>
                      <TableCell>${formatValue(position.price)}</TableCell>
                      <TableCell>{formatValue(position.margin)}</TableCell>
                      <TableCell>
                        <div className={cn("font-medium", getValueColor(position.pnl))}>
                          {formatValue(position.pnl)}
                        </div>
                        <div className={cn("text-sm", getValueColor(position.pnlPercentage))}>
                          {formatPercentage(position.pnlPercentage)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{formatValue(position.marginRatio)}</span>
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${Math.min(position.marginRatio * 10, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(position.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(position.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(position)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma posição encontrada</p>
              <p className="text-sm">
                {showRefactoredData ? 'Dados da API v2 Refatorada' : 'Dados da API v1 Antiga'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Informações da API</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Fonte dos Dados</p>
              <p className="font-medium">
                {showRefactoredData ? 'API v2 Refatorada' : 'API v1 Antiga'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status da Conexão</p>
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Atualização</p>
              <p className="font-medium">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
