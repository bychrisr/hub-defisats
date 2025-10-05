const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createUser() {
  try {
    console.log('🔐 Criando usuário manualmente...');
    
    // Hash da senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash('TestPassword123!', saltRounds);
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'brainoschris@gmail.com',
        username: 'brainoschris',
        password_hash: passwordHash,
        plan_type: 'free',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email:', user.email);
    console.log('🆔 ID:', user.id);
    console.log('👤 Username:', user.username);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
