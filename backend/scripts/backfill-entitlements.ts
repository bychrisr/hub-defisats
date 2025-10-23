#!/usr/bin/env tsx

/**
 * Script de Backfill de Entitlements
 * Adiciona entitlements FREE para todos usuários sem entitlements
 * Marca demo_mode=false para usuários já verificados
 * Gera relatório de usuários sem email_verified
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BackfillReport {
  totalUsers: number;
  usersWithoutEntitlements: number;
  usersWithoutEmailVerified: number;
  entitlementsCreated: number;
  entitlementsUpdated: number;
  errors: string[];
}

async function backfillEntitlements(): Promise<BackfillReport> {
  console.log('🔄 Iniciando backfill de entitlements...');
  
  const report: BackfillReport = {
    totalUsers: 0,
    usersWithoutEntitlements: 0,
    usersWithoutEmailVerified: 0,
    entitlementsCreated: 0,
    entitlementsUpdated: 0,
    errors: []
  };

  try {
    // 1. Contar total de usuários
    report.totalUsers = await prisma.user.count();
    console.log(`📊 Total de usuários: ${report.totalUsers}`);

    // 2. Buscar usuários sem entitlements
    const usersWithoutEntitlements = await prisma.user.findMany({
      where: {
        user_entitlements: null
      },
      select: {
        id: true,
        email: true,
        email_verified: true,
        account_status: true,
        plan_type: true
      }
    });

    report.usersWithoutEntitlements = usersWithoutEntitlements.length;
    console.log(`👥 Usuários sem entitlements: ${report.usersWithoutEntitlements}`);

    // 3. Contar usuários sem email_verified
    const usersWithoutEmailVerified = await prisma.user.count({
      where: {
        email_verified: false
      }
    });
    report.usersWithoutEmailVerified = usersWithoutEmailVerified;
    console.log(`📧 Usuários sem email verificado: ${report.usersWithoutEmailVerified}`);

    // 4. Criar entitlements para usuários sem entitlements
    console.log('\n🔧 Criando entitlements...');
    
    for (const user of usersWithoutEntitlements) {
      try {
        // Determinar se deve estar em demo_mode
        const demoMode = !user.email_verified;
        
        // Mapear plan_type para plan string
        const planMap: Record<string, string> = {
          'free': 'FREE',
          'basic': 'BASIC', 
          'advanced': 'ADVANCED',
          'pro': 'PRO',
          'lifetime': 'LIFETIME'
        };
        
        const plan = planMap[user.plan_type] || 'FREE';
        const featureSet = plan.toLowerCase();

        await prisma.userEntitlements.create({
          data: {
            user_id: user.id,
            plan,
            feature_set: featureSet,
            demo_mode: demoMode
          }
        });

        report.entitlementsCreated++;
        console.log(`✅ Entitlement criado para ${user.email} (${plan}, demo: ${demoMode})`);

      } catch (error) {
        const errorMsg = `Erro ao criar entitlement para ${user.email}: ${error}`;
        report.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // 5. Atualizar entitlements existentes se necessário
    console.log('\n🔄 Verificando entitlements existentes...');
    
    const existingEntitlements = await prisma.userEntitlements.findMany({
      include: {
        user: {
          select: {
            email_verified: true,
            plan_type: true
          }
        }
      }
    });

    for (const entitlement of existingEntitlements) {
      try {
        const shouldUpdate = 
          entitlement.demo_mode !== !entitlement.user.email_verified ||
          entitlement.plan !== (entitlement.user.plan_type?.toUpperCase() || 'FREE');

        if (shouldUpdate) {
          const planMap: Record<string, string> = {
            'free': 'FREE',
            'basic': 'BASIC',
            'advanced': 'ADVANCED', 
            'pro': 'PRO',
            'lifetime': 'LIFETIME'
          };
          
          const plan = planMap[entitlement.user.plan_type] || 'FREE';
          const featureSet = plan.toLowerCase();
          const demoMode = !entitlement.user.email_verified;

          await prisma.userEntitlements.update({
            where: { id: entitlement.id },
            data: {
              plan,
              feature_set: featureSet,
              demo_mode: demoMode,
              updated_at: new Date()
            }
          });

          report.entitlementsUpdated++;
          console.log(`🔄 Entitlement atualizado para user_id: ${entitlement.user_id}`);
        }

      } catch (error) {
        const errorMsg = `Erro ao atualizar entitlement ${entitlement.id}: ${error}`;
        report.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // 6. Gerar relatório final
    console.log('\n📋 Relatório Final:');
    console.log(`   Total de usuários: ${report.totalUsers}`);
    console.log(`   Usuários sem entitlements: ${report.usersWithoutEntitlements}`);
    console.log(`   Usuários sem email verificado: ${report.usersWithoutEmailVerified}`);
    console.log(`   Entitlements criados: ${report.entitlementsCreated}`);
    console.log(`   Entitlements atualizados: ${report.entitlementsUpdated}`);
    console.log(`   Erros: ${report.errors.length}`);

    if (report.errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      report.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n🎉 Backfill de entitlements concluído!');

    return report;

  } catch (error) {
    console.error('❌ Erro fatal no backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  backfillEntitlements()
    .then((report) => {
      console.log('\n📊 Relatório final:', report);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { backfillEntitlements };
