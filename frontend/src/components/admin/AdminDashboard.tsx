import React from 'react';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { MetricCard } from '../dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { SWCacheManager } from '../SWCacheManager';
import { RefreshCw, Users, Activity, DollarSign, TrendingUp, Clock } from 'lucide-react';

export function AdminDashboard() {
  const { metrics, loading, error, refresh } = useAdminDashboard();

  console.log('🔍 ADMIN DASHBOARD - Render state:', { metrics, loading, error });

  if (loading) {
    console.log('⏳ ADMIN DASHBOARD - Loading state');
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

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total de Usuários"
          value={metrics.totalUsers.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          description="Usuários registrados no sistema"
        />
        
        <MetricCard
          title="Usuários Ativos"
          value={metrics.activeUsers.toLocaleString()}
          icon={<Activity className="h-4 w-4" />}
          description="Usuários ativos nas últimas 24h"
        />
        
        <MetricCard
          title="Receita Mensal"
          value={`$${metrics.monthlyRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          description="Receita dos últimos 30 dias"
        />
        
        <MetricCard
          title="Total de Trades"
          value={metrics.totalTrades.toLocaleString()}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Trades executados no sistema"
        />
        
        <MetricCard
          title="Uptime do Sistema"
          value={`${metrics.uptimePercentage.toFixed(1)}%`}
          icon={<Clock className="h-4 w-4" />}
          description="Tempo de atividade do sistema"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Usuários Ativos</span>
                <span className="font-medium">{metrics.activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total de Usuários</span>
                <span className="font-medium">{metrics.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Taxa de Atividade</span>
                <span className="font-medium">
                  {((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="font-medium">{metrics.uptimePercentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Trades Executados</span>
                <span className="font-medium">{metrics.totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Receita Mensal</span>
                <span className="font-medium">${metrics.monthlyRevenue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Cache</CardTitle>
        </CardHeader>
        <CardContent>
          <SWCacheManager />
        </CardContent>
      </Card>
    </div>
  );
}

