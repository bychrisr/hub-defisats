import Fastify from 'fastify';
import bcrypt from 'bcrypt';

const fastify = Fastify({
  logger: true
});

// Simple in-memory storage for demo purposes
const users: any[] = [];

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register endpoint
fastify.post('/api/auth/register', async (request, reply) => {
  try {
    const { email, password, ln_markets_api_key, ln_markets_api_secret } = request.body as any;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return reply.status(409).send({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: `user-${Date.now()}`,
      email,
      password_hash: passwordHash,
      ln_markets_api_key,
      ln_markets_api_secret,
      plan_type: 'free',
      is_active: true,
      created_at: new Date().toISOString()
    };

    users.push(user);

    return reply.send({
      user_id: user.id,
      email: user.email,
      plan_type: user.plan_type,
      created_at: user.created_at
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

// Test LN Markets API integration
fastify.post('/api/test/lnmarkets', async (request, reply) => {
  try {
    const { apiKey, apiSecret } = request.body as any;

    if (!apiKey || !apiSecret) {
      return reply.status(400).send({ error: 'API key and secret are required' });
    }

    const { createLNMarketsService } = await import('./services/lnmarkets.service');
    const lnMarkets = createLNMarketsService({ apiKey, apiSecret });

    // Test credentials
    const isValid = await lnMarkets.validateCredentials();
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid LN Markets credentials' });
    }

    // Get margin info
    const marginInfo = await lnMarkets.getMarginInfo();
    const positions = await lnMarkets.getPositions();

    return reply.send({
      success: true,
      marginInfo,
      positions,
      message: 'LN Markets API integration successful'
    });
  } catch (error) {
    console.error('LN Markets test error:', error);
    return reply.status(500).send({
      error: 'LN Markets API test failed',
      details: (error as Error).message
    });
  }
});

// Test Margin Guard
fastify.post('/api/test/margin-guard', async (request, reply) => {
  try {
    const { apiKey, apiSecret, userId } = request.body as any;

    if (!apiKey || !apiSecret || !userId) {
      return reply.status(400).send({ error: 'API key, secret, and userId are required' });
    }

    const { createLNMarketsService } = await import('./services/lnmarkets.service');
    const { addUserCredentials, simulateMarginMonitoring } = await import('./workers/margin-monitor');

    // Add credentials
    addUserCredentials(userId, apiKey, apiSecret);

    // Create service and test
    const lnMarkets = createLNMarketsService({ apiKey, apiSecret });

    // Get current margin status
    const marginInfo = await lnMarkets.getMarginInfo();
    const positions = await lnMarkets.getPositions();

    // Calculate risk
    const risk = lnMarkets.calculateLiquidationRisk(marginInfo, positions);

    // Simulate monitoring
    await simulateMarginMonitoring(userId, {
      userId,
      enabled: true,
      threshold: 20,
      autoClose: false,
      notificationEnabled: true
    });

    return reply.send({
      success: true,
      marginInfo,
      positions,
      risk,
      message: 'Margin Guard test completed'
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

