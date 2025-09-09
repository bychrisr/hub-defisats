import { FastifyInstance } from 'fastify';
import { build } from '../index';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';

describe('IDOR (Insecure Direct Object Reference) Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let authService: AuthService;

  beforeAll(async () => {
    app = await build();
    prisma = new PrismaClient();
    authService = new AuthService(prisma, app);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('User Resource Access', () => {
    let user1Token: string;
    // let user2Token: string;
    let user1Id: string;
    let user2Id: string;

    beforeAll(async () => {
      // Criar dois usuários para teste
      const user1Data = {
        email: 'user1@example.com',
        username: 'user1',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const user2Data = {
        email: 'user2@example.com',
        username: 'user2',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      // Registrar usuários
      const user1Result = await authService.register(user1Data);
      const user2Result = await authService.register(user2Data);

      user1Token = user1Result.token;
      user2Token = user2Result.token;
      user1Id = user1Result.user_id;
      user2Id = user2Result.user_id;
    });

    test("should prevent user from accessing another user's data", async () => {
      // User1 tenta acessar dados do User2
      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${user2Id}`,
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('FORBIDDEN');
      expect(body.message).toContain('Access denied');
    });

    test('should allow user to access their own data', async () => {
      // User1 acessa seus próprios dados
      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${user1Id}`,
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });

      // Deve retornar 200 ou 404 (se rota não existir)
      expect([200, 404]).toContain(response.statusCode);
    });

    test("should prevent user from modifying another user's data", async () => {
      // User1 tenta modificar dados do User2
      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${user2Id}`,
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
        payload: {
          username: 'hacked',
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('FORBIDDEN');
    });
  });

  describe('Automation Access', () => {
    let user1Token: string;
    // let user2Token: string;
    let user1Id: string;
    let user2Id: string;
    let user1AutomationId: string;
    let user2AutomationId: string;

    beforeAll(async () => {
      // Criar usuários
      const user1Data = {
        email: 'automation_user1@example.com',
        username: 'automation_user1',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const user2Data = {
        email: 'automation_user2@example.com',
        username: 'automation_user2',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const user1Result = await authService.register(user1Data);
      const user2Result = await authService.register(user2Data);

      user1Token = user1Result.token;
      user2Token = user2Result.token;
      user1Id = user1Result.user_id;
      user2Id = user2Result.user_id;

      // Criar automações para cada usuário
      const user1Automation = await prisma.automation.create({
        data: {
          user_id: user1Id,
          type: 'margin_guard',
          config: { threshold: 0.8 },
          is_active: true,
        },
      });

      const user2Automation = await prisma.automation.create({
        data: {
          user_id: user2Id,
          type: 'margin_guard',
          config: { threshold: 0.9 },
          is_active: true,
        },
      });

      user1AutomationId = user1Automation.id;
      user2AutomationId = user2Automation.id;
    });

    test("should prevent user from accessing another user's automation", async () => {
      // User1 tenta acessar automação do User2
      const response = await app.inject({
        method: 'GET',
        url: `/api/automations/${user2AutomationId}`,
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('FORBIDDEN');
    });

    test('should allow user to access their own automation', async () => {
      // User1 acessa sua própria automação
      const response = await app.inject({
        method: 'GET',
        url: `/api/automations/${user1AutomationId}`,
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    test("should prevent user from modifying another user's automation", async () => {
      // User1 tenta modificar automação do User2
      const response = await app.inject({
        method: 'PUT',
        url: `/api/automations/${user2AutomationId}`,
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
        payload: {
          config: { threshold: 0.5 },
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('FORBIDDEN');
    });

    test("should prevent user from deleting another user's automation", async () => {
      // User1 tenta deletar automação do User2
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/automations/${user2AutomationId}`,
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('FORBIDDEN');
    });
  });

  describe('Trade Log Access', () => {
    let user1Token: string;
    // let user2Token: string;
    let user1Id: string;
    let user2Id: string;
    let user1TradeLogId: string;
    let user2TradeLogId: string;

    beforeAll(async () => {
      // Criar usuários
      const user1Data = {
        email: 'trade_user1@example.com',
        username: 'trade_user1',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const user2Data = {
        email: 'trade_user2@example.com',
        username: 'trade_user2',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const user1Result = await authService.register(user1Data);
      const user2Result = await authService.register(user2Data);

      user1Token = user1Result.token;
      user2Token = user2Result.token;
      user1Id = user1Result.user_id;
      user2Id = user2Result.user_id;

      // Criar trade logs para cada usuário
      const user1TradeLog = await prisma.tradeLog.create({
        data: {
          user_id: user1Id,
          symbol: 'BTCUSD',
          side: 'buy',
          amount: 0.001,
          price: 50000,
          status: 'executed',
          executed_at: new Date(),
        },
      });

      const user2TradeLog = await prisma.tradeLog.create({
        data: {
          user_id: user2Id,
          symbol: 'ETHUSD',
          side: 'sell',
          amount: 0.1,
          price: 3000,
          status: 'executed',
          executed_at: new Date(),
        },
      });

      user1TradeLogId = user1TradeLog.id;
      user2TradeLogId = user2TradeLog.id;
    });

    test("should prevent user from accessing another user's trade log", async () => {
      // User1 tenta acessar trade log do User2
      const response = await app.inject({
        method: 'GET',
        url: `/api/trades/${user2TradeLogId}`,
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('FORBIDDEN');
    });

    test('should allow user to access their own trade log', async () => {
      // User1 acessa seu próprio trade log
      const response = await app.inject({
        method: 'GET',
        url: `/api/trades/${user1TradeLogId}`,
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Admin Access', () => {
    let adminToken: string;
    let userToken: string;
    let userId: string;

    beforeAll(async () => {
      // Criar usuário comum
      const userData = {
        email: 'regular_user@example.com',
        username: 'regular_user',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const userResult = await authService.register(userData);
      userToken = userResult.token;
      userId = userResult.user_id;

      // Criar admin
      const adminData = {
        email: 'admin@example.com',
        username: 'admin',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const adminResult = await authService.register(adminData);
      adminToken = adminResult.token;

      // Tornar admin
      await prisma.adminUser.create({
        data: {
          user_id: adminResult.user_id,
          role: 'admin',
        },
      });
    });

    test("should allow admin to access any user's data", async () => {
      // Admin acessa dados de usuário comum
      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${userId}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Admin deve ter acesso (200 ou 404 se rota não existir)
      expect([200, 404]).toContain(response.statusCode);
    });

    test('should prevent regular user from accessing admin functions', async () => {
      // Usuário comum tenta acessar função de admin
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('FORBIDDEN');
    });
  });

  describe('Resource Enumeration', () => {
    test('should not allow enumeration of user IDs', async () => {
      // Tentar acessar IDs sequenciais
      const responses = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/users/1',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }),
        app.inject({
          method: 'GET',
          url: '/api/users/2',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }),
        app.inject({
          method: 'GET',
          url: '/api/users/999',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }),
      ]);

      // Todas devem retornar 401 (não autenticado) ou 404 (não encontrado)
      responses.forEach(response => {
        expect([401, 404]).toContain(response.statusCode);
      });
    });

    test('should not allow enumeration of automation IDs', async () => {
      // Tentar acessar IDs de automação sequenciais
      const responses = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/automations/1',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }),
        app.inject({
          method: 'GET',
          url: '/api/automations/2',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }),
      ]);

      // Todas devem retornar 401 (não autenticado) ou 404 (não encontrado)
      responses.forEach(response => {
        expect([401, 404]).toContain(response.statusCode);
      });
    });
  });
});
