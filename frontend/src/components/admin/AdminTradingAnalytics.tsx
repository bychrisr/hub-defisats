import React, { useState } from 'react';
import { useAdminTradingAnalytics } from '../../hooks/useAdminTradingAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { RefreshCw, Search, Filter, Download } from 'lucide-react';

export function AdminTradingAnalytics() {
  const [filters, setFilters] = useState({
    search: '',
    planType: '',
    sortBy: 'totalTrades' as const,
    sortOrder: 'desc' as const,
    page: 1,
    limit: 10
  });

  const { data, metrics, pagination, loading, error, refresh } = useAdminTradingAnalytics(filters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
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
        <h1 className="text-3xl font-bold">Analytics de Trading</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar usuário..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.planType} onValueChange={(value) => handleFilterChange('planType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Planos</SelectItem>
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
                <SelectItem value="totalTrades">Total de Trades</SelectItem>
                <SelectItem value="winRate">Taxa de Vitória</SelectItem>
                <SelectItem value="pnl">PnL</SelectItem>
                <SelectItem value="createdAt">Data de Criação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Crescente</SelectItem>
                <SelectItem value="desc">Decrescente</SelectItem>
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
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <p className="text-sm text-gray-600">Total de Usuários</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.activeUsers}</div>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.totalTrades}</div>
              <p className="text-sm text-gray-600">Total de Trades</p>
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
              <div className="text-2xl font-bold">{metrics.avgWinRate.toFixed(1)}%</div>
              <p className="text-sm text-gray-600">Taxa Média de Vitória</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários e Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Trades</TableHead>
                <TableHead>Taxa de Vitória</TableHead>
                <TableHead>PnL Total</TableHead>
                <TableHead>PnL Médio</TableHead>
                <TableHead>Último Trade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.planType}</Badge>
                  </TableCell>
                  <TableCell>{user.totalTrades}</TableCell>
                  <TableCell>
                    <span className={user.winRate >= 50 ? 'text-green-600' : 'text-red-600'}>
                      {user.winRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={user.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${user.totalPnL.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={user.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${user.avgPnL.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.lastTradeAt ? new Date(user.lastTradeAt).toLocaleDateString() : 'N/A'}
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

