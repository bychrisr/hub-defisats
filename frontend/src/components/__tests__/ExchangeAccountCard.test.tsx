/**
 * ExchangeAccountCard Tests
 * 
 * Component tests for ExchangeAccountCard
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExchangeAccountCard } from '../account/ExchangeAccountCard';
import { UserExchangeAccount } from '@/services/userExchangeAccount.service';

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={className} {...props}>{children}</h3>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} {...props}>{children}</span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick, ...props }: any) => (
    <button className={className} onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <div className={className} onClick={onClick}>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MoreVertical: () => <span data-testid="more-vertical-icon" />,
  Check: () => <span data-testid="check-icon" />,
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
}));

describe('ExchangeAccountCard', () => {
  const mockAccount: UserExchangeAccount = {
    id: 'account-123',
    user_id: 'user-123',
    exchange_id: 'exchange-123',
    account_name: 'Test Account',
    credentials: {
      api_key: 'test_key',
      secret: 'test_secret',
    },
    is_active: false,
    is_verified: true,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    last_test: '2023-01-01T00:00:00.000Z',
    exchange: {
      id: 'exchange-123',
      name: 'LN Markets',
      slug: 'lnmarkets',
      is_active: true,
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    },
  };

  const mockCallbacks = {
    onSetActive: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onTest: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render account information correctly', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('Test Account')).toBeInTheDocument();
      expect(screen.getByText('LN Markets')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument(); // First letter of exchange name
    });

    it('should show verified status badge for verified account', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('should show not verified status badge for unverified account', () => {
      const unverifiedAccount = {
        ...mockAccount,
        is_verified: false,
        last_test: null,
      };

      render(
        <ExchangeAccountCard
          account={unverifiedAccount}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('Not Verified')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should show recent test status badge for recently tested account', () => {
      const recentTestAccount = {
        ...mockAccount,
        is_verified: false,
        last_test: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      };

      render(
        <ExchangeAccountCard
          account={recentTestAccount}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('Recent Test')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('should show active status when isActive is true', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          isActive={true}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('This is your active account')).toBeInTheDocument();
    });

    it('should show inactive status when isActive is false', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          isActive={false}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format created date correctly', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('1/1/2023')).toBeInTheDocument(); // Default US format
    });

    it('should format last test date correctly', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    });
  });

  describe('Dropdown Menu', () => {
    it('should show set active option for inactive account', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          isActive={false}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('Set as Active')).toBeInTheDocument();
    });

    it('should not show set active option for active account', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          isActive={true}
          {...mockCallbacks}
        />
      );

      expect(screen.queryByText('Set as Active')).not.toBeInTheDocument();
    });

    it('should show edit option when onEdit is provided', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          onEdit={mockCallbacks.onEdit}
        />
      );

      expect(screen.getByText('Edit Account')).toBeInTheDocument();
    });

    it('should show test option when onTest is provided', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          onTest={mockCallbacks.onTest}
        />
      );

      expect(screen.getByText('Test Credentials')).toBeInTheDocument();
    });

    it('should show delete option when onDelete is provided', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          onDelete={mockCallbacks.onDelete}
        />
      );

      expect(screen.getByText('Delete Account')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should call onSetActive when set active is clicked', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          isActive={false}
          onSetActive={mockCallbacks.onSetActive}
        />
      );

      fireEvent.click(screen.getByText('Set as Active'));
      expect(mockCallbacks.onSetActive).toHaveBeenCalledWith('account-123');
    });

    it('should call onEdit when edit is clicked', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          onEdit={mockCallbacks.onEdit}
        />
      );

      fireEvent.click(screen.getByText('Edit Account'));
      expect(mockCallbacks.onEdit).toHaveBeenCalledWith(mockAccount);
    });

    it('should call onDelete when delete is clicked', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          onDelete={mockCallbacks.onDelete}
        />
      );

      fireEvent.click(screen.getByText('Delete Account'));
      expect(mockCallbacks.onDelete).toHaveBeenCalledWith('account-123');
    });

    it('should call onTest when test is clicked', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          onTest={mockCallbacks.onTest}
        />
      );

      fireEvent.click(screen.getByText('Test Credentials'));
      expect(mockCallbacks.onTest).toHaveBeenCalledWith('account-123');
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ExchangeAccountCard
          account={mockAccount}
          className="custom-class"
          {...mockCallbacks}
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should apply active styling when isActive is true', () => {
      const { container } = render(
        <ExchangeAccountCard
          account={mockAccount}
          isActive={true}
          {...mockCallbacks}
        />
      );

      expect(container.firstChild).toHaveClass('ring-2', 'ring-primary', 'ring-opacity-50', 'bg-primary/5');
    });

    it('should not apply active styling when isActive is false', () => {
      const { container } = render(
        <ExchangeAccountCard
          account={mockAccount}
          isActive={false}
          {...mockCallbacks}
        />
      );

      expect(container.firstChild).not.toHaveClass('ring-2', 'ring-primary', 'ring-opacity-50', 'bg-primary/5');
    });
  });

  describe('Edge Cases', () => {
    it('should handle account without last_test', () => {
      const accountWithoutTest = {
        ...mockAccount,
        last_test: null,
      };

      render(
        <ExchangeAccountCard
          account={accountWithoutTest}
          {...mockCallbacks}
        />
      );

      expect(screen.queryByText('Last Test:')).not.toBeInTheDocument();
    });

    it('should handle account with old test date', () => {
      const accountWithOldTest = {
        ...mockAccount,
        is_verified: false,
        last_test: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      };

      render(
        <ExchangeAccountCard
          account={accountWithOldTest}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('Not Verified')).toBeInTheDocument();
    });

    it('should handle missing callbacks gracefully', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
        />
      );

      // Should not crash and should not show dropdown options
      expect(screen.queryByText('Set as Active')).not.toBeInTheDocument();
      expect(screen.queryByText('Edit Account')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Credentials')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          {...mockCallbacks}
        />
      );

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(
        <ExchangeAccountCard
          account={mockAccount}
          {...mockCallbacks}
        />
      );

      const moreButton = screen.getByRole('button');
      expect(moreButton).toBeInTheDocument();
    });
  });
});
