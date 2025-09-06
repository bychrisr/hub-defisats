import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Calendar,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3,
  Search,
  Eye
} from "lucide-react";

const trades = [
  {
    id: "TRD001",
    date: "2024-01-15 14:30:22",
    type: "Stop Loss",
    asset: "BTC/USD",
    action: "Sell",
    amount: "$1,250.00",
    price: "$42,850.00",
    pnl: "-$45.50",
    pnlPercent: "-3.5%",
    status: "executed",
    automationType: "Margin Guard",
  },
  {
    id: "TRD002", 
    date: "2024-01-15 12:15:10",
    type: "Take Profit",
    asset: "BTC/USD",
    action: "Sell",
    amount: "$890.00",
    price: "$43,200.00",
    pnl: "+$67.30",
    pnlPercent: "+8.2%",
    status: "executed",
    automationType: "TP/SL",
  },
  {
    id: "TRD003",
    date: "2024-01-15 09:45:33",
    type: "Margin Protection",
    asset: "ETH/USD",
    action: "Reduce",
    amount: "$500.00",
    price: "$2,650.00",
    pnl: "+$12.80",
    pnlPercent: "+2.6%",
    status: "executed",
    automationType: "Margin Guard",
  },
  {
    id: "TRD004",
    date: "2024-01-14 16:22:45",
    type: "Stop Loss",
    asset: "BTC/USD",
    action: "Sell",
    amount: "$2,100.00",
    price: "$41,950.00",
    pnl: "-$89.25",
    pnlPercent: "-4.1%",
    status: "executed",
    automationType: "TP/SL",
  },
  {
    id: "TRD005",
    date: "2024-01-14 11:05:12",
    type: "Take Profit",
    asset: "ETH/USD",
    action: "Sell",
    amount: "$750.00",
    price: "$2,720.00",
    pnl: "+$85.50",
    pnlPercent: "+12.9%",
    status: "executed",
    automationType: "TP/SL",
  },
];

export const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === "all" || 
                         trade.automationType.toLowerCase().includes(selectedFilter.toLowerCase());
    
    return matchesSearch && matchesFilter;
  });

  const totalTrades = trades.length;
  const successfulTrades = trades.filter(t => parseFloat(t.pnl) > 0).length;
  const winRate = ((successfulTrades / totalTrades) * 100).toFixed(1);
  const totalPnL = trades.reduce((sum, trade) => sum + parseFloat(trade.pnl.replace(/[+$]/g, '')), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Trading</h1>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho das suas automações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Período
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Trades"
          value={totalTrades}
          change={{ value: "+12 este mês", type: "positive" }}
          icon={Activity}
        />
        <MetricCard
          title="Win Rate"
          value={`${winRate}%`}
          change={{ value: "Acima da média", type: "positive" }}
          icon={TrendingUp}
        />
        <MetricCard
          title="P&L Total"
          value={`$${totalPnL.toFixed(2)}`}
          change={{ 
            value: totalPnL > 0 ? "+2.4% hoje" : "-1.2% hoje", 
            type: totalPnL > 0 ? "positive" : "negative" 
          }}
          icon={DollarSign}
        />
        <MetricCard
          title="Capital Protegido"
          value="$3,247"
          change={{ value: "Trades salvos", type: "positive" }}
          icon={BarChart3}
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Histórico de Operações</CardTitle>
              <CardDescription>
                Todas as execuções das suas automações
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar trades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">Todos os tipos</option>
                <option value="margin">Margin Guard</option>
                <option value="tp">TP/SL</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 py-3 px-4 bg-muted/30 rounded-lg text-sm font-medium">
              <div>Trade ID</div>
              <div>Data/Hora</div>
              <div>Tipo</div>
              <div>Ativo</div>
              <div>Valor</div>
              <div>P&L</div>
              <div>Ações</div>
            </div>

            {/* Table Rows */}
            {filteredTrades.map((trade) => (
              <div
                key={trade.id}
                className="grid grid-cols-7 gap-4 py-4 px-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="font-mono text-sm">{trade.id}</div>
                
                <div className="text-sm">
                  <div>{trade.date.split(' ')[0]}</div>
                  <div className="text-muted-foreground text-xs">
                    {trade.date.split(' ')[1]}
                  </div>
                </div>
                
                <div>
                  <Badge variant="outline" className="text-xs">
                    {trade.type}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {trade.automationType}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium">{trade.asset}</div>
                  <div className="text-muted-foreground text-xs">
                    {trade.action} @ ${trade.price}
                  </div>
                </div>
                
                <div className="text-sm font-medium">
                  {trade.amount}
                </div>
                
                <div className="text-sm">
                  <div className={`font-medium ${
                    trade.pnl.startsWith('+') ? 'text-success' : 'text-destructive'
                  }`}>
                    {trade.pnl}
                  </div>
                  <div className={`text-xs ${
                    trade.pnlPercent.startsWith('+') ? 'text-success' : 'text-destructive'
                  }`}>
                    {trade.pnlPercent}
                  </div>
                </div>
                
                <div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredTrades.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum trade encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedFilter !== "all" 
                    ? "Tente ajustar os filtros de busca"
                    : "Suas automações ainda não executaram nenhum trade"
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Melhores Performances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trades
                .filter(t => parseFloat(t.pnl) > 0)
                .sort((a, b) => parseFloat(b.pnl.replace(/[+$]/g, '')) - parseFloat(a.pnl.replace(/[+$]/g, '')))
                .slice(0, 3)
                .map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{trade.asset} - {trade.type}</p>
                      <p className="text-xs text-muted-foreground">{trade.date.split(' ')[0]}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-success">{trade.pnl}</p>
                      <p className="text-xs text-success">{trade.pnlPercent}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Proteções Ativadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trades
                .filter(t => t.type.includes("Stop") || t.type.includes("Margin"))
                .slice(0, 3)
                .map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{trade.asset} - {trade.type}</p>
                      <p className="text-xs text-muted-foreground">
                        Capital protegido: {Math.abs(parseFloat(trade.pnl.replace(/[+$-]/g, '')) * 3).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status="success">Protegido</StatusBadge>
                      <p className="text-xs text-muted-foreground mt-1">{trade.date.split(' ')[0]}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};