import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleTradeData() {
  console.log('🚀 Creating sample trade data...');

  try {
    // Find the user brainoschris@gmail.com
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
    });

    if (!user) {
      console.log('❌ User brainoschris@gmail.com not found. Please create the user first.');
      return;
    }

    console.log('✅ Found user:', user.email, 'ID:', user.id);

    // Find or create automations for the user
    let marginGuardAutomation = await prisma.automation.findFirst({
      where: {
        user_id: user.id,
        type: 'margin_guard',
      },
    });

    if (!marginGuardAutomation) {
      marginGuardAutomation = await prisma.automation.create({
        data: {
          user_id: user.id,
          type: 'margin_guard',
          config: {
            margin_threshold: 80,
            action: 'close_position',
            enabled: true,
          },
          is_active: true,
        },
      });
      console.log('✅ Created margin guard automation');
    }

    let tpSlAutomation = await prisma.automation.findFirst({
      where: {
        user_id: user.id,
        type: 'tp_sl',
      },
    });

    if (!tpSlAutomation) {
      tpSlAutomation = await prisma.automation.create({
        data: {
          user_id: user.id,
          type: 'tp_sl',
          config: {
            take_profit_percentage: 5,
            stop_loss_percentage: 3,
            trailing_stop: false,
            enabled: true,
          },
          is_active: true,
        },
      });
      console.log('✅ Created TP/SL automation');
    }

    let autoEntryAutomation = await prisma.automation.findFirst({
      where: {
        user_id: user.id,
        type: 'auto_entry',
      },
    });

    if (!autoEntryAutomation) {
      autoEntryAutomation = await prisma.automation.create({
        data: {
          user_id: user.id,
          type: 'auto_entry',
          config: {
            entry_condition: 'rsi_oversold',
            rsi_period: 14,
            rsi_threshold: 30,
            position_size: 0.1,
            enabled: true,
          },
          is_active: true,
        },
      });
      console.log('✅ Created auto entry automation');
    }

    // Create sample trade logs
    const sampleTradeLogs = [
      // Recent successful trades
      {
        trade_id: 'trade_001_' + Date.now(),
        automation_id: marginGuardAutomation.id,
        status: 'success' as const,
        executed_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        trade_id: 'trade_002_' + Date.now(),
        automation_id: tpSlAutomation.id,
        status: 'success' as const,
        executed_at: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        trade_id: 'trade_003_' + Date.now(),
        automation_id: autoEntryAutomation.id,
        status: 'success' as const,
        executed_at: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      // Some error trades
      {
        trade_id: 'trade_004_' + Date.now(),
        automation_id: marginGuardAutomation.id,
        status: 'app_error' as const,
        error_message: 'Insufficient margin for position closure',
        executed_at: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      },
      {
        trade_id: 'trade_005_' + Date.now(),
        automation_id: tpSlAutomation.id,
        status: 'exchange_error' as const,
        error_message: 'LN Markets API rate limit exceeded',
        executed_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      // Older trades
      {
        trade_id: 'trade_006_' + Date.now(),
        automation_id: autoEntryAutomation.id,
        status: 'success' as const,
        executed_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        trade_id: 'trade_007_' + Date.now(),
        automation_id: marginGuardAutomation.id,
        status: 'success' as const,
        executed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        trade_id: 'trade_008_' + Date.now(),
        automation_id: tpSlAutomation.id,
        status: 'app_error' as const,
        error_message: 'Position not found',
        executed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        trade_id: 'trade_009_' + Date.now(),
        automation_id: autoEntryAutomation.id,
        status: 'success' as const,
        executed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        trade_id: 'trade_010_' + Date.now(),
        automation_id: marginGuardAutomation.id,
        status: 'success' as const,
        executed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    // Insert trade logs
    for (const tradeLog of sampleTradeLogs) {
      await prisma.tradeLog.create({
        data: {
          user_id: user.id,
          ...tradeLog,
        },
      });
    }

    console.log('✅ Created', sampleTradeLogs.length, 'sample trade logs');

    // Update user's last activity
    await prisma.user.update({
      where: { id: user.id },
      data: { last_activity_at: new Date() },
    });

    console.log('✅ Updated user last activity');

    // Show summary
    const stats = await prisma.tradeLog.groupBy({
      by: ['status'],
      where: { user_id: user.id },
      _count: { status: true },
    });

    console.log('📊 Trade Log Statistics:');
    stats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.status}`);
    });

    console.log('🎉 Sample trade data created successfully!');

  } catch (error) {
    console.error('❌ Error creating sample trade data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleTradeData();

