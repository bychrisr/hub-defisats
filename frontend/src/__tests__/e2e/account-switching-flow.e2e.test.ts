/**
 * Account Switching Flow E2E Tests
 * 
 * End-to-end tests for account switching flow
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';

// Mock all the necessary services and hooks
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

jest.mock('@/hooks/useUserExchangeAccounts', () => ({
  useUserExchangeAccounts: jest.fn(() => ({
    accounts: [],
    getActiveAccount: jest.fn(() => null),
    setActiveAccount: jest.fn(),
    createAccount: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
    isLoading: false,
    error: null,
    loadAccounts: jest.fn(),
  })),
}));

jest.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: jest.fn(() => ({
    activeAccountId: null,
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

// Mock API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock components
jest.mock('@/components/account/AccountSelector', () => {
  return function MockAccountSelector({ accounts, activeAccount, onAccountChange }: any) {
    return (
      <div data-testid="account-selector">
        <div data-testid="active-account">
          {activeAccount ? activeAccount.account_name : 'No Account'}
        </div>
        <div data-testid="account-list">
          {accounts.map((account: any) => (
            <button
              key={account.id}
              data-testid={`account-${account.id}`}
              onClick={() => onAccountChange(account.id)}
              className={account.is_active ? 'active' : ''}
            >
              {account.account_name}
            </button>
          ))}
        </div>
      </div>
    );
  };
});

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

describe('Account Switching Flow E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Account Switching Flow', () => {
    it('should complete full account switching flow', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');

      const mockSetActiveAccount = jest.fn();
      const mockLoadAccounts = jest.fn();

      // Mock initial state with multiple accounts
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
          {
            id: 'account-3',
            account_name: 'Trading Account',
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
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: mockLoadAccounts,
      });

      useActiveAccount.mockReturnValue({
        activeAccountId: 'account-1',
        setActiveAccount: jest.fn(),
        clearActiveAccount: jest.fn(),
        isLoading: false,
        error: null,
      });

      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'account-2',
              account_name: 'Secondary Account',
              exchange: { name: 'LN Markets', slug: 'lnmarkets' },
              is_active: true,
              is_verified: true,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'account-1',
              account_name: 'Main Account',
              exchange: { name: 'LN Markets', slug: 'lnmarkets' },
              is_active: false,
              is_verified: true,
            },
          }),
        });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Step 1: Verify initial state
      expect(screen.getByTestId('account-selector')).toBeInTheDocument();
      expect(screen.getByTestId('active-account')).toHaveTextContent('Main Account');

      // Step 2: Switch to secondary account
      const secondaryAccountButton = screen.getByTestId('account-account-2');
      fireEvent.click(secondaryAccountButton);

      // Step 3: Verify API call for account switching
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/user/exchange-accounts/account-2/set-active',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Bearer'),
              'Content-Type': 'application/json',
            }),
          })
        );
      });

      // Step 4: Verify account switching
      await waitFor(() => {
        expect(mockSetActiveAccount).toHaveBeenCalledWith('account-2');
      });

      // Step 5: Verify UI updates
      await waitFor(() => {
        expect(screen.getByTestId('active-account')).toHaveTextContent('Secondary Account');
      });

      // Step 6: Verify accounts are reloaded
      await waitFor(() => {
        expect(mockLoadAccounts).toHaveBeenCalled();
      });
    });

    it('should handle account switching errors', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');

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
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      useActiveAccount.mockReturnValue({
        activeAccountId: 'account-1',
        setActiveAccount: jest.fn(),
        clearActiveAccount: jest.fn(),
        isLoading: false,
        error: null,
      });

      // Mock API error
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found',
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Try to switch to secondary account
      const secondaryAccountButton = screen.getByTestId('account-account-2');
      fireEvent.click(secondaryAccountButton);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText('Account not found')).toBeInTheDocument();
      });

      // Verify account remains the same
      expect(screen.getByTestId('active-account')).toHaveTextContent('Main Account');
    });

    it('should handle network errors during account switching', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');

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
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      useActiveAccount.mockReturnValue({
        activeAccountId: 'account-1',
        setActiveAccount: jest.fn(),
        clearActiveAccount: jest.fn(),
        isLoading: false,
        error: null,
      });

      // Mock network error
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Try to switch to secondary account
      const secondaryAccountButton = screen.getByTestId('account-account-2');
      fireEvent.click(secondaryAccountButton);

      // Verify network error handling
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Verify account remains the same
      expect(screen.getByTestId('active-account')).toHaveTextContent('Main Account');
    });
  });

  describe('Account Switching with Data Updates', () => {
    it('should update dashboard data when switching accounts', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');

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
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      useActiveAccount.mockReturnValue({
        activeAccountId: 'account-1',
        setActiveAccount: jest.fn(),
        clearActiveAccount: jest.fn(),
        isLoading: false,
        error: null,
      });

      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'account-2',
            account_name: 'Secondary Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
            is_verified: true,
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Switch to secondary account
      const secondaryAccountButton = screen.getByTestId('account-account-2');
      fireEvent.click(secondaryAccountButton);

      // Verify account switching
      await waitFor(() => {
        expect(mockSetActiveAccount).toHaveBeenCalledWith('account-2');
      });

      // Verify UI updates
      await waitFor(() => {
        expect(screen.getByTestId('active-account')).toHaveTextContent('Secondary Account');
      });
    });

    it('should handle rapid account switching', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');

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
          {
            id: 'account-3',
            account_name: 'Trading Account',
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
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      useActiveAccount.mockReturnValue({
        activeAccountId: 'account-1',
        setActiveAccount: jest.fn(),
        clearActiveAccount: jest.fn(),
        isLoading: false,
        error: null,
      });

      // Mock successful API responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'account-2',
            account_name: 'Secondary Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
            is_verified: true,
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Rapidly switch between accounts
      const secondaryAccountButton = screen.getByTestId('account-account-2');
      const tradingAccountButton = screen.getByTestId('account-account-3');

      fireEvent.click(secondaryAccountButton);
      fireEvent.click(tradingAccountButton);
      fireEvent.click(secondaryAccountButton);

      // Verify multiple API calls
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });

      // Verify final account state
      await waitFor(() => {
        expect(mockSetActiveAccount).toHaveBeenLastCalledWith('account-2');
      });
    });
  });

  describe('Account Switching with Persistence', () => {
    it('should persist account changes across page reloads', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');

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
          id: 'account-2',
          account_name: 'Secondary Account',
          exchange: { name: 'LN Markets', slug: 'lnmarkets' },
          is_active: true,
          is_verified: true,
        })),
        setActiveAccount: mockSetActiveAccount,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      useActiveAccount.mockReturnValue({
        activeAccountId: 'account-2',
        setActiveAccount: jest.fn(),
        clearActiveAccount: jest.fn(),
        isLoading: false,
        error: null,
      });

      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'account-2',
            account_name: 'Secondary Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
            is_verified: true,
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Verify persisted account is loaded
      await waitFor(() => {
        expect(screen.getByTestId('active-account')).toHaveTextContent('Secondary Account');
      });
    });

    it('should handle missing active account gracefully', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');

      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            account_name: 'Main Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: false,
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
        getActiveAccount: jest.fn(() => null),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      useActiveAccount.mockReturnValue({
        activeAccountId: null,
        setActiveAccount: jest.fn(),
        clearActiveAccount: jest.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Verify no active account state
      await waitFor(() => {
        expect(screen.getByTestId('active-account')).toHaveTextContent('No Account');
      });
    });
  });

  describe('Account Switching with Loading States', () => {
    it('should show loading state during account switching', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');

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
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: true,
        error: null,
        loadAccounts: jest.fn(),
      });

      useActiveAccount.mockReturnValue({
        activeAccountId: 'account-1',
        setActiveAccount: jest.fn(),
        clearActiveAccount: jest.fn(),
        isLoading: true,
        error: null,
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
      });
    });
  });
});
