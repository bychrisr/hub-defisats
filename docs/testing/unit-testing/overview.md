---
title: Unit Testing Overview
category: testing
subcategory: unit-testing
tags: [unit-tests, testing-strategy, jest, test-coverage, quality-assurance]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team", "Frontend Team"]
---

# Unit Testing Overview

## Summary

Comprehensive unit testing strategy and implementation for the Axisor platform. This document covers the testing framework setup, testing patterns, coverage requirements, and best practices for writing effective unit tests across both backend and frontend components.

## Unit Testing Architecture

```mermaid
graph TB
    A[Unit Testing Framework] --> B[Backend Tests]
    A --> C[Frontend Tests]
    A --> D[Test Infrastructure]
    A --> E[Quality Assurance]
    
    B --> F[Service Tests]
    B --> G[Controller Tests]
    B --> H[Utility Tests]
    B --> I[Validation Tests]
    
    C --> J[Component Tests]
    C --> K[Hook Tests]
    C --> L[Service Tests]
    C --> M[Utility Tests]
    
    D --> N[Jest Configuration]
    D --> O[Test Setup]
    D --> P[Mocking Strategy]
    D --> Q[Coverage Reports]
    
    E --> R[Test Coverage]
    E --> S[Code Quality]
    E --> T[Performance Tests]
    E --> U[Regression Prevention]
```

## Testing Framework Setup

### Backend Testing Configuration

```typescript
// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/tests/**',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000,
  verbose: true
};
```

### Frontend Testing Configuration

```typescript
// frontend/jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.tsx',
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).tsx',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/__tests__/**',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000,
  verbose: true
};
```

## Backend Unit Testing

### Service Layer Testing

```typescript
// backend/src/services/__tests__/userExchangeAccount.service.test.ts
import { PrismaClient } from '@prisma/client';
import { UserExchangeAccountService } from '../userExchangeAccount.service';
import { mockPrismaClient } from '../../tests/mocks/prisma.mock';

describe('UserExchangeAccountService', () => {
  let service: UserExchangeAccountService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = mockPrismaClient();
    service = new UserExchangeAccountService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExchangeAccount', () => {
    it('should create a new exchange account successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const exchangeData = {
        exchange: 'LNMarkets',
        api_key: 'test-api-key',
        api_secret: 'test-api-secret',
        is_active: true
      };

      const mockAccount = {
        id: 'account-123',
        user_id: userId,
        ...exchangeData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrisma.userExchangeAccount.create.mockResolvedValue(mockAccount);

      // Act
      const result = await service.createExchangeAccount(userId, exchangeData);

      // Assert
      expect(result).toEqual(mockAccount);
      expect(mockPrisma.userExchangeAccount.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          exchange: exchangeData.exchange,
          api_key: expect.any(String), // Should be encrypted
          api_secret: expect.any(String), // Should be encrypted
          is_active: exchangeData.is_active
        }
      });
    });

    it('should throw error when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const exchangeData = {
        exchange: 'LNMarkets',
        api_key: 'test-api-key',
        api_secret: 'test-api-secret',
        is_active: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createExchangeAccount(userId, exchangeData)
      ).rejects.toThrow('User not found');
    });

    it('should deactivate existing accounts when creating new active account', async () => {
      // Arrange
      const userId = 'user-123';
      const exchangeData = {
        exchange: 'LNMarkets',
        api_key: 'new-api-key',
        api_secret: 'new-api-secret',
        is_active: true
      };

      const existingAccount = {
        id: 'existing-account-123',
        user_id: userId,
        exchange: 'LNMarkets',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrisma.userExchangeAccount.findMany.mockResolvedValue([existingAccount]);
      mockPrisma.userExchangeAccount.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.userExchangeAccount.create.mockResolvedValue({
        id: 'new-account-123',
        user_id: userId,
        ...exchangeData,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Act
      await service.createExchangeAccount(userId, exchangeData);

      // Assert
      expect(mockPrisma.userExchangeAccount.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          exchange: exchangeData.exchange
        },
        data: {
          is_active: false
        }
      });
    });
  });

  describe('getUserExchangeAccounts', () => {
    it('should return all exchange accounts for a user', async () => {
      // Arrange
      const userId = 'user-123';
      const mockAccounts = [
        {
          id: 'account-1',
          user_id: userId,
          exchange: 'LNMarkets',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'account-2',
          user_id: userId,
          exchange: 'LNMarkets',
          is_active: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockPrisma.userExchangeAccount.findMany.mockResolvedValue(mockAccounts);

      // Act
      const result = await service.getUserExchangeAccounts(userId);

      // Assert
      expect(result).toEqual(mockAccounts);
      expect(mockPrisma.userExchangeAccount.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      });
    });

    it('should return empty array when user has no accounts', async () => {
      // Arrange
      const userId = 'user-with-no-accounts';
      mockPrisma.userExchangeAccount.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getUserExchangeAccounts(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('testExchangeCredentials', () => {
    it('should successfully test valid credentials', async () => {
      // Arrange
      const credentials = {
        api_key: 'valid-api-key',
        api_secret: 'valid-api-secret'
      };

      const mockLNMarketsService = {
        testCredentials: jest.fn().mockResolvedValue({
          success: true,
          user_info: {
            id: 'user-123',
            username: 'testuser'
          }
        })
      };

      jest.spyOn(service, 'getLNMarketsService').mockReturnValue(mockLNMarketsService);

      // Act
      const result = await service.testExchangeCredentials('LNMarkets', credentials);

      // Assert
      expect(result).toEqual({
        success: true,
        user_info: {
          id: 'user-123',
          username: 'testuser'
        }
      });
    });

    it('should fail when credentials are invalid', async () => {
      // Arrange
      const credentials = {
        api_key: 'invalid-api-key',
        api_secret: 'invalid-api-secret'
      };

      const mockLNMarketsService = {
        testCredentials: jest.fn().mockResolvedValue({
          success: false,
          error: 'Invalid credentials'
        })
      };

      jest.spyOn(service, 'getLNMarketsService').mockReturnValue(mockLNMarketsService);

      // Act
      const result = await service.testExchangeCredentials('LNMarkets', credentials);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid credentials'
      });
    });
  });
});
```

### Controller Testing

```typescript
// backend/src/tests/unit/admin/dashboard.controller.test.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminController } from '../../../controllers/admin.controller';
import { PrismaClient } from '@prisma/client';
import { mockPrismaClient } from '../../mocks/prisma.mock';

describe('AdminController', () => {
  let controller: AdminController;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockPrisma = mockPrismaClient();
    controller = new AdminController(mockPrisma);
    
    mockRequest = {
      user: { id: 'admin-123', role: 'admin' }
    };
    
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('getAdvancedDashboard', () => {
    it('should return dashboard metrics successfully', async () => {
      // Arrange
      const mockMetrics = {
        users: {
          total_users: 1000,
          new_users_today: 10,
          active_users: 800
        },
        revenue: {
          total_revenue: 50000,
          monthly_recurring_revenue: 15000
        },
        system: {
          uptime: 99.9,
          response_time: 150
        }
      };

      jest.spyOn(controller, 'getDashboardMetrics').mockResolvedValue(mockMetrics);

      // Act
      await controller.getAdvancedDashboard(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockMetrics
      });
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      jest.spyOn(controller, 'getDashboardMetrics').mockRejectedValue(error);

      // Act
      await controller.getAdvancedDashboard(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });
});
```

## Frontend Unit Testing

### Component Testing

```typescript
// frontend/src/components/__tests__/ExchangeAccountCard.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExchangeAccountCard } from '../ExchangeAccountCard';
import { useUserExchangeAccounts } from '../../hooks/useUserExchangeAccounts';
import { useAuthStore } from '../../stores/authStore';

// Mock hooks
jest.mock('../../hooks/useUserExchangeAccounts');
jest.mock('../../stores/authStore');

const mockUseUserExchangeAccounts = useUserExchangeAccounts as jest.MockedFunction<typeof useUserExchangeAccounts>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('ExchangeAccountCard', () => {
  const mockAccount = {
    id: 'account-123',
    exchange: 'LNMarkets',
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    plan_type: 'Pro'
  };

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true
    });

    mockUseUserExchangeAccounts.mockReturnValue({
      accounts: [mockAccount],
      loading: false,
      error: null,
      createAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
      testCredentials: jest.fn()
    });
  });

  it('should render account information correctly', () => {
    // Act
    render(<ExchangeAccountCard account={mockAccount} />);

    // Assert
    expect(screen.getByText('LNMarkets')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Created: Jan 1, 2024')).toBeInTheDocument();
  });

  it('should show edit button when user has edit permissions', () => {
    // Act
    render(<ExchangeAccountCard account={mockAccount} />);

    // Assert
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('should call updateAccount when edit button is clicked', async () => {
    // Arrange
    const mockUpdateAccount = jest.fn();
    mockUseUserExchangeAccounts.mockReturnValue({
      accounts: [mockAccount],
      loading: false,
      error: null,
      createAccount: jest.fn(),
      updateAccount: mockUpdateAccount,
      deleteAccount: jest.fn(),
      testCredentials: jest.fn()
    });

    // Act
    render(<ExchangeAccountCard account={mockAccount} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Assert
    await waitFor(() => {
      expect(mockUpdateAccount).toHaveBeenCalled();
    });
  });

  it('should show loading state when account is being updated', () => {
    // Arrange
    mockUseUserExchangeAccounts.mockReturnValue({
      accounts: [mockAccount],
      loading: true,
      error: null,
      createAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
      testCredentials: jest.fn()
    });

    // Act
    render(<ExchangeAccountCard account={mockAccount} />);

    // Assert
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    // Arrange
    const errorMessage = 'Failed to load account';
    mockUseUserExchangeAccounts.mockReturnValue({
      accounts: [mockAccount],
      loading: false,
      error: errorMessage,
      createAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
      testCredentials: jest.fn()
    });

    // Act
    render(<ExchangeAccountCard account={mockAccount} />);

    // Assert
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
// frontend/src/hooks/__tests__/useActiveAccount.test.ts
import { renderHook, act } from '@testing-library/react';
import { useActiveAccount } from '../useActiveAccount';
import { useUserExchangeAccounts } from '../useUserExchangeAccounts';

// Mock dependencies
jest.mock('../useUserExchangeAccounts');

const mockUseUserExchangeAccounts = useUserExchangeAccounts as jest.MockedFunction<typeof useUserExchangeAccounts>;

describe('useActiveAccount', () => {
  const mockAccounts = [
    {
      id: 'account-1',
      exchange: 'LNMarkets',
      is_active: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'account-2',
      exchange: 'LNMarkets',
      is_active: false,
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02')
    }
  ];

  beforeEach(() => {
    mockUseUserExchangeAccounts.mockReturnValue({
      accounts: mockAccounts,
      loading: false,
      error: null,
      createAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
      testCredentials: jest.fn()
    });
  });

  it('should return the active account', () => {
    // Act
    const { result } = renderHook(() => useActiveAccount());

    // Assert
    expect(result.current.activeAccount).toEqual(mockAccounts[0]);
    expect(result.current.hasActiveAccount).toBe(true);
  });

  it('should return null when no active account exists', () => {
    // Arrange
    const inactiveAccounts = mockAccounts.map(account => ({ ...account, is_active: false }));
    mockUseUserExchangeAccounts.mockReturnValue({
      accounts: inactiveAccounts,
      loading: false,
      error: null,
      createAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
      testCredentials: jest.fn()
    });

    // Act
    const { result } = renderHook(() => useActiveAccount());

    // Assert
    expect(result.current.activeAccount).toBeNull();
    expect(result.current.hasActiveAccount).toBe(false);
  });

  it('should switch to a different account', async () => {
    // Arrange
    const mockUpdateAccount = jest.fn();
    mockUseUserExchangeAccounts.mockReturnValue({
      accounts: mockAccounts,
      loading: false,
      error: null,
      createAccount: jest.fn(),
      updateAccount: mockUpdateAccount,
      deleteAccount: jest.fn(),
      testCredentials: jest.fn()
    });

    // Act
    const { result } = renderHook(() => useActiveAccount());
    
    await act(async () => {
      await result.current.switchToAccount('account-2');
    });

    // Assert
    expect(mockUpdateAccount).toHaveBeenCalledWith('account-2', { is_active: true });
  });
});
```

## Test Utilities and Mocks

### Prisma Mock

```typescript
// backend/src/tests/mocks/prisma.mock.ts
import { PrismaClient } from '@prisma/client';

export const mockPrismaClient = (): jest.Mocked<PrismaClient> => {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    userExchangeAccount: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    automation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $disconnect: jest.fn()
  } as any;
};
```

### Test Setup

```typescript
// backend/src/tests/setup.ts
import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/axisor_test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.ENCRYPTION_KEY = 'test-encryption-key';
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
});

afterAll(() => {
  // Global cleanup
});
```

## Responsibilities

### Test Coverage

- **Service Layer**: Test all business logic and data operations
- **Controller Layer**: Test API endpoints and request handling
- **Utility Functions**: Test helper functions and utilities
- **Validation Logic**: Test input validation and error handling

### Quality Assurance

- **Code Coverage**: Maintain minimum 60% coverage across all modules
- **Test Quality**: Write meaningful tests that catch real bugs
- **Performance**: Ensure tests run quickly and efficiently
- **Maintainability**: Keep tests readable and maintainable

## Critical Points

### Test Isolation

- **Independent Tests**: Each test should be independent and isolated
- **Mock Dependencies**: Mock external dependencies and services
- **Clean State**: Reset state between tests
- **No Side Effects**: Tests should not affect each other

### Test Reliability

- **Deterministic**: Tests should produce consistent results
- **Fast Execution**: Unit tests should run quickly
- **Clear Assertions**: Tests should have clear, specific assertions
- **Error Handling**: Test both success and failure scenarios

## Evaluation Checklist

- [ ] Unit tests cover all critical business logic
- [ ] Test coverage meets minimum requirements (60%)
- [ ] Tests are isolated and independent
- [ ] Mocks are properly configured for external dependencies
- [ ] Error scenarios are tested
- [ ] Tests run quickly and reliably
- [ ] Test setup and teardown are properly configured
- [ ] Tests are readable and maintainable
- [ ] CI/CD pipeline runs tests automatically
- [ ] Test reports provide clear feedback

## How to Use This Document

- **For Writing Tests**: Use the examples to understand testing patterns
- **For Test Configuration**: Use the configuration sections to set up testing frameworks
- **For Mocking**: Use the mock examples to create test doubles
- **For Quality Assurance**: Use the checklist to ensure test quality
