/**
 * Test User Seeder
 * 
 * Cria usuários de teste para desenvolvimento
 * Inclui usuário com plano vitalício para testes
 */

import { getPrisma } from '../lib/prisma';
import { Seeder, SeederResult } from './index';
import bcrypt from 'bcrypt';

interface TestUserData {
  email: string;
  password: string;
  username: string;
  planType: 'free' | 'pro' | 'enterprise' | 'lifetime';
  isActive: boolean;
}

const defaultTestUsers: TestUserData[] = [
  {
    email: 'brainoschris@gmail.com',
    password: 'TestPassword123!',
    username: 'brainoschris',
    planType: 'lifetime',
    isActive: true
  }
];

export const testUserSeeder: Seeder = {
  name: 'test-user',
  description: 'Creates test users for development (including lifetime plan user)',

  async run(): Promise<SeederResult> {
    try {
      const prisma = await getPrisma();
      const createdUsers: string[] = [];
      const errors: string[] = [];

      for (const userData of defaultTestUsers) {
        try {
          // Verificar se usuário já existe
          const existingUser = await prisma.user.findUnique({
            where: { email: userData.email }
          });

          if (existingUser) {
            console.log(`⚠️  Test user ${userData.email} already exists, skipping...`);
            continue;
          }

          // Hash da senha
          const saltRounds = 12;
          const passwordHash = await bcrypt.hash(userData.password, saltRounds);

          // Criar usuário
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              password_hash: passwordHash,
              username: userData.username,
              plan_type: userData.planType,
              is_active: userData.isActive,
              email_verified: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          });

          createdUsers.push(userData.email);
          console.log(`✅ Created test user: ${userData.email} (${userData.planType})`);

        } catch (userError: any) {
          const errorMsg = `Failed to create test user ${userData.email}: ${userError.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      if (createdUsers.length === 0 && errors.length === 0) {
        return {
          success: true,
          message: 'All test users already exist. No new users created.',
          count: 0
        };
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Successfully created ${createdUsers.length} test users`
          : `Created ${createdUsers.length} users, ${errors.length} errors`,
        count: createdUsers.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to seed test users: ${error.message}`,
        errors: [error.message]
      };
    }
  }
};
