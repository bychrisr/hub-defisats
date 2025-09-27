/**
 * LN Markets API Endpoints Configuration
 * 
 * Centralized configuration for all LN Markets API v2 endpoints
 * Uses 'as const' and 'keyof' for type safety
 */

export const LN_MARKETS_ENDPOINTS = {
  // User endpoints
  user: '/user',
  userBalance: '/user/balance',
  userDeposits: '/user/deposits',
  userWithdrawals: '/user/withdrawals',
  
  // Futures endpoints
  futures: '/futures',
  futuresTicker: '/futures/btc_usd/ticker',
  futuresHistory: '/futures/btc_usd/history',
  futuresLimits: '/futures/btc_usd/limits',
  futuresTrades: '/futures/trades',
  futuresPositions: '/futures/positions',
  futuresOrders: '/futures/orders',
  futuresClose: '/futures/close',
  futuresNewTrade: '/futures/new-trade',
  futuresUpdateTrade: '/futures/update-trade',
  
  // Market data endpoints
  marketData: '/market/data',
  marketTicker: '/market/ticker',
  marketHistory: '/market/history',
  marketIndex: '/market/index',
  
  // Trading endpoints
  tradingOrders: '/trading/orders',
  tradingPositions: '/trading/positions',
  tradingHistory: '/trading/history',
  
  // System endpoints
  systemStatus: '/system/status',
  systemHealth: '/system/health',
} as const;

// Type for endpoint keys
export type LNMarketsEndpointKey = keyof typeof LN_MARKETS_ENDPOINTS;

// Type for endpoint values
export type LNMarketsEndpointValue = typeof LN_MARKETS_ENDPOINTS[LNMarketsEndpointKey];

// Helper function to get endpoint by key
export function getLNMarketsEndpoint(key: LNMarketsEndpointKey): LNMarketsEndpointValue {
  return LN_MARKETS_ENDPOINTS[key];
}

// Helper function to get all endpoints
export function getAllLNMarketsEndpoints(): typeof LN_MARKETS_ENDPOINTS {
  return LN_MARKETS_ENDPOINTS;
}

// Helper function to check if endpoint exists
export function isValidLNMarketsEndpoint(key: string): key is LNMarketsEndpointKey {
  return key in LN_MARKETS_ENDPOINTS;
}

// Endpoint categories for organization
export const LN_MARKETS_ENDPOINT_CATEGORIES = {
  USER: ['user', 'userBalance', 'userDeposits', 'userWithdrawals'] as const,
  FUTURES: ['futures', 'futuresTicker', 'futuresHistory', 'futuresLimits', 'futuresTrades', 'futuresPositions', 'futuresOrders', 'futuresClose', 'futuresNewTrade', 'futuresUpdateTrade'] as const,
  MARKET: ['marketData', 'marketTicker', 'marketHistory', 'marketIndex'] as const,
  TRADING: ['tradingOrders', 'tradingPositions', 'tradingHistory'] as const,
  SYSTEM: ['systemStatus', 'systemHealth'] as const,
} as const;

// Type for category keys
export type LNMarketsEndpointCategory = keyof typeof LN_MARKETS_ENDPOINT_CATEGORIES;

// Helper function to get endpoints by category
export function getLNMarketsEndpointsByCategory(category: LNMarketsEndpointCategory): LNMarketsEndpointValue[] {
  return LN_MARKETS_ENDPOINT_CATEGORIES[category].map(key => LN_MARKETS_ENDPOINTS[key]);
}

// Helper function to get category of an endpoint
export function getLNMarketsEndpointCategory(key: LNMarketsEndpointKey): LNMarketsEndpointCategory | null {
  for (const [category, endpoints] of Object.entries(LN_MARKETS_ENDPOINT_CATEGORIES)) {
    if ((endpoints as unknown as string[]).includes(key)) {
      return category as LNMarketsEndpointCategory;
    }
  }
  return null;
}

// Export default
export default LN_MARKETS_ENDPOINTS;
