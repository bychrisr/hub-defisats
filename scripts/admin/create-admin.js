const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@dev.com' }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('password', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@dev.com',
        username: 'admin',
        password: hashedPassword,
        plan_type: 'free',
        is_active: true,
        is_admin: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('✅ Admin user created successfully:', {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      is_admin: admin.is_admin
    });
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();