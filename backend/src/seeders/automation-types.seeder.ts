/**
 * Automation Types Seeder
 * 
 * Popula os tipos de automação disponíveis no sistema
 * Inclui Margin Guard, Take Profit/Stop Loss e Automatic Entries
 */

import { getPrisma } from '../lib/prisma';
import { Seeder, SeederResult } from './index';

interface AutomationTypeData {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

const defaultAutomationTypes: AutomationTypeData[] = [
  {
    name: 'Margin Guard',
    slug: 'margin_guard',
    description: 'Automatically manages margin levels to prevent liquidation. Monitors position margin and takes protective actions when thresholds are reached.',
    isActive: true
  },
  {
    name: 'Take Profit / Stop Loss',
    slug: 'tp_sl',
    description: 'Automatically closes positions when profit targets are reached or stop loss levels are hit. Includes trailing stop functionality.',
    isActive: true
  },
  {
    name: 'Automatic Entries',
    slug: 'auto_entry',
    description: 'Automatically opens new positions based on technical indicators and market conditions. Includes RSI, price levels, and other entry signals.',
    isActive: true
  }
];

export const automationTypesSeeder: Seeder = {
  name: 'automation-types',
  description: 'Populates automation types (Margin Guard, TP/SL, Auto Entry)',

  async run(): Promise<SeederResult> {
    try {
      const prisma = await getPrisma();
      const createdTypes: string[] = [];
      const errors: string[] = [];

      console.log('🚀 AUTOMATION TYPES - Starting automation types seeding...');

      for (const typeData of defaultAutomationTypes) {
        try {
          // Verificar se o tipo já existe
          const existingType = await prisma.automationType.findUnique({
            where: { slug: typeData.slug }
          });

          if (existingType) {
            console.log(`📋 AUTOMATION TYPES - Type ${typeData.name} already exists, updating...`);
            
            await prisma.automationType.update({
              where: { id: existingType.id },
              data: {
                name: typeData.name,
                description: typeData.description,
                is_active: typeData.isActive,
                updated_at: new Date(),
              }
            });
            
            createdTypes.push(existingType.id);
            console.log(`✅ AUTOMATION TYPES - Updated type: ${typeData.name}`);
          } else {
            console.log(`🚀 AUTOMATION TYPES - Creating type: ${typeData.name}`);
            
            const createdType = await prisma.automationType.create({
              data: {
                name: typeData.name,
                slug: typeData.slug,
                description: typeData.description,
                is_active: typeData.isActive,
                created_at: new Date(),
                updated_at: new Date(),
              }
            });
            
            createdTypes.push(createdType.id);
            console.log(`✅ AUTOMATION TYPES - Created type: ${typeData.name} (ID: ${createdType.id})`);
          }

        } catch (error: any) {
          const errorMsg = `Failed to create/update automation type ${typeData.name}: ${error.message}`;
          console.error('❌ AUTOMATION TYPES -', errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`📊 AUTOMATION TYPES - Final counts: { created/updated: ${createdTypes.length}, errors: ${errors.length} }`);

      if (errors.length > 0) {
        return {
          success: false,
          message: `Automation types seeding completed with errors. Created/Updated ${createdTypes.length} types, ${errors.length} errors occurred.`,
          count: createdTypes.length,
          errors
        };
      }

      return {
        success: true,
        message: `Automation types seeding completed successfully. Created/Updated ${createdTypes.length} automation types.`,
        count: createdTypes.length
      };

    } catch (error: any) {
      console.error('❌ AUTOMATION TYPES - Error during seeding:', error);
      return {
        success: false,
        message: error.message || 'Failed to seed automation types',
        errors: [error.message]
      };
    }
  }
};
