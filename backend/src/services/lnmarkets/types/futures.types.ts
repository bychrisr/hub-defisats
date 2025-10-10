/**
 * LN Markets Futures API Types
 * 
 * Interfaces TypeScript para respostas da API de futures
 */

export interface LNMarketsFuturesPosition {
  uid: string;
  type: 'm' | 'l'; // market or limit
  id: string;
  side: 'b' | 's'; // buy or sell
  opening_fee: number;
  closing_fee: number;
  maintenance_margin: number;
  quantity: number;
  margin: number;
  leverage: number;
  price: number;
  liquidation: number;
  pl: number;
  creation_ts: number;
  market_filled_ts: number | null;
  closed_ts: number | null;
  entry_price: number;
  entry_margin: number;
  open: boolean;
  running: boolean;
  canceled: boolean;
  closed: boolean;
  sum_carry_fees: number;
  stoploss?: number;
  takeprofit?: number;
}

export interface LNMarketsFuturesOrder {
  type: 'm' | 'l'; // market or limit
  side: 'b' | 's'; // buy or sell
  leverage: number;
  quantity: number;
  price?: number; // required for limit orders
  stoploss?: number;
  takeprofit?: number;
}

export interface LNMarketsFuturesResponse {
  uid: string;
  type: 'm' | 'l';
  id: string;
  side: 'b' | 's';
  opening_fee: number;
  closing_fee: number;
  maintenance_margin: number;
  quantity: number;
  margin: number;
  leverage: number;
  price: number;
  liquidation: number;
  pl: number;
  creation_ts: number;
  market_filled_ts: number | null;
  closed_ts: number | null;
  entry_price: number;
  entry_margin: number;
  open: boolean;
  running: boolean;
  canceled: boolean;
  closed: boolean;
  sum_carry_fees: number;
}

export interface LNMarketsFuturesParams {
  type?: 'running' | 'open' | 'closed';
  from?: number;
  to?: number;
  limit?: number;
}

export interface LNMarketsStopLossTakeProfitUpdate {
  stopLoss?: number;
  takeProfit?: number;
}

export interface LNMarketsAddMarginRequest {
  amount: number;
}

export interface LNMarketsCashInRequest {
  quantity: number;
}

export interface LNMarketsCarryFee {
  id: string;
  time: number;
  price: number;
  fee_rate: number;
}

export interface LNMarketsMarketLimits {
  quantity: {
    min: number;
    max: number;
  };
  trade: number;
  leverage: {
    min: number;
    max: number;
  };
  count: {
    max: number;
  };
}

export interface LNMarketsMarketFees {
  carry: {
    min: number;
    hours: number[];
  };
  trading: {
    tiers: Array<{
      minVolume: number;
      fees: number;
    }>;
  };
}

export interface LNMarketsMarketInfo {
  active: boolean;
  limits: LNMarketsMarketLimits;
  fees: LNMarketsMarketFees;
}
