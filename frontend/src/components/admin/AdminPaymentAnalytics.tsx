import React, { useState } from 'react';
import { useAdminPaymentAnalytics } from '../../hooks/useAdminPaymentAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { RefreshCw, Search, Filter, Download, DollarSign } from 'lucide-react';

export function AdminPaymentAnalytics() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
    planType: '',
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
    page: 1,
    limit: 10
  });

  const { data, metrics, pagination, loading, error, refresh } = useAdminPaymentAnalytics(filters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { variant: 'default' as const, color: 'text-green-600' },
      'pending': { variant: 'secondary' as const, color: 'text-yellow-600' },
      'failed': { variant: 'destructive' as const, color: 'text-red-600' },
      'cancelled': { variant: 'outline' as const, color: 'text-gray-600' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { variant: 'outline' as const, color: 'text-gray-600' };
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status}
      </Badge>
    );
  };

  const getPaymentMethodBadge = (method: string | null) => {
    if (!method) return <span className="text-gray-400">N/A</span>;
    
    const methodMap = {
      'lightning': { variant: 'default' as const, color: 'text-yellow-600' },
      'card': { variant: 'secondary' as const, color: 'text-blue-600' },
      'bank_transfer': { variant: 'outline' as const, color: 'text-gray-600' }
    };
    
    const config = methodMap[method as keyof typeof methodMap] || { variant: 'outline' as const, color: 'text-gray-600' };
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {method}
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
        <h1 className="text-3xl font-bold">Analytics de Pagamentos</h1>
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
                <SelectItem value="">Todos os Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.paymentMethod} onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Método de Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Métodos</SelectItem>
                <SelectItem value="lightning">Lightning</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>

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
                <SelectItem value="createdAt">Data de Criação</SelectItem>
                <SelectItem value="paidAt">Data de Pagamento</SelectItem>
                <SelectItem value="amount">Valor</SelectItem>
                <SelectItem value="amountSats">Valor em Sats</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Receita Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.totalTransactions}</div>
              <p className="text-sm text-gray-600">Total de Transações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">${metrics.avgTransactionValue.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Valor Médio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Breakdown */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{metrics.completedPayments}</div>
              <p className="text-sm text-gray-600">Pagamentos Concluídos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{metrics.pendingPayments}</div>
              <p className="text-sm text-gray-600">Pagamentos Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{metrics.failedPayments}</div>
              <p className="text-sm text-gray-600">Pagamentos Falhados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Transações de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Valor (Sats)</TableHead>
                <TableHead>Valor (USD)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Pago em</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.username}</div>
                      <div className="text-sm text-gray-500">{payment.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {payment.amountSats.toLocaleString()} sats
                    </div>
                  </TableCell>
                  <TableCell>
                    {payment.amount ? `$${payment.amount.toLocaleString()}` : 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.planType}</Badge>
                  </TableCell>
                  <TableCell>
                    {payment.description || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(payment.createdAt).toLocaleString()}
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

