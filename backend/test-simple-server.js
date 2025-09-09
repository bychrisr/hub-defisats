console.log('🧪 Testing simple server startup...');

const Fastify = require('fastify');

async function testSimpleServer() {
  try {
    console.log('🔍 Creating Fastify instance...');
    const fastify = Fastify({
      logger: false,
    });
    console.log('✅ Fastify instance created');

    console.log('🔍 Registering a simple route...');
    fastify.get('/test', async (request, reply) => {
      return { message: 'Server is working!' };
    });
    console.log('✅ Simple route registered');

    console.log('🔍 Starting server...');
    await fastify.listen({ port: 3011, host: '0.0.0.0' });
    console.log('✅ Server started successfully on port 3011');

    console.log('🔍 Testing the route...');
    const response = await fastify.inject({
      method: 'GET',
      url: '/test'
    });
    console.log('✅ Route test successful:', response.json());

    console.log('🏁 Simple server test completed successfully!');
    console.log('🎉 Basic Fastify setup is working');

    // Close the server
    await fastify.close();

  } catch (error) {
    console.error('❌ Simple server test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
  }
}

testSimpleServer();