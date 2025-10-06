/**
 * Account Creation Flow E2E Tests
 * 
 * End-to-end tests for complete account creation flow
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

jest.mock('@/services/userExchangeAccount.service', () => ({
  createUserExchangeAccount: jest.fn(),
  updateUserExchangeAccount: jest.fn(),
  deleteUserExchangeAccount: jest.fn(),
  getUserExchangeAccounts: jest.fn(),
}));

jest.mock('@/services/planLimits.service', () => ({
  planLimitsService: {
    getUserLimits: jest.fn(),
    validateLimit: jest.fn(),
  },
}));

// Mock API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock components
jest.mock('@/components/account/AccountSelector', () => {
  return function MockAccountSelector() {
    return <div data-testid="account-selector">Account Selector</div>;
  };
});

jest.mock('@/components/modals/CreateAccountModal', () => {
  return function MockCreateAccountModal({ isOpen, onClose, onSuccess }: any) {
    if (!isOpen) return null;
    
    return (
      <div data-testid="create-account-modal">
        <div>Create Account Modal</div>
        <button 
          data-testid="close-modal" 
          onClick={onClose}
        >
          Close
        </button>
        <button 
          data-testid="create-account" 
          onClick={() => onSuccess({ id: 'new-account-123', name: 'New Account' })}
        >
          Create Account
        </button>
      </div>
    );
  };
});

jest.mock('@/components/modals/AccountActionsModal', () => {
  return function MockAccountActionsModal({ isOpen, onClose }: any) {
    if (!isOpen) return null;
    
    return (
      <div data-testid="account-actions-modal">
        <div>Account Actions Modal</div>
        <button data-testid="close-actions-modal" onClick={onClose}>
          Close
        </button>
      </div>
    );
  };
});

describe('Account Creation Flow E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Account Creation Flow', () => {
    it('should complete full account creation flow', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');
      const { createUserExchangeAccount } = require('@/services/userExchangeAccount.service');
      const { planLimitsService } = require('@/services/planLimits.service');

      // Mock initial state - no accounts
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

      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'new-account-123',
              account_name: 'New Account',
              exchange: { name: 'LN Markets', slug: 'lnmarkets' },
              is_active: true,
              is_verified: false,
              created_at: new Date().toISOString(),
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              canCreate: true,
              currentUsage: 0,
              limit: 10,
            },
          }),
        });

      // Mock service calls
      createUserExchangeAccount.mockResolvedValue({
        id: 'new-account-123',
        account_name: 'New Account',
        exchange: { name: 'LN Markets', slug: 'lnmarkets' },
        is_active: true,
        is_verified: false,
      });

      planLimitsService.validateLimit.mockResolvedValue({
        isValid: true,
        currentCount: 0,
        maxLimit: 10,
        limitType: 'EXCHANGE_ACCOUNTS',
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Step 1: Verify initial state
      expect(screen.getByTestId('account-selector')).toBeInTheDocument();

      // Step 2: Open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
      });

      // Step 3: Fill account creation form
      const accountNameInput = screen.getByPlaceholderText('Account Name');
      fireEvent.change(accountNameInput, { target: { value: 'New Account' } });

      const apiKeyInput = screen.getByPlaceholderText('API Key');
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });

      const secretInput = screen.getByPlaceholderText('Secret');
      fireEvent.change(secretInput, { target: { value: 'test-secret' } });

      // Step 4: Submit form
      const createAccountButton = screen.getByTestId('create-account');
      fireEvent.click(createAccountButton);

      // Step 5: Verify API calls
      await waitFor(() => {
        expect(createUserExchangeAccount).toHaveBeenCalledWith({
          exchange_id: 'lnmarkets-exchange-id',
          account_name: 'New Account',
          credentials: {
            api_key: 'test-api-key',
            secret: 'test-secret',
          },
        });
      });

      // Step 6: Verify account was created
      await waitFor(() => {
        expect(screen.getByText('Account created successfully')).toBeInTheDocument();
      });

      // Step 7: Verify modal closes
      await waitFor(() => {
        expect(screen.queryByTestId('create-account-modal')).not.toBeInTheDocument();
      });

      // Step 8: Verify account appears in selector
      await waitFor(() => {
        expect(screen.getByText('New Account')).toBeInTheDocument();
      });
    });

    it('should handle account creation errors', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { createUserExchangeAccount } = require('@/services/userExchangeAccount.service');

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

      // Mock API error
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'EXCHANGE_NOT_FOUND',
          message: 'Exchange not found',
        }),
      });

      createUserExchangeAccount.mockRejectedValue(new Error('Exchange not found'));

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
      });

      // Fill form
      const accountNameInput = screen.getByPlaceholderText('Account Name');
      fireEvent.change(accountNameInput, { target: { value: 'New Account' } });

      const apiKeyInput = screen.getByPlaceholderText('API Key');
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });

      const secretInput = screen.getByPlaceholderText('Secret');
      fireEvent.change(secretInput, { target: { value: 'test-secret' } });

      // Submit form
      const createAccountButton = screen.getByTestId('create-account');
      fireEvent.click(createAccountButton);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText('Exchange not found')).toBeInTheDocument();
      });

      // Verify modal stays open
      expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
    });

    it('should validate plan limits before creating account', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { usePlanLimits } = require('@/hooks/usePlanLimits');
      const { planLimitsService } = require('@/services/planLimits.service');

      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            account_name: 'Existing Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
            is_verified: true,
          },
        ],
        getActiveAccount: jest.fn(() => ({
          id: 'account-1',
          account_name: 'Existing Account',
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

      // Mock plan limits - user at limit
      usePlanLimits.mockReturnValue({
        limits: {
          maxExchangeAccounts: 1, // User at limit
          maxAutomations: 25,
          maxIndicators: 50,
          maxSimulations: 30,
          maxBacktests: 15,
        },
        isLoading: false,
        error: null,
      });

      planLimitsService.validateLimit.mockResolvedValue({
        isValid: false,
        currentCount: 1,
        maxLimit: 1,
        limitType: 'EXCHANGE_ACCOUNTS',
        message: 'Account limit reached',
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

    it('should handle network errors during account creation', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');

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

      // Mock network error
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
      });

      // Fill form
      const accountNameInput = screen.getByPlaceholderText('Account Name');
      fireEvent.change(accountNameInput, { target: { value: 'New Account' } });

      const apiKeyInput = screen.getByPlaceholderText('API Key');
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });

      const secretInput = screen.getByPlaceholderText('Secret');
      fireEvent.change(secretInput, { target: { value: 'test-secret' } });

      // Submit form
      const createAccountButton = screen.getByTestId('create-account');
      fireEvent.click(createAccountButton);

      // Verify network error handling
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle validation errors during account creation', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');

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

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
      });

      // Try to submit form without filling required fields
      const createAccountButton = screen.getByTestId('create-account');
      fireEvent.click(createAccountButton);

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText('Account name is required')).toBeInTheDocument();
        expect(screen.getByText('API key is required')).toBeInTheDocument();
        expect(screen.getByText('Secret is required')).toBeInTheDocument();
      });
    });
  });

  describe('Account Creation with Different Exchanges', () => {
    it('should create account for LN Markets exchange', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { createUserExchangeAccount } = require('@/services/userExchangeAccount.service');

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

      createUserExchangeAccount.mockResolvedValue({
        id: 'new-account-123',
        account_name: 'LN Markets Account',
        exchange: { name: 'LN Markets', slug: 'lnmarkets' },
        is_active: true,
        is_verified: false,
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
      });

      // Select LN Markets exchange
      const exchangeSelect = screen.getByTestId('exchange-select');
      fireEvent.change(exchangeSelect, { target: { value: 'lnmarkets' } });

      // Fill form
      const accountNameInput = screen.getByPlaceholderText('Account Name');
      fireEvent.change(accountNameInput, { target: { value: 'LN Markets Account' } });

      const apiKeyInput = screen.getByPlaceholderText('API Key');
      fireEvent.change(apiKeyInput, { target: { value: 'lnmarkets-api-key' } });

      const secretInput = screen.getByPlaceholderText('Secret');
      fireEvent.change(secretInput, { target: { value: 'lnmarkets-secret' } });

      // Submit form
      const createAccountButton = screen.getByTestId('create-account');
      fireEvent.click(createAccountButton);

      // Verify account creation
      await waitFor(() => {
        expect(createUserExchangeAccount).toHaveBeenCalledWith({
          exchange_id: 'lnmarkets-exchange-id',
          account_name: 'LN Markets Account',
          credentials: {
            api_key: 'lnmarkets-api-key',
            secret: 'lnmarkets-secret',
          },
        });
      });
    });
  });

  describe('Account Creation Success Flow', () => {
    it('should complete successful account creation and set as active', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');

      const mockSetActiveAccount = jest.fn();
      const mockLoadAccounts = jest.fn();

      useUserExchangeAccounts.mockReturnValue({
        accounts: [],
        getActiveAccount: jest.fn(() => null),
        setActiveAccount: mockSetActiveAccount,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
        isLoading: false,
        error: null,
        loadAccounts: mockLoadAccounts,
      });

      useActiveAccount.mockReturnValue({
        activeAccountId: null,
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
            id: 'new-account-123',
            account_name: 'New Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
            is_verified: false,
            created_at: new Date().toISOString(),
          },
        }),
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Open create account modal
      const createButton = screen.getByText('Add Exchange Account');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
      });

      // Fill form
      const accountNameInput = screen.getByPlaceholderText('Account Name');
      fireEvent.change(accountNameInput, { target: { value: 'New Account' } });

      const apiKeyInput = screen.getByPlaceholderText('API Key');
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });

      const secretInput = screen.getByPlaceholderText('Secret');
      fireEvent.change(secretInput, { target: { value: 'test-secret' } });

      // Submit form
      const createAccountButton = screen.getByTestId('create-account');
      fireEvent.click(createAccountButton);

      // Verify success flow
      await waitFor(() => {
        expect(screen.getByText('Account created successfully')).toBeInTheDocument();
      });

      // Verify account is set as active
      await waitFor(() => {
        expect(mockSetActiveAccount).toHaveBeenCalledWith('new-account-123');
      });

      // Verify accounts are reloaded
      await waitFor(() => {
        expect(mockLoadAccounts).toHaveBeenCalled();
      });

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByTestId('create-account-modal')).not.toBeInTheDocument();
      });
    });
  });
});
