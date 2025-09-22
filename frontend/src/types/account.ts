export type AccountProvider = 'lnmarkets' | 'binance' | 'coinbase' | 'kraken' | 'other';

export interface Account {
  id: string;
  name: string;
  provider: AccountProvider;
  isActive: boolean;
  balance?: number;
  currency?: string;
  lastUsed?: Date;
  credentials?: {
    apiKey?: string;
    apiSecret?: string;
    passphrase?: string;
  };
}

export interface AccountContextType {
  accounts: Account[];
  activeAccount: Account | null;
  setActiveAccount: (account: Account) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  removeAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<Account>) => void;
  isLoading: boolean;
  error: string | null;
}

export const ACCOUNT_PROVIDERS = {
  lnmarkets: {
    name: 'LN Markets',
    color: '#3773F5',
    icon: '⚡'
  },
  binance: {
    name: 'Binance',
    color: '#F0B90B',
    icon: '🟡'
  },
  coinbase: {
    name: 'Coinbase',
    color: '#0052FF',
    icon: '🔵'
  },
  kraken: {
    name: 'Kraken',
    color: '#4D4D4D',
    icon: '⚫'
  },
  other: {
    name: 'Other',
    color: '#6B7280',
    icon: '⚪'
  }
} as const;