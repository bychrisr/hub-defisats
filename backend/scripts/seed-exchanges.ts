#!/usr/bin/env ts-node

/**
 * Script para executar apenas o seeder de exchanges
 * 
 * Uso:
 *   npm run seed:exchanges
 *   ou
 *   npx ts-node scripts/seed-exchanges.ts
 */

import { exchangesSeeder } from '../src/seeders/exchanges.seeder';

async function main() {
  console.log('🌱 Executando seeder de exchanges...');
  
  try {
    const result = await exchangesSeeder.run();
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      if (result.count) {
        console.log(`📊 Registros criados: ${result.count}`);
      }
    } else {
      console.error(`❌ ${result.message}`);
      if (result.errors) {
        result.errors.forEach(error => console.error(`   - ${error}`));
      }
      process.exit(1);
    }
  } catch (error: any) {
    console.error('💥 Erro inesperado:', error.message);
    process.exit(1);
  }
}

main();
