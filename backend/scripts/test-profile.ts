import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProfile() {
  try {
    console.log('🔍 Testing profile query...');
    
    const profile = await prisma.user.findUnique({
      where: { id: '531116ef-62ff-4772-a617-412e89e23d96' },
      select: {
        id: true,
        email: true,
        username: true,
        plan_type: true,
        created_at: true,
        last_activity_at: true,
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true,
        admin_user: {
          select: {
            role: true
          }
        }
      },
    });
    
    console.log('✅ Profile query result:');
    console.log(JSON.stringify(profile, null, 2));
    
    const isAdmin = !!profile?.admin_user;
    console.log('✅ Is admin:', isAdmin);
    console.log('✅ Admin role:', profile?.admin_user?.role);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfile();
