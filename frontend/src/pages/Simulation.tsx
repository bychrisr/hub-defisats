import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  BarChart3,
  Clock,
  DollarSign,
  Activity,
  Eye,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import SimulationChart from '@/components/SimulationChart';

const simulationSchema = z.object({
  name: z.string().min(1).max(100),
  automationType: z.enum(['margin_guard', 'take_profit', 'trailing_stop', 'auto_entry']),
  priceScenario: z.enum(['bull', 'bear', 'sideways', 'volatile']),
  initialPrice: z.number().min(1),
  duration: z.number().min(10).max(3600),
});

type SimulationForm = z.infer<typeof simulationSchema>;

interface Simulation {
  id: string;
  name: string;
  automation_type: string;
  price_scenario: string;
  initial_price: number;
  duration: number;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  results?: Array<{
    timestamp: string;
    price: number;
    pnl?: number;
    action_type?: string;
  }>;
}

interface SimulationProgress {
  simulationId: string;
  status: string;
  progress: number;
  currentPrice: number;
  started_at?: string;
  completed_at?: string;
}

interface SimulationMetrics {
  successRate: number;
  totalActions: number;
  averageResponseTime: number;
  totalPnL: number;
  maxDrawdown: number;
  finalBalance: number;
}

export default function Simulation() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [metrics, setMetrics] = useState<SimulationMetrics | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState<{
    priceData: any[];
    pnlData: any[];
    actions: any[];
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SimulationForm>({
    resolver: zodResolver(simulationSchema),
    defaultValues: {
      name: '',
      automationType: 'margin_guard',
      priceScenario: 'bear',
      initialPrice: 50000,
      duration: 60,
    },
  });

  const selectedAutomationType = watch('automationType');
  const selectedPriceScenario = watch('priceScenario');

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      const response = await axios.get('/api/simulations');
      setSimulations(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch simulations');
    }
  };

  const onSubmit = async (data: SimulationForm) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/simulations', data);
      toast.success('Simulation created successfully');
      reset();
      fetchSimulations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const startSimulation = async (simulationId: string) => {
    try {
      setIsRunning(true);
      setProgress(null);
      setMetrics(null);

      await axios.post(`/api/simulations/${simulationId}/start`);
      toast.success('Simulation started');

      // Start polling for progress
      const pollInterval = setInterval(async () => {
        try {
          const response = await axios.get(`/api/simulations/${simulationId}/progress`);
          const progressData = response.data.data;
          setProgress(progressData);

          if (progressData.status === 'completed') {
            clearInterval(pollInterval);
            setIsRunning(false);
            fetchSimulations();

            // Fetch final metrics
            const metricsResponse = await axios.get(`/api/simulations/${simulationId}/metrics`);
            setMetrics(metricsResponse.data.data.metrics);
          }
        } catch (error) {
          console.error('Failed to fetch progress:', error);
        }
      }, 1000); // Poll every second

      // Stop polling after max duration + buffer
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsRunning(false);
      }, 3700000); // 1 hour + 1 minute buffer

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start simulation');
      setIsRunning(false);
    }
  };

  const loadSimulationChart = async (simulation: Simulation) => {
    try {
      setSelectedSimulation(simulation);
      const response = await axios.get(`/api/simulations/${simulation.id}/chart`);
      setChartData(response.data.data);
      setShowChart(true);

      // Also load metrics
      const metricsResponse = await axios.get(`/api/simulations/${simulation.id}/metrics`);
      setMetrics(metricsResponse.data.data.metrics);
    } catch (error: any) {
      toast.error('Failed to load simulation chart');
    }
  };

  const deleteSimulation = async (simulationId: string) => {
    if (!confirm('Are you sure you want to delete this simulation?')) {
      return;
    }

    try {
      await axios.delete(`/api/simulations/${simulationId}`);
      toast.success('Simulation deleted successfully');
      fetchSimulations();
      setSelectedSimulation(null);
      setShowChart(false);
      setChartData(null);
      setMetrics(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete simulation');
    }
  };

  const getScenarioIcon = (scenario: string) => {
    switch (scenario) {
      case 'bull':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bear':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'sideways':
        return <Minus className="h-4 w-4 text-gray-500" />;
      case 'volatile':
        return <Zap className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getScenarioDescription = (scenario: string) => {
    switch (scenario) {
      case 'bull':
        return 'Mercado em alta com tendência positiva e volatilidade baixa';
      case 'bear':
        return 'Mercado em queda com tendência negativa e volatilidade média';
      case 'sideways':
        return 'Mercado lateral sem tendência definida';
      case 'volatile':
        return 'Mercado altamente volátil e imprevisível';
      default:
        return '';
    }
  };

  const getAutomationDescription = (type: string) => {
    switch (type) {
      case 'margin_guard':
        return 'Proteção inteligente - Adiciona margem automaticamente para afastar liquidação';
      case 'take_profit':
        return 'Captura lucros automaticamente - Executa quando preço sobe significativamente';
      case 'trailing_stop':
        return 'Stop móvel inteligente - Segue tendência com stop ajustável';
      case 'auto_entry':
        return 'Entrada automática - Entra em posições baseadas em sinais técnicos';
      default:
        return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
        return <Badge variant="secondary">Criado</Badge>;
      case 'running':
        return <Badge variant="default">Executando</Badge>;
      case 'completed':
        return <Badge variant="outline">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Simulações em Tempo Real</h1>
            <p className="text-gray-600 mt-2">
              Teste suas automações com cenários de mercado realistas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Nova Simulação</span>
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros da simulação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Simulação</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Teste Margin Guard Bear Market"
                      {...register('name')}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="automationType">Tipo de Automação</Label>
                    <Select
                      value={selectedAutomationType}
                      onValueChange={(value) => setValue('automationType', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="margin_guard">Margin Guard</SelectItem>
                        <SelectItem value="take_profit">Take Profit</SelectItem>
                        <SelectItem value="trailing_stop">Trailing Stop</SelectItem>
                        <SelectItem value="auto_entry">Auto Entry</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {getAutomationDescription(selectedAutomationType)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priceScenario">Cenário de Preço</Label>
                    <Select
                      value={selectedPriceScenario}
                      onValueChange={(value) => setValue('priceScenario', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cenário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bull">🐂 Bull Market</SelectItem>
                        <SelectItem value="bear">🐻 Bear Market</SelectItem>
                        <SelectItem value="sideways">➡️ Sideways</SelectItem>
                        <SelectItem value="volatile">⚡ Volatile</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      {getScenarioIcon(selectedPriceScenario)}
                      <p className="text-xs text-gray-500">
                        {getScenarioDescription(selectedPriceScenario)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="initialPrice">Preço Inicial (USD)</Label>
                    <Input
                      id="initialPrice"
                      type="number"
                      step="0.01"
                      placeholder="50000"
                      {...register('initialPrice', { valueAsNumber: true })}
                      className={errors.initialPrice ? 'border-red-500' : ''}
                    />
                    {errors.initialPrice && (
                      <p className="text-sm text-red-500">{errors.initialPrice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (segundos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="10"
                      max="3600"
                      placeholder="60"
                      {...register('duration', { valueAsNumber: true })}
                      className={errors.duration ? 'border-red-500' : ''}
                    />
                    {errors.duration && (
                      <p className="text-sm text-red-500">{errors.duration.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Criando...' : 'Criar Simulação'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Simulations List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Simulações</span>
                </CardTitle>
                <CardDescription>
                  Lista de todas as suas simulações
                </CardDescription>
              </CardHeader>
              <CardContent>
                {simulations.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma simulação criada ainda</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Crie sua primeira simulação usando o formulário ao lado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {simulations.map((simulation) => (
                      <Card key={simulation.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium">{simulation.name}</h3>
                              {getStatusBadge(simulation.status)}
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <Settings className="h-3 w-3" />
                                <span>{simulation.automation_type.replace('_', ' ')}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                {getScenarioIcon(simulation.price_scenario)}
                                <span>{simulation.price_scenario}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{simulation.duration}s</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>${simulation.initial_price.toLocaleString()}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {simulation.status === 'created' && (
                              <Button
                                size="sm"
                                onClick={() => startSimulation(simulation.id)}
                                disabled={isRunning}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Executar
                              </Button>
                            )}
                            {simulation.status === 'running' && (
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                <span className="text-sm text-blue-600">Executando...</span>
                              </div>
                            )}
                            {simulation.status === 'completed' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => loadSimulationChart(simulation)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Gráfico
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteSimulation(simulation.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Deletar
                                </Button>
                              </div>
                            )}
                            {(simulation.status === 'created' || simulation.status === 'failed') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteSimulation(simulation.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Deletar
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Card */}
            {progress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Execução em Tempo Real</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{progress.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress.progress} className="w-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-medium">{progress.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Preço Atual:</span>
                      <span className="ml-2 font-medium">${progress.currentPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {progress.started_at && (
                    <div className="text-xs text-gray-500">
                      Iniciado em: {new Date(progress.started_at).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Metrics Card */}
            {metrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Métricas Finais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Taxa de Sucesso:</span>
                        <span className="font-medium">{metrics.successRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total de Ações:</span>
                        <span className="font-medium">{metrics.totalActions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tempo Médio:</span>
                        <span className="font-medium">{metrics.averageResponseTime}ms</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">P&L Total:</span>
                        <span className={`font-medium ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${metrics.totalPnL.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Max Drawdown:</span>
                        <span className="font-medium text-red-600">
                          ${Math.abs(metrics.maxDrawdown).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Saldo Final:</span>
                        <span className="font-medium">${metrics.finalBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chart Section */}
            {showChart && selectedSimulation && chartData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Análise Detalhada - {selectedSimulation.name}</span>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowChart(false);
                        setSelectedSimulation(null);
                        setChartData(null);
                      }}
                    >
                      Fechar
                    </Button>
                  </div>
                  <CardDescription>
                    Visualização completa dos dados da simulação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimulationChart
                    priceData={chartData.priceData}
                    pnlData={chartData.pnlData}
                    actions={chartData.actions}
                    simulationName={selectedSimulation.name}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cenários Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Bull Market</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Bear Market</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Minus className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Sideways</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Volatile</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Automações Suportadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">🛡️ Margin Guard</div>
                <div className="text-sm">💰 Take Profit</div>
                <div className="text-sm">🎯 Trailing Stop</div>
                <div className="text-sm">📈 Auto Entry</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Limites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Duração: 10s - 3600s</div>
                <div>Preço: $1 - ∞</div>
                <div>Execuções simultâneas: 2</div>
                <div>Workers: Redis Queue</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Métricas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Taxa de Sucesso</div>
                <div>P&L Total</div>
                <div>Tempo de Resposta</div>
                <div>Drawdown Máximo</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
