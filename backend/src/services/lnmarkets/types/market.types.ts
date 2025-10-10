/**
 * LN Markets Market Data API Types
 * 
 * Interfaces TypeScript para respostas da API de dados de mercado
 */

export interface LNMarketsTicker {
  index: number;
  lastPrice: number;
  askPrice: number;
  bidPrice: number;
  carryFeeRate: number;
  carryFeeTimestamp: number;
  exchangesWeights: Record<string, any>;
}

export interface LNMarketsIndexPoint {
  time: number;
  value: number;
}

export interface LNMarketsPricePoint {
  time: number;
  value: number;
}

export interface LNMarketsVolatilityIndex {
  time: number;
  index: number;
}

export interface LNMarketsLeaderboardEntry {
  username: string;
  pl: number;
  direction: 1 | -1; // 1 for profit, -1 for loss
}

export interface LNMarketsLeaderboard {
  daily: LNMarketsLeaderboardEntry[];
  weekly: LNMarketsLeaderboardEntry[];
  monthly: LNMarketsLeaderboardEntry[];
  all_time: LNMarketsLeaderboardEntry[];
}

export interface LNMarketsOptionsMarketLimits {
  margin: {
    min: number;
    max: number;
  };
  quantity: {
    min: number;
    max: number;
  };
  count: {
    max: number;
  };
}

export interface LNMarketsOptionsMarketInfo {
  active: boolean;
  limits: LNMarketsOptionsMarketLimits;
  fees: {
    trading: number;
  };
}

export interface LNMarketsHistoricalParams {
  from: number; // timestamp in ms
  to: number; // timestamp in ms
  limit?: number; // max 1000, default 100
}

export interface LNMarketsMarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
  source: 'lnmarkets';
}
