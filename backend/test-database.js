const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database tables...');
    
    // Test UserExchangeAccounts table
    const userAccounts = await prisma.userExchangeAccounts.findMany();
    console.log(`✅ UserExchangeAccounts table exists - ${userAccounts.length} records`);
    
    // Test PlanLimits table
    const planLimits = await prisma.planLimits.findMany();
    console.log(`✅ PlanLimits table exists - ${planLimits.length} records`);
    
    // Test Automation table with new field
    const automations = await prisma.automation.findMany();
    console.log(`✅ Automation table exists with new field - ${automations.length} records`);
    
    // Test Exchange table
    const exchanges = await prisma.exchange.findMany();
    console.log(`✅ Exchange table exists - ${exchanges.length} records`);
    
    // Test User table
    const users = await prisma.user.findMany();
    console.log(`✅ User table exists - ${users.length} records`);
    
    console.log('🎉 All tables are working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
