// backend/src/services/AutomationService.ts
import { PrismaClient } from '@prisma/client';

export interface MarginGuardConfig {
  enabled: boolean;
  threshold: number; // 0.1 a 100
  action: 'add_margin' | 'close_position' | 'reduce_position';
  add_margin_amount?: number; // 0 a 100
  reduce_percentage?: number; // 0 a 100
}

export class AutomationService {
  private prisma = new PrismaClient();

  /**
   * Busca configuração do Margin Guard para um usuário
   */
  async getConfig(userId: string): Promise<MarginGuardConfig | null> {
    try {
      const automation = await this.prisma.automation.findFirst({
        where: {
          user_id: userId,
          type: 'margin_guard',
        },
      });

      // Retorna apenas a parte `config` ou null se não existir
      return automation?.config as MarginGuardConfig || null;
    } catch (error) {
      console.error('❌ AUTOMATION SERVICE - Erro ao buscar configuração:', error);
      throw new Error('Falha ao buscar configurações');
    }
  }

  /**
   * Salva configuração do Margin Guard para um usuário
   */
  async saveConfig(userId: string, config: MarginGuardConfig): Promise<void> {
    try {
      console.log('💾 AUTOMATION SERVICE - Salvando configuração:', { userId, config });

      // Verifica se já existe uma configuração para este usuário e tipo
      const existing = await this.prisma.automation.findFirst({
        where: { 
          user_id: userId, 
          type: 'margin_guard' 
        },
      });

      if (existing) {
        // Atualiza configuração existente
        await this.prisma.automation.update({
          where: { id: existing.id },
          data: {
            config: config,
            is_active: config.enabled, // O estado de ativo/desativado vem da configuração
            updated_at: new Date(),
          },
        });
        console.log('✅ AUTOMATION SERVICE - Configuração atualizada');
      } else {
        // Cria nova configuração
        await this.prisma.automation.create({
          data: {
            user_id: userId,
            type: 'margin_guard',
            config: config,
            is_active: config.enabled,
          },
        });
        console.log('✅ AUTOMATION SERVICE - Nova configuração criada');
      }
    } catch (error) {
      console.error('❌ AUTOMATION SERVICE - Erro ao salvar configuração:', error);
      throw new Error('Falha ao salvar configurações');
    }
  }

  /**
   * Busca todos os usuários com Margin Guard ativo para o worker
   */
  async getActiveUsers(): Promise<Array<{ userId: string; automationId: string; config: MarginGuardConfig }>> {
    try {
      const activeAutomations = await this.prisma.automation.findMany({
        where: { 
          type: 'margin_guard', 
          is_active: true 
        },
        select: { 
          user_id: true, 
          id: true, 
          config: true 
        },
      });

      return activeAutomations.map(auto => ({
        userId: auto.user_id,
        automationId: auto.id,
        config: auto.config as MarginGuardConfig,
      }));
    } catch (error) {
      console.error('❌ AUTOMATION SERVICE - Erro ao buscar usuários ativos:', error);
      throw new Error('Falha ao buscar usuários ativos');
    }
  }
}
