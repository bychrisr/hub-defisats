import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Activity,
  Settings,
  Eye,
  RefreshCw
} from "lucide-react";

const recentTrades = [
  {
    id: 1,
    type: "Stop Loss Acionado",
    asset: "BTC/USD",
    amount: "$1,250",
    saved: "$180",
    time: "2 min atrás",
    status: "success" as const,
  },
  {
    id: 2,
    type: "Margin Guard Ativo",
    asset: "BTC/USD", 
    amount: "$2,100",
    time: "15 min atrás",
    status: "active" as const,
  },
  {
    id: 3,
    type: "Take Profit",
    asset: "ETH/USD",
    amount: "$890",
    profit: "$95",
    time: "1h atrás",
    status: "success" as const,
  },
  {
    id: 4,
    type: "Entrada Automatizada",
    asset: "BTC/USD",
    amount: "$1,500",
    time: "3h atrás", 
    status: "active" as const,
  },
];

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas automações e posições
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Margem Atual"
          value="$2,845"
          change={{ value: "85% da posição", type: "warning" }}
          icon={DollarSign}
        />
        <MetricCard
          title="Capital Protegido"
          value="$12,450"
          change={{ value: "+$1,250 hoje", type: "positive" }}
          icon={Shield}
        />
        <MetricCard
          title="Trades Salvos"
          value="23"
          change={{ value: "Este mês", type: "neutral" }}
          icon={TrendingUp}
        />
        <MetricCard
          title="Uptime"
          value="99.8%"
          change={{ value: "Últimos 30 dias", type: "positive" }}
          icon={Activity}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Automation Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Margin Status */}
          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Status da Margem
                  </CardTitle>
                  <CardDescription>
                    Monitoramento em tempo real da sua posição
                  </CardDescription>
                </div>
                <StatusBadge status="warning">Em Alerta</StatusBadge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Margem Utilizada</span>
                  <span className="font-medium">$2,845 / $3,350 (85%)</span>
                </div>
                <Progress value={85} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Limite seguro: 70%</span>
                  <span>Liquidação: 95%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Posição Atual</p>
                  <p className="font-medium">Long BTC/USD</p>
                  <p className="text-sm">$15,250 (0.12 BTC)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">P&L Não Realizado</p>
                  <p className="font-medium text-success">+$234.50</p>
                  <p className="text-sm text-success">+1.54%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Automation Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Controles de Automação</CardTitle>
              <CardDescription>
                Ativar/desativar suas proteções automáticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Margin Guard</h4>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Ativo
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Proteção automática contra liquidação
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Limite: 90% • Ação: Reduzir posição em 50%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Switch checked />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Take Profit / Stop Loss</h4>
                    <Badge variant="outline" className="status-active">
                      Ativo
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatizar saídas de posições
                  </p>
                  <p className="text-xs text-muted-foreground">
                    TP: +8% • SL: -3% • Trailing: Ativo
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Switch checked />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Entradas Automáticas</h4>
                    <Badge variant="outline" className="status-inactive">
                      Inativo
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Abrir posições baseado em sinais
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nenhuma estratégia configurada
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configurar Automações
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Ver Relatórios
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                Histórico de Logs
              </Button>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="text-sm font-medium">Margem Alta</p>
                  <p className="text-xs text-muted-foreground">
                    Sua margem está em 85%. Considere reduzir a posição.
                  </p>
                </div>
                <div className="p-3 bg-muted/10 rounded-lg">
                  <p className="text-sm font-medium">API Conectada</p>
                  <p className="text-xs text-muted-foreground">
                    Última sincronização: há 30 segundos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas ações executadas pelas automações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    trade.status === 'success' ? 'bg-success' : 'bg-primary'
                  }`} />
                  <div>
                    <p className="font-medium">{trade.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {trade.asset} • {trade.amount}
                      {trade.saved && ` • Salvou ${trade.saved}`}
                      {trade.profit && ` • Lucro ${trade.profit}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={trade.status}>
                    {trade.status === 'success' ? 'Sucesso' : 'Ativo'}
                  </StatusBadge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trade.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};