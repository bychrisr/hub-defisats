import Fastify from 'fastify';
import bcrypt from 'bcrypt';

const fastify = Fastify({
  logger: true
});

// Register CORS
fastify.register(import('@fastify/cors'), {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// Simple in-memory storage for demo purposes
const users: any[] = [];
const admins: any[] = [
  {
    id: 'admin-1',
    email: 'brainoschris@gmail.com',
    password_hash: '$2b$10$rRMUNNsd1PTOROngFVrLGuP2oLu/.PS29Z6CbnXAoISr8o1yd5LAW',
    role: 'superadmin',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Check username availability
fastify.get('/api/auth/check-username', async (request, reply) => {
  try {
    const { username } = request.query as any;

    if (!username || typeof username !== 'string') {
      return reply.status(400).send({ error: 'USERNAME_REQUIRED', message: 'Nome de usuário é obrigatório' });
    }

    // Basic username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return reply.status(400).send({
        error: 'INVALID_USERNAME',
        message: 'Nome de usuário deve ter 3-20 caracteres, apenas letras, números e underscore'
      });
    }

    // Check if username exists
    const existingUser = users.find(u => u.username === username);

    return reply.send({
      available: !existingUser,
      username,
      message: existingUser ? 'Nome de usuário já está em uso' : 'Nome de usuário disponível'
    });
  } catch (error) {
    console.error('Username check error:', error);
    return reply.status(500).send({ error: 'Erro interno do servidor' });
  }
});

// Register endpoint
fastify.post('/api/auth/register', async (request, reply) => {
  try {
    const { email, password, username, ln_markets_api_key, ln_markets_api_secret, ln_markets_passphrase, coupon_code } = request.body as any;

    // Check if user already exists by email
    const existingUserByEmail = users.find(u => u.email === email);
    if (existingUserByEmail) {
      return reply.status(409).send({ error: 'EMAIL_ALREADY_EXISTS', message: 'Este email já está cadastrado' });
    }

    // Check if username already exists
    const existingUserByUsername = users.find(u => u.username === username);
    if (existingUserByUsername) {
      return reply.status(409).send({ error: 'USERNAME_ALREADY_EXISTS', message: 'Este nome de usuário já está em uso' });
    }

    // Validate LN Markets credentials immediately after registration
    if (ln_markets_api_key && ln_markets_api_secret && ln_markets_passphrase) {
      try {
        console.log('🔐 Validating LN Markets credentials...');

        const { createLNMarketsService } = await import('./services/lnmarkets.service');
        const lnMarkets = createLNMarketsService({
          apiKey: ln_markets_api_key,
          apiSecret: ln_markets_api_secret,
          passphrase: ln_markets_passphrase
        });

        // Test credentials by trying to get user balance
        const isValid = await lnMarkets.validateCredentials();
        if (!isValid) {
          return reply.status(400).send({
            error: 'INVALID_LN_MARKETS_CREDENTIALS',
            message: 'As credenciais da LN Markets fornecidas são inválidas. Verifique sua API Key, Secret e Passphrase.'
          });
        }

        // Get real user data to confirm everything is working
        const balance = await lnMarkets.getBalance();
        const marginInfo = await lnMarkets.getMarginInfo();

        console.log('✅ LN Markets credentials validated successfully');
        console.log(`💰 Balance: ${balance}`, `📊 Margin Level: ${marginInfo.marginLevel}%`);

      } catch (error) {
        console.error('❌ LN Markets credential validation failed:', error);
        return reply.status(400).send({
          error: 'LN_MARKETS_API_ERROR',
          message: 'Erro ao validar credenciais LN Markets. Verifique se suas credenciais estão corretas e se a API está acessível.',
          details: (error as Error).message
        });
      }
    } else {
      return reply.status(400).send({
        error: 'MISSING_LN_MARKETS_CREDENTIALS',
        message: 'API Key, Secret e Passphrase da LN Markets são obrigatórios para o cadastro.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Determine plan type based on coupon
    let planType = 'free';
    if (coupon_code === 'ALPHATESTER') {
      planType = 'free'; // Vitalício
    }

    // Create user
    const user = {
      id: `user-${Date.now()}`,
      email,
      username,
      password_hash: passwordHash,
      ln_markets_api_key,
      ln_markets_api_secret,
      ln_markets_passphrase,
      plan_type: planType,
      is_active: true,
      created_at: new Date().toISOString()
    };

    users.push(user);

    return reply.send({
      user_id: user.id,
      email: user.email,
      username: user.username,
      plan_type: user.plan_type,
      created_at: user.created_at,
      ln_markets_validated: true,
      message: 'Conta criada com sucesso! Credenciais LN Markets validadas e dados da conta confirmados.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Login endpoint
fastify.post('/api/auth/login', async (request, reply) => {
  try {
    const { email, password } = request.body as any;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user || !user.password_hash) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    return reply.send({
      user_id: user.id,
      email: user.email,
      plan_type: user.plan_type,
      is_active: user.is_active
    });
  } catch (error) {
    console.error('Login error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Get user profile
fastify.get('/api/users/me', async (request, reply) => {
  try {
    // For now, return a mock user - in real implementation this would use authentication
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      plan_type: 'free',
      is_active: true,
      created_at: new Date().toISOString()
    };

    return reply.send(mockUser);
  } catch (error) {
    console.error('Profile error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Admin login
fastify.post('/api/admin/login', async (request, reply) => {
  try {
    const { email, password } = request.body as any;

    // Find admin
    const admin = admins.find(a => a.email === email);
    if (!admin || !admin.password_hash) {
      return reply.status(401).send({ error: 'Invalid admin credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return reply.status(401).send({ error: 'Invalid admin credentials' });
    }

    return reply.send({
      admin_id: admin.id,
      email: admin.email,
      role: admin.role,
      is_active: admin.is_active
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Admin dashboard
fastify.get('/api/admin/dashboard', async (request, reply) => {
  try {
    // Mock dashboard data
    const dashboardData = {
      kpi: {
        total_users: users.length,
        active_users: users.filter(u => u.is_active).length,
        total_trades: 0, // Would come from database
        total_revenue: 0, // Would come from database
        margin_alerts_today: 0,
        system_health: 'healthy'
      },
      recent_users: users.slice(-5).map(u => ({
        id: u.id,
        email: u.email,
        plan_type: u.plan_type,
        created_at: u.created_at
      })),
      recent_trades: [], // Would come from database
      system_alerts: [] // Would come from database
    };

    return reply.send(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
fastify.get('/api/admin/users', async (request, reply) => {
  try {
    const userList = users.map(u => ({
      id: u.id,
      email: u.email,
      plan_type: u.plan_type,
      is_active: u.is_active,
      created_at: u.created_at,
      has_ln_credentials: !!(u.ln_markets_api_key && u.ln_markets_api_secret)
    }));

    return reply.send(userList);
  } catch (error) {
    console.error('Users list error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Test LN Markets API connectivity
fastify.get('/api/test/lnmarkets/connectivity', async (request, reply) => {
  try {
    const { createLNMarketsService } = await import('./services/lnmarkets.service');
    const lnMarkets = createLNMarketsService({ apiKey: 'dummy', apiSecret: 'dummy', passphrase: 'dummy' });

    const connectivityTest = await lnMarkets.testConnectivity();

    return reply.send({
      success: connectivityTest.success,
      message: connectivityTest.message,
      details: connectivityTest.details
    });
  } catch (error) {
    console.error('Connectivity test error:', error);
    return reply.status(500).send({
      error: 'Connectivity test failed',
      details: (error as Error).message
    });
  }
});

// Test LN Markets API integration
fastify.post('/api/test/lnmarkets', async (request, reply) => {
  try {
    const { apiKey, apiSecret, passphrase } = request.body as any;

    if (!apiKey || !apiSecret || !passphrase) {
      return reply.status(400).send({ error: 'API key, secret, and passphrase are required' });
    }

    const { createLNMarketsService } = await import('./services/lnmarkets.service');
    const lnMarkets = createLNMarketsService({ apiKey, apiSecret, passphrase });

    // Test credentials
    const isValid = await lnMarkets.validateCredentials();
    if (!isValid) {
      return reply.status(401).send({
        error: 'Invalid LN Markets credentials',
        suggestion: 'Try checking your API key, secret, and passphrase'
      });
    }

    // Get margin info
    const marginInfo = await lnMarkets.getMarginInfo();
    const positions = await lnMarkets.getPositions();
    const balance = await lnMarkets.getBalance();

    return reply.send({
      success: true,
      marginInfo,
      positions,
      balance,
      message: 'LN Markets API integration successful'
    });
  } catch (error) {
    console.error('LN Markets test error:', error);
    return reply.status(500).send({
      error: 'LN Markets API test failed',
      details: (error as Error).message,
      suggestion: 'Check your internet connection and API credentials'
    });
  }
});

// Test Margin Guard
fastify.post('/api/test/margin-guard', async (request, reply) => {
  try {
    const { apiKey, apiSecret, passphrase, userId } = request.body as any;

    if (!apiKey || !apiSecret || !passphrase || !userId) {
      return reply.status(400).send({ error: 'API key, secret, passphrase, and userId are required' });
    }

    const { createLNMarketsService } = await import('./services/lnmarkets.service');
    const { addUserCredentials, simulateMarginMonitoring } = await import('./workers/margin-monitor');

    // Add credentials
    addUserCredentials(userId, apiKey, apiSecret, passphrase);

    // Create service and test
    const lnMarkets = createLNMarketsService({ apiKey, apiSecret, passphrase });

    // Test credentials first
    const isValid = await lnMarkets.validateCredentials();
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid LN Markets credentials' });
    }

    // Get current margin status
    const marginInfo = await lnMarkets.getMarginInfo();
    const positions = await lnMarkets.getPositions();
    const balance = await lnMarkets.getBalance();

    // Calculate risk
    const risk = lnMarkets.calculateLiquidationRisk(marginInfo, positions);

    // Simulate monitoring
    await simulateMarginMonitoring(userId, {
      userId,
      enabled: true,
      threshold: 0.8,
      autoClose: false,
      notificationEnabled: true
    });

    return reply.send({
      success: true,
      marginInfo,
      positions,
      balance,
      risk,
      message: 'Margin Guard test completed successfully'
    });
  } catch (error) {
    console.error('Margin Guard test error:', error);
    return reply.status(500).send({
      error: 'Margin Guard test failed',
      details: (error as Error).message
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = process.env['PORT'] || 3010;
    await fastify.listen({ port: Number(port), host: '0.0.0.0' });
    console.log(`🚀 Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

