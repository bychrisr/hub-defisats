import { useEffect, useCallback, useMemo } from 'react';
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
import { 
  useMarketData,
  useOptimizedDashboardMetrics, 
  useOptimizedPositions, 
  useBtcPrice,
  useOptimizedMarketData
} from '@/contexts/MarketDataContext';
import RealtimeStatus from '@/components/RealtimeStatus';
import { useThemeClasses } from '@/contexts/ThemeContext';
import CoinGeckoCard from '@/components/CoinGeckoCard';
import PriceChange from '@/components/PriceChange';
import { useFormatSats } from '@/hooks/useFormatSats';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useEstimatedBalance } from '@/hooks/useEstimatedBalance';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LNMarketsError } from '@/components/LNMarketsError';
import { PnLCard } from '@/components/dashboard/PnLCard';
import SatsIcon from '@/components/SatsIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { Tooltip } from '@/components/ui/tooltip';
import TradingViewChart from '@/components/charts/TradingViewChart';
import LightweightLiquidationChart from '@/components/charts/LightweightLiquidationChart';

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
  
  // Hook otimizado para dados da dashboard (baseado no roadmap)
  // Dados centralizados de mercado
  const { 
    data: marketData, 
    isLoading: marketLoading, 
    error: marketError, 
    refresh: refreshMarket,
    lastUpdate,
    cacheHit
  } = useMarketData();
  
  // Métricas otimizadas da dashboard
  const {
    totalPL,
    totalMargin,
    positionCount
  } = useOptimizedDashboardMetrics();
  
  // Dados de posições otimizados
  const { positions: optimizedPositions } = useOptimizedPositions();
  // Linhas de liquidação: uma por posição válida
  const liquidationLines = useMemo(() => {
    const src = optimizedPositions ?? [];
    const lines = src
      .map((p: any, idx: number) => {
        const candidate = (p as any);
        const price = Number(
          candidate.liquidation ??
          candidate.liquidationPrice ??
          candidate.liquidation_price ??
          candidate.liq ??
          candidate.liq_price ??
          candidate.liqPrice
        );
        if (!Number.isFinite(price) || price <= 0) return null;
        return { price: Math.round(price), label: p?.symbol ? `${p.symbol} #${idx + 1}` : `Pos #${idx + 1}` };
      })
      .filter(Boolean) as Array<{ price: number; label?: string }>;
    console.log('📊 DASHBOARD - liquidationLines calculadas:', {
      positionsCount: src?.length ?? 0,
      sample: src?.slice(0, 3),
      lines
    });
    return lines.length ? lines : undefined;
  }, [optimizedPositions]);
  
  // Dados de mercado otimizados (agora via contexto centralizado)
  const { marketIndex: optimizedMarketIndex } = useOptimizedMarketData();
  
  // Dados históricos (mantido para compatibilidade)
  const historicalData = useHistoricalData();
  
  // Dados de saldo estimado (hook específico)
  const estimatedBalance = useEstimatedBalance();
  
  // Dados de posições já estão disponíveis via useOptimizedDashboardMetrics
  
  // Dados de saldo (agora via contexto centralizado)
  const balanceData = marketData?.balance;
  
  // Hook de tempo real otimizado (menos frequente)
  const { refreshAll, isEnabled: isRealtimeEnabled } = useRealtimeDashboard({
    positionsInterval: 10000, // 10 segundos (reduzido)
    balanceInterval: 30000, // 30 segundos (reduzido)
    marketInterval: 60000, // 1 minuto (reduzido)
    historicalInterval: 300000, // 5 minutos (reduzido)
    enabled: true
  });
  
  // Utilitários
  const { formatSats, getDynamicSize } = useFormatSats();
  
  // Erro de credenciais LN Markets
  const { credentialsError, clearCredentialsError } = useCredentialsError();
  
  // Estado de carregamento otimizado - APENAS para autenticação inicial
  const isLoading = authLoading || automationLoading;
  
  // Estado de carregamento para atualizações (sem modal)
  const isUpdating = marketLoading || estimatedBalance.isLoading;
  
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
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };
  
  const getProfitColor = (value: number) => {
    if (value > 0) return 'positive';
    return 'neutral';
  };
  
  const getTradesColor = (value: number) => {
    if (value > 0) return 'positive';
    return 'neutral';
  };
  
  // Dados históricos para cálculos
  const historicalMetrics = historicalData.data;
  
  // Debug: Log dos dados principais
  console.log('🔍 DASHBOARD - Main data sources:', {
    estimatedBalance: {
      hasData: !!estimatedBalance.data,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error,
      totalFees: estimatedBalance.data?.total_fees,
      totalInvested: estimatedBalance.data?.total_invested
    },
    historicalData: {
      hasData: !!historicalData.data,
      isLoading: historicalData.isLoading,
      error: historicalData.error,
      totalFees: historicalData.data?.totalFees
    }
  });
  
  // Funções de cálculo baseadas no PAINEL_METRICAS.md
  const calculateActiveTrades = () => {
    if (!optimizedPositions) return 0;
    return optimizedPositions.filter(pos => pos.status === 'running').length;
  };
  
  const calculateTotalMargin = () => {
    return totalMargin || 0;
  };
  
  const calculateAvailableMargin = () => {
    // Usar dados do balanceData ou marketData
    return balanceData?.available_margin || marketData?.balance?.available_margin || 0;
  };
  
  const calculateEstimatedBalance = () => {
    const availableMargin = calculateAvailableMargin();
    const totalMargin = calculateTotalMargin();
    const estimatedProfitValue = totalPL || 0; // Usar totalPL em vez de estimatedProfit
    const estimatedFeesValue = calculateFeesPaid(); // Usar função calculada
    
    return availableMargin + totalMargin + estimatedProfitValue - estimatedFeesValue;
  };
  
  const calculateTotalInvested = useCallback(() => {
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.total_invested || 0;
  }, [estimatedBalance.data]);
  
  const calculateFeesPaid = useCallback(() => {
    // Usar dados do estimated-balance como fonte primária para fees
    if (estimatedBalance.data?.total_fees !== undefined) {
      return estimatedBalance.data.total_fees;
    }
    // Fallback para dados históricos se disponível
    return historicalMetrics?.totalFees || 0;
  }, [estimatedBalance.data?.total_fees, historicalMetrics?.totalFees]);
  
  const calculateNetProfit = useCallback(() => {
    const totalPnl = totalPL || 0;
    const feesPaid = calculateFeesPaid();
    return totalPnl - feesPaid;
  }, [totalPL, calculateFeesPaid]);
  
  const calculateTotalProfitability = () => {
    const netProfit = calculateNetProfit();
    const totalInvested = calculateTotalInvested();
    if (totalInvested === 0) return 0;
    return (netProfit / totalInvested) * 100;
  };
  
  const calculateLostTrades = useCallback(() => {
    // Usar estimatedBalance como fonte primária
    if (estimatedBalance.data?.lost_trades !== undefined) {
      return estimatedBalance.data.lost_trades;
    }
    // Fallback para historicalMetrics
    return historicalMetrics?.lostTrades || 0;
  }, [estimatedBalance.data?.lost_trades, historicalMetrics?.lostTrades]);

  // Novas funções para os cards adicionais
  const calculateSuccessRate = () => {
    console.log('🔍 DASHBOARD - calculateSuccessRate called:', {
      hasData: !!estimatedBalance.data,
      successRate: estimatedBalance.data?.success_rate,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.success_rate || 0;
  };

  const calculateTotalTrades = () => {
    console.log('🔍 DASHBOARD - calculateTotalTrades called:', {
      hasData: !!estimatedBalance.data,
      totalTrades: estimatedBalance.data?.total_trades,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.total_trades || 0;
  };

  const calculateWinningTrades = () => {
    console.log('🔍 DASHBOARD - calculateWinningTrades called:', {
      hasData: !!estimatedBalance.data,
      winningTrades: estimatedBalance.data?.winning_trades,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.winning_trades || 0;
  };


  const calculateAveragePnL = () => {
    console.log('🔍 DASHBOARD - calculateAveragePnL called:', {
      hasData: !!estimatedBalance.data,
      averagePnL: estimatedBalance.data?.average_pnl,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.average_pnl || 0;
  };

  const calculateMaxDrawdown = () => {
    console.log('🔍 DASHBOARD - calculateMaxDrawdown called:', {
      hasData: !!estimatedBalance.data,
      maxDrawdown: estimatedBalance.data?.max_drawdown,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.max_drawdown || 0;
  };

  const calculateSharpeRatio = () => {
    console.log('🔍 DASHBOARD - calculateSharpeRatio called:', {
      hasData: !!estimatedBalance.data,
      sharpeRatio: estimatedBalance.data?.sharpe_ratio,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.sharpe_ratio || 0;
  };

  const calculateVolatility = () => {
    console.log('🔍 DASHBOARD - calculateVolatility called:', {
      hasData: !!estimatedBalance.data,
      volatility: estimatedBalance.data?.volatility,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.volatility || 0;
  };

  // 4 novas funções para os cards adicionais
  const calculateWinStreak = () => {
    console.log('🔍 DASHBOARD - calculateWinStreak called:', {
      hasData: !!estimatedBalance.data,
      winStreak: estimatedBalance.data?.win_streak,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.win_streak || 0;
  };

  const calculateBestTrade = () => {
    console.log('🔍 DASHBOARD - calculateBestTrade called:', {
      hasData: !!estimatedBalance.data,
      bestTrade: estimatedBalance.data?.best_trade,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.best_trade || 0;
  };

  const calculateRiskRewardRatio = () => {
    console.log('🔍 DASHBOARD - calculateRiskRewardRatio called:', {
      hasData: !!estimatedBalance.data,
      riskRewardRatio: estimatedBalance.data?.risk_reward_ratio,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.risk_reward_ratio || 0;
  };

  const calculateTradingFrequency = () => {
    console.log('🔍 DASHBOARD - calculateTradingFrequency called:', {
      hasData: !!estimatedBalance.data,
      tradingFrequency: estimatedBalance.data?.trading_frequency,
      isLoading: estimatedBalance.isLoading,
      error: estimatedBalance.error
    });
    
    if (!estimatedBalance.data) return 0;
    return estimatedBalance.data.trading_frequency || 0;
  };

  // Função unificada para determinar TODAS as cores dos cards (pai, ícone, tipografia)
  const getCardColors = (cardType: string, value?: number) => {
    // Cards com cores temáticas específicas (não mudam baseado no valor)
    const themedColorCards = {
      'estimated-fees': { 
        card: 'gradient-card-orange border-orange-500 hover:border-orange-400 hover:shadow-orange-500/30',
        icon: { bg: 'bg-orange-600/20', border: 'border-orange-500/30', shadow: 'group-hover:shadow-orange-500/30', icon: 'text-orange-300 group-hover:text-orange-200' },
        text: 'text-orange-200',
        satsIcon: 'text-orange-300'
      },
      'total-invested': { 
        card: 'gradient-card-gray border-gray-500 hover:border-gray-400',
        icon: { bg: 'bg-blue-600/20', border: 'border-blue-500/30', shadow: 'group-hover:shadow-blue-500/30', icon: 'text-blue-300 group-hover:text-blue-200' },
        text: 'text-blue-200',
        satsIcon: 'text-blue-300'
      },
      'fees-paid': { 
        card: 'gradient-card-gray border-gray-500 hover:border-gray-400',
        icon: { bg: 'bg-purple-600/20', border: 'border-purple-500/30', shadow: 'group-hover:shadow-purple-500/30', icon: 'text-purple-300 group-hover:text-purple-200' },
        text: 'text-purple-200',
        satsIcon: 'text-purple-300'
      }
    };

    // Cards quantitativos neutros (sempre cinza - números fixos, não valores monetários)
    const neutralQuantitativeCards = {
      'active-trades': { 
        card: 'gradient-card-gray border-gray-500 hover:border-gray-400',
        icon: { bg: 'bg-gray-600/20', border: 'border-gray-500/30', shadow: 'group-hover:shadow-gray-500/30', icon: 'text-gray-300 group-hover:text-gray-200' },
        text: 'text-gray-200',
        satsIcon: 'text-gray-300'
      }
    };

    // Se for um card com cor temática, retorna as cores temáticas
    if (themedColorCards[cardType as keyof typeof themedColorCards]) {
      return themedColorCards[cardType as keyof typeof themedColorCards];
    }

    // Se for um card quantitativo neutro, retorna cinza
    if (neutralQuantitativeCards[cardType as keyof typeof neutralQuantitativeCards]) {
      return neutralQuantitativeCards[cardType as keyof typeof neutralQuantitativeCards];
    }

    // Cards monetários dinâmicos (valores em sats - mudam baseado no valor)

    // Lógica para cards monetários dinâmicos (valores em sats)
    if (value === undefined) value = 0;

    // Para cards monetários, o ícone superior deve seguir a mesma lógica do valor
    if (value > 0) {
      return {
        card: 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30',
        icon: { bg: 'bg-green-600/20', border: 'border-green-500/30', shadow: 'group-hover:shadow-green-500/30', icon: 'text-green-300 group-hover:text-green-200' },
        text: 'text-green-200',
        satsIcon: 'text-green-300'
      };
    } else if (value < 0) {
      return {
        card: 'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30',
        icon: { bg: 'bg-red-600/20', border: 'border-red-500/30', shadow: 'group-hover:shadow-red-500/30', icon: 'text-red-300 group-hover:text-red-200' },
        text: 'text-red-200',
        satsIcon: 'text-red-300'
      };
    } else {
      return {
        card: 'gradient-card-gray border-gray-500 hover:border-gray-400',
        icon: { bg: 'bg-gray-600/20', border: 'border-gray-500/30', shadow: '', icon: 'text-gray-300 group-hover:text-gray-200' },
        text: 'text-gray-200',
        satsIcon: 'text-gray-300'
      };
    }
  };

  // Função unificada para determinar cores dos ícones superiores dos cards (mantida para compatibilidade)
  const getCardIconColors = (cardType: string, value?: number) => {
    return getCardColors(cardType, value).icon;
  };

  // Função para calcular o tamanho global baseado no MAIOR valor entre todos os cards
  const getGlobalDynamicSize = () => {
    // Coletar todos os valores numéricos dos cards (usando dados otimizados)
    const allValues = [
      totalPL || 0,
      totalPL || 0, // estimatedProfit = totalPL
      totalMargin || 0,
      calculateFeesPaid(), // estimatedFees
      calculateAvailableMargin(), // availableMargin
      calculateEstimatedBalance(), // estimatedBalance
      calculateTotalInvested(), // totalInvested
      calculateNetProfit(), // netProfit
      calculateFeesPaid() // feesPaid
    ];

    // Encontrar o MAIOR valor absoluto (excluindo zeros)
    const nonZeroValues = allValues.filter(value => value !== 0);
    if (nonZeroValues.length === 0) {
      return { textSize: 'text-number-lg', iconSize: 24 }; // Padrão se todos forem zero
    }

    const maxValue = Math.max(...nonZeroValues.map(Math.abs));
    
    // Se o maior valor for zero, usar tamanho padrão
    if (maxValue === 0) {
      return { textSize: 'text-number-lg', iconSize: 24 };
    }
    
    const digits = Math.floor(Math.log10(maxValue)) + 1;
    
    let result;
    if (digits <= 3) {
      result = { textSize: 'text-number-lg', iconSize: 24 };
    } else if (digits <= 6) {
      result = { textSize: 'text-number-md', iconSize: 20 };
    } else if (digits <= 9) {
      result = { textSize: 'text-number-sm', iconSize: 16 };
    } else {
      result = { textSize: 'text-number-xs', iconSize: 12 };
    }
    
    console.log('🔍 Global Dynamic Size Debug:', {
      allValues,
      nonZeroValues,
      maxValue,
      digits,
      result
    });
    
    return result;
  };
  

  useEffect(() => {
    if (!user) {
      getProfile();
    }
    fetchAutomations();
    fetchStats();
    // Usar refresh otimizado em vez de refreshAll
    refreshMarket();
  }, [user, getProfile, fetchAutomations, fetchStats, refreshMarket]);

  const activeAutomations = automations.filter(a => a.is_active);

  return (
    <RouteGuard isLoading={isLoading}>
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
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
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-2 icon-primary" />
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
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-vibrant">Key Metrics</h2>
          
          {/* Cards com degradês coloridos - Layout responsivo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {/* Card PnL Total com cores dinâmicas */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                {(() => {
                  const colors = getCardIconColors('total-pnl', totalPL || 0);
                  return (
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <TrendingUp className={`w-4 h-4 sm:w-6 sm:h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
                </div>
                  );
                })()}
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                getPnLColor(totalPL || 0) === 'positive' ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                getPnLColor(totalPL || 0) === 'negative' ? 'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    {/* Título maior */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                      <CardTitle 
                        className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total PL') }}
                        />
                        <Tooltip 
                          content="Quanto você está ganhando (ou perdendo) AGORA nas posições que ainda estão abertas."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${
                        getPnLColor(totalPL || 0) === 'positive' ? 'text-green-200' :
                        getPnLColor(totalPL || 0) === 'negative' ? 'text-red-200' :
                        'text-gray-200'
                      }`}>
                        {formatSats(totalPL || 0, { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'auto',
                          forceColor: true,
                          className: getPnLColor(totalPL || 0) === 'positive' ? 'text-green-300' :
                            getPnLColor(totalPL || 0) === 'negative' ? 'text-red-300' :
                            'text-gray-300'
                        })}
                      </div>
                    </div>
                    
                    {/* Badge e label */}
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          getPnLColor(totalPL || 0) === 'positive' ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          getPnLColor(totalPL || 0) === 'negative' ? 'border-red-400/60 text-red-200 bg-red-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {totalMargin > 0 ? `${((totalPL || 0) / totalMargin * 100).toFixed(1)}%` : '0.0%'}
                      </Badge>
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
                {(() => {
                  const colors = getCardIconColors('estimated-profit', totalPL || 0);
                  return (
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <TrendingUp className={`w-4 h-4 sm:w-6 sm:h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
                    </div>
                  );
                })()}
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                getProfitColor(totalPL || 0) === 'positive' ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    {/* Título maior */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                      <CardTitle 
                        className="text-lg sm:text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Estimated Profit') }}
                      />
                        <Tooltip 
                          content="Lucro ou prejuízo estimado se você fechar TODAS as posições abertas AGORA."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${
                        getProfitColor(totalPL || 0) === 'positive' ? 'text-green-200' :
                        'text-gray-200'
                      }`}>
                        {formatSats(totalPL || 0, { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'auto',
                          forceColor: true,
                          className: getProfitColor(totalPL || 0) === 'positive' ? 'text-green-300' :
                            'text-gray-300'
                        })}
                      </div>
                    </div>
                    
                    {/* Badge e label */}
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          getProfitColor(totalPL || 0) === 'positive' ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {totalMargin > 0 ? `+${((totalPL || 0) / totalMargin * 100).toFixed(1)}%` : '+0.0%'}
                      </Badge>
                      <span className={`text-caption ${
                        getProfitColor(totalPL || 0) === 'positive' ? 'text-green-300/80' :
                        'text-gray-300/80'
                      }`}>vs Margin</span>
                    </div>
                  </div>
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Card Active Trades - SEMPRE CINZA (neutro permanente) */}
            <div className="relative group">
              {/* Ícone posicionado fora do card */}
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                {(() => {
                  const colors = getCardIconColors('active-trades');
                  return (
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <Activity className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
                    </div>
                  );
                })()}
              </div>
              
              <Card className="gradient-card gradient-card-gray border-2 border-gray-500 hover:border-gray-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    {/* Título maior */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                      <CardTitle 
                        className="text-lg sm:text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Active Trades') }}
                      />
                        <Tooltip 
                          content="Número de posições que estão abertas e ativas agora."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} text-gray-200`}>
                        {calculateActiveTrades()}
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
                            if (optimizedPositions && optimizedPositions.length > 0) {
                              const longCount = optimizedPositions.filter(pos => pos.status === 'running' && pos.side === 'long').length;
                              console.log('🔍 LONG COUNT - positions array:', longCount, optimizedPositions.map(p => ({ id: p.id, side: p.side, status: p.status })));
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
                            if (optimizedPositions && optimizedPositions.length > 0) {
                              const shortCount = optimizedPositions.filter(pos => pos.status === 'running' && pos.side === 'short').length;
                              console.log('🔍 SHORT COUNT - positions array:', shortCount, optimizedPositions.map(p => ({ id: p.id, side: p.side, status: p.status })));
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
                {(() => {
                  const colors = getCardIconColors('total-margin');
                  return (
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <PieChart className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
                    </div>
                  );
                })()}
              </div>
              
              <Card className="gradient-card gradient-card-gray border-2 border-gray-500 hover:border-gray-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    {/* Título maior */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                      <CardTitle 
                        className="text-lg sm:text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total Margin') }}
                      />
                        <Tooltip 
                          content="Soma de todas as margens alocadas nas suas posições abertas."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} text-purple-200`}>
                        {formatSats(calculateTotalMargin(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'neutral',
                          forceColor: true,
                          className: 'text-purple-300'
                        })}
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
                {(() => {
                  const colors = getCardIconColors('estimated-fees');
                  return (
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <TrendingDown className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
                    </div>
                  );
                })()}
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                getCardColors('estimated-fees').card
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    {/* Título maior */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                      <CardTitle 
                        className="text-lg sm:text-h3 text-vibrant"
                        dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Estimated Fees') }}
                      />
                        <Tooltip 
                          content="Estimativa de taxas que você pagará para fechar suas posições + funding das próximas 24h."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${getCardColors('estimated-fees').text}`}>
                        {formatSats(calculateFeesPaid(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'neutral',
                          forceColor: true,
                          className: getCardColors('estimated-fees').satsIcon
                        })}
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
          <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-vibrant">History</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {/* Available Margin */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                {(() => {
                  const colors = getCardIconColors('available-margin', calculateAvailableMargin());
                  return (
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <Wallet className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
                    </div>
                  );
                })()}
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                getCardColors('available-margin', calculateAvailableMargin()).card
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Available Margin') }}
                        />
                        <Tooltip 
                          content="Quanto você tem livre agora para abrir novas posições."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${getCardColors('available-margin', calculateAvailableMargin()).text}`}>
                        {formatSats(calculateAvailableMargin(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'auto',
                          forceColor: true,
                          className: getCardColors('available-margin', calculateAvailableMargin()).satsIcon
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          calculateAvailableMargin() > 0 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {calculateAvailableMargin() > 0 ? 'Available' : 'Empty'}
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
                {(() => {
                  const colors = getCardIconColors('estimated-balance', estimatedBalance.data?.estimated_balance || 0);
                  return (
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <Wallet className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
                    </div>
                  );
                })()}
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                getCardColors('estimated-balance', estimatedBalance.data?.estimated_balance || 0).card
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Estimated Balance') }}
                        />
                        <Tooltip 
                          content="Seu saldo total se fechar TUDO agora: disponível + lucro das posições - taxas futuras."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${getCardColors('estimated-balance', estimatedBalance.data?.estimated_balance || 0).text}`}>
                        {formatSats(calculateEstimatedBalance(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'auto',
                          forceColor: true,
                          className: getCardColors('estimated-balance', estimatedBalance.data?.estimated_balance || 0).satsIcon
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          calculateEstimatedBalance() > 0 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          calculateEstimatedBalance() < 0 ? 'border-red-400/60 text-red-200 bg-red-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {calculateEstimatedBalance() > 0 ? 'Positive' : calculateEstimatedBalance() < 0 ? 'Negative' : 'Neutral'}
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
                {(() => {
                  const colors = getCardIconColors('total-invested');
                  return (
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <Target className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
                    </div>
                  );
                })()}
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${getCardColors('total-invested').card}`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total Invested') }}
                        />
                        <Tooltip 
                          content="Soma de todas as margens iniciais que você usou para abrir suas posições (abertas e fechadas)."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
            </div>
          </div>

                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${getCardColors('total-invested').text}`}>
                        {formatSats(calculateTotalInvested(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'neutral',
                          forceColor: true,
                          className: getCardColors('total-invested').satsIcon
                        })}
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
                {(() => {
                  const colors = getCardIconColors('net-profit', historicalMetrics?.totalProfit || 0);
                  return (
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <TrendingUp className={`w-4 h-4 sm:w-6 sm:h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
                    </div>
                  );
                })()}
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                getCardColors('net-profit', historicalMetrics?.totalProfit || 0).card
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Net Profit') }}
                        />
                        <Tooltip 
                          content="Seu lucro real: total de PnL - total de taxas pagas."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${getCardColors('net-profit', historicalMetrics?.totalProfit || 0).text}`}>
                        {formatSats(calculateNetProfit(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'auto',
                          forceColor: true,
                          className: getCardColors('net-profit', historicalMetrics?.totalProfit || 0).satsIcon
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          calculateNetProfit() > 0 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          calculateNetProfit() < 0 ? 'border-red-400/60 text-red-200 bg-red-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {calculateNetProfit() > 0 ? 'Profit' : calculateNetProfit() < 0 ? 'Loss' : 'Neutral'}
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
                {(() => {
                  const colors = getCardIconColors('fees-paid');
                  return (
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <DollarSign className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
                    </div>
                  );
                })()}
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${getCardColors('fees-paid').card}`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Fees Paid') }}
                        />
                        <Tooltip 
                          content="Soma de todas as taxas de abertura, fechamento e funding que você já pagou."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${getCardColors('fees-paid').text}`}>
                        {formatSats(calculateFeesPaid(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'neutral',
                          forceColor: true,
                          className: getCardColors('fees-paid').satsIcon
                        })}
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
                calculateSuccessRate() >= 50 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                calculateSuccessRate() >= 30 ? 'gradient-card-yellow border-yellow-500 hover:border-yellow-400 hover:shadow-yellow-500/30' :
                'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30'
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Success Rate') }}
                        />
                        <Tooltip 
                          content="Porcentagem de trades que deram lucro entre todas as fechadas."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
            </div>
          </div>

                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${
                        calculateSuccessRate() >= 50 ? 'text-green-200' :
                        calculateSuccessRate() >= 30 ? 'text-yellow-200' :
                        'text-red-200'
                      }`}>
                        {calculateSuccessRate().toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          calculateSuccessRate() >= 50 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          calculateSuccessRate() >= 30 ? 'border-yellow-400/60 text-yellow-200 bg-yellow-600/20' :
                          'border-red-400/60 text-red-200 bg-red-600/20'
                        }`}
                      >
                        {calculateSuccessRate() >= 50 ? 'Good' : calculateSuccessRate() >= 30 ? 'Fair' : 'Poor'}
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
                calculateTotalProfitability() >= 0 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30'
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total Profitability') }}
                        />
                        <Tooltip 
                          content="Porcentagem de lucro sobre o total investido: (lucro líquido / total investido) x 100."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${
                        calculateTotalProfitability() >= 0 ? 'text-green-200' :
                        'text-red-200'
                      }`}>
                        {calculateTotalProfitability().toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          calculateTotalProfitability() >= 0 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          'border-red-400/60 text-red-200 bg-red-600/20'
                        }`}
                      >
                        {calculateTotalProfitability() >= 0 ? 'Positive' : 'Negative'}
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
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Total Trades') }}
                        />
                        <Tooltip 
                          content="Número total de trades que você já fez (abertas + fechadas)."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} text-purple-200`}>
                        {formatSats(calculateTotalTrades(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'neutral',
                          forceColor: true,
                          className: 'text-purple-300'
                        })}
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
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Winning Trades') }}
                        />
                        <Tooltip 
                          content="Número de trades fechadas que deram lucro (PnL > 0)."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} text-green-200`}>
                        {formatSats(calculateWinningTrades(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'neutral',
                          forceColor: true,
                          className: 'text-green-300'
                        })}
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
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Lost Trades') }}
                        />
                        <Tooltip 
                          content="Número de trades fechadas que deram prejuízo (PnL < 0)."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} text-red-200`}>
                        {formatSats(calculateLostTrades(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'neutral',
                          forceColor: true,
                          className: 'text-red-300'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>



            {/* Average PnL */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  calculateAveragePnL() > 0 ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
                  calculateAveragePnL() < 0 ? 'bg-red-600/20 border-red-500/30 group-hover:shadow-red-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <TrendingUp className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    calculateAveragePnL() > 0 ? 'text-green-300 group-hover:text-green-200' :
                    calculateAveragePnL() < 0 ? 'text-red-300 group-hover:text-red-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                calculateAveragePnL() > 0 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                calculateAveragePnL() < 0 ? 'gradient-card-red border-red-500 hover:border-red-400 hover:shadow-red-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Average PnL') }}
                        />
                        <Tooltip 
                          content="PnL médio por trade fechado."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${
                        calculateAveragePnL() > 0 ? 'text-green-200' :
                        calculateAveragePnL() < 0 ? 'text-red-200' :
                        'text-gray-200'
                      }`}>
                        {formatSats(calculateAveragePnL(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'auto',
                          forceColor: true,
                          className: calculateAveragePnL() > 0 ? 'text-green-300' :
                            calculateAveragePnL() < 0 ? 'text-red-300' :
                            'text-gray-300'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Max Drawdown */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-orange-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <TrendingDown className="w-6 h-6 text-orange-300 stroke-2 group-hover:text-orange-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-orange border-2 border-orange-500 hover:border-orange-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Max Drawdown') }}
                        />
                        <Tooltip 
                          content="Maior perda consecutiva registrada nos trades fechados."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} text-orange-200`}>
                        {formatSats(calculateMaxDrawdown(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'neutral',
                          forceColor: true,
                          className: 'text-red-300'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Sharpe Ratio */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  calculateSharpeRatio() > 1 ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
                  calculateSharpeRatio() > 0 ? 'bg-yellow-600/20 border-yellow-500/30 group-hover:shadow-yellow-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <BarChart3 className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    calculateSharpeRatio() > 1 ? 'text-green-300 group-hover:text-green-200' :
                    calculateSharpeRatio() > 0 ? 'text-yellow-300 group-hover:text-yellow-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                calculateSharpeRatio() > 1 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                calculateSharpeRatio() > 0 ? 'gradient-card-yellow border-yellow-500 hover:border-yellow-400 hover:shadow-yellow-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Sharpe Ratio') }}
                        />
                        <Tooltip 
                          content="Índice de Sharpe - medida de retorno ajustado ao risco (retorno médio / desvio padrão)."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${
                        calculateSharpeRatio() > 1 ? 'text-green-200' :
                        calculateSharpeRatio() > 0 ? 'text-yellow-200' :
                        'text-gray-200'
                      }`}>
                        {calculateSharpeRatio().toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          calculateSharpeRatio() > 1 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          calculateSharpeRatio() > 0 ? 'border-yellow-400/60 text-yellow-200 bg-yellow-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {calculateSharpeRatio() > 1 ? 'Excellent' : calculateSharpeRatio() > 0 ? 'Good' : 'Poor'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Volatility */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className="w-12 h-12 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                  <PieChart className="w-6 h-6 text-purple-300 stroke-2 group-hover:text-purple-200 transition-colors duration-500" />
                </div>
              </div>
              
              <Card className="gradient-card gradient-card-purple border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 hover:shadow-xl cursor-default">
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Volatility') }}
                        />
                        <Tooltip 
                          content="Volatilidade das posições atuais - medida de variação dos retornos."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} text-purple-200`}>
                        {formatSats(calculateVolatility(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'neutral',
                          forceColor: true,
                          className: 'text-blue-300'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Win Streak */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  calculateWinStreak() > 0 ? 'bg-green-600/20 border-green-500/30 group-hover:shadow-green-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <CheckCircle className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    calculateWinStreak() > 0 ? 'text-green-300 group-hover:text-green-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                calculateWinStreak() > 0 ? 'gradient-card-green border-green-500 hover:border-green-400 hover:shadow-green-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Win Streak') }}
                        />
                        <Tooltip 
                          content="Número de trades vencedores consecutivos mais recentes."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${
                        calculateWinStreak() > 0 ? 'text-green-200' :
                        'text-gray-200'
                      }`}>
                        {calculateWinStreak()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          calculateWinStreak() > 0 ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {calculateWinStreak() > 0 ? 'Hot' : 'Cold'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Best Trade */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  calculateBestTrade() > 0 ? 'bg-yellow-600/20 border-yellow-500/30 group-hover:shadow-yellow-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <TrendingUp className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    calculateBestTrade() > 0 ? 'text-yellow-300 group-hover:text-yellow-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                calculateBestTrade() > 0 ? 'gradient-card-yellow border-yellow-500 hover:border-yellow-400 hover:shadow-yellow-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Best Trade') }}
                        />
                        <Tooltip 
                          content="Maior lucro obtido em um único trade fechado."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${
                        calculateBestTrade() > 0 ? 'text-yellow-200' :
                        'text-gray-200'
                      }`}>
                        {formatSats(calculateBestTrade(), { 
                          size: getGlobalDynamicSize().iconSize, 
                          variant: 'neutral',
                          forceColor: true,
                          className: 'text-green-300'
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          calculateBestTrade() > 0 ? 'border-yellow-400/60 text-yellow-200 bg-yellow-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {calculateBestTrade() > 0 ? 'Record' : 'None'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Risk/Reward Ratio */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  calculateRiskRewardRatio() > 1 ? 'bg-blue-600/20 border-blue-500/30 group-hover:shadow-blue-500/30' :
                  calculateRiskRewardRatio() > 0 ? 'bg-yellow-600/20 border-yellow-500/30 group-hover:shadow-yellow-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <BarChart3 className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    calculateRiskRewardRatio() > 1 ? 'text-blue-300 group-hover:text-blue-200' :
                    calculateRiskRewardRatio() > 0 ? 'text-yellow-300 group-hover:text-yellow-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                calculateRiskRewardRatio() > 1 ? 'gradient-card-blue border-blue-500 hover:border-blue-400 hover:shadow-blue-500/30' :
                calculateRiskRewardRatio() > 0 ? 'gradient-card-yellow border-yellow-500 hover:border-yellow-400 hover:shadow-yellow-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Risk/Reward') }}
                        />
                        <Tooltip 
                          content="Relação risco/retorno - eficiência da estratégia (ganho médio / perda média)."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${
                        calculateRiskRewardRatio() > 1 ? 'text-blue-200' :
                        calculateRiskRewardRatio() > 0 ? 'text-yellow-200' :
                        'text-gray-200'
                      }`}>
                        {calculateRiskRewardRatio().toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          calculateRiskRewardRatio() > 1 ? 'border-blue-400/60 text-blue-200 bg-blue-600/20' :
                          calculateRiskRewardRatio() > 0 ? 'border-yellow-400/60 text-yellow-200 bg-yellow-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {calculateRiskRewardRatio() > 1 ? 'Good' : calculateRiskRewardRatio() > 0 ? 'Fair' : 'Poor'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>

            {/* Trading Frequency */}
            <div className="relative group">
              <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                <div className={`w-12 h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${
                  calculateTradingFrequency() > 1 ? 'bg-purple-600/20 border-purple-500/30 group-hover:shadow-purple-500/30' :
                  calculateTradingFrequency() > 0 ? 'bg-blue-600/20 border-blue-500/30 group-hover:shadow-blue-500/30' :
                  'bg-gray-600/20 border-gray-500/30'
                }`}>
                  <Activity className={`w-6 h-6 stroke-2 group-hover:transition-colors duration-500 ${
                    calculateTradingFrequency() > 1 ? 'text-purple-300 group-hover:text-purple-200' :
                    calculateTradingFrequency() > 0 ? 'text-blue-300 group-hover:text-blue-200' :
                    'text-gray-300 group-hover:text-gray-200'
                  }`} />
                </div>
              </div>
              
              <Card className={`gradient-card border-2 transition-all duration-300 hover:shadow-xl cursor-default ${
                calculateTradingFrequency() > 1 ? 'gradient-card-purple border-purple-500 hover:border-purple-400 hover:shadow-purple-500/30' :
                calculateTradingFrequency() > 0 ? 'gradient-card-blue border-blue-500 hover:border-blue-400 hover:shadow-blue-500/30' :
                'gradient-card-gray border-gray-500 hover:border-gray-400'
              }`}>
                <div className="card-content">
                  <div className={`p-3 sm:p-6 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <CardTitle 
                          className="text-lg sm:text-h3 text-vibrant"
                          dangerouslySetInnerHTML={{ __html: breakTitleIntoTwoLines('Trading Frequency') }}
                        />
                        <Tooltip 
                          content="Número de trades por dia nos últimos 30 dias - indica estilo de trading."
                          position="top"
                          delay={200}
                          className="z-50"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help hover:text-vibrant transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`${getGlobalDynamicSize().textSize} ${
                        calculateTradingFrequency() > 1 ? 'text-purple-200' :
                        calculateTradingFrequency() > 0 ? 'text-blue-200' :
                        'text-gray-200'
                      }`}>
                        {calculateTradingFrequency().toFixed(1)}/day
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-label-sm px-2 py-1 ${
                          calculateTradingFrequency() > 1 ? 'border-purple-400/60 text-purple-200 bg-purple-600/20' :
                          calculateTradingFrequency() > 0 ? 'border-blue-400/60 text-blue-200 bg-blue-600/20' :
                          'border-gray-400/60 text-gray-200 bg-gray-600/20'
                        }`}
                      >
                        {calculateTradingFrequency() > 1 ? 'Scalper' : calculateTradingFrequency() > 0 ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              </Card>
            </div>
          </div>
        </div>

        </div>

        {/* TradingView Chart - Implementação funcional com integração de dados */}
        <div className="mt-6">
          {!!liquidationLines && liquidationLines.length > 0 && (
          <TradingViewChart 
            symbol="BINANCE:BTCUSDT"
            interval="60"
            theme="dark"
            height={500}
            className="w-full"
            liquidationPrice={undefined}
            showLiquidationLine={true}
          />)}

          {/* Novo card: gráfico leve com linha de liquidação */}
          <div className="mt-6">
            {!!liquidationLines && (
            <LightweightLiquidationChart
              symbol="BINANCE:BTCUSDT"
              height={220}
              liquidationLines={liquidationLines}
              className="w-full"
            />)}
          </div>
        </div>
    </RouteGuard>
  );
}