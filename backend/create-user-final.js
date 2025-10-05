const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Creating user brainoschris@gmail.com...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'brainoschris@gmail.com' }
    });
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email);
      return;
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    
    const user = await prisma.user.create({
      data: {
        email: 'brainoschris@gmail.com',
        username: 'brainoschris',
        password_hash: hashedPassword,
        plan_type: 'free',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('✅ User created successfully:', {
      id: user.id,
      email: user.email,
      username: user.username,
      plan_type: user.plan_type
    });
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
