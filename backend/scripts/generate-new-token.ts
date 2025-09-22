import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/auth.service';

const prisma = new PrismaClient();

async function generateNewToken() {
  try {
    console.log('🔑 GENERATING NEW TOKEN - Starting...');
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
      select: { 
        id: true, 
        email: true,
        username: true,
        plan_type: true
      }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.email} (${user.id})`);

    // Criar instância do AuthService
    const authService = new AuthService(prisma, {} as any);

    // Gerar novo token usando o método do AuthService
    const token = (authService as any).generateAccessToken(user);

    console.log('✅ New token generated:');
    console.log(token);
    console.log('\n📋 Instructions:');
    console.log('1. Copy the token above');
    console.log('2. Open browser dev tools (F12)');
    console.log('3. Go to Application > Local Storage > localhost:13000');
    console.log('4. Replace the access_token value with the new token');
    console.log('5. Refresh the page');
    
  } catch (error) {
    console.error('❌ Error generating new token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateNewToken();
