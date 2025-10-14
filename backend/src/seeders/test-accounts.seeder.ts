import { PrismaClient } from '@prisma/client';

export async function seedTestAccounts(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Starting test accounts seeder...');

  try {
    // 1. Criar usuário de teste principal
    const testUser = await prisma.user.upsert({
      where: { email: 'brainoschris@gmail.com' },
      update: {
        plan_type: 'lifetime',
        is_active: true
      },
      create: {
        email: 'brainoschris@gmail.com',
        username: 'brainoschris',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4QjXQ9hQ8m', // TestPassword123!
        plan_type: 'lifetime',
        is_active: true,
        email_verified: true
      }
    });

    console.log('✅ Test user created/updated:', testUser.email);

    // 2. Buscar exchange LN Markets
    const lnMarketsExchange = await prisma.exchange.findFirst({
      where: { slug: 'ln-markets' }
    });

    if (!lnMarketsExchange) {
      console.error('❌ LN Markets exchange not found. Run exchanges seeder first.');
      return;
    }

    // 3. Criar conta testnet ativa
    const testnetAccount = await prisma.userExchangeAccounts.upsert({
      where: {
        id: `testnet-${testUser.id}`
      },
      update: {
        is_active: true,
        is_verified: true,
        credentials: {
          'API Key': 'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
          'API Secret': 'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
          'Passphrase': 'a6c1bh56jc33',
          isTestnet: 'true',
          testnet: 'true'
        }
      },
      create: {
        id: `testnet-${testUser.id}`,
        user_id: testUser.id,
        exchange_id: lnMarketsExchange.id,
        account_name: 'LN Markets Testnet',
        credentials: {
          'API Key': 'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
          'API Secret': 'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
          'Passphrase': 'a6c1bh56jc33',
          isTestnet: 'true',
          testnet: 'true'
        },
        is_active: true,
        is_verified: true
      }
    });

    console.log('✅ Testnet account created/updated:', testnetAccount.account_name);

    // 4. Criar conta mainnet inativa (para teste de múltiplas contas)
    const mainnetAccount = await prisma.userExchangeAccounts.upsert({
      where: {
        id: `mainnet-${testUser.id}`
      },
      update: {
        is_active: false,
        is_verified: false,
        credentials: {
          'API Key': 'mainnet_api_key_placeholder',
          'API Secret': 'mainnet_api_secret_placeholder',
          'Passphrase': 'mainnet_passphrase_placeholder',
          isTestnet: 'false',
          testnet: 'false'
        }
      },
      create: {
        id: `mainnet-${testUser.id}`,
        user_id: testUser.id,
        exchange_id: lnMarketsExchange.id,
        account_name: 'LN Markets Mainnet',
        credentials: {
          'API Key': 'mainnet_api_key_placeholder',
          'API Secret': 'mainnet_api_secret_placeholder',
          'Passphrase': 'mainnet_passphrase_placeholder',
          isTestnet: 'false',
          testnet: 'false'
        },
        is_active: false,
        is_verified: false
      }
    });

    console.log('✅ Mainnet account created/updated:', mainnetAccount.account_name);

    // 5. Criar usuário admin de teste
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@axisor.com' },
      update: {
        plan_type: 'lifetime',
        is_active: true
      },
      create: {
        email: 'admin@axisor.com',
        username: 'admin',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4QjXQ9hQ8m', // AdminPassword123!
        plan_type: 'lifetime',
        is_active: true,
        email_verified: true
      }
    });

    console.log('✅ Admin user created/updated:', adminUser.email);

    // 6. Criar conta admin testnet
    const adminTestnetAccount = await prisma.userExchangeAccounts.upsert({
      where: {
        id: `admin-testnet-${adminUser.id}`
      },
      update: {
        is_active: true,
        is_verified: true,
        credentials: {
          'API Key': 'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
          'API Secret': 'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
          'Passphrase': 'a6c1bh56jc33',
          isTestnet: 'true',
          testnet: 'true'
        }
      },
      create: {
        id: `admin-testnet-${adminUser.id}`,
        user_id: adminUser.id,
        exchange_id: lnMarketsExchange.id,
        account_name: 'Admin Testnet',
        credentials: {
          'API Key': 'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
          'API Secret': 'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
          'Passphrase': 'a6c1bh56jc33',
          isTestnet: 'true',
          testnet: 'true'
        },
        is_active: true,
        is_verified: true
      }
    });

    console.log('✅ Admin testnet account created/updated:', adminTestnetAccount.account_name);

    // 7. Criar registro de admin_user
    await prisma.adminUser.upsert({
      where: { user_id: adminUser.id },
      update: {
        role: 'superadmin'
      },
      create: {
        user_id: adminUser.id,
        role: 'superadmin'
      }
    });

    console.log('✅ Admin role assigned to:', adminUser.email);

    console.log('🎉 Test accounts seeder completed successfully!');
    console.log('📋 Created accounts:');
    console.log('  - User: brainoschris@gmail.com (TestPassword123!)');
    console.log('  - Admin: admin@axisor.com (AdminPassword123!)');
    console.log('  - Testnet account: LN Markets Testnet (active)');
    console.log('  - Mainnet account: LN Markets Mainnet (inactive)');
    console.log('  - Admin testnet account: Admin Testnet (active)');

  } catch (error) {
    console.error('❌ Error seeding test accounts:', error);
    throw error;
  }
}
