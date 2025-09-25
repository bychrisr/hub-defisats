const fastify = require('fastify')({ logger: true });

// Mock routes to test if the server can start
fastify.get('/api/version', async (request, reply) => {
  return {
    version: '1.12.0',
    buildTime: new Date().toISOString(),
    environment: 'development',
    features: ['trading', 'analytics', 'admin-panel', 'notifications', 'automation', 'version-check']
  };
});

fastify.get('/api/redirects/active', async (request, reply) => {
  return {
    redirects: [],
    count: 0
  };
});

fastify.get('/api/redirects/check', async (request, reply) => {
  return {
    found: false,
    message: 'Redirect system is disabled'
  };
});

fastify.get('/api/market/index/public', async (request, reply) => {
  return {
    success: true,
    data: {
      index: 50000,
      index24hChange: 2.5,
      tradingFees: 0.1,
      nextFunding: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      rate: 0.0001,
      timestamp: new Date().toISOString(),
      source: 'mock'
    }
  };
});

fastify.get('/api/auth/me', async (request, reply) => {
  return reply.status(401).send({
    error: 'UNAUTHORIZED',
    message: 'Authorization header with Bearer token is required'
  });
});

fastify.post('/api/auth/login', async (request, reply) => {
  return reply.status(401).send({
    error: 'UNAUTHORIZED',
    message: 'Invalid credentials'
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 13000, host: '0.0.0.0' });
    console.log('✅ Test server running on http://localhost:13000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
