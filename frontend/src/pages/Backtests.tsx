import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Play,
  History,
  Target,
  DollarSign,
  Percent,
  Calendar,
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import axios from 'axios';
import { toast } from 'sonner';

const backtestSchema = z.object({
  startDate: z.string().min(1, 'Data inicial é obrigatória'),
  endDate: z.string().min(1, 'Data final é obrigatória'),
  initialBalance: z.number().min(100, 'Saldo inicial deve ser no mínimo 100'),
  automationType: z.enum(['margin_guard', 'tp_sl', 'auto_entry']),
  automationConfig: z.object({
    margin_threshold: z.number().optional(),
    action: z.enum(['close_position', 'reduce_position', 'add_margin']).optional(),
    reduce_percentage: z.number().optional(),
    add_margin_amount: z.number().optional(),
    takeprofit: z.number().optional(),
    stoploss: z.number().optional(),
    trailing_stop: z.boolean().optional(),
    trigger_price: z.number().optional(),
    trigger_type: z.enum(['market', 'limit']).optional(),
    side: z.enum(['b', 's']).optional(),
    quantity: z.number().optional(),
    leverage: z.number().optional(),
  }),
});

type BacktestForm = z.infer<typeof backtestSchema>;

interface BacktestResult {
  id: string;
  created_at: string;
  config: BacktestForm;
  result: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnl: number;
    maxDrawdown: number;
    sharpeRatio: number;
    trades: Array<{
      id: string;
      entryTime: string;
      exitTime: string;
      side: string;
      entryPrice: number;
      exitPrice: number;
      quantity: number;
      pnl: number;
      pnlPercentage: number;
      automationAction?: string;
    }>;
    performance: Array<{
      date: string;
      balance: number;
      pnl: number;
      drawdown: number;
    }>;
  };
}

interface AutomationType {
  type: string;
  name: string;
  description: string;
  config_schema: any;
}

export const Backtests = () => {
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [automationTypes, setAutomationTypes] = useState<AutomationType[]>([]);
  const [selectedBacktest, setSelectedBacktest] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BacktestForm>({
    resolver: zodResolver(backtestSchema),
    defaultValues: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      initialBalance: 10000,
      automationType: 'margin_guard',
      automationConfig: {},
    },
  });

  const selectedAutomationType = watch('automationType');

  useEffect(() => {
    fetchBacktests();
    fetchAutomationTypes();
  }, []);

  const fetchBacktests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/backtests');
      setBacktests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching backtests:', error);
      toast.error('Erro ao carregar backtests');
    } finally {
      setLoading(false);
    }
  };

  const fetchAutomationTypes = async () => {
    try {
      const response = await axios.get('/api/backtests/automation-types');
      setAutomationTypes(response.data.data.automation_types || []);
    } catch (error) {
      console.error('Error fetching automation types:', error);
    }
  };

  const onSubmit = async (data: BacktestForm) => {
    try {
      setRunning(true);
      const response = await axios.post('/api/backtests', data);
      toast.success('Backtest executado com sucesso!');
      fetchBacktests();
      setDialogOpen(false);
      reset();
    } catch (error: any) {
      console.error('Error executing backtest:', error);
      toast.error(error.response?.data?.error || 'Erro ao executar backtest');
    } finally {
      setRunning(false);
    }
  };

  const deleteBacktest = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este backtest?')) return;

    try {
      await axios.delete(`/api/backtests/${id}`);
      toast.success('Backtest excluído com sucesso!');
      fetchBacktests();
    } catch (error) {
      console.error('Error deleting backtest:', error);
      toast.error('Erro ao excluir backtest');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getAutomationTypeName = (type: string) => {
    const automation = automationTypes.find(a => a.type === type);
    return automation?.name || type;
  };

  const renderAutomationConfig = () => {
    const automation = automationTypes.find(a => a.type === selectedAutomationType);
    if (!automation) return null;

    const schema = automation.config_schema;

    return (
      <div className="space-y-4">
        <h4 className="font-medium">{automation.name}</h4>
        <p className="text-sm text-muted-foreground">{automation.description}</p>

        {selectedAutomationType === 'margin_guard' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="margin_threshold">Margem Limite (%)</Label>
              <Input
                id="margin_threshold"
                type="number"
                {...register('automationConfig.margin_threshold', { valueAsNumber: true })}
                defaultValue={10}
              />
            </div>
            <div>
              <Label htmlFor="action">Ação</Label>
              <Select
                onValueChange={(value) => setValue('automationConfig.action', value as any)}
                defaultValue="close_position"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="close_position">Fechar Posição</SelectItem>
                  <SelectItem value="reduce_position">Reduzir Posição</SelectItem>
                  <SelectItem value="add_margin">Adicionar Margem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {watch('automationConfig.action') === 'reduce_position' && (
              <div>
                <Label htmlFor="reduce_percentage">Porcentagem de Redução (%)</Label>
                <Input
                  id="reduce_percentage"
                  type="number"
                  {...register('automationConfig.reduce_percentage', { valueAsNumber: true })}
                  defaultValue={50}
                />
              </div>
            )}
            {watch('automationConfig.action') === 'add_margin' && (
              <div>
                <Label htmlFor="add_margin_amount">Valor da Margem</Label>
                <Input
                  id="add_margin_amount"
                  type="number"
                  {...register('automationConfig.add_margin_amount', { valueAsNumber: true })}
                  defaultValue={1000}
                />
              </div>
            )}
          </div>
        )}

        {selectedAutomationType === 'tp_sl' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="takeprofit">Take Profit (%)</Label>
              <Input
                id="takeprofit"
                type="number"
                step="0.1"
                {...register('automationConfig.takeprofit', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="stoploss">Stop Loss (%)</Label>
              <Input
                id="stoploss"
                type="number"
                step="0.1"
                {...register('automationConfig.stoploss', { valueAsNumber: true })}
              />
            </div>
          </div>
        )}

        {selectedAutomationType === 'auto_entry' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trigger_price">Preço de Gatilho</Label>
              <Input
                id="trigger_price"
                type="number"
                step="0.01"
                {...register('automationConfig.trigger_price', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                {...register('automationConfig.quantity', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="leverage">Alavancagem</Label>
              <Input
                id="leverage"
                type="number"
                {...register('automationConfig.leverage', { valueAsNumber: true })}
                defaultValue={10}
              />
            </div>
            <div>
              <Label htmlFor="side">Lado</Label>
              <Select
                onValueChange={(value) => setValue('automationConfig.side', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="b">Compra (Long)</SelectItem>
                  <SelectItem value="s">Venda (Short)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Backtests</h1>
            <p className="text-muted-foreground">
              Análise de performance de estratégias de trading
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={fetchBacktests}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Backtest
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Executar Backtest</DialogTitle>
                  <DialogDescription>
                    Configure os parâmetros para executar um backtest da sua estratégia
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Data Inicial</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register('startDate')}
                      />
                      {errors.startDate && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.startDate.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="endDate">Data Final</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...register('endDate')}
                      />
                      {errors.endDate && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.endDate.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="initialBalance">Saldo Inicial</Label>
                      <Input
                        id="initialBalance"
                        type="number"
                        {...register('initialBalance', { valueAsNumber: true })}
                      />
                      {errors.initialBalance && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.initialBalance.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="automationType">Tipo de Automação</Label>
                      <Select
                        onValueChange={(value) => setValue('automationType', value as any)}
                        defaultValue="margin_guard"
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {automationTypes.map((type) => (
                            <SelectItem key={type.type} value={type.type}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {renderAutomationConfig()}

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={running}>
                      {running ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Executando...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Executar Backtest
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Backtests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{backtests.length}</div>
              <p className="text-xs text-muted-foreground">
                Executados recentemente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso Média</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {backtests.length > 0
                  ? formatPercentage(
                      backtests.reduce((sum, b) => sum + b.result.winRate, 0) / backtests.length
                    )
                  : '0%'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Baseado em todos os backtests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PnL Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                backtests.reduce((sum, b) => sum + b.result.totalPnl, 0) >= 0
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {formatCurrency(
                  backtests.reduce((sum, b) => sum + b.result.totalPnl, 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Lucro/perda acumulado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Melhor Sharpe Ratio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {backtests.length > 0
                  ? Math.max(...backtests.map(b => b.result.sharpeRatio)).toFixed(2)
                  : '0.00'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Razão risco-retorno
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Backtests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Backtests</CardTitle>
            <CardDescription>
              Resultados das análises de performance executadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backtests.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum backtest encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Execute seu primeiro backtest para começar a analisar estratégias
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Backtest
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Estratégia</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Taxa de Sucesso</TableHead>
                    <TableHead>PnL Total</TableHead>
                    <TableHead>Sharpe Ratio</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backtests.map((backtest) => (
                    <TableRow key={backtest.id}>
                      <TableCell>
                        {new Date(backtest.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getAutomationTypeName(backtest.config.automationType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{backtest.result.totalTrades}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          backtest.result.winRate >= 50 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {formatPercentage(backtest.result.winRate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          backtest.result.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {formatCurrency(backtest.result.totalPnl)}
                        </span>
                      </TableCell>
                      <TableCell>{backtest.result.sharpeRatio.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBacktest(backtest)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBacktest(backtest.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detailed Backtest Modal */}
        {selectedBacktest && (
          <Dialog open={!!selectedBacktest} onOpenChange={() => setSelectedBacktest(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Resultado do Backtest</DialogTitle>
                <DialogDescription>
                  Análise detalhada da performance da estratégia
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="trades">Trades</TabsTrigger>
                  <TabsTrigger value="config">Configuração</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{selectedBacktest.result.totalTrades}</div>
                        <p className="text-xs text-muted-foreground">Total de Trades</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-500">
                          {selectedBacktest.result.winningTrades}
                        </div>
                        <p className="text-xs text-muted-foreground">Trades Vencedores</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-500">
                          {selectedBacktest.result.losingTrades}
                        </div>
                        <p className="text-xs text-muted-foreground">Trades Perdedores</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className={`text-2xl font-bold ${
                          selectedBacktest.result.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {formatCurrency(selectedBacktest.result.totalPnl)}
                        </div>
                        <p className="text-xs text-muted-foreground">PnL Total</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {formatPercentage(selectedBacktest.result.winRate)}
                        </div>
                        <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-500">
                          {formatPercentage(selectedBacktest.result.maxDrawdown)}
                        </div>
                        <p className="text-xs text-muted-foreground">Max Drawdown</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {selectedBacktest.result.sharpeRatio.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {getAutomationTypeName(selectedBacktest.config.automationType)}
                        </div>
                        <p className="text-xs text-muted-foreground">Estratégia</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolução do Capital</CardTitle>
                      <CardDescription>
                        Performance ao longo do período do backtest
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={selectedBacktest.result.performance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                            formatter={(value: any) => [formatCurrency(Number(value)), '']}
                          />
                          <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Drawdown</CardTitle>
                      <CardDescription>
                        Máxima perda acumulada durante o período
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={selectedBacktest.result.performance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                            formatter={(value: any) => [formatPercentage(Number(value)), '']}
                          />
                          <Line
                            type="monotone"
                            dataKey="drawdown"
                            stroke="#ef4444"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trades" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Histórico de Trades</CardTitle>
                      <CardDescription>
                        Todos os trades executados durante o backtest
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data Entrada</TableHead>
                              <TableHead>Data Saída</TableHead>
                              <TableHead>Lado</TableHead>
                              <TableHead>Preço Entrada</TableHead>
                              <TableHead>Preço Saída</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead>PnL</TableHead>
                              <TableHead>PnL %</TableHead>
                              <TableHead>Ação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedBacktest.result.trades.map((trade) => (
                              <TableRow key={trade.id}>
                                <TableCell>
                                  {new Date(trade.entryTime).toLocaleString('pt-BR')}
                                </TableCell>
                                <TableCell>
                                  {new Date(trade.exitTime).toLocaleString('pt-BR')}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={trade.side === 'long' ? 'default' : 'secondary'}>
                                    {trade.side === 'long' ? 'Compra' : 'Venda'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatCurrency(trade.entryPrice)}</TableCell>
                                <TableCell>{formatCurrency(trade.exitPrice)}</TableCell>
                                <TableCell>{trade.quantity}</TableCell>
                                <TableCell className={
                                  trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                                }>
                                  {formatCurrency(trade.pnl)}
                                </TableCell>
                                <TableCell className={
                                  trade.pnlPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                                }>
                                  {formatPercentage(trade.pnlPercentage)}
                                </TableCell>
                                <TableCell>
                                  {trade.automationAction && (
                                    <Badge variant="outline">
                                      {trade.automationAction}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="config" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuração do Backtest</CardTitle>
                      <CardDescription>
                        Parâmetros utilizados na execução
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Data Inicial</Label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedBacktest.config.startDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <Label>Data Final</Label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedBacktest.config.endDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <Label>Saldo Inicial</Label>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(selectedBacktest.config.initialBalance)}
                          </p>
                        </div>
                        <div>
                          <Label>Estratégia</Label>
                          <p className="text-sm text-muted-foreground">
                            {getAutomationTypeName(selectedBacktest.config.automationType)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label>Configuração da Estratégia</Label>
                        <pre className="mt-2 p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                          {JSON.stringify(selectedBacktest.config.automationConfig, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Backtests;
