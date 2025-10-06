/**
 * Plan Limits Validation E2E Tests
 * 
 * End-to-end tests for plan limits validation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { Profile } from '@/pages/Profile';

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

jest.mock('@/hooks/usePlanLimits', () => ({
  usePlanLimits: jest.fn(() => ({
    limits: {
      maxExchangeAccounts: 10,
      maxAutomations: 25,
      maxIndicators: 50,
      maxSimulations: 30,
      maxBacktests: 15,
    },
    isLoading: false,
    error: null,
  })),
}));

jest.mock('@/hooks/useAutomations', () => ({
  useAutomations: jest.fn(() => ({
    automations: [],
    createAutomation: jest.fn(),
    updateAutomation: jest.fn(),
    deleteAutomation: jest.fn(),
    isLoading: false,
    error: null,
    loadAutomations: jest.fn(),
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

jest.mock('@/components/modals/CreateAccountModal', () => {
  return function MockCreateAccountModal({ isOpen, onClose, onSuccess }: any) {
    if (!isOpen) return null;
    
    return (
      <div data-testid="create-account-modal">
        <div>Create Account Modal</div>
        <button data-testid="close-modal" onClick={onClose}>
          Close
        </button>
        <button data-testid="create-account" onClick={() => onSuccess({ id: 'new-account-123', name: 'New Account' })}>
          Create Account
        </button>
      </div>
    );
  };
});

jest.mock('@/components/modals/PlanModal', () => {
  return function MockPlanModal({ isOpen, onClose }: any) {
    if (!isOpen) return null;
    
    return (
      <div data-testid="plan-modal">
        <div>Plan Upgrade Modal</div>
        <button data-testid="close-plan-modal" onClick={onClose}>
          Close
        </button>
        <button data-testid="upgrade-plan">
          Upgrade Plan
        </button>
      </div>
    );
  };
});

describe('Plan Limits Validation E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Exchange Account Limits Validation', () => {
    it('should prevent account creation when limit is reached', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');

      // Mock user at account limit
      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          { id: 'account-1', account_name: 'Account 1', is_active: true },
          { id: 'account-2', account_name: 'Account 2', is_active: false },
          { id: 'account-3', account_name: 'Account 3', is_active: false },
          { id: 'account-4', account_name: 'Account 4', is_active: false },
          { id: 'account-5', account_name: 'Account 5', is_active: false },
          { id: 'account-6', account_name: 'Account 6', is_active: false },
          { id: 'account-7', account_name: 'Account 7', is_active: false },
          { id: 'account-8', account_name: 'Account 8', is_active: false },
          { id: 'account-9', account_name: 'Account 9', is_active: false },
          { id: 'account-10', account_name: 'Account 10', is_active: false },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Account 1',
          is_active: true,
        })),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits - user at limit
      usePlanLimits.mockReturnValue({
        limits: {
          maxExchangeAccounts: 10, // User at limit
          maxAutomations: 25,
          maxIndicators: 50,
          maxSimulations: 30,
          maxBacktests: 15,
        },
        isLoading: false,
        error: null,
      });

      // Mock API response for limit validation
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            canCreate: false,
            currentUsage: 10,
            limit: 10,
            message: 'Account limit reached',
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Try to open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      // Verify limit validation
      await waitFor(() => {
        expect(screen.getByText('Account limit reached')).toBeInTheDocument();
      });

      // Verify modal doesn't open
      expect(screen.queryByTestId('create-account-modal')).not.toBeInTheDocument();
    });

    it('should show upgrade prompt when limit is reached', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');

      // Mock user at account limit
      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          { id: 'account-1', account_name: 'Account 1', is_active: true },
          { id: 'account-2', account_name: 'Account 2', is_active: false },
          { id: 'account-3', account_name: 'Account 3', is_active: false },
          { id: 'account-4', account_name: 'Account 4', is_active: false },
          { id: 'account-5', account_name: 'Account 5', is_active: false },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Account 1',
          is_active: true,
        })),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits - user at limit
      usePlanLimits.mockReturnValue({
        limits: {
          maxExchangeAccounts: 5, // User at limit
          maxAutomations: 25,
          maxIndicators: 50,
          maxSimulations: 30,
          maxBacktests: 15,
        },
        isLoading: false,
        error: null,
      });

      // Mock API response for limit validation
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            canCreate: false,
            currentUsage: 5,
            limit: 5,
            message: 'Account limit reached',
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Try to open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      // Verify upgrade prompt
      await waitFor(() => {
        expect(screen.getByText('Account limit reached')).toBeInTheDocument();
        expect(screen.getByText('Upgrade your plan to create more accounts')).toBeInTheDocument();
      });

      // Verify upgrade button is shown
      expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
    });

    it('should allow account creation when under limit', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');

      // Mock user under account limit
      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          { id: 'account-1', account_name: 'Account 1', is_active: true },
          { id: 'account-2', account_name: 'Account 2', is_active: false },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Account 1',
          is_active: true,
        })),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits - user under limit
      usePlanLimits.mockReturnValue({
        limits: {
          maxExchangeAccounts: 10, // User under limit
          maxAutomations: 25,
          maxIndicators: 50,
          maxSimulations: 30,
          maxBacktests: 15,
        },
        isLoading: false,
        error: null,
      });

      // Mock API response for limit validation
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            canCreate: true,
            currentUsage: 2,
            limit: 10,
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Try to open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      // Verify modal opens
      await waitFor(() => {
        expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
      });

      // Verify no limit message
      expect(screen.queryByText('Account limit reached')).not.toBeInTheDocument();
    });
  });

  describe('Automation Limits Validation', () => {
    it('should prevent automation creation when limit is reached', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');
      const { useAutomations } = require('@/hooks/useAutomations');

      // Mock user at automation limit
      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          { id: 'account-1', account_name: 'Account 1', is_active: true },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Account 1',
          is_active: true,
        })),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits - user at automation limit
      usePlanLimits.mockReturnValue({
        limits: {
          maxExchangeAccounts: 10,
          maxAutomations: 5, // User at limit
          maxIndicators: 50,
          maxSimulations: 30,
          maxBacktests: 15,
        },
        isLoading: false,
        error: null,
      });

      useAutomations.mockReturnValue({
        automations: [
          { id: 'automation-1', name: 'Automation 1', is_active: true },
          { id: 'automation-2', name: 'Automation 2', is_active: true },
          { id: 'automation-3', name: 'Automation 3', is_active: true },
          { id: 'automation-4', name: 'Automation 4', is_active: true },
          { id: 'automation-5', name: 'Automation 5', is_active: true },
        ],
        createAutomation: jest.fn(),
        updateAutomation: jest.fn(),
        deleteAutomation: jest.fn(),
        isLoading: false,
        error: null,
        loadAutomations: jest.fn(),
      });

      // Mock API response for limit validation
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            canCreate: false,
            currentUsage: 5,
            limit: 5,
            message: 'Automation limit reached',
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Try to create automation
      const createAutomationButton = screen.getByText('Create Automation');
      fireEvent.click(createAutomationButton);

      // Verify limit validation
      await waitFor(() => {
        expect(screen.getByText('Automation limit reached')).toBeInTheDocument();
      });

      // Verify upgrade prompt
      expect(screen.getByText('Upgrade your plan to create more automations')).toBeInTheDocument();
    });

    it('should allow automation creation when under limit', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');
      const { useAutomations } = require('@/hooks/useAutomations');

      // Mock user under automation limit
      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          { id: 'account-1', account_name: 'Account 1', is_active: true },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Account 1',
          is_active: true,
        })),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits - user under limit
      usePlanLimits.mockReturnValue({
        limits: {
          maxExchangeAccounts: 10,
          maxAutomations: 25, // User under limit
          maxIndicators: 50,
          maxSimulations: 30,
          maxBacktests: 15,
        },
        isLoading: false,
        error: null,
      });

      useAutomations.mockReturnValue({
        automations: [
          { id: 'automation-1', name: 'Automation 1', is_active: true },
          { id: 'automation-2', name: 'Automation 2', is_active: true },
        ],
        createAutomation: jest.fn(),
        updateAutomation: jest.fn(),
        deleteAutomation: jest.fn(),
        isLoading: false,
        error: null,
        loadAutomations: jest.fn(),
      });

      // Mock API response for limit validation
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            canCreate: true,
            currentUsage: 2,
            limit: 25,
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Try to create automation
      const createAutomationButton = screen.getByText('Create Automation');
      fireEvent.click(createAutomationButton);

      // Verify automation form opens
      await waitFor(() => {
        expect(screen.getByTestId('automation-form')).toBeInTheDocument();
      });

      // Verify no limit message
      expect(screen.queryByText('Automation limit reached')).not.toBeInTheDocument();
    });
  });

  describe('Unlimited Plan Limits', () => {
    it('should allow unlimited account creation for lifetime plan', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');

      // Mock user with lifetime plan
      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          { id: 'account-1', account_name: 'Account 1', is_active: true },
          { id: 'account-2', account_name: 'Account 2', is_active: false },
          { id: 'account-3', account_name: 'Account 3', is_active: false },
          { id: 'account-4', account_name: 'Account 4', is_active: false },
          { id: 'account-5', account_name: 'Account 5', is_active: false },
          { id: 'account-6', account_name: 'Account 6', is_active: false },
          { id: 'account-7', account_name: 'Account 7', is_active: false },
          { id: 'account-8', account_name: 'Account 8', is_active: false },
          { id: 'account-9', account_name: 'Account 9', is_active: false },
          { id: 'account-10', account_name: 'Account 10', is_active: false },
          { id: 'account-11', account_name: 'Account 11', is_active: false },
          { id: 'account-12', account_name: 'Account 12', is_active: false },
          { id: 'account-13', account_name: 'Account 13', is_active: false },
          { id: 'account-14', account_name: 'Account 14', is_active: false },
          { id: 'account-15', account_name: 'Account 15', is_active: false },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Account 1',
          is_active: true,
        })),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits - lifetime plan with unlimited accounts
      usePlanLimits.mockReturnValue({
        limits: {
          maxExchangeAccounts: -1, // Unlimited
          maxAutomations: -1,
          maxIndicators: -1,
          maxSimulations: -1,
          maxBacktests: -1,
        },
        isLoading: false,
        error: null,
      });

      // Mock API response for limit validation
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            canCreate: true,
            currentUsage: 15,
            limit: -1, // Unlimited
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Try to open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      // Verify modal opens
      await waitFor(() => {
        expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
      });

      // Verify no limit message
      expect(screen.queryByText('Account limit reached')).not.toBeInTheDocument();
    });

    it('should display infinity symbol for unlimited plans', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');

      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          { id: 'account-1', account_name: 'Account 1', is_active: true },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Account 1',
          is_active: true,
        })),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits - lifetime plan with unlimited accounts
      usePlanLimits.mockReturnValue({
        limits: {
          maxExchangeAccounts: -1, // Unlimited
          maxAutomations: -1,
          maxIndicators: -1,
          maxSimulations: -1,
          maxBacktests: -1,
        },
        isLoading: false,
        error: null,
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Verify infinity symbol is displayed
      await waitFor(() => {
        expect(screen.getByText('∞')).toBeInTheDocument();
      });
    });
  });

  describe('Plan Limits Display', () => {
    it('should display current usage and limits correctly', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');

      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          { id: 'account-1', account_name: 'Account 1', is_active: true },
          { id: 'account-2', account_name: 'Account 2', is_active: false },
          { id: 'account-3', account_name: 'Account 3', is_active: false },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Account 1',
          is_active: true,
        })),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits
      usePlanLimits.mockReturnValue({
        limits: {
          maxExchangeAccounts: 10,
          maxAutomations: 25,
          maxIndicators: 50,
          maxSimulations: 30,
          maxBacktests: 15,
        },
        isLoading: false,
        error: null,
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Verify limits are displayed
      await waitFor(() => {
        expect(screen.getByText('3 / 10 accounts')).toBeInTheDocument();
        expect(screen.getByText('0 / 25 automations')).toBeInTheDocument();
        expect(screen.getByText('0 / 50 indicators')).toBeInTheDocument();
        expect(screen.getByText('0 / 30 simulations')).toBeInTheDocument();
        expect(screen.getByText('0 / 15 backtests')).toBeInTheDocument();
      });
    });

    it('should handle loading state for plan limits', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');

      useUserExchangeAccounts.mockReturnValue({
        accounts: [],
        getActiveAccount: jest.fn(() => null),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits loading
      usePlanLimits.mockReturnValue({
        limits: null,
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
        expect(screen.getByText('Loading plan limits...')).toBeInTheDocument();
      });
    });

    it('should handle plan limits errors', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');

      useUserExchangeAccounts.mockReturnValue({
        accounts: [],
        getActiveAccount: jest.fn(() => null),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits error
      usePlanLimits.mockReturnValue({
        limits: null,
        isLoading: false,
        error: 'Failed to load plan limits',
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Verify error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load plan limits')).toBeInTheDocument();
      });
    });
  });

  describe('Plan Upgrade Flow', () => {
    it('should open plan upgrade modal when limit is reached', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');

      // Mock user at account limit
      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          { id: 'account-1', account_name: 'Account 1', is_active: true },
          { id: 'account-2', account_name: 'Account 2', is_active: false },
          { id: 'account-3', account_name: 'Account 3', is_active: false },
          { id: 'account-4', account_name: 'Account 4', is_active: false },
          { id: 'account-5', account_name: 'Account 5', is_active: false },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Account 1',
          is_active: true,
        })),
        setActiveAccount: jest.fn(),
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: jest.fn(),
      });

      // Mock plan limits - user at limit
      usePlanLimits.mockReturnValue({
        limits: {
          maxExchangeAccounts: 5, // User at limit
          maxAutomations: 25,
          maxIndicators: 50,
          maxSimulations: 30,
          maxBacktests: 15,
        },
        isLoading: false,
        error: null,
      });

      // Mock API response for limit validation
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            canCreate: false,
            currentUsage: 5,
            limit: 5,
            message: 'Account limit reached',
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Try to open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      // Verify upgrade prompt
      await waitFor(() => {
        expect(screen.getByText('Account limit reached')).toBeInTheDocument();
        expect(screen.getByText('Upgrade your plan to create more accounts')).toBeInTheDocument();
      });

      // Click upgrade button
      const upgradeButton = screen.getByText('Upgrade Plan');
      fireEvent.click(upgradeButton);

      // Verify plan modal opens
      await waitFor(() => {
        expect(screen.getByTestId('plan-modal')).toBeInTheDocument();
      });
    });
  });
});
