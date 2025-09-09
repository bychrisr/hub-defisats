console.log('🧪 Testing configuration and routes...');

try {
  console.log('🔍 Testing config import...');
  const { config } = require('./src/config/env.ts');
  console.log('✅ Config imported successfully');

  console.log('🔍 Testing auth routes import...');
  const { authRoutes } = require('./src/routes/auth.routes.ts');
  console.log('✅ Auth routes imported successfully');

  console.log('🔍 Testing automation routes import...');
  const { automationRoutes } = require('./src/routes/automation.routes.ts');
  console.log('✅ Automation routes imported successfully');

  console.log('🔍 Testing auth middleware import...');
  const { authMiddleware } = require('./src/middleware/auth.middleware.ts');
  console.log('✅ Auth middleware imported successfully');

  console.log('🏁 Configuration and routes test completed successfully!');
  console.log('🎉 All modules imported correctly');

} catch (error) {
  console.error('❌ Configuration test failed:', error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    code: error.code
  });
}