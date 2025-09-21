import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/auth.service';

const prisma = new PrismaClient();

async function testJWTToken() {
  try {
    console.log('🧪 TESTING JWT TOKEN - Starting test...');
    
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

    // Testar validação de um token existente (simulando o que vem do frontend)
    console.log('🔍 Testing token validation with existing token...');
    
    // Simular um token JWT válido (você pode pegar um do localStorage do frontend)
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMjRlZjk0Zi03ZTQxLTRlOTYtODk2MS02NmRjNWZkNTg5Y2YiLCJlbWFpbCI6ImJyYWlub3NjaHJpc0BnbWFpbC5jb20iLCJwbGFuVHlwZSI6ImxpZmV0aW1lIiwiaWF0IjoxNzU4NDY2MTI4LCJleHAiOjE3NTg0NjcwMjh9.A5pg3iMa-cxyvkiDzL9pqpAnxPG8t6bEDtjyEGRyCE8';
    
    try {
      const validatedUser = await authService.validateSession(testToken);
      console.log(`✅ Token validation successful:`, {
        id: validatedUser?.id,
        email: validatedUser?.email,
        username: validatedUser?.username
      });
    } catch (error: any) {
      console.error('❌ Token validation failed:', error.message);
      console.error('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing JWT token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testJWTToken();
