/**
 * Dashboard Integration Tests
 * 
 * Integration tests for Dashboard with multi-account system
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../Dashboard';

// Mock all the hooks and contexts
jest.mock('@/stores/auth', () => ({
  useAuthStore: jest.fn(() => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      plan_type: 'PREMIUM',
    },
    isAuthenticated: true,
  })),
}));

jest.mock('@/stores/automation', () => ({
  useAutomationStore: jest.fn(() => ({
    automations: [],
    isLoading: false,
  })),
}));

jest.mock('@/contexts/RealtimeDataContext', () => ({
  useUserPositions: jest.fn(() => []),
  useUserBalance: jest.fn(() => ({ balance: 0, currency: 'BTC' })),
  useConnectionStatus: jest.fn(() => ({ isConnected: true, lastUpdate: new Date() })),
}));

jest.mock('@/contexts/PositionsContext', () => ({
  usePositionsMetrics: jest.fn(() => ({
    totalPnL: 0,
    totalVolume: 0,
    winRate: 0,
    totalTrades: 0,
  })),
  usePositions: jest.fn(() => []),
  useCredentialsError: jest.fn(() => null),
}));

jest.mock('@/contexts/MarketDataContext', () => ({
  useMarketData: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useOptimizedDashboardMetrics: jest.fn(() => ({
    totalPnL: 0,
    totalVolume: 0,
    winRate: 0,
    totalTrades: 0,
  })),
  useOptimizedPositions: jest.fn(() => []),
  useBtcPrice: jest.fn(() => 50000),
  useOptimizedMarketData: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useThemeClasses: jest.fn(() => ({
    card: 'bg-white dark:bg-gray-800',
    text: 'text-gray-900 dark:text-white',
  })),
}));

jest.mock('@/hooks/useFormatSats', () => ({
  useFormatSats: jest.fn(() => (value: number) => `${value} sats`),
}));

jest.mock('@/hooks/useHistoricalData', () => ({
  useHistoricalData: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock('@/hooks/useEstimatedBalance', () => ({
  useEstimatedBalance: jest.fn(() => ({
    balance: 100000,
    currency: 'BTC',
    isLoading: false,
  })),
}));

jest.mock('@/hooks/useRealtimeDashboard', () => ({
  useRealtimeDashboard: jest.fn(() => ({
    isConnected: true,
    lastUpdate: new Date(),
    data: {
      positions: [],
      balance: { balance: 0, currency: 'BTC' },
      metrics: {
        totalPnL: 0,
        totalVolume: 0,
        winRate: 0,
        totalTrades: 0,
      },
    },
  })),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

// Mock the multi-account hooks
jest.mock('@/hooks/useUserExchangeAccounts', () => ({
  useUserExchangeAccounts: jest.fn(() => ({
    accounts: [
      {
        id: 'account-1',
        account_name: 'Main Account',
        exchange: { name: 'LN Markets', slug: 'lnmarkets' },
        is_active: true,
        is_verified: true,
      },
      {
        id: 'account-2',
        account_name: 'Secondary Account',
        exchange: { name: 'LN Markets', slug: 'lnmarkets' },
        is_active: false,
        is_verified: true,
      },
    ],
    getActiveAccount: jest.fn(() => ({
      id: 'account-1',
      account_name: 'Main Account',
      exchange: { name: 'LN Markets', slug: 'lnmarkets' },
      is_active: true,
      is_verified: true,
    })),
    setActiveAccount: jest.fn(),
    isLoading: false,
    error: null,
  })),
}));

jest.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: jest.fn(() => ({
    activeAccountId: 'account-1',
    setActiveAccount: jest.fn(),
    clearActiveAccount: jest.fn(),
    isLoading: false,
    error: null,
  })),
}));

jest.mock('@/hooks/useAccountEvents', () => ({
  useAccountEvents: jest.fn(() => ({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
}));

// Mock components
jest.mock('@/components/charts/SimpleChart', () => {
  return function MockSimpleChart() {
    return <div data-testid="simple-chart">Simple Chart</div>;
  };
});

jest.mock('@/components/RealtimeStatus', () => {
  return function MockRealtimeStatus() {
    return <div data-testid="realtime-status">Realtime Status</div>;
  };
});

jest.mock('@/components/CoinGeckoCard', () => {
  return function MockCoinGeckoCard() {
    return <div data-testid="coingecko-card">CoinGecko Card</div>;
  };
});

jest.mock('@/components/PriceChange', () => {
  return function MockPriceChange() {
    return <div data-testid="price-change">Price Change</div>;
  };
});

jest.mock('@/components/dashboard/MetricCard', () => {
  return function MockMetricCard({ title, value, icon: Icon }: any) {
    return (
      <div data-testid="metric-card">
        <div>{title}</div>
        <div>{value}</div>
        {Icon && <Icon data-testid="metric-icon" />}
      </div>
    );
  };
});

jest.mock('@/components/dashboard/PnLCard', () => {
  return function MockPnLCard() {
    return <div data-testid="pnl-card">PnL Card</div>;
  };
});

jest.mock('@/components/SatsIcon', () => {
  return function MockSatsIcon() {
    return <div data-testid="sats-icon">Sats Icon</div>;
  };
});

jest.mock('@/components/guards/RouteGuard', () => {
  return function MockRouteGuard({ children }: any) {
    return <div data-testid="route-guard">{children}</div>;
  };
});

// Mock the AccountSelector component
jest.mock('@/components/account/AccountSelector', () => {
  return function MockAccountSelector() {
    return <div data-testid="account-selector">Account Selector</div>;
  };
});

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  describe('Multi-Account Integration', () => {
    it('should render account selector in dashboard', () => {
      renderDashboard();

      expect(screen.getByTestId('account-selector')).toBeInTheDocument();
    });

    it('should display active account information', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Main Account')).toBeInTheDocument();
      });
    });

    it('should show account switching functionality', () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const mockSetActiveAccount = jest.fn();
      
      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            account_name: 'Main Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
            is_verified: true,
          },
          {
            id: 'account-2',
            account_name: 'Secondary Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: false,
            is_verified: true,
          },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Main Account',
          exchange: { name: 'LN Markets', slug: 'lnmarkets' },
          is_active: true,
          is_verified: true,
        })),
        setActiveAccount: mockSetActiveAccount,
        isLoading: false,
        error: null,
      });

      renderDashboard();

      expect(screen.getByTestId('account-selector')).toBeInTheDocument();
    });
  });

  describe('Dashboard Metrics with Multi-Account', () => {
    it('should display metrics for active account', async () => {
      const { useOptimizedDashboardMetrics } = require('@/contexts/MarketDataContext');
      
      useOptimizedDashboardMetrics.mockReturnValue({
        totalPnL: 1500,
        totalVolume: 10000,
        winRate: 75,
        totalTrades: 20,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('1500')).toBeInTheDocument();
        expect(screen.getByText('10000')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
      });
    });

    it('should update metrics when account changes', async () => {
      const { useOptimizedDashboardMetrics } = require('@/contexts/MarketDataContext');
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      
      const mockSetActiveAccount = jest.fn();
      
      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            account_name: 'Main Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
            is_verified: true,
          },
          {
            id: 'account-2',
            account_name: 'Secondary Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: false,
            is_verified: true,
          },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Main Account',
          exchange: { name: 'LN Markets', slug: 'lnmarkets' },
          is_active: true,
          is_verified: true,
        })),
        setActiveAccount: mockSetActiveAccount,
        isLoading: false,
        error: null,
      });

      useOptimizedDashboardMetrics.mockReturnValue({
        totalPnL: 1500,
        totalVolume: 10000,
        winRate: 75,
        totalTrades: 20,
      });

      renderDashboard();

      // Simulate account change
      act(() => {
        useOptimizedDashboardMetrics.mockReturnValue({
          totalPnL: 2000,
          totalVolume: 15000,
          winRate: 80,
          totalTrades: 25,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('2000')).toBeInTheDocument();
        expect(screen.getByText('15000')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });
  });

  describe('Positions Integration', () => {
    it('should display positions for active account', async () => {
      const { useOptimizedPositions } = require('@/contexts/MarketDataContext');
      
      useOptimizedPositions.mockReturnValue([
        {
          id: 'position-1',
          symbol: 'BTCUSD',
          side: 'long',
          size: 1000,
          entryPrice: 50000,
          markPrice: 51000,
          pnl: 1000,
        },
        {
          id: 'position-2',
          symbol: 'ETHUSD',
          side: 'short',
          size: 500,
          entryPrice: 3000,
          markPrice: 2900,
          pnl: 500,
        },
      ]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('BTCUSD')).toBeInTheDocument();
        expect(screen.getByText('ETHUSD')).toBeInTheDocument();
      });
    });

    it('should update positions when account changes', async () => {
      const { useOptimizedPositions } = require('@/contexts/MarketDataContext');
      
      useOptimizedPositions.mockReturnValue([
        {
          id: 'position-1',
          symbol: 'BTCUSD',
          side: 'long',
          size: 1000,
          entryPrice: 50000,
          markPrice: 51000,
          pnl: 1000,
        },
      ]);

      renderDashboard();

      // Simulate account change with different positions
      act(() => {
        useOptimizedPositions.mockReturnValue([
          {
            id: 'position-2',
            symbol: 'ETHUSD',
            side: 'short',
            size: 500,
            entryPrice: 3000,
            markPrice: 2900,
            pnl: 500,
          },
        ]);
      });

      await waitFor(() => {
        expect(screen.getByText('ETHUSD')).toBeInTheDocument();
      });
    });
  });

  describe('Balance Integration', () => {
    it('should display balance for active account', async () => {
      const { useUserBalance } = require('@/contexts/RealtimeDataContext');
      
      useUserBalance.mockReturnValue({
        balance: 100000,
        currency: 'BTC',
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('100000')).toBeInTheDocument();
      });
    });

    it('should update balance when account changes', async () => {
      const { useUserBalance } = require('@/contexts/RealtimeDataContext');
      
      useUserBalance.mockReturnValue({
        balance: 100000,
        currency: 'BTC',
      });

      renderDashboard();

      // Simulate account change with different balance
      act(() => {
        useUserBalance.mockReturnValue({
          balance: 150000,
          currency: 'BTC',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('150000')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle account loading errors', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      
      useUserExchangeAccounts.mockReturnValue({
        accounts: [],
        getActiveAccount: jest.fn(() => null),
        setActiveAccount: jest.fn(),
        isLoading: false,
        error: 'Failed to load accounts',
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Failed to load accounts')).toBeInTheDocument();
      });
    });

    it('should handle no active account state', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      
      useUserExchangeAccounts.mockReturnValue({
        accounts: [],
        getActiveAccount: jest.fn(() => null),
        setActiveAccount: jest.fn(),
        isLoading: false,
        error: null,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('No active account')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while accounts are loading', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      
      useUserExchangeAccounts.mockReturnValue({
        accounts: [],
        getActiveAccount: jest.fn(() => null),
        setActiveAccount: jest.fn(),
        isLoading: true,
        error: null,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
      });
    });

    it('should show loading state while data is loading', async () => {
      const { useOptimizedDashboardMetrics } = require('@/contexts/MarketDataContext');
      
      useOptimizedDashboardMetrics.mockReturnValue({
        totalPnL: 0,
        totalVolume: 0,
        winRate: 0,
        totalTrades: 0,
        isLoading: true,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
      });
    });
  });

  describe('Account Switching', () => {
    it('should trigger account change when selector is used', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const mockSetActiveAccount = jest.fn();
      
      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            account_name: 'Main Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
            is_verified: true,
          },
          {
            id: 'account-2',
            account_name: 'Secondary Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: false,
            is_verified: true,
          },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Main Account',
          exchange: { name: 'LN Markets', slug: 'lnmarkets' },
          is_active: true,
          is_verified: true,
        })),
        setActiveAccount: mockSetActiveAccount,
        isLoading: false,
        error: null,
      });

      renderDashboard();

      // Simulate account selector interaction
      const accountSelector = screen.getByTestId('account-selector');
      fireEvent.click(accountSelector);

      expect(mockSetActiveAccount).toHaveBeenCalled();
    });
  });
});
