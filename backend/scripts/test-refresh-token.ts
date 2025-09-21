import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/auth.service';

const prisma = new PrismaClient();

async function testRefreshToken() {
  try {
    console.log('🧪 TESTING REFRESH TOKEN - Starting test...');
    
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

    // Simular um refresh token (você pode pegar um do localStorage do frontend)
    const refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMjRlZjk0Zi03ZTQxLTRlOTYtODk2MS02NmRjNWZkNTg5Y2YiLCJlbWFpbCI6ImJyYWlub3NjaHJpc0BnbWFpbC5jb20iLCJwbGFuVHlwZSI6ImxpZmV0aW1lIiwiaWF0IjoxNzU4NDY2MTI4LCJleHAiOjE3NTg0NjcwMjh9.A5pg3iMa-cxyvkiDzL9pqpAnxPG8t6bEDtjyEGRyCE8';
    
    console.log('🔍 Testing refresh token...');
    try {
      const result = await authService.refreshToken(refreshToken);
      console.log(`✅ Refresh token successful:`, {
        token: result.token.substring(0, 50) + '...'
      });
    } catch (error: any) {
      console.error('❌ Refresh token failed:', error.message);
      console.error('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing refresh token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRefreshToken();
