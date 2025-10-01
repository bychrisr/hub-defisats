#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

async function main() {
  console.log('🔄 Migrando credenciais existentes para nova estrutura de exchanges...');
  
  try {
    const prisma = new PrismaClient();
    
    // Buscar usuários com credenciais LN Markets antigas
    const usersWithOldCredentials = await prisma.user.findMany({
      where: {
        AND: [
          { ln_markets_api_key: { not: null } },
          { ln_markets_api_secret: { not: null } },
          { ln_markets_passphrase: { not: null } }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true
      }
    });
    
    console.log(`📊 Usuários com credenciais antigas encontrados: ${usersWithOldCredentials.length}`);
    
    if (usersWithOldCredentials.length === 0) {
      console.log('✅ Nenhuma migração necessária - não há credenciais antigas');
      await prisma.$disconnect();
      return;
    }
    
    // Buscar exchange LN Markets
    const lnMarketsExchange = await prisma.exchange.findUnique({
      where: { slug: 'ln-markets' }
    });
    
    if (!lnMarketsExchange) {
      console.log('❌ Exchange LN Markets não encontrada! Execute o seeder primeiro.');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`🏢 Exchange LN Markets encontrada: ${lnMarketsExchange.name}`);
    
    let migratedCount = 0;
    
    for (const user of usersWithOldCredentials) {
      console.log(`\n👤 Migrando credenciais do usuário: ${user.email}`);
      
      // Verificar se já existe credencial para este usuário e exchange
      const existingCredential = await prisma.userExchangeCredentials.findUnique({
        where: {
          user_id_exchange_id: {
            user_id: user.id,
            exchange_id: lnMarketsExchange.id
          }
        }
      });
      
      if (existingCredential) {
        console.log(`   ⚠️  Credencial já existe para este usuário e exchange`);
        continue;
      }
      
      // Criar credencial na nova estrutura
      const credentials = {
        api_key: user.ln_markets_api_key,
        api_secret: user.ln_markets_api_secret,
        passphrase: user.ln_markets_passphrase
      };
      
      await prisma.userExchangeCredentials.create({
        data: {
          user_id: user.id,
          exchange_id: lnMarketsExchange.id,
          credentials: credentials,
          is_active: true,
          is_verified: false, // Será verificado quando o usuário fizer login
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      console.log(`   ✅ Credenciais migradas com sucesso`);
      migratedCount++;
    }
    
    console.log(`\n🎉 Migração concluída!`);
    console.log(`   📊 Total de usuários migrados: ${migratedCount}`);
    console.log(`   📊 Total de usuários processados: ${usersWithOldCredentials.length}`);
    
    // Verificar se a migração foi bem-sucedida
    const totalCredentials = await prisma.userExchangeCredentials.count({
      where: { exchange_id: lnMarketsExchange.id }
    });
    
    console.log(`   📊 Total de credenciais LN Markets no banco: ${totalCredentials}`);
    
    await prisma.$disconnect();
    
  } catch (error: any) {
    console.error('💥 Erro na migração:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
