import React, { useState } from 'react';
import { useAdminTradeLogs } from '../../hooks/useAdminTradeLogs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { RefreshCw, Search, Filter, Download } from 'lucide-react';

export function AdminTradeLogs() {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    action: 'all',
    planType: 'all',
    sortBy: 'executedAt' as const,
    sortOrder: 'desc' as const,
    page: 1,
    limit: 10
  });

  const { data, metrics, pagination, loading, error, refresh } = useAdminTradeLogs(filters);

  const handleFilterChange = (key: string, value: string) => {
    // Tratar "all" como valor vazio para filtros
    const filterValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: filterValue, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'success': { variant: 'default' as const, color: 'text-green-600' },
      'failed': { variant: 'destructive' as const, color: 'text-red-600' },
      'pending': { variant: 'secondary' as const, color: 'text-yellow-600' },
      'cancelled': { variant: 'outline' as const, color: 'text-gray-600' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { variant: 'outline' as const, color: 'text-gray-600' };
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status}
      </Badge>
    );
  };

  const getActionBadge = (action: string | null) => {
    if (!action) return <span className="text-gray-400">N/A</span>;
    
    const actionMap = {
      'buy': { variant: 'default' as const, color: 'text-green-600' },
      'sell': { variant: 'destructive' as const, color: 'text-red-600' },
      'hold': { variant: 'secondary' as const, color: 'text-blue-600' }
    };
    
    const config = actionMap[action as keyof typeof actionMap] || { variant: 'outline' as const, color: 'text-gray-600' };
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {action}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Logs de Trades</h1>
        <div className="flex gap-2">
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.planType} onValueChange={(value) => handleFilterChange('planType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="executedAt">Data de Execução</SelectItem>
                <SelectItem value="createdAt">Data de Criação</SelectItem>
                <SelectItem value="pnl">PnL</SelectItem>
                <SelectItem value="amount">Valor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.totalTrades}</div>
              <p className="text-sm text-gray-600">Total de Trades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{metrics.successfulTrades}</div>
              <p className="text-sm text-gray-600">Trades Bem-sucedidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{metrics.failedTrades}</div>
              <p className="text-sm text-gray-600">Trades Falhados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">${metrics.totalPnL.toLocaleString()}</div>
              <p className="text-sm text-gray-600">PnL Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">${metrics.avgPnL.toLocaleString()}</div>
              <p className="text-sm text-gray-600">PnL Médio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Trade ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>PnL</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Executado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trade.username}</div>
                      <div className="text-sm text-gray-500">ID: {trade.userId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {trade.tradeId}
                    </code>
                  </TableCell>
                  <TableCell>{getStatusBadge(trade.status)}</TableCell>
                  <TableCell>{getActionBadge(trade.action)}</TableCell>
                  <TableCell>
                    {trade.planType ? <Badge variant="outline">{trade.planType}</Badge> : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {trade.pnl !== null ? (
                      <span className={trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${trade.pnl.toLocaleString()}
                      </span>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {trade.amount !== null ? `$${trade.amount.toLocaleString()}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {trade.price !== null ? `$${trade.price.toLocaleString()}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(trade.executedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginação */}
          {pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

