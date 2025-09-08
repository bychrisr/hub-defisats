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

