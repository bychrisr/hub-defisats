const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔍 Checking for existing admin users...');
    
    // Check if there are any admin users
    const existingAdmins = await prisma.adminUser.findMany({
      include: { user: true }
    });
    
    if (existingAdmins.length > 0) {
      console.log('✅ Found existing admin users:');
      existingAdmins.forEach(admin => {
        console.log(`  - ${admin.user.email} (${admin.user.username}) - Role: ${admin.role}`);
      });
      return;
    }
    
    console.log('❌ No admin users found. Creating superadmin...');
    
    // Create admin user
    const adminEmail = 'admin@hub-defisats.com';
    const adminUsername = 'superadmin';
    const adminPassword = 'AdminPass123!';
    const adminApiKey = 'admin-key-16chars';
    const adminApiSecret = 'admin-secret-16chars';
    const adminPassphrase = 'admin-passphrase';
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password_hash: passwordHash,
        ln_markets_api_key: adminApiKey,
        ln_markets_api_secret: adminApiSecret,
        plan_type: 'pro',
        email_verified: true,
        is_active: true
      }
    });
    
    console.log('✅ User created:', user.email);
    
    // Create admin user
    const adminUser = await prisma.adminUser.create({
      data: {
        user_id: user.id,
        role: 'superadmin'
      }
    });
    
    console.log('✅ Admin user created with superadmin role');
    
    console.log('\n🎉 ADMIN CREDENTIALS CREATED:');
    console.log('================================');
    console.log(`Email: ${adminEmail}`);
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role: superadmin`);
    console.log('================================');
    console.log('\n📋 ADMIN PANEL ACCESS:');
    console.log('URL: http://localhost:13010/api/admin/dashboard');
    console.log('Method: GET');
    console.log('Headers: Authorization: Bearer <JWT_TOKEN>');
    console.log('\n🔑 To get JWT token, login at: http://localhost:13010/api/auth/login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

