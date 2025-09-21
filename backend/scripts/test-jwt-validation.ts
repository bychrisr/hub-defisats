import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/auth.service';
import { config } from '../src/config/env';

const prisma = new PrismaClient();

async function testJWTValidation() {
  try {
    console.log('🧪 TESTING JWT VALIDATION - Starting test...');
    console.log('🔍 JWT Config:', {
      secret: config.jwt.secret.substring(0, 10) + '...',
      expiresIn: config.jwt.expiresIn
    });
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
      select: { 
        id: true, 
        email: true,
        username: true,
        plan_type: true,
        session_expires_at: true,
        is_active: true
      }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.email} (${user.id})`);

    // Criar instância do AuthService
    const authService = new AuthService(prisma, {} as any);

    // Testar com um token JWT válido do localStorage
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMjRlZjk0Zi03ZTQxLTRlOTYtODk2MS02NmRjNWZkNTg5Y2YiLCJlbWFpbCI6ImJyYWlub3NjaHJpc0BnbWFpbC5jb20iLCJwbGFuVHlwZSI6ImxpZmV0aW1lIiwiaWF0IjoxNzU4NDY2MTI4LCJleHAiOjE3NTg0NjcwMjh9.A5pg3iMa-cxyvkiDzL9pqpAnxPG8t6bEDtjyEGRyCE8';
    
    console.log('🔍 Testing JWT validation...');
    console.log('🔍 Token:', testToken.substring(0, 50) + '...');
    
    try {
      const validatedUser = await authService.validateSession(testToken);
      console.log(`✅ JWT validation successful:`, {
        id: validatedUser?.id,
        email: validatedUser?.email,
        username: validatedUser?.username
      });
    } catch (error: any) {
      console.error('❌ JWT validation failed:', error.message);
      console.error('Error details:', error);
      
      // Verificar se é problema de expiração
      try {
        const decoded = JSON.parse(Buffer.from(testToken.split('.')[1], 'base64').toString());
        console.log('🔍 Token payload:', decoded);
        console.log('🔍 Token exp:', new Date(decoded.exp * 1000));
        console.log('🔍 Current time:', new Date());
        console.log('🔍 Token expired:', decoded.exp * 1000 < Date.now());
      } catch (decodeError) {
        console.error('❌ Error decoding token:', decodeError);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing JWT validation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testJWTValidation();
