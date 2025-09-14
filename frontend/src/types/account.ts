// Interfaces para suporte a múltiplas contas/credenciais

export interface AccountCredentials {
  id: string;
  name: string; // Nome da conta (ex: "Conta Principal", "Conta Teste")
  ln_markets_api_key: string;
  ln_markets_api_secret: string;
  ln_markets_passphrase: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountBalance {
  account_id: string;
  account_name: string;
  total_balance: number;
  available_balance: number;
  margin_used: number;
  timestamp: number;
}

export interface AccountPosition {
  account_id: string;
  account_name: string;
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  price: number;
  margin: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
}

export interface MultiAccountData {
  accounts: AccountCredentials[];
  balances: AccountBalance[];
  positions: AccountPosition[];
  totalPL: number;
  lastUpdate: number;
}

// Hook para gerenciar dados de múltiplas contas
export interface UseMultiAccountDataReturn {
  data: MultiAccountData;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addAccount: (credentials: Omit<AccountCredentials, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  updateAccount: (accountId: string, updates: Partial<AccountCredentials>) => Promise<void>;
}

