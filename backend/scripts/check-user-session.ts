import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserSession() {
  try {
    console.log('🔍 CHECKING USER SESSION - Starting check...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
      select: { 
        id: true, 
        email: true,
        username: true,
        plan_type: true,
        session_expires_at: true,
        last_activity_at: true,
        is_active: true
      }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.email} (${user.id})`);
    console.log(`📊 Session details:`, {
      session_expires_at: user.session_expires_at,
      last_activity_at: user.last_activity_at,
      is_active: user.is_active,
      session_expired: user.session_expires_at ? user.session_expires_at < new Date() : 'No session'
    });

    // Verificar se a sessão está expirada
    if (user.session_expires_at) {
      const isExpired = user.session_expires_at < new Date();
      console.log(`⏰ Session expired: ${isExpired}`);
      
      if (isExpired) {
        console.log('🔄 Updating session to extend it...');
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            session_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
          }
        });
        console.log('✅ Session extended successfully');
      }
    } else {
      console.log('🔄 No session found, creating new session...');
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          session_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
        }
      });
      console.log('✅ New session created successfully');
    }
    
  } catch (error) {
    console.error('❌ Error checking user session:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSession();
