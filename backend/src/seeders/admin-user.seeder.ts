/**
 * Admin User Seeder
 * 
 * Cria usuários administrativos padrão
 * Inclui superadmin e admin básico
 */

import { getPrisma } from '../lib/prisma';
import { Seeder, SeederResult } from './index';
import bcrypt from 'bcrypt';

interface AdminUserData {
  email: string;
  password: string;
  username: string;
  role: 'superadmin' | 'admin';
  isActive: boolean;
}

const defaultAdminUsers: AdminUserData[] = [
  {
    email: 'admin@axisor.com',
    password: 'Admin123!@#',
    username: 'admin',
    role: 'superadmin',
    isActive: true
  },
  {
    email: 'support@axisor.com',
    password: 'Support123!@#',
    username: 'support',
    role: 'admin',
    isActive: true
  }
];

export const adminUserSeeder: Seeder = {
  name: 'admin-user',
  description: 'Creates default admin users (superadmin and admin)',

  async run(): Promise<SeederResult> {
    try {
      const prisma = await getPrisma();
      const createdUsers: string[] = [];
      const errors: string[] = [];

      for (const userData of defaultAdminUsers) {
        try {
          // Verificar se usuário já existe
          const existingUser = await prisma.user.findUnique({
            where: { email: userData.email }
          });

          if (existingUser) {
            console.log(`⚠️  User ${userData.email} already exists, skipping...`);
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
              plan_type: 'free',
              is_active: userData.isActive,
              email_verified: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          });

          // Criar registro de admin
          await prisma.adminUser.create({
            data: {
              user_id: user.id,
              role: userData.role,
              created_at: new Date()
            }
          });

          createdUsers.push(userData.email);
          console.log(`✅ Created admin user: ${userData.email} (${userData.role})`);

        } catch (userError: any) {
          const errorMsg = `Failed to create user ${userData.email}: ${userError.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      if (createdUsers.length === 0 && errors.length === 0) {
        return {
          success: true,
          message: 'All admin users already exist. No new users created.',
          count: 0
        };
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Successfully created ${createdUsers.length} admin users`
          : `Created ${createdUsers.length} users, ${errors.length} errors`,
        count: createdUsers.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to seed admin users: ${error.message}`,
        errors: [error.message]
      };
    }
  }
};