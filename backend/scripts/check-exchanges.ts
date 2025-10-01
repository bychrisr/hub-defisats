#!/usr/bin/env ts-node

/**
 * Script para verificar se as exchanges foram criadas corretamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExchanges() {
  try {
    console.log('🔍 Verificando exchanges no banco de dados...');
    
    // Verificar exchanges
    const exchanges = await prisma.exchange.findMany({
      include: {
        credential_types: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log(`📊 Total de exchanges: ${exchanges.length}`);
    
    exchanges.forEach(exchange => {
      console.log(`\n🏢 Exchange: ${exchange.name}`);
      console.log(`   Slug: ${exchange.slug}`);
      console.log(`   Descrição: ${exchange.description}`);
      console.log(`   Website: ${exchange.website}`);
      console.log(`   Ativo: ${exchange.is_active}`);
      console.log(`   API Version: ${exchange.api_version}`);
      console.log(`   Tipos de credenciais: ${exchange.credential_types.length}`);
      
      exchange.credential_types.forEach(credType => {
        console.log(`     - ${credType.name} (${credType.field_name}): ${credType.field_type} ${credType.is_required ? '[OBRIGATÓRIO]' : '[OPCIONAL]'}`);
      });
    });
    
    // Verificar se há dados de usuários com credenciais
    const userCredentials = await prisma.userExchangeCredentials.count();
    console.log(`\n👥 Credenciais de usuários: ${userCredentials}`);
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error: any) {
    console.error('❌ Erro na verificação:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkExchanges();
