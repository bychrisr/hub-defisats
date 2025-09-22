import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Wallet,
  Target,
  Activity,
  TrendingDown,
  CheckCircle,
  PieChart,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useAutomationStore } from '@/stores/automation';
import SimpleChart from '@/components/charts/SimpleChart';
import { useUserPositions, useUserBalance, useConnectionStatus } from '@/contexts/RealtimeDataContext';
import { usePositionsMetrics, usePositions, useCredentialsError } from '@/contexts/PositionsContext';
import RealtimeStatus from '@/components/RealtimeStatus';
import { useThemeClasses } from '@/contexts/ThemeContext';
import CoinGeckoCard from '@/components/CoinGeckoCard';
import PriceChange from '@/components/PriceChange';
import { useFormatSats } from '@/hooks/useFormatSats';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import BTCChart from '@/components/charts/BTCChart';
import { useEstimatedBalance } from '@/hooks/useEstimatedBalance';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LNMarketsError } from '@/components/LNMarketsError';
import { PnLCard } from '@/components/dashboard/PnLCard';
import SatsIcon from '@/components/SatsIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { Tooltip } from '@/components/ui/tooltip';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, getProfile, isLoading: authLoading } = useAuthStore();
  const {
    automations,
    fetchAutomations,
    fetchStats,
    stats,
    isLoading: automationLoading,
  } = useAutomationStore();
  
  // Dados em tempo real
  const realtimePositions = useUserPositions();
  const balanceData = useUserBalance();
  const { isConnected } = useConnectionStatus();
  
  // Erro de credenciais LN Markets
  const { credentialsError, clearCredentialsError } = useCredentialsError();
  
  // Hook de tempo real para todos os dados do dashboard
  const { refreshAll, isEnabled: isRealtimeEnabled } = useRealtimeDashboard({
    positionsInterval: 5000, // 5 segundos
    balanceInterval: 10000, // 10 segundos
    marketInterval: 30000, // 30 segundos
    historicalInterval: 60000, // 1 minuto
    enabled: true
  });
  
  // Novos hooks para métricas da dashboard
  const positionsData = usePositionsMetrics();
  const { data: positionsContextData } = usePositions(); // Para obter o marketIndex consistente e positionsLoading
  const historicalData = useHistoricalData();
  const estimatedBalance = useEstimatedBalance();
  const { formatSats } = useFormatSats();
  
  // Estado de carregamento das posições
  const positionsLoading = positionsContextData?.isLoading || false;
  
  // Função para quebrar títulos em duas linhas
  const breakTitleIntoTwoLines = (title: string) => {
    const words = title.split(' ');
    if (words.length === 1) {
      // Se só tem uma palavra, adiciona quebra no meio
      const mid = Math.ceil(title.length / 2);
      return `${title.slice(0, mid)}<br>${title.slice(mid)}`;
    } else if (words.length === 2) {
      // Se tem duas palavras, quebra entre elas
      return `${words[0]}<br>${words[1]}`;
    } else {
      // Se tem mais de duas palavras, quebra no meio
      const mid = Math.ceil(words.length / 2);
      const firstLine = words.slice(0, mid).join(' ');
      const secondLine = words.slice(mid).join(' ');
      return `${firstLine}<br>${secondLine}`;
    }
  };

  // Funções para determinar cores dinâmicas
  const getPnLColor = (value: number) => {
    if (positionsLoading) return 'neutral';
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };
  
  const getProfitColor = (value: number) => {
    if (positionsLoading) return 'neutral';
    if (value > 0) return 'positive';
    return 'neutral';
  };
  
  const getTradesColor = (value: number) => {
    if (positionsLoading) return 'neutral';
    if (value > 0) return 'positive';
    return 'neutral';
  };
  
  // Dados históricos para cálculos
  const historicalMetrics = historicalData.data;
  

  useEffect(() => {
    if (!user) {
      getProfile();
    }
    fetchAutomations();
    fetchStats();
  }, [user, getProfile, fetchAutomations, fetchStats]);

  const isLoading = authLoading || automationLoading;

  const activeAutomations = automations.filter(a => a.is_active);

  return (
    <RouteGuard isLoading={isLoading}>
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-4xl font-bold text-vibrant">Dashboard</h1>
                {isRealtimeEnabled && (
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-sm text-success font-semibold">Live</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <p className="text-vibrant-secondary text-lg font-medium break-all">Welcome back, {user?.email}</p>
                <Badge variant="outline" className="text-sm font-semibold px-3 py-1 border-primary/30 text-primary w-fit">
                  {user?.plan_type.toUpperCase()} Plan
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* TODO: Botão Refresh comentado para futuras modificações */}
              {/* 
              {isRealtimeEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAll}
                  className="text-xs btn-modern-primary"
                >
                  <Activity className="w-4 h-4 mr-2 icon-primary" />
                  Refresh
                </Button>
              )}
              */}
            </div>
          </div>

          {/* LN Markets Credentials Error */}
          {credentialsError && (
            <LNMarketsError 
              error={credentialsError}
              onConfigure={() => {
                clearCredentialsError();
                // Navigate to profile page to configure credentials
                window.location.href = '/profile';
              }}
              showConfigureButton={true}
            />
          )}

        {/* Nova Linha - Cards Principais */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-vibrant">Key Metrics</h2>
          
          {/* Cards com degradês coloridos */}
          <div className="grid grid-cols-5 gap-6">
            {/* Card PnL Total com cores dinâmicas */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  positionsLoading ? 'bg-gray-600/20 border-gray-500/30' :
                  getPnLColor(positionsData.totalPL || 0) === 'positive' ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
                  getPnLColor(positionsData.totalPL || 0) === 'negative' ? 'bg-red-600/20 border-red-500/30 group-hover:shadow-red-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <TrendingUp className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    positionsLoading ? 'text-gray-300 group-hover:text-gray-200' :
                    getPnLColor(positionsData.totalPL || 0) === 'positive' ? 'text-green-300 group-hover:text-green-200' :
                    getPnLColor(positionsData.totalPL || 0) === 'negative' ? 'text-red-300 group-hover:text-red-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                getPnLColor(positionsData.totalPL || 0) === 'positive' ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                getPnLColor(positionsData.totalPL || 0) === 'negative' ? 'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className="p-6">
                    {/* Título maior */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total PnL') }}
                        />
                        <Tooltip 
                          content="Profit and Loss total de todas as suas posições ativas. Mostra o lucro ou prejuízo real baseado nos preços atuais do mercado. Valores positivos em verde indicam lucro, valores negativos em vermelho indicam prejuízo."
                          position="top"
                          delay={300}
                        >
                          <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className={`text-number-lg ${
                        positionsLoading ? 'text-gray-200' :
                        getPnLColor(positionsData.totalPL || 0) === 'positive' ? 'text-green-200' :
                        getPnLColor(positionsData.totalPL || 0) === 'negative' ? 'text-red-200' :
                        'text-gray-200'
                      }`}>
                        {formatSats(positionsData.totalPL || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                    {/* Badge e label */}
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          positionsLoading ? 'border-gray-400/60 text-gray-200 bg-gray-600/20' :
                          getPnLColor(positionsData.totalPL || 0) === 'positive' ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          getPnLColor(positionsData.totalPL || 0) === 'negative' ? 'border-red-400/60 text-red-200 bg-red-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {positionsData.totalMargin > 0 ? `${((positionsData.totalPL || 0) / positionsData.totalMargin * 100).toFixed(1)}%` : '0.0%'}
                      </Badge>
                      <span className={`text-caption ${
                        positionsLoading ? 'text-gray-300/80' :
                        getPnLColor(positionsData.totalPL || 0) === 'positive' ? 'text-green-300/80' :
                        getPnLColor(positionsData.totalPL || 0) === 'negative' ? 'text-red-300/80' :
                        'text-gray-300/80'
                      }`}>vs Margin</span>
                    </div>
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Card Estimated Profit com cores dinâmicas */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  positionsLoading ? 'bg-gray-600/20 border-gray-500/30' :
                  getProfitColor(positionsData.estimatedProfit || 0) === 'positive' ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <TrendingUp className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    positionsLoading ? 'text-gray-300 group-hover:text-gray-200' :
                    getProfitColor(positionsData.estimatedProfit || 0) === 'positive' ? 'text-green-300 group-hover:text-green-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                getProfitColor(positionsData.estimatedProfit || 0) === 'positive' ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className="p-6">
                    {/* Título maior */}
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Estimated Profit') }}
                      />
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className={`text-number-lg ${
                        positionsLoading ? 'text-gray-200' :
                        getProfitColor(positionsData.estimatedProfit || 0) === 'positive' ? 'text-green-200' :
                        'text-gray-200'
                      }`}>
                        {formatSats(positionsData.estimatedProfit || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                    {/* Badge e label */}
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          positionsLoading ? 'border-gray-400/60 text-gray-200 bg-gray-600/20' :
                          getProfitColor(positionsData.estimatedProfit || 0) === 'positive' ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {positionsData.totalMargin > 0 ? `+${((positionsData.estimatedProfit || 0) / positionsData.totalMargin * 100).toFixed(1)}%` : '+0.0%'}
                      </Badge>
                      <span className={`text-caption ${
                        positionsLoading ? 'text-gray-300/80' :
                        getProfitColor(positionsData.estimatedProfit || 0) === 'positive' ? 'text-green-300/80' :
                        'text-gray-300/80'
                      }`}>vs Margin</span>
                    </div>
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Card Active Trades com cores dinâmicas */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  positionsLoading ? 'bg-gray-600/20 border-gray-500/30' :
                  getTradesColor(positionsData.positionCount || 0) === 'positive' ? 'bg-blue-600/20 border-blue-500/30 group-hover:shadow-blue-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <Activity className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    positionsLoading ? 'text-gray-300 group-hover:text-gray-200' :
                    getTradesColor(positionsData.positionCount || 0) === 'positive' ? 'text-blue-300 group-hover:text-blue-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-gray border-2 border-gray-500 hover:border-gray-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    {/* Título maior */}
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Active Trades') }}
                      />
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className={`text-number-lg ${
                        positionsLoading ? 'text-gray-200' :
                        getTradesColor(positionsData.positionCount || 0) === 'positive' ? 'text-blue-200' :
                        'text-gray-200'
                      }`}>
                        {(() => {
                          // Debug detalhado
                          console.log('🔍 ACTIVE TRADES - DEBUG COMPLETO:', {
                            positionsData: positionsData,
                            positionsArray: positionsData.positions,
                            positionsLength: positionsData.positions?.length,
                            positionCount: positionsData.positionCount,
                            hasPositions: !!(positionsData.positions && positionsData.positions.length > 0)
                          });
                          
                          if (positionsData.positions && positionsData.positions.length > 0) {
                            const runningPositions = positionsData.positions.filter(pos => pos.status === 'running').length;
                            console.log('🔍 ACTIVE TRADES - Usando positions array:', runningPositions);
                            return runningPositions;
                          }
                          
                          console.log('🔍 ACTIVE TRADES - Usando positionCount fallback:', positionsData.positionCount);
                          return positionsData.positionCount || 0;
                        })()}
                      </div>
                    </div>
                    
                    {/* Contagem Long/Short como Badges */}
                    <div className="mb-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className="text-xs px-2 py-1 border-green-400/60 text-green-200 bg-green-600/20 whitespace-nowrap"
                        >
                          {(() => {
                            if (positionsData.positions && positionsData.positions.length > 0) {
                              const longCount = positionsData.positions.filter(pos => pos.status === 'running' && pos.side === 'long').length;
                              console.log('🔍 LONG COUNT - positions array:', longCount, positionsData.positions.map(p => ({ id: p.id, side: p.side, status: p.status })));
                              return longCount;
                            }
                            console.log('🔍 LONG COUNT - No positions array, returning 0');
                            return 0;
                          })()} Long
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="text-xs px-2 py-1 border-red-400/60 text-red-200 bg-red-600/20 whitespace-nowrap"
                        >
                          {(() => {
                            if (positionsData.positions && positionsData.positions.length > 0) {
                              const shortCount = positionsData.positions.filter(pos => pos.status === 'running' && pos.side === 'short').length;
                              console.log('🔍 SHORT COUNT - positions array:', shortCount, positionsData.positions.map(p => ({ id: p.id, side: p.side, status: p.status })));
                              return shortCount;
                            }
                            console.log('🔍 SHORT COUNT - No positions array, returning 0');
                            return 0;
                          })()} Short
                        </Badge>
                      </div>
                    </div>
                    
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Card Total Margin com degradê roxo - NOVO DESIGN */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <PieChart className="w-6 h-6 text-purple-300 stroke-2 group-hover:text-purple-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-gray border-2 border-gray-500 hover:border-gray-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    {/* Título maior */}
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total Margin') }}
                      />
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className="text-number-lg text-purple-200">
                        {formatSats(positionsData.totalMargin || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Card Estimated Fees com degradê laranja - NOVO DESIGN */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-orange-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <TrendingDown className="w-6 h-6 text-orange-300 stroke-2 group-hover:text-orange-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                'gradient-card-orange border-orange-500 hover:border-orange-400 hover:shadow-orange-500/30'
              }`}>
                <div className="card-content">
                  <div className="p-6">
                    {/* Título maior */}
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Estimated Fees') }}
                      />
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className="text-number-lg text-orange-200">
                        {formatSats(positionsData.estimatedFees || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                    {/* Badge e label */}
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className="text-label-sm px-2 py-1 border-orange-400/60 text-orange-200 bg-orange-600/20"
                      >
                        0.1%
                      </Badge>
                      <span className="text-caption text-orange-300/80">rate</span>
                    </div>
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-vibrant">History</h2>
          <div className="grid grid-cols-5 gap-6">
            {/* Available Margin */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  positionsLoading ? 'bg-gray-600/20 border-gray-500/30' :
                  (balanceData?.total_balance || 0) > 0 ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <Wallet className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    positionsLoading ? 'text-gray-300 group-hover:text-gray-200' :
                    (balanceData?.total_balance || 0) > 0 ? 'text-green-300 group-hover:text-green-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                (balanceData?.total_balance || 0) > 0 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className="p-6">
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Available Margin') }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className={`text-number-lg ${
                        positionsLoading ? 'text-gray-200' :
                        (balanceData?.total_balance || 0) > 0 ? 'text-green-200' :
                        'text-gray-200'
                      }`}>
                        {formatSats(balanceData?.total_balance || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          positionsLoading ? 'border-gray-400/60 text-gray-200 bg-gray-600/20' :
                          (balanceData?.total_balance || 0) > 0 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {(balanceData?.total_balance || 0) > 0 ? 'Available' : 'Empty'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Estimated Balance */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  positionsLoading ? 'bg-gray-600/20 border-gray-500/30' :
                  (estimatedBalance.data?.estimated_balance || 0) > 0 ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
                  (estimatedBalance.data?.estimated_balance || 0) < 0 ? 'bg-red-600/20 border-red-500/30 group-hover:shadow-red-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <Wallet className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    positionsLoading ? 'text-gray-300 group-hover:text-gray-200' :
                    (estimatedBalance.data?.estimated_balance || 0) > 0 ? 'text-green-300 group-hover:text-green-200' :
                    (estimatedBalance.data?.estimated_balance || 0) < 0 ? 'text-red-300 group-hover:text-red-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                (estimatedBalance.data?.estimated_balance || 0) > 0 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                (estimatedBalance.data?.estimated_balance || 0) < 0 ? 'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className="p-6">
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Estimated Balance') }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className={`text-number-lg ${
                        positionsLoading ? 'text-gray-200' :
                        (estimatedBalance.data?.estimated_balance || 0) > 0 ? 'text-green-200' :
                        (estimatedBalance.data?.estimated_balance || 0) < 0 ? 'text-red-200' :
                        'text-gray-200'
                      }`}>
                        {formatSats(estimatedBalance.data?.estimated_balance || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          positionsLoading ? 'border-gray-400/60 text-gray-200 bg-gray-600/20' :
                          (estimatedBalance.data?.estimated_balance || 0) > 0 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          (estimatedBalance.data?.estimated_balance || 0) < 0 ? 'border-red-400/60 text-red-200 bg-red-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {(estimatedBalance.data?.estimated_balance || 0) > 0 ? 'Positive' : (estimatedBalance.data?.estimated_balance || 0) < 0 ? 'Negative' : 'Neutral'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Total Invested */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <Target className="w-6 h-6 text-blue-300 stroke-2 group-hover:text-blue-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-gray border-2 border-gray-500 hover:border-gray-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total Invested') }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-number-lg text-blue-200">
                        {formatSats(estimatedBalance.data?.total_invested || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Net Profit */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  positionsLoading ? 'bg-gray-600/20 border-gray-500/30' :
                  (historicalMetrics?.totalProfit || 0) > 0 ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
                  (historicalMetrics?.totalProfit || 0) < 0 ? 'bg-red-600/20 border-red-500/30 group-hover:shadow-red-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <TrendingUp className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    positionsLoading ? 'text-gray-300 group-hover:text-gray-200' :
                    (historicalMetrics?.totalProfit || 0) > 0 ? 'text-green-300 group-hover:text-green-200' :
                    (historicalMetrics?.totalProfit || 0) < 0 ? 'text-red-300 group-hover:text-red-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                positionsLoading ? 'gradient-card-gray border-gray-500 hover:border-gray-400' :
                (historicalMetrics?.totalProfit || 0) > 0 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                (historicalMetrics?.totalProfit || 0) < 0 ? 'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className="p-6">
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Net Profit') }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className={`text-number-lg ${
                        positionsLoading ? 'text-gray-200' :
                        (historicalMetrics?.totalProfit || 0) > 0 ? 'text-green-200' :
                        (historicalMetrics?.totalProfit || 0) < 0 ? 'text-red-200' :
                        'text-gray-200'
                      }`}>
                        {formatSats(historicalMetrics?.totalProfit || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          positionsLoading ? 'border-gray-400/60 text-gray-200 bg-gray-600/20' :
                          (historicalMetrics?.totalProfit || 0) > 0 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          (historicalMetrics?.totalProfit || 0) < 0 ? 'border-red-400/60 text-red-200 bg-red-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {(historicalMetrics?.totalProfit || 0) > 0 ? 'Profit' : (historicalMetrics?.totalProfit || 0) < 0 ? 'Loss' : 'Neutral'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Fees Paid */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-orange-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <DollarSign className="w-6 h-6 text-orange-300 stroke-2 group-hover:text-orange-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-gray border-2 border-gray-500 hover:border-gray-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Fees Paid') }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-number-lg text-orange-200">
                        {formatSats(historicalMetrics?.totalFees || 0, { size: 24, variant: 'auto' })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Success Rate */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  (historicalMetrics?.successRate || 0) >= 50 ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
                  (historicalMetrics?.successRate || 0) >= 30 ? 'bg-yellow-600/20 border-yellow-500/30 group-hover:shadow-yellow-500/30' :
                  'bg-red-600/20 border-red-500/30 group-hover:shadow-red-500/30'
                }`}>
                  <CheckCircle className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    (historicalMetrics?.successRate || 0) >= 50 ? 'text-green-300 group-hover:text-green-200' :
                    (historicalMetrics?.successRate || 0) >= 30 ? 'text-yellow-300 group-hover:text-yellow-200' :
                    'text-red-300 group-hover:text-red-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                (historicalMetrics?.successRate || 0) >= 50 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                (historicalMetrics?.successRate || 0) >= 30 ? 'gradient-card-yellow border-yellow-500 hover:border-yellow-400 hover:shadow-yellow-500/30' :
                'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30'
              }`}>
                <div className="card-content">
                  <div className="p-6">
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Success Rate') }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className={`text-number-lg ${
                        (historicalMetrics?.successRate || 0) >= 50 ? 'text-green-200' :
                        (historicalMetrics?.successRate || 0) >= 30 ? 'text-yellow-200' :
                        'text-red-200'
                      }`}>
                        {(historicalMetrics?.successRate || 0).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          (historicalMetrics?.successRate || 0) >= 50 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          (historicalMetrics?.successRate || 0) >= 30 ? 'border-yellow-400/60 text-yellow-200 bg-yellow-600/20' :
                          'border-red-400/60 text-red-200 bg-red-600/20'
                        }`}
                      >
                        {(historicalMetrics?.successRate || 0) >= 50 ? 'Good' : (historicalMetrics?.successRate || 0) >= 30 ? 'Fair' : 'Poor'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Total Profitability */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  ((historicalMetrics?.totalProfit || 0) / Math.max(estimatedBalance.data?.total_invested || 1, 1) * 100) >= 0 ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
                  'bg-red-600/20 border-red-500/30 group-hover:shadow-red-500/30'
                }`}>
                  <PieChart className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    ((historicalMetrics?.totalProfit || 0) / Math.max(estimatedBalance.data?.total_invested || 1, 1) * 100) >= 0 ? 'text-green-300 group-hover:text-green-200' :
                    'text-red-300 group-hover:text-red-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                ((historicalMetrics?.totalProfit || 0) / Math.max(estimatedBalance.data?.total_invested || 1, 1) * 100) >= 0 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30'
              }`}>
                <div className="card-content">
                  <div className="p-6">
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total Profitability') }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className={`text-number-lg ${
                        ((historicalMetrics?.totalProfit || 0) / Math.max(estimatedBalance.data?.total_invested || 1, 1) * 100) >= 0 ? 'text-green-200' :
                        'text-red-200'
                      }`}>
                        {((historicalMetrics?.totalProfit || 0) / Math.max(estimatedBalance.data?.total_invested || 1, 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          ((historicalMetrics?.totalProfit || 0) / Math.max(estimatedBalance.data?.total_invested || 1, 1) * 100) >= 0 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          'border-red-400/60 text-red-200 bg-red-600/20'
                        }`}
                      >
                        {((historicalMetrics?.totalProfit || 0) / Math.max(estimatedBalance.data?.total_invested || 1, 1) * 100) >= 0 ? 'Positive' : 'Negative'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Total Trades */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <BarChart3 className="w-6 h-6 text-purple-300 stroke-2 group-hover:text-purple-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-gray border-2 border-gray-500 hover:border-gray-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total Trades') }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-number-lg text-purple-200">
                        {(historicalMetrics?.totalTrades || 0).toString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Winning Trades */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-green-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <TrendingUp className="w-6 h-6 text-green-300 stroke-2 group-hover:text-green-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-gray border-2 border-gray-500 hover:border-gray-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Winning Trades') }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-number-lg text-green-200">
                        {(historicalMetrics?.winningTrades || 0).toString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Lost Trades */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <TrendingDown className="w-6 h-6 text-red-300 stroke-2 group-hover:text-red-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-gray border-2 border-gray-500 hover:border-gray-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className="p-6">
                    <div className="mb-4">
                      <CardTitle 
                        className="text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Lost Trades') }}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-number-lg text-red-200">
                        {(historicalMetrics?.lostTrades || 0).toString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>
          </div>
        </div>

          {/* Automation Types Overview */}
          {stats && stats.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Automation Overview</CardTitle>
                <CardDescription>
                  Breakdown of your automation types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Target className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Margin Guard</div>
                        <div className="text-sm text-text-secondary">
                          Position protection
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.byType.margin_guard}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <div>
                        <div className="font-medium">TP/SL</div>
                        <div className="text-sm text-text-secondary">
                          Take profit / Stop loss
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.byType.tp_sl}</div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5 text-secondary" />
                      <div>
                        <div className="font-medium">Auto Entry</div>
                        <div className="text-sm text-text-secondary">
                          Automatic entries
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.byType.auto_entry}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* BTC Chart - Gráfico de candlesticks */}
        <div className="mt-6">
          <BTCChart height={500} />
        </div>
      </div>
    </RouteGuard>
  );
}