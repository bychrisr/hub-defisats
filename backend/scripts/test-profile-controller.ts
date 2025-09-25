import { PrismaClient } from '@prisma/client';
import { ProfileController } from '../src/controllers/profile.controller';

const prisma = new PrismaClient();
const profileController = new ProfileController(prisma);

async function testProfileController() {
  try {
    console.log('🔍 Testing profile controller...');
    
    // Mock request and reply
    const mockRequest = {
      user: { id: '531116ef-62ff-4772-a617-412e89e23d96' }
    };
    
    const mockReply = {
      status: (code: number) => ({
        send: (data: any) => {
          console.log('✅ Profile controller response:');
          console.log(JSON.stringify(data, null, 2));
        }
      })
    };
    
    await profileController.getProfile(mockRequest as any, mockReply as any);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfileController();
