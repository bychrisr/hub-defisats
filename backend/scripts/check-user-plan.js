const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserPlan() {
  try {
    console.log('🔍 Checking user brainoschris@gmail.com...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
      select: {
        id: true,
        email: true,
        plan_type: true,
        created_at: true,
        is_active: true,
        _count: {
          select: {
            automations: true,
            exchange_accounts: true,
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User brainoschris@gmail.com not found');
      return;
    }

    console.log('✅ User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Plan Type: ${user.plan_type}`);
    console.log(`  Created: ${user.created_at}`);
    console.log(`  Active: ${user.is_active}`);
    console.log(`  Automations: ${user._count.automations}`);
    console.log(`  Exchange Accounts: ${user._count.exchange_accounts}`);

    // Get Margin Guard automations
    const marginGuardAutomations = await prisma.automation.findMany({
      where: {
        user_id: user.id,
        type: 'margin_guard'
      },
      include: {
        user_exchange_account: {
          include: {
            exchange: true
          }
        }
      }
    });

    console.log(`\n🛡️ Margin Guard Automations: ${marginGuardAutomations.length}`);
    marginGuardAutomations.forEach((automation, index) => {
      console.log(`  ${index + 1}. ID: ${automation.id}`);
      console.log(`     Active: ${automation.is_active}`);
      console.log(`     Account: ${automation.user_exchange_account?.account_name || 'N/A'}`);
      console.log(`     Exchange: ${automation.user_exchange_account?.exchange?.name || 'N/A'}`);
      console.log(`     Config: ${JSON.stringify(automation.config, null, 2)}`);
    });

    // Get automation logs for this user (if table exists)
    try {
      const automationLogs = await prisma.automationLog.findMany({
        where: {
          automation: {
            user_id: user.id,
            type: 'margin_guard'
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 5
      });

      console.log(`\n📊 Recent Margin Guard Logs: ${automationLogs.length}`);
      automationLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.created_at.toISOString()}`);
        console.log(`     Action: ${log.action}`);
        console.log(`     Status: ${log.status}`);
        console.log(`     Message: ${log.message || 'N/A'}`);
      });
    } catch (error) {
      console.log('\n📊 Automation logs table not available or empty');
    }

  } catch (error) {
    console.error('❌ Error checking user plan:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPlan();
