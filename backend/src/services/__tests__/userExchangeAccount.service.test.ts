/**
 * UserExchangeAccountService Tests
 * 
 * Unit tests for UserExchangeAccountService implementation
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { UserExchangeAccountService, CreateUserExchangeAccountData, UpdateUserExchangeAccountData } from '../userExchangeAccount.service';
import { PrismaClient, UserExchangeAccounts, Exchange } from '@prisma/client';

// Mock PrismaClient
const mockPrisma = {
  userExchangeAccounts: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  exchange: {
    findUnique: jest.fn(),
  },
  automation: {
    count: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock AuthService
jest.mock('../auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    encryptData: jest.fn((data: string) => `encrypted_${data}`),
    decryptData: jest.fn((data: string) => data.replace('encrypted_', '')),
  })),
}));

describe('UserExchangeAccountService', () => {
  let service: UserExchangeAccountService;
  const mockUserId = 'user-123';
  const mockAccountId = 'account-123';
  const mockExchangeId = 'exchange-123';

  beforeEach(() => {
    service = new UserExchangeAccountService(mockPrisma);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserExchangeAccounts', () => {
    it('should return user exchange accounts with decrypted credentials', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          user_id: mockUserId,
          exchange_id: mockExchangeId,
          account_name: 'Test Account 1',
          credentials: { api_key: 'encrypted_key1', secret: 'encrypted_secret1' },
          is_active: true,
          is_verified: true,
          created_at: new Date(),
          updated_at: new Date(),
          last_test: null,
          exchange: {
            id: mockExchangeId,
            name: 'LN Markets',
            slug: 'lnmarkets',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          } as Exchange,
        },
      ];

      mockPrisma.userExchangeAccounts.findMany.mockResolvedValue(mockAccounts);

      const result = await service.getUserExchangeAccounts(mockUserId);

      expect(mockPrisma.userExchangeAccounts.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        include: { exchange: true },
        orderBy: { created_at: 'desc' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].credentials).toEqual({
        api_key: 'key1',
        secret: 'secret1',
      });
    });

    it('should return empty array when no accounts found', async () => {
      mockPrisma.userExchangeAccounts.findMany.mockResolvedValue([]);

      const result = await service.getUserExchangeAccounts(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserExchangeAccount', () => {
    it('should return specific account with decrypted credentials', async () => {
      const mockAccount = {
        id: mockAccountId,
        user_id: mockUserId,
        exchange_id: mockExchangeId,
        account_name: 'Test Account',
        credentials: { api_key: 'encrypted_key', secret: 'encrypted_secret' },
        is_active: true,
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_test: null,
        exchange: {
          id: mockExchangeId,
          name: 'LN Markets',
          slug: 'lnmarkets',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        } as Exchange,
      };

      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(mockAccount);

      const result = await service.getUserExchangeAccount(mockUserId, mockAccountId);

      expect(mockPrisma.userExchangeAccounts.findFirst).toHaveBeenCalledWith({
        where: { id: mockAccountId, user_id: mockUserId },
        include: { exchange: true },
      });

      expect(result).toBeDefined();
      expect(result?.credentials).toEqual({
        api_key: 'key',
        secret: 'secret',
      });
    });

    it('should return null when account not found', async () => {
      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(null);

      const result = await service.getUserExchangeAccount(mockUserId, mockAccountId);

      expect(result).toBeNull();
    });
  });

  describe('createUserExchangeAccount', () => {
    const mockCreateData: CreateUserExchangeAccountData = {
      exchange_id: mockExchangeId,
      account_name: 'New Account',
      credentials: { api_key: 'test_key', secret: 'test_secret' },
    };

    it('should create new account successfully', async () => {
      const mockExchange = {
        id: mockExchangeId,
        name: 'LN Markets',
        slug: 'lnmarkets',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockCreatedAccount = {
        id: mockAccountId,
        user_id: mockUserId,
        exchange_id: mockExchangeId,
        account_name: 'New Account',
        credentials: { api_key: 'encrypted_test_key', secret: 'encrypted_test_secret' },
        is_active: true,
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_test: null,
        exchange: mockExchange,
      };

      mockPrisma.exchange.findUnique.mockResolvedValue(mockExchange);
      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(null); // No existing account
      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValueOnce(null); // No active account
      mockPrisma.userExchangeAccounts.create.mockResolvedValue(mockCreatedAccount);
      mockPrisma.userExchangeAccounts.count.mockResolvedValue(1); // Only one active account

      const result = await service.createUserExchangeAccount(mockUserId, mockCreateData);

      expect(mockPrisma.exchange.findUnique).toHaveBeenCalledWith({
        where: { id: mockExchangeId },
      });
      expect(mockPrisma.userExchangeAccounts.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUserId,
          exchange_id: mockExchangeId,
          account_name: 'New Account',
          credentials: { api_key: 'encrypted_test_key', secret: 'encrypted_test_secret' },
          is_active: true,
          is_verified: false,
        },
        include: { exchange: true },
      });

      expect(result).toBeDefined();
      expect(result.account_name).toBe('New Account');
    });

    it('should throw error when exchange not found', async () => {
      mockPrisma.exchange.findUnique.mockResolvedValue(null);

      await expect(
        service.createUserExchangeAccount(mockUserId, mockCreateData)
      ).rejects.toThrow('Exchange not found');
    });

    it('should throw error when account with same name exists', async () => {
      const mockExchange = {
        id: mockExchangeId,
        name: 'LN Markets',
        slug: 'lnmarkets',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const existingAccount = {
        id: 'existing-account',
        user_id: mockUserId,
        exchange_id: mockExchangeId,
        account_name: 'New Account',
        credentials: {},
        is_active: false,
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_test: null,
      };

      mockPrisma.exchange.findUnique.mockResolvedValue(mockExchange);
      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(existingAccount);

      await expect(
        service.createUserExchangeAccount(mockUserId, mockCreateData)
      ).rejects.toThrow('User already has an account with this name for this exchange');
    });
  });

  describe('updateUserExchangeAccount', () => {
    const mockUpdateData: UpdateUserExchangeAccountData = {
      account_name: 'Updated Account',
      credentials: { api_key: 'new_key', secret: 'new_secret' },
      is_active: true,
    };

    it('should update account successfully', async () => {
      const existingAccount = {
        id: mockAccountId,
        user_id: mockUserId,
        exchange_id: mockExchangeId,
        account_name: 'Old Account',
        credentials: { api_key: 'old_key', secret: 'old_secret' },
        is_active: false,
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_test: null,
      };

      const updatedAccount = {
        ...existingAccount,
        account_name: 'Updated Account',
        credentials: { api_key: 'encrypted_new_key', secret: 'encrypted_new_secret' },
        is_active: true,
        exchange: {
          id: mockExchangeId,
          name: 'LN Markets',
          slug: 'lnmarkets',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        } as Exchange,
      };

      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(existingAccount);
      mockPrisma.userExchangeAccounts.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.userExchangeAccounts.update.mockResolvedValue(updatedAccount);
      mockPrisma.userExchangeAccounts.count.mockResolvedValue(1);

      const result = await service.updateUserExchangeAccount(mockUserId, mockAccountId, mockUpdateData);

      expect(mockPrisma.userExchangeAccounts.findFirst).toHaveBeenCalledWith({
        where: { id: mockAccountId, user_id: mockUserId },
      });
      expect(mockPrisma.userExchangeAccounts.update).toHaveBeenCalledWith({
        where: { id: mockAccountId },
        data: {
          account_name: 'Updated Account',
          is_active: true,
          is_verified: undefined,
          credentials: { api_key: 'encrypted_new_key', secret: 'encrypted_new_secret' },
        },
        include: { exchange: true },
      });

      expect(result).toBeDefined();
      expect(result.account_name).toBe('Updated Account');
    });

    it('should throw error when account not found', async () => {
      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(null);

      await expect(
        service.updateUserExchangeAccount(mockUserId, mockAccountId, mockUpdateData)
      ).rejects.toThrow('Account not found');
    });
  });

  describe('deleteUserExchangeAccount', () => {
    it('should delete account successfully', async () => {
      const existingAccount = {
        id: mockAccountId,
        user_id: mockUserId,
        exchange_id: mockExchangeId,
        account_name: 'Test Account',
        credentials: {},
        is_active: false,
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_test: null,
      };

      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(existingAccount);
      mockPrisma.automation.count.mockResolvedValue(0);
      mockPrisma.userExchangeAccounts.delete.mockResolvedValue(existingAccount);

      await service.deleteUserExchangeAccount(mockUserId, mockAccountId);

      expect(mockPrisma.userExchangeAccounts.findFirst).toHaveBeenCalledWith({
        where: { id: mockAccountId, user_id: mockUserId },
      });
      expect(mockPrisma.automation.count).toHaveBeenCalledWith({
        where: { user_exchange_account_id: mockAccountId },
      });
      expect(mockPrisma.userExchangeAccounts.delete).toHaveBeenCalledWith({
        where: { id: mockAccountId },
      });
    });

    it('should throw error when account not found', async () => {
      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteUserExchangeAccount(mockUserId, mockAccountId)
      ).rejects.toThrow('Account not found');
    });

    it('should throw error when account has active automations', async () => {
      const existingAccount = {
        id: mockAccountId,
        user_id: mockUserId,
        exchange_id: mockExchangeId,
        account_name: 'Test Account',
        credentials: {},
        is_active: false,
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_test: null,
      };

      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(existingAccount);
      mockPrisma.automation.count.mockResolvedValue(2);

      await expect(
        service.deleteUserExchangeAccount(mockUserId, mockAccountId)
      ).rejects.toThrow('Cannot delete account with active automations');
    });
  });

  describe('setActiveAccount', () => {
    it('should set active account successfully', async () => {
      const mockAccount = {
        id: mockAccountId,
        user_id: mockUserId,
        exchange_id: mockExchangeId,
        account_name: 'Test Account',
        credentials: { api_key: 'encrypted_key', secret: 'encrypted_secret' },
        is_active: false,
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_test: null,
        exchange: {
          id: mockExchangeId,
          name: 'LN Markets',
          slug: 'lnmarkets',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        } as Exchange,
      };

      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(mockAccount);
      mockPrisma.userExchangeAccounts.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.userExchangeAccounts.update.mockResolvedValue({
        ...mockAccount,
        is_active: true,
      });
      mockPrisma.userExchangeAccounts.count.mockResolvedValue(1);

      const result = await service.setActiveAccount(mockUserId, mockAccountId);

      expect(mockPrisma.userExchangeAccounts.findFirst).toHaveBeenCalledWith({
        where: { id: mockAccountId, user_id: mockUserId },
        include: { exchange: true },
      });
      expect(mockPrisma.userExchangeAccounts.updateMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId, is_active: true },
        data: { is_active: false },
      });
      expect(mockPrisma.userExchangeAccounts.update).toHaveBeenCalledWith({
        where: { id: mockAccountId },
        data: { is_active: true },
        include: { exchange: true },
      });

      expect(result).toBeDefined();
      expect(result.is_active).toBe(true);
    });

    it('should throw error when account not found', async () => {
      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(null);

      await expect(
        service.setActiveAccount(mockUserId, mockAccountId)
      ).rejects.toThrow('Account not found');
    });
  });

  describe('getActiveAccount', () => {
    it('should return active account for user and exchange', async () => {
      const mockAccount = {
        id: mockAccountId,
        user_id: mockUserId,
        exchange_id: mockExchangeId,
        account_name: 'Active Account',
        credentials: { api_key: 'encrypted_key', secret: 'encrypted_secret' },
        is_active: true,
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_test: null,
        exchange: {
          id: mockExchangeId,
          name: 'LN Markets',
          slug: 'lnmarkets',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        } as Exchange,
      };

      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(mockAccount);

      const result = await service.getActiveAccount(mockUserId, mockExchangeId);

      expect(mockPrisma.userExchangeAccounts.findFirst).toHaveBeenCalledWith({
        where: { user_id: mockUserId, exchange_id: mockExchangeId, is_active: true },
        include: { exchange: true },
      });

      expect(result).toBeDefined();
      expect(result?.is_active).toBe(true);
    });

    it('should return null when no active account found', async () => {
      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(null);

      const result = await service.getActiveAccount(mockUserId, mockExchangeId);

      expect(result).toBeNull();
    });
  });

  describe('testAccountCredentials', () => {
    it('should test credentials successfully', async () => {
      const mockAccount = {
        id: mockAccountId,
        user_id: mockUserId,
        exchange_id: mockExchangeId,
        account_name: 'Test Account',
        credentials: { api_key: 'encrypted_key', secret: 'encrypted_secret' },
        is_active: true,
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_test: null,
        exchange: {
          id: mockExchangeId,
          name: 'LN Markets',
          slug: 'lnmarkets',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        } as Exchange,
      };

      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(mockAccount);
      mockPrisma.userExchangeAccounts.update.mockResolvedValue(mockAccount);

      const result = await service.testAccountCredentials(mockUserId, mockAccountId);

      expect(mockPrisma.userExchangeAccounts.findFirst).toHaveBeenCalledWith({
        where: { id: mockAccountId, user_id: mockUserId },
        include: { exchange: true },
      });
      expect(mockPrisma.userExchangeAccounts.update).toHaveBeenCalledWith({
        where: { id: mockAccountId },
        data: { last_test: expect.any(Date) },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Credentials test successful');
    });

    it('should throw error when account not found', async () => {
      mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(null);

      await expect(
        service.testAccountCredentials(mockUserId, mockAccountId)
      ).rejects.toThrow('Account not found');
    });
  });

  describe('validateAndFixActiveAccounts', () => {
    it('should fix multiple active accounts', async () => {
      const mockActiveAccounts = [
        {
          id: 'account-1',
          user_id: mockUserId,
          account_name: 'Account 1',
          created_at: new Date('2023-01-01'),
        },
        {
          id: 'account-2',
          user_id: mockUserId,
          account_name: 'Account 2',
          created_at: new Date('2023-01-02'),
        },
      ];

      mockPrisma.userExchangeAccounts.findMany.mockResolvedValue(mockActiveAccounts);
      mockPrisma.userExchangeAccounts.updateMany.mockResolvedValue({ count: 1 });

      await service.validateAndFixActiveAccounts(mockUserId);

      expect(mockPrisma.userExchangeAccounts.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId, is_active: true },
        orderBy: { created_at: 'asc' },
      });
      expect(mockPrisma.userExchangeAccounts.updateMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId, is_active: true, id: { not: 'account-1' } },
        data: { is_active: false },
      });
    });

    it('should not fix when only one active account', async () => {
      const mockActiveAccounts = [
        {
          id: 'account-1',
          user_id: mockUserId,
          account_name: 'Account 1',
          created_at: new Date('2023-01-01'),
        },
      ];

      mockPrisma.userExchangeAccounts.findMany.mockResolvedValue(mockActiveAccounts);

      await service.validateAndFixActiveAccounts(mockUserId);

      expect(mockPrisma.userExchangeAccounts.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId, is_active: true },
        orderBy: { created_at: 'asc' },
      });
      expect(mockPrisma.userExchangeAccounts.updateMany).not.toHaveBeenCalled();
    });
  });
});

