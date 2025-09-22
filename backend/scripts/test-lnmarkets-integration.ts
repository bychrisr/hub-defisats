import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIService } from '../src/services/lnmarkets-api.service';

const prisma = new PrismaClient();

async function testLNMarketsIntegration() {
  try {
    console.log('🧪 TESTING LN MARKETS INTEGRATION - Starting test...');
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
      select: { 
        id: true, 
        email: true,
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true
      }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.email} (${user.id})`);

    // Criar instância do serviço LN Markets
    const lnmarketsService = new LNMarketsAPIService(
      {
        apiKey: user.ln_markets_api_key!,
        apiSecret: user.ln_markets_api_secret!,
        passphrase: user.ln_markets_passphrase!
      },
      console as any // Mock logger
    );

    console.log('🔍 Testing LN Markets API connection...');

    try {
      // Testar validação de credenciais
      console.log('1. Testing credentials validation...');
      const isValid = await lnmarketsService.validateCredentials();
      console.log(`✅ Credentials validation: ${isValid ? 'SUCCESS' : 'FAILED'}`);

      if (isValid) {
        // Testar obtenção de dados do usuário
        console.log('2. Testing getUser...');
        const userData = await lnmarketsService.getUser();
        console.log(`✅ User data retrieved:`, userData);

        // Testar obtenção de posições
        console.log('3. Testing getUserPositions...');
        const positions = await lnmarketsService.getUserPositions();
        console.log(`✅ Positions retrieved:`, positions);

        // Testar obtenção de saldo
        console.log('4. Testing getUserBalance...');
        const balance = await lnmarketsService.getUserBalance();
        console.log(`✅ Balance retrieved:`, balance);

        console.log('🎉 LN Markets integration test COMPLETED SUCCESSFULLY!');
      } else {
        console.log('❌ Credentials validation failed - cannot proceed with other tests');
      }

    } catch (error: any) {
      console.error('❌ LN Markets API error:', error.message);
      console.error('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing LN Markets integration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLNMarketsIntegration();
