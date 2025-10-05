/**
 * Exchanges Seeder
 * 
 * Cria exchanges padrão do sistema
 * Inclui LN Markets e estrutura para futuras exchanges
 */

import { getPrisma } from '../lib/prisma';
import { Seeder, SeederResult } from './index';

interface ExchangeData {
  name: string;
  slug: string;
  description: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  api_version?: string;
  credential_types: {
    name: string;
    field_name: string;
    field_type: 'text' | 'password' | 'url' | 'number';
    is_required: boolean;
    description?: string;
    order: number;
  }[];
}

const defaultExchanges: ExchangeData[] = [
  {
    name: 'LN Markets',
    slug: 'ln-markets',
    description: 'The ultimate aggregation layer for Bitcoin derivatives',
    website: 'https://lnmarkets.com',
    logo_url: 'https://lnmarkets.com/favicon.ico',
    is_active: true,
    api_version: 'v2',
    credential_types: [
      {
        name: 'API Key',
        field_name: 'api_key',
        field_type: 'password',
        is_required: true,
        description: 'Your LN Markets API key',
        order: 1
      },
      {
        name: 'API Secret',
        field_name: 'api_secret',
        field_type: 'password',
        is_required: true,
        description: 'Your LN Markets API secret',
        order: 2
      },
      {
        name: 'Passphrase',
        field_name: 'passphrase',
        field_type: 'password',
        is_required: true,
        description: 'Your LN Markets passphrase',
        order: 3
      }
    ]
  }
];

export const exchangesSeeder: Seeder = {
  name: 'exchanges',
  description: 'Creates default cryptocurrency exchanges',

  async run(): Promise<SeederResult> {
    try {
      const prisma = await getPrisma();
      
      // Verificar se já existem exchanges
      const existingCount = await prisma.exchange.count();
      
      if (existingCount > 0) {
        return {
          success: true,
          message: `Exchanges already exist (${existingCount} records). Skipping seeding.`,
          count: existingCount
        };
      }

      let totalCreated = 0;

      // Inserir exchanges e seus tipos de credenciais
      for (const exchangeData of defaultExchanges) {
        // Criar exchange
        const exchange = await prisma.exchange.create({
          data: {
            name: exchangeData.name,
            slug: exchangeData.slug,
            description: exchangeData.description,
            website: exchangeData.website,
            logo_url: exchangeData.logo_url,
            is_active: exchangeData.is_active,
            api_version: exchangeData.api_version,
            created_at: new Date(),
            updated_at: new Date()
          }
        });

        // Criar tipos de credenciais para esta exchange
        for (const credentialType of exchangeData.credential_types) {
          await prisma.exchangeCredentialType.create({
            data: {
              exchange_id: exchange.id,
              name: credentialType.name,
              field_name: credentialType.field_name,
              field_type: credentialType.field_type,
              is_required: credentialType.is_required,
              description: credentialType.description,
              order: credentialType.order,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
        }

        totalCreated++;
      }

      // Verificar quantos foram realmente criados
      const finalExchangeCount = await prisma.exchange.count();
      const finalCredentialTypesCount = await prisma.exchangeCredentialType.count();

      return {
        success: true,
        message: `Successfully created ${finalExchangeCount} exchanges with ${finalCredentialTypesCount} credential types`,
        count: finalExchangeCount
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to seed exchanges: ${error.message}`,
        errors: [error.message]
      };
    }
  }
};
