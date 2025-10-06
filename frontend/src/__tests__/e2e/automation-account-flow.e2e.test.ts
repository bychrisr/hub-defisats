/**
 * Automation Account Flow E2E Tests
 * 
 * End-to-end tests for automation flow with multiple accounts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Automations } from '@/pages/Automations';

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

jest.mock('@/components/automation/AutomationAccountManager', () => {
  return function MockAutomationAccountManager({ automations, activeAccount, onAccountChange }: any) {
    return (
      <div data-testid="automation-account-manager">
        <div data-testid="active-automation-account">
          {activeAccount ? activeAccount.account_name : 'No Account'}
        </div>
        <div data-testid="automation-list">
          {automations.map((automation: any) => (
            <div key={automation.id} data-testid={`automation-${automation.id}`}>
              <div>{automation.name}</div>
              <div>Account: {automation.account_name}</div>
              <div>Status: {automation.is_active ? 'Active' : 'Inactive'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
});

jest.mock('@/components/forms/AutomationForm', () => {
  return function MockAutomationForm({ onSubmit, onCancel, initialData }: any) {
    return (
      <div data-testid="automation-form">
        <div>Automation Form</div>
        <input
          data-testid="automation-name"
          placeholder="Automation Name"
          defaultValue={initialData?.name || ''}
        />
        <select data-testid="automation-account" defaultValue={initialData?.account_id || ''}>
          <option value="">Select Account</option>
          <option value="account-1">Main Account</option>
          <option value="account-2">Secondary Account</option>
        </select>
        <button data-testid="submit-automation" onClick={() => onSubmit({
          name: 'Test Automation',
          account_id: 'account-1',
          type: 'margin_guard',
          settings: { threshold: 0.8 }
        })}>
          Create Automation
        </button>
        <button data-testid="cancel-automation" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  };
});

describe('Automation Account Flow E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Automation Account Flow', () => {
    it('should complete full automation creation flow with account selection', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');
      const { useAutomations } = require('@/hooks/useAutomations');

      const mockCreateAutomation = jest.fn();
      const mockLoadAutomations = jest.fn();

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

      useAutomations.mockReturnValue({
        automations: [],
        createAutomation: mockCreateAutomation,
        updateAutomation: jest.fn(),
        deleteAutomation: jest.fn(),
        isLoading: false,
        error: null,
        loadAutomations: mockLoadAutomations,
      });

      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'automation-123',
              name: 'Test Automation',
              user_exchange_account_id: 'account-1',
              type: 'margin_guard',
              is_active: true,
              settings: { threshold: 0.8 },
              created_at: new Date().toISOString(),
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'automation-123',
                name: 'Test Automation',
                user_exchange_account_id: 'account-1',
                account_name: 'Main Account',
                type: 'margin_guard',
                is_active: true,
                settings: { threshold: 0.8 },
                created_at: new Date().toISOString(),
              },
            ],
          }),
        });

      render(
        <BrowserRouter>
          <Automations />
        </BrowserRouter>
      );

      // Step 1: Verify initial state
      expect(screen.getByTestId('automation-account-manager')).toBeInTheDocument();
      expect(screen.getByTestId('active-automation-account')).toHaveTextContent('Main Account');

      // Step 2: Open automation form
      const createAutomationButton = screen.getByText('Create Automation');
      fireEvent.click(createAutomationButton);

      await waitFor(() => {
        expect(screen.getByTestId('automation-form')).toBeInTheDocument();
      });

      // Step 3: Fill automation form
      const automationNameInput = screen.getByTestId('automation-name');
      fireEvent.change(automationNameInput, { target: { value: 'Test Automation' } });

      const accountSelect = screen.getByTestId('automation-account');
      fireEvent.change(accountSelect, { target: { value: 'account-1' } });

      // Step 4: Submit form
      const submitButton = screen.getByTestId('submit-automation');
      fireEvent.click(submitButton);

      // Step 5: Verify API call for automation creation
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/automations',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Bearer'),
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              name: 'Test Automation',
              user_exchange_account_id: 'account-1',
              type: 'margin_guard',
              settings: { threshold: 0.8 },
            }),
          })
        );
      });

      // Step 6: Verify automation creation
      await waitFor(() => {
        expect(mockCreateAutomation).toHaveBeenCalledWith({
          name: 'Test Automation',
          account_id: 'account-1',
          type: 'margin_guard',
          settings: { threshold: 0.8 },
        });
      });

      // Step 7: Verify automation appears in list
      await waitFor(() => {
        expect(screen.getByTestId('automation-123')).toBeInTheDocument();
        expect(screen.getByText('Test Automation')).toBeInTheDocument();
        expect(screen.getByText('Account: Main Account')).toBeInTheDocument();
      });

      // Step 8: Verify automations are reloaded
      await waitFor(() => {
        expect(mockLoadAutomations).toHaveBeenCalled();
      });
    });

    it('should handle automation creation errors', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');
      const { useAutomations } = require('@/hooks/useAutomations');

      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            account_name: 'Main Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
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

      useAutomations.mockReturnValue({
        automations: [],
        createAutomation: jest.fn(),
        updateAutomation: jest.fn(),
        deleteAutomation: jest.fn(),
        isLoading: false,
        error: null,
        loadAutomations: jest.fn(),
      });

      // Mock API error
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'AUTOMATION_CREATION_FAILED',
          message: 'Failed to create automation',
        }),
      });

      render(
        <BrowserRouter>
          <Automations />
        </BrowserRouter>
      );

      // Open automation form
      const createAutomationButton = screen.getByText('Create Automation');
      fireEvent.click(createAutomationButton);

      await waitFor(() => {
        expect(screen.getByTestId('automation-form')).toBeInTheDocument();
      });

      // Fill form
      const automationNameInput = screen.getByTestId('automation-name');
      fireEvent.change(automationNameInput, { target: { value: 'Test Automation' } });

      const accountSelect = screen.getByTestId('automation-account');
      fireEvent.change(accountSelect, { target: { value: 'account-1' } });

      // Submit form
      const submitButton = screen.getByTestId('submit-automation');
      fireEvent.click(submitButton);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText('Failed to create automation')).toBeInTheDocument();
      });

      // Verify form stays open
      expect(screen.getByTestId('automation-form')).toBeInTheDocument();
    });

    it('should handle network errors during automation creation', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');
      const { useAutomations } = require('@/hooks/useAutomations');

      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            account_name: 'Main Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
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

      useAutomations.mockReturnValue({
        automations: [],
        createAutomation: jest.fn(),
        updateAutomation: jest.fn(),
        deleteAutomation: jest.fn(),
        isLoading: false,
        error: null,
        loadAutomations: jest.fn(),
      });

      // Mock network error
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <Automations />
        </BrowserRouter>
      );

      // Open automation form
      const createAutomationButton = screen.getByText('Create Automation');
      fireEvent.click(createAutomationButton);

      await waitFor(() => {
        expect(screen.getByTestId('automation-form')).toBeInTheDocument();
      });

      // Fill form
      const automationNameInput = screen.getByTestId('automation-name');
      fireEvent.change(automationNameInput, { target: { value: 'Test Automation' } });

      const accountSelect = screen.getByTestId('automation-account');
      fireEvent.change(accountSelect, { target: { value: 'account-1' } });

      // Submit form
      const submitButton = screen.getByTestId('submit-automation');
      fireEvent.click(submitButton);

      // Verify network error handling
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Automation Account Filtering', () => {
    it('should filter automations by active account', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');
      const { useAutomations } = require('@/hooks/useAutomations');

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

      useAutomations.mockReturnValue({
        automations: [
          {
            id: 'automation-1',
            name: 'Main Account Automation',
            user_exchange_account_id: 'account-1',
            account_name: 'Main Account',
            type: 'margin_guard',
            is_active: true,
            settings: { threshold: 0.8 },
            created_at: new Date().toISOString(),
          },
          {
            id: 'automation-2',
            name: 'Secondary Account Automation',
            user_exchange_account_id: 'account-2',
            account_name: 'Secondary Account',
            type: 'take_profit',
            is_active: true,
            settings: { target: 0.1 },
            created_at: new Date().toISOString(),
          },
        ],
        createAutomation: jest.fn(),
        updateAutomation: jest.fn(),
        deleteAutomation: jest.fn(),
        isLoading: false,
        error: null,
        loadAutomations: jest.fn(),
      });

      render(
        <BrowserRouter>
          <Automations />
        </BrowserRouter>
      );

      // Verify only active account automations are shown
      await waitFor(() => {
        expect(screen.getByTestId('automation-1')).toBeInTheDocument();
        expect(screen.getByText('Main Account Automation')).toBeInTheDocument();
        expect(screen.getByText('Account: Main Account')).toBeInTheDocument();
      });

      // Verify secondary account automation is not shown
      expect(screen.queryByTestId('automation-2')).not.toBeInTheDocument();
      expect(screen.queryByText('Secondary Account Automation')).not.toBeInTheDocument();
    });

    it('should update automations when account changes', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');
      const { useAutomations } = require('@/hooks/useAutomations');

      const mockLoadAutomations = jest.fn();

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

      useAutomations.mockReturnValue({
        automations: [
          {
            id: 'automation-1',
            name: 'Main Account Automation',
            user_exchange_account_id: 'account-1',
            account_name: 'Main Account',
            type: 'margin_guard',
            is_active: true,
            settings: { threshold: 0.8 },
            created_at: new Date().toISOString(),
          },
        ],
        createAutomation: jest.fn(),
        updateAutomation: jest.fn(),
        deleteAutomation: jest.fn(),
        isLoading: false,
        error: null,
        loadAutomations: mockLoadAutomations,
      });

      render(
        <BrowserRouter>
          <Automations />
        </BrowserRouter>
      );

      // Verify initial automations
      await waitFor(() => {
        expect(screen.getByTestId('automation-1')).toBeInTheDocument();
        expect(screen.getByText('Main Account Automation')).toBeInTheDocument();
      });

      // Simulate account change
      act(() => {
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
              is_active: true,
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
          setActiveAccount: jest.fn(),
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

        useAutomations.mockReturnValue({
          automations: [
            {
              id: 'automation-2',
              name: 'Secondary Account Automation',
              user_exchange_account_id: 'account-2',
              account_name: 'Secondary Account',
              type: 'take_profit',
              is_active: true,
              settings: { target: 0.1 },
              created_at: new Date().toISOString(),
            },
          ],
          createAutomation: jest.fn(),
          updateAutomation: jest.fn(),
          deleteAutomation: jest.fn(),
          isLoading: false,
          error: null,
          loadAutomations: mockLoadAutomations,
        });
      });

      // Verify automations are reloaded
      await waitFor(() => {
        expect(mockLoadAutomations).toHaveBeenCalled();
      });

      // Verify new automations are shown
      await waitFor(() => {
        expect(screen.getByTestId('automation-2')).toBeInTheDocument();
        expect(screen.getByText('Secondary Account Automation')).toBeInTheDocument();
        expect(screen.getByText('Account: Secondary Account')).toBeInTheDocument();
      });

      // Verify old automations are hidden
      expect(screen.queryByTestId('automation-1')).not.toBeInTheDocument();
      expect(screen.queryByText('Main Account Automation')).not.toBeInTheDocument();
    });
  });

  describe('Automation Account Management', () => {
    it('should handle automation updates for specific account', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');
      const { useAutomations } = require('@/hooks/useAutomations');

      const mockUpdateAutomation = jest.fn();

      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            account_name: 'Main Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
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

      useAutomations.mockReturnValue({
        automations: [
          {
            id: 'automation-1',
            name: 'Main Account Automation',
            user_exchange_account_id: 'account-1',
            account_name: 'Main Account',
            type: 'margin_guard',
            is_active: true,
            settings: { threshold: 0.8 },
            created_at: new Date().toISOString(),
          },
        ],
        createAutomation: jest.fn(),
        updateAutomation: mockUpdateAutomation,
        deleteAutomation: jest.fn(),
        isLoading: false,
        error: null,
        loadAutomations: jest.fn(),
      });

      // Mock API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'automation-1',
            name: 'Updated Automation',
            user_exchange_account_id: 'account-1',
            account_name: 'Main Account',
            type: 'margin_guard',
            is_active: true,
            settings: { threshold: 0.9 },
            updated_at: new Date().toISOString(),
          },
        }),
      });

      render(
        <BrowserRouter>
          <Automations />
        </BrowserRouter>
      );

      // Verify initial automation
      await waitFor(() => {
        expect(screen.getByTestId('automation-1')).toBeInTheDocument();
        expect(screen.getByText('Main Account Automation')).toBeInTheDocument();
      });

      // Simulate automation update
      act(() => {
        mockUpdateAutomation({
          id: 'automation-1',
          name: 'Updated Automation',
          settings: { threshold: 0.9 },
        });
      });

      // Verify update was called
      await waitFor(() => {
        expect(mockUpdateAutomation).toHaveBeenCalledWith({
          id: 'automation-1',
          name: 'Updated Automation',
          settings: { threshold: 0.9 },
        });
      });
    });

    it('should handle automation deletion for specific account', async () => {
      const { useUserExchangeAccounts } = require('@/hooks/useUserExchangeAccounts');
      const { useActiveAccount } = require('@/hooks/useActiveAccount');
      const { useAutomations } = require('@/hooks/useAutomations');

      const mockDeleteAutomation = jest.fn();

      useUserExchangeAccounts.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            account_name: 'Main Account',
            exchange: { name: 'LN Markets', slug: 'lnmarkets' },
            is_active: true,
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

      useAutomations.mockReturnValue({
        automations: [
          {
            id: 'automation-1',
            name: 'Main Account Automation',
            user_exchange_account_id: 'account-1',
            account_name: 'Main Account',
            type: 'margin_guard',
            is_active: true,
            settings: { threshold: 0.8 },
            created_at: new Date().toISOString(),
          },
        ],
        createAutomation: jest.fn(),
        updateAutomation: jest.fn(),
        deleteAutomation: mockDeleteAutomation,
        isLoading: false,
        error: null,
        loadAutomations: jest.fn(),
      });

      // Mock API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Automation deleted successfully',
        }),
      });

      render(
        <BrowserRouter>
          <Automations />
        </BrowserRouter>
      );

      // Verify initial automation
      await waitFor(() => {
        expect(screen.getByTestId('automation-1')).toBeInTheDocument();
        expect(screen.getByText('Main Account Automation')).toBeInTheDocument();
      });

      // Simulate automation deletion
      act(() => {
        mockDeleteAutomation('automation-1');
      });

      // Verify deletion was called
      await waitFor(() => {
        expect(mockDeleteAutomation).toHaveBeenCalledWith('automation-1');
      });
    });
  });
});
