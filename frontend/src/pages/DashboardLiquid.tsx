import { useEffect, useCallback, useMemo, useState } from 'react';
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
  XCircle,
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
import { useActiveAccountData } from '@/hooks/useActiveAccountData';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LNMarketsError } from '@/components/LNMarketsError';
import { PnLCard } from '@/components/dashboard/PnLCard';
import { PnLChartCard } from '@/components/dashboard/PnLChartCard';
import { MetricMiniCard, ActiveTradesMiniCard, BalanceMiniCard, MarginMiniCard } from '@/components/dashboard/MetricMiniCard';
import SatsIcon from '@/components/SatsIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { Tooltip } from '@/components/ui/tooltip';
import LightweightLiquidationChart from '@/components/charts/LightweightLiquidationChart';
import PriceReference from '@/components/lnmarkets/PriceReference';
import TradingViewMonitor from '@/components/TradingViewMonitor';
import { marketDataService } from '@/services/marketData.service';

export default function DashboardLiquid() {
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

  // Hook para informações da conta ativa
  const { accountInfo, hasActiveAccount } = useActiveAccountData();
  // ✅ DADOS DE TESTE PARA SIMULAR POSIÇÕES
  const testPositions = useMemo(() => {
    // Simular 2 posições para teste
    return [
      {
        id: 'pos1',
        symbol: 'XBTUSD',
        liquidation_price: 119039,
        takeprofit: 122400,
        side: 'long',
        quantity: 100
      },
      {
        id: 'pos2', 
        symbol: 'XBTUSD',
        liquidation_price: 118663,
        takeprofit: null, // Sem take profit
        side: 'short',
        quantity: 50
      }
    ];
  }, []);

  // Linhas de liquidação: uma por posição válida
  const liquidationLines = useMemo(() => {
    // ✅ USAR DADOS DE TESTE SE NÃO HOUVER POSIÇÕES REAIS
    const candidates: any[] = [];
    
    // Tentar dados reais primeiro
    if (Array.isArray(optimizedPositions) && optimizedPositions.length) {
      candidates.push(optimizedPositions);
    }
    
    const md: any = marketData?.positions ?? marketData ?? marketData;
    if (md) {
      const maybeArrays = [
        md.positions,
        md.openPositions,
        md.runningPositions,
        md.userPositions,
        md?.lnMarkets?.positions,
        md?.dashboard?.positions,
      ].filter(Boolean);
      for (const arr of maybeArrays) {
        if (Array.isArray(arr) && arr.length) candidates.push(arr);
      }
    }

    // ✅ FALLBACK: Usar dados de teste se não houver posições reais
    const src: any[] = candidates.length ? candidates[0] : testPositions;
    
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
      sample: Array.isArray(src) ? src.slice(0, 3) : src,
      fromOptimized: Array.isArray(optimizedPositions) ? optimizedPositions.length : 'n/a',
      fromMarketDataKeys: marketData ? Object.keys(marketData as any) : 'n/a',
      usingTestData: candidates.length === 0,
      lines
    });
    return lines.length ? lines : undefined;
  }, [optimizedPositions, marketData, testPositions]);

  // Linhas de Take Profit: uma por posição com takeprofit válido
  const takeProfitLines = useMemo(() => {
    // Tentar extrair posições de múltiplas fontes (hooks/contextos)
    const candidates: any[] = [];
    if (Array.isArray(optimizedPositions) && optimizedPositions.length) candidates.push(optimizedPositions);
    const md: any = marketData?.positions ?? marketData ?? marketData;
    if (md) {
      // candidatos comuns
      const maybeArrays = [
        md.positions,
        md.openPositions,
        md.runningPositions,
        md.userPositions,
        md?.lnMarkets?.positions,
        md?.dashboard?.positions,
      ].filter(Boolean);
      for (const arr of maybeArrays) {
        if (Array.isArray(arr) && arr.length) candidates.push(arr);
      }
    }

    // ✅ FALLBACK: Usar dados de teste se não houver posições reais
    const src: any[] = candidates.length ? candidates[0] : testPositions;
    const lines = src
      .map((p: any, idx: number) => {
        const candidate = (p as any);
        const takeprofit = Number(
          candidate.takeprofit ??
          candidate.takeProfit ??
          candidate.take_profit ??
          candidate.tp ??
          candidate.tp_price
        );
        if (!Number.isFinite(takeprofit) || takeprofit <= 0) return null;
        
        const side = candidate.side === 'b' ? 'Long' : 'Short';
        const quantity = candidate.quantity || 0;
        const label = `TP ${side} ${quantity} @ $${takeprofit.toLocaleString()}`;
        
        return { 
          price: Math.round(takeprofit), 
          label,
          color: '#22c55e' // Verde para Take Profit
        };
      })
      .filter(Boolean) as Array<{ price: number; label?: string; color?: string }>;
    
    console.log('📊 DASHBOARD - takeProfitLines calculadas:', {
      positionsCount: src?.length ?? 0,
      sample: Array.isArray(src) ? src.slice(0, 3) : src,
      fromOptimized: Array.isArray(optimizedPositions) ? optimizedPositions.length : 'n/a',
      fromMarketDataKeys: marketData ? Object.keys(marketData as any) : 'n/a',
      usingTestData: candidates.length === 0,
      lines
    });
    return lines.length ? lines : undefined;
  }, [optimizedPositions, marketData, testPositions]);
  
  // Dados de mercado otimizados (agora via contexto centralizado)
  const { marketIndex: optimizedMarketIndex } = useOptimizedMarketData();
  
  // Dados históricos (habilitado para carregamento automático)
  const historicalData = useHistoricalData({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    initialLimit: 168,
    enabled: true // ✅ Habilitado para carregar dados históricos
  });

  // Função para resetar dados históricos
  const resetHistoricalData = () => {
    if (historicalData.resetData) {
      historicalData.resetData();
      console.log('🔄 DASHBOARD - Historical data reset');
    }
  };
  
  // Dados de saldo estimado (hook específico)
  const estimatedBalance = useEstimatedBalance();
  
  // Dados de posições já estão disponíveis via useOptimizedDashboardMetrics
  
  // Dados de saldo (agora via contexto centralizado)
  const balanceData = marketData?.balance;

  // Extrair candles de marketData (unitário, tolerante a formatos)
  type Candle = { time: number; open: number; high: number; low: number; close: number };
  const candleDataFromContext: Candle[] | undefined = useMemo(() => {
    const md: any = marketData ?? {};
    const candidates = [
      md.candles,
      md.ohlc,
      md.klines,
      md.kline,
      md.history,
      md.priceHistory,
      md?.lnMarkets?.candles,
      md?.dashboard?.candles,
    ].filter(Array.isArray);

    const arr: any[] = candidates.length ? candidates[0] : [];
    if (!arr || arr.length === 0) return undefined;

    const toNum = (v: any) => (typeof v === 'string' ? Number(v) : v);
    const toSec = (v: any) => {
      const n = toNum(v);
      if (!Number.isFinite(n)) return undefined;
      // Heurística: timestamps em ms são muito grandes
      return n > 10_000_000_000 ? Math.floor(n / 1000) : Math.floor(n);
    };

    const mapped = arr
      .map((it: any) => {
        const time = toSec(it.time ?? it.ts ?? it.timestamp ?? it.openTime ?? it.t);
        const open = toNum(it.open ?? it.o ?? it.open_price);
        const high = toNum(it.high ?? it.h);
        const low = toNum(it.low ?? it.l);
        const close = toNum(it.close ?? it.c ?? it.close_price);
        if (!time || ![open, high, low, close].every((x) => Number.isFinite(x))) return null;
        return { time, open, high, low, close } as Candle;
      })
      .filter(Boolean) as Candle[];

    return mapped.length ? mapped : undefined;
  }, [marketData]);

  // Dados de candles a usar no gráfico (apenas do contexto)
  const candleData = candleDataFromContext;

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
  
  // Dados históricos para cálculos (removido - não usado)
  // const historicalMetrics = historicalData.candleData;
  
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
      hasData: !!historicalData.candleData,
      isLoading: historicalData.isLoading,
      error: historicalData.error,
      candleCount: historicalData.candleData?.length
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
    return 0 || 0;
  }, [estimatedBalance.data?.total_fees, 0]);
  
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
    return 0 || 0;
  }, [estimatedBalance.data?.lost_trades, 0]);

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


        {/* Liquid Glass Dashboard - Mosaic Layout */}
        <div className="space-y-6">
          {/* Account Status Badge */}
          <div className="flex items-center justify-between">
            {hasActiveAccount && accountInfo ? (
              <Badge variant="outline" className="text-sm border-green-400/60 text-green-200 bg-green-600/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                {accountInfo.exchangeName} - {accountInfo.accountName}
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-sm">
                <XCircle className="w-3 h-3 mr-1" />
                Nenhuma conta ativa
              </Badge>
            )}
          </div>

          {/* Mosaic Grid Layout */}
          <div className="grid grid-cols-12 gap-4 auto-rows-[140px]">
            {/* Main PnL Chart Card - Spans 2 rows, responsive columns */}
            <div className="col-span-12 md:col-span-6 lg:col-span-5 row-span-2">
              <PnLChartCard 
                pnlValue={Number.isFinite(totalPL) ? totalPL : 0}
                percentageChange={Number.isFinite(totalMargin) && totalMargin > 0 ? ((Number.isFinite(totalPL) ? totalPL : 0) / totalMargin * 100) : 0}
                subtitle={`Margin: ${formatSats(Number.isFinite(totalMargin) ? totalMargin : 0, { size: 16, variant: 'neutral' })}`}
                showChart={true}
                showFilters={true}
                initialPeriod="7D"
              />
            </div>
            
            {/* Mini Cards Grid - Right side */}
            <div className="col-span-12 md:col-span-6 lg:col-span-7 grid grid-cols-2 gap-4">
              {/* Active Trades */}
              <ActiveTradesMiniCard 
                longCount={optimizedPositions?.filter(p => p.status === 'running' && p.side === 'long').length || 0}
                shortCount={optimizedPositions?.filter(p => p.status === 'running' && p.side === 'short').length || 0}
                totalCount={calculateActiveTrades()}
              />
              
              {/* Total Margin */}
              <MarginMiniCard 
                margin={Number.isFinite(calculateTotalMargin()) ? calculateTotalMargin() : 0}
                marginRatio={Number.isFinite(totalMargin) && totalMargin > 0 ? ((Number.isFinite(totalPL) ? totalPL : 0) / totalMargin * 100) : 0}
              />
              
              {/* Balance */}
              <BalanceMiniCard 
                balance={Number.isFinite(calculateEstimatedBalance()) ? calculateEstimatedBalance() : 0}
                freeBalance={Number.isFinite(calculateAvailableMargin()) ? calculateAvailableMargin() : 0}
                showSatsIcon={true}
              />
              
              {/* Free Balance / Estimated Fees */}
              <MetricMiniCard 
                title="Free Balance"
                value={Number.isFinite(calculateAvailableMargin()) ? calculateAvailableMargin() : 0}
                formatAsSats={true}
                showSatsIcon={true}
                variant={Number.isFinite(calculateAvailableMargin()) && calculateAvailableMargin() > 0 ? 'success' : 'neutral'}
                tooltip="Quanto você tem livre agora para abrir novas posições."
              />
            </div>
          </div>
        </div>

            <LightweightLiquidationChart
              symbol="BINANCE:BTCUSDT"
              height={400}
              liquidationLines={liquidationLines}
              takeProfitLines={takeProfitLines}
              className="w-full"
              showToolbar={true}
              displaySymbol="XBTUSD"
              symbolDescription="BTCUSD: LNM FUTURES"
              logoUrl="/lnm-logo.svg"
              useApiData={true}
              onTimeframeChange={(tf) => {
                console.log('Timeframe changed to:', tf);
                // Dados são automaticamente buscados via useCandleData hook
              }}
              onIndicatorAdd={(indicator) => {
                console.log('Indicator added:', indicator);
                // TODO: Implementar adição de indicadores
              }}
            />)}
          </div>

          {/* TradingView Data Service Monitor */}
          <div className="mt-6">
            <TradingViewMonitor />
          </div>

      </div>
    </RouteGuard>
  );
}