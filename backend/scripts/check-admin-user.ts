import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('🔍 Checking admin user...');
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'admin@defisats.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.email, 'ID:', user.id);
    
    // Check if admin user record exists
    const adminUser = await prisma.adminUser.findUnique({
      where: { user_id: user.id }
    });
    
    if (adminUser) {
      console.log('✅ Admin user record exists:', adminUser.role);
    } else {
      console.log('❌ Admin user record not found, creating...');
      
      const newAdminUser = await prisma.adminUser.create({
        data: {
          user_id: user.id,
          role: 'superadmin'
        }
      });
      
      console.log('✅ Admin user record created:', newAdminUser.role);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();