import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAndCreateAdmin() {
  try {
    console.log('🔍 Checking for existing admin users...');
    
    // Verificar se existe algum usuário admin
    const existingAdmin = await prisma.adminUser.findFirst({
      where: {
        role: 'superadmin'
      },
      include: {
        user: true
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user found:');
      console.log(`   Email: ${existingAdmin.user.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   User ID: ${existingAdmin.user_id}`);
      return;
    }

    console.log('❌ No admin user found. Creating one...');
    
    // Verificar se existe usuário com email admin
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@defisats.com' }
    });

    if (!adminUser) {
      console.log('📝 Creating admin user...');
      
      // Criar usuário admin
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@defisats.com',
          password_hash: hashedPassword,
          username: 'admin',
          plan_type: 'lifetime',
          is_active: true,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      console.log('✅ Admin user created successfully');
    }

    // Criar registro de admin
    const adminRecord = await prisma.adminUser.create({
      data: {
        user_id: adminUser.id,
        role: 'superadmin',
        created_at: new Date()
      }
    });

    console.log('🎉 Admin setup completed!');
    console.log('📧 Email: admin@defisats.com');
    console.log('🔑 Password: Admin123!');
    console.log('👑 Role: superadmin');
    console.log('🆔 User ID:', adminUser.id);

  } catch (error) {
    console.error('❌ Error checking/creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateAdmin();
