import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔍 Creating superadmin user...');
    
    // Check if superadmin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@axisor.com' }
    });
    
    if (existingUser) {
      console.log('✅ Superadmin already exists:', existingUser.email);
      return;
    }
    
    // Create superadmin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const superadmin = await prisma.user.create({
      data: {
        email: 'admin@axisor.com',
        username: 'superadmin',
        password_hash: hashedPassword,
        plan_type: 'lifetime',
        is_active: true,
        email_verified: true,
      }
    });
    
    // Create admin user record
    const adminUser = await prisma.adminUser.create({
      data: {
        user_id: superadmin.id,
        role: 'superadmin'
      }
    });
    
    console.log('✅ Superadmin created successfully:');
    console.log('   Email:', superadmin.email);
    console.log('   Username:', superadmin.username);
    console.log('   Password: Admin123!');
    console.log('   Role:', adminUser.role);
    
  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
