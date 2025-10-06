/**
 * useActiveAccount Hook Tests
 * 
 * Tests for useActiveAccount hook functionality
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { useActiveAccount, useActiveAccountInfo } from '../useActiveAccount';

// Mock indicatorPersistenceService
const mockIndicatorPersistenceService = {
  getActiveAccount: jest.fn(),
  setActiveAccount: jest.fn(),
  setAutomationDefaultAccount: jest.fn(),
  getAutomationDefaultAccount: jest.fn(),
  updateAutomationPreferences: jest.fn(),
  getAutomationPreferences: jest.fn(),
};

jest.mock('@/services/indicatorPersistence.service', () => ({
  indicatorPersistenceService: mockIndicatorPersistenceService,
}));

// Mock window events
const mockDispatchEvent = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true,
});

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

describe('useActiveAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIndicatorPersistenceService.getActiveAccount.mockReturnValue(null);
    mockIndicatorPersistenceService.setActiveAccount.mockReturnValue(true);
    mockIndicatorPersistenceService.setAutomationDefaultAccount.mockReturnValue(true);
    mockIndicatorPersistenceService.getAutomationDefaultAccount.mockReturnValue(null);
    mockIndicatorPersistenceService.updateAutomationPreferences.mockReturnValue(true);
    mockIndicatorPersistenceService.getAutomationPreferences.mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with null activeAccountId', () => {
      const { result } = renderHook(() => useActiveAccount());

      expect(result.current.activeAccountId).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should load active account from persistence service', () => {
      mockIndicatorPersistenceService.getActiveAccount.mockReturnValue('account-123');

      const { result } = renderHook(() => useActiveAccount());

      expect(mockIndicatorPersistenceService.getActiveAccount).toHaveBeenCalled();
    });
  });

  describe('setActiveAccount', () => {
    it('should set active account successfully', () => {
      const { result } = renderHook(() => useActiveAccount());

      act(() => {
        const success = result.current.setActiveAccount('account-123');
        expect(success).toBe(true);
      });

      expect(mockIndicatorPersistenceService.setActiveAccount).toHaveBeenCalledWith('account-123');
      expect(result.current.activeAccountId).toBe('account-123');
      expect(result.current.error).toBeNull();
    });

    it('should dispatch custom event when setting active account', () => {
      const { result } = renderHook(() => useActiveAccount());

      act(() => {
        result.current.setActiveAccount('account-123');
      });

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'activeAccountChanged',
          detail: { accountId: 'account-123' },
        })
      );
    });

    it('should handle setActiveAccount failure', () => {
      mockIndicatorPersistenceService.setActiveAccount.mockReturnValue(false);

      const { result } = renderHook(() => useActiveAccount());

      act(() => {
        const success = result.current.setActiveAccount('account-123');
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Failed to save active account');
    });

    it('should handle setActiveAccount exception', () => {
      mockIndicatorPersistenceService.setActiveAccount.mockImplementation(() => {
        throw new Error('Persistence error');
      });

      const { result } = renderHook(() => useActiveAccount());

      act(() => {
        const success = result.current.setActiveAccount('account-123');
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Persistence error');
    });
  });

  describe('clearActiveAccount', () => {
    it('should clear active account', () => {
      const { result } = renderHook(() => useActiveAccount());

      act(() => {
        const success = result.current.clearActiveAccount();
        expect(success).toBe(true);
      });

      expect(mockIndicatorPersistenceService.setActiveAccount).toHaveBeenCalledWith(null);
      expect(result.current.activeAccountId).toBe(null);
    });
  });

  describe('Automation Methods', () => {
    it('should set automation default account', () => {
      const { result } = renderHook(() => useActiveAccount());

      act(() => {
        const success = result.current.setAutomationDefaultAccount('account-123');
        expect(success).toBe(true);
      });

      expect(mockIndicatorPersistenceService.setAutomationDefaultAccount).toHaveBeenCalledWith('account-123');
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'automationAccountChanged',
          detail: { accountId: 'account-123' },
        })
      );
    });

    it('should get automation default account', () => {
      mockIndicatorPersistenceService.getAutomationDefaultAccount.mockReturnValue('account-123');

      const { result } = renderHook(() => useActiveAccount());

      act(() => {
        const accountId = result.current.getAutomationDefaultAccount();
        expect(accountId).toBe('account-123');
      });

      expect(mockIndicatorPersistenceService.getAutomationDefaultAccount).toHaveBeenCalled();
    });

    it('should update automation preferences', () => {
      const preferences = { autoStart: true, maxConcurrent: 5 };

      const { result } = renderHook(() => useActiveAccount());

      act(() => {
        const success = result.current.updateAutomationPreferences(preferences);
        expect(success).toBe(true);
      });

      expect(mockIndicatorPersistenceService.updateAutomationPreferences).toHaveBeenCalledWith(preferences);
    });

    it('should get automation preferences', () => {
      const preferences = { autoStart: true, maxConcurrent: 5 };
      mockIndicatorPersistenceService.getAutomationPreferences.mockReturnValue(preferences);

      const { result } = renderHook(() => useActiveAccount());

      act(() => {
        const result = result.current.getAutomationPreferences();
        expect(result).toEqual(preferences);
      });

      expect(mockIndicatorPersistenceService.getAutomationPreferences).toHaveBeenCalled();
    });
  });

  describe('Storage Event Handling', () => {
    it('should listen for storage changes', () => {
      renderHook(() => useActiveAccount());

      expect(mockAddEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('should handle storage change event', () => {
      const { result } = renderHook(() => useActiveAccount());

      // Simulate storage change
      const storageEvent = new StorageEvent('storage', {
        key: 'hub-defisats-indicator-configs',
        newValue: JSON.stringify({
          userPreferences: { activeAccountId: 'account-456' },
        }),
      });

      act(() => {
        const handler = mockAddEventListener.mock.calls.find(
          call => call[0] === 'storage'
        )?.[1];
        if (handler) handler(storageEvent);
      });

      expect(result.current.activeAccountId).toBe('account-456');
    });

    it('should handle custom event for active account change', () => {
      const { result } = renderHook(() => useActiveAccount());

      // Simulate custom event
      const customEvent = new CustomEvent('activeAccountChanged', {
        detail: { accountId: 'account-789' },
      });

      act(() => {
        const handler = mockAddEventListener.mock.calls.find(
          call => call[0] === 'activeAccountChanged'
        )?.[1];
        if (handler) handler(customEvent);
      });

      expect(result.current.activeAccountId).toBe('account-789');
    });

    it('should ignore storage changes for different keys', () => {
      const { result } = renderHook(() => useActiveAccount());

      const storageEvent = new StorageEvent('storage', {
        key: 'different-key',
        newValue: 'some-value',
      });

      act(() => {
        const handler = mockAddEventListener.mock.calls.find(
          call => call[0] === 'storage'
        )?.[1];
        if (handler) handler(storageEvent);
      });

      // Should not change the active account
      expect(result.current.activeAccountId).toBeNull();
    });

    it('should handle malformed storage data gracefully', () => {
      const { result } = renderHook(() => useActiveAccount());

      const storageEvent = new StorageEvent('storage', {
        key: 'hub-defisats-indicator-configs',
        newValue: 'invalid-json',
      });

      act(() => {
        const handler = mockAddEventListener.mock.calls.find(
          call => call[0] === 'storage'
        )?.[1];
        if (handler) handler(storageEvent);
      });

      // Should not crash and should not change the active account
      expect(result.current.activeAccountId).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useActiveAccount());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('activeAccountChanged', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('should handle persistence service errors during initialization', () => {
      mockIndicatorPersistenceService.getActiveAccount.mockImplementation(() => {
        throw new Error('Persistence error');
      });

      const { result } = renderHook(() => useActiveAccount());

      expect(result.current.error).toBe('Persistence error');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle automation method errors', () => {
      mockIndicatorPersistenceService.setAutomationDefaultAccount.mockImplementation(() => {
        throw new Error('Automation error');
      });

      const { result } = renderHook(() => useActiveAccount());

      act(() => {
        const success = result.current.setAutomationDefaultAccount('account-123');
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Automation error');
    });
  });
});

describe('useActiveAccountInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null accountInfo', () => {
    const { result } = renderHook(() => useActiveAccountInfo());

    expect(result.current.accountInfo).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should provide refresh function', () => {
    const { result } = renderHook(() => useActiveAccountInfo());

    expect(typeof result.current.refresh).toBe('function');

    act(() => {
      result.current.refresh();
    });

    // Should not crash
    expect(result.current.accountInfo).toBeNull();
  });
});
