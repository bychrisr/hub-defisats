/**
 * Database Seeders
 * 
 * Sistema para popular banco de dados vazio com dados padrão
 * Útil para desenvolvimento, testes e deploy inicial
 */

import { getPrisma } from '../lib/prisma';
import { rateLimitConfigSeeder } from './rate-limit-config.seeder';
import { adminUserSeeder } from './admin-user.seeder';
import { testUserSeeder } from './test-user.seeder';
import { plansSeeder } from './plans.seeder';
import { healthCheckSeeder } from './health-check.seeder';
import { exchangesSeeder } from './exchanges.seeder';

export interface SeederResult {
  success: boolean;
  message: string;
  count?: number;
  errors?: string[];
}

export interface Seeder {
  name: string;
  description: string;
  run(): Promise<SeederResult>;
}

export class DatabaseSeeder {
  private prisma: any;
  private seeders: Seeder[] = [];

  constructor() {
    this.seeders = [
      rateLimitConfigSeeder,
      adminUserSeeder,
      testUserSeeder,
      plansSeeder,
      healthCheckSeeder,
      exchangesSeeder,
    ];
  }

  async initialize() {
    this.prisma = await getPrisma();
  }

  async runAll(): Promise<SeederResult[]> {
    const results: SeederResult[] = [];
    
    console.log('🌱 Starting database seeding...');
    
    for (const seeder of this.seeders) {
      try {
        console.log(`📦 Running seeder: ${seeder.name}`);
        const result = await seeder.run();
        results.push(result);
        
        if (result.success) {
          console.log(`✅ ${seeder.name}: ${result.message}`);
        } else {
          console.log(`❌ ${seeder.name}: ${result.message}`);
        }
      } catch (error: any) {
        console.error(`💥 Error in ${seeder.name}:`, error);
        results.push({
          success: false,
          message: `Seeder failed: ${error.message}`,
          errors: [error.message]
        });
      }
    }
    
    console.log('🌱 Database seeding completed!');
    return results;
  }

  async runSpecific(seederName: string): Promise<SeederResult> {
    const seeder = this.seeders.find(s => s.name === seederName);
    
    if (!seeder) {
      return {
        success: false,
        message: `Seeder '${seederName}' not found`
      };
    }

    try {
      console.log(`📦 Running specific seeder: ${seeder.name}`);
      const result = await seeder.run();
      
      if (result.success) {
        console.log(`✅ ${seeder.name}: ${result.message}`);
      } else {
        console.log(`❌ ${seeder.name}: ${result.message}`);
      }
      
      return result;
    } catch (error: any) {
      console.error(`💥 Error in ${seeder.name}:`, error);
      return {
        success: false,
        message: `Seeder failed: ${error.message}`,
        errors: [error.message]
      };
    }
  }

  listSeeders(): { name: string; description: string }[] {
    return this.seeders.map(s => ({
      name: s.name,
      description: s.description
    }));
  }
}

// CLI interface para executar seeders
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  
  const command = process.argv[2];
  const seederName = process.argv[3];
  
  async function main() {
    await seeder.initialize();
    
    switch (command) {
      case 'all':
        await seeder.runAll();
        break;
      case 'specific':
        if (!seederName) {
          console.log('❌ Please provide seeder name');
          console.log('Available seeders:', seeder.listSeeders());
          process.exit(1);
        }
        await seeder.runSpecific(seederName);
        break;
      case 'list':
        console.log('📋 Available seeders:');
        seeder.listSeeders().forEach(s => {
          console.log(`  • ${s.name}: ${s.description}`);
        });
        break;
      default:
        console.log('🌱 Database Seeder CLI');
        console.log('');
        console.log('Usage:');
        console.log('  npm run seed all                    # Run all seeders');
        console.log('  npm run seed specific <name>        # Run specific seeder');
        console.log('  npm run seed list                    # List available seeders');
        console.log('');
        console.log('Examples:');
        console.log('  npm run seed all');
        console.log('  npm run seed specific rate-limit-config');
        console.log('  npm run seed list');
    }
  }
  
  main().catch(console.error);
}
