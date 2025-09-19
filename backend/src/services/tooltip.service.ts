import { PrismaClient } from '@prisma/client';

export interface TooltipConfig {
  id: string;
  card_key: string;
  tooltip_text: string;
  tooltip_position: 'top' | 'bottom' | 'left' | 'right';
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface DashboardCard {
  id: string;
  key: string;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
  order_index: number;
  is_active: boolean;
  is_admin_only: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CreateTooltipConfigData {
  card_key: string;
  tooltip_text: string;
  tooltip_position?: 'top' | 'bottom' | 'left' | 'right';
  is_enabled?: boolean;
  created_by?: string;
}

export interface UpdateTooltipConfigData {
  tooltip_text?: string;
  tooltip_position?: 'top' | 'bottom' | 'left' | 'right';
  is_enabled?: boolean;
  updated_by?: string;
}

export interface CreateDashboardCardData {
  key: string;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
  order_index?: number;
  is_active?: boolean;
  is_admin_only?: boolean;
  created_by?: string;
}

export interface UpdateDashboardCardData {
  title?: string;
  description?: string;
  icon?: string;
  category?: string;
  order_index?: number;
  is_active?: boolean;
  is_admin_only?: boolean;
  updated_by?: string;
}

export class TooltipService {
  constructor(private prisma: PrismaClient) {}

  // Tooltip Config CRUD
  async createTooltipConfig(data: CreateTooltipConfigData): Promise<TooltipConfig> {
    return await this.prisma.tooltipConfig.create({
      data: {
        card_key: data.card_key,
        tooltip_text: data.tooltip_text,
        tooltip_position: data.tooltip_position || 'top',
        is_enabled: data.is_enabled ?? true,
        created_by: data.created_by,
      },
    });
  }

  async getTooltipConfig(cardKey: string): Promise<TooltipConfig | null> {
    return await this.prisma.tooltipConfig.findUnique({
      where: { card_key: cardKey },
    });
  }

  async getAllTooltipConfigs(): Promise<TooltipConfig[]> {
    return await this.prisma.tooltipConfig.findMany({
      orderBy: { card_key: 'asc' },
    });
  }

  async updateTooltipConfig(cardKey: string, data: UpdateTooltipConfigData): Promise<TooltipConfig> {
    return await this.prisma.tooltipConfig.update({
      where: { card_key: cardKey },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async deleteTooltipConfig(cardKey: string): Promise<void> {
    await this.prisma.tooltipConfig.delete({
      where: { card_key: cardKey },
    });
  }

  // Dashboard Card CRUD
  async createDashboardCard(data: CreateDashboardCardData): Promise<DashboardCard> {
    return await this.prisma.dashboardCard.create({
      data: {
        key: data.key,
        title: data.title,
        description: data.description,
        icon: data.icon,
        category: data.category,
        order_index: data.order_index || 0,
        is_active: data.is_active ?? true,
        is_admin_only: data.is_admin_only ?? false,
        created_by: data.created_by,
      },
    });
  }

  async getDashboardCard(key: string): Promise<DashboardCard | null> {
    return await this.prisma.dashboardCard.findUnique({
      where: { key },
    });
  }

  async getAllDashboardCards(category?: string, isActive?: boolean): Promise<DashboardCard[]> {
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    return await this.prisma.dashboardCard.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { order_index: 'asc' },
        { title: 'asc' },
      ],
    });
  }

  async updateDashboardCard(key: string, data: UpdateDashboardCardData): Promise<DashboardCard> {
    return await this.prisma.dashboardCard.update({
      where: { key },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async deleteDashboardCard(key: string): Promise<void> {
    await this.prisma.dashboardCard.delete({
      where: { key },
    });
  }

  async reorderDashboardCards(cardKeys: string[], updatedBy?: string): Promise<void> {
    const updatePromises = cardKeys.map((key, index) =>
      this.prisma.dashboardCard.update({
        where: { key },
        data: {
          order_index: index,
          updated_by: updatedBy,
          updated_at: new Date(),
        },
      })
    );

    await Promise.all(updatePromises);
  }

  // Métodos utilitários
  async getCardWithTooltip(cardKey: string): Promise<(DashboardCard & { tooltip?: TooltipConfig }) | null> {
    const card = await this.getDashboardCard(cardKey);
    if (!card) return null;

    const tooltip = await this.getTooltipConfig(cardKey);
    
    return {
      ...card,
      tooltip: tooltip || undefined,
    };
  }

  async getCardsWithTooltips(category?: string, isActive?: boolean): Promise<(DashboardCard & { tooltip?: TooltipConfig })[]> {
    const cards = await this.getAllDashboardCards(category, isActive);
    
    const cardsWithTooltips = await Promise.all(
      cards.map(async (card) => {
        const tooltip = await this.getTooltipConfig(card.key);
        return {
          ...card,
          tooltip: tooltip || undefined,
        };
      })
    );

    return cardsWithTooltips;
  }

  // Inicializar dados padrão
  async initializeDefaultCards(adminId?: string): Promise<void> {
    const defaultCards = [
      {
        key: 'total_margin',
        title: 'Margem Total',
        description: 'Margem utilizada',
        icon: 'Wallet',
        category: 'positions',
        order_index: 0,
      },
      {
        key: 'estimated_fees',
        title: 'Taxas Estimadas',
        description: 'Taxas das posições ativas',
        icon: 'DollarSign',
        category: 'positions',
        order_index: 1,
      },
      {
        key: 'available_margin',
        title: 'Margem disponível',
        description: 'Saldo da conta LN Markets',
        icon: 'Wallet',
        category: 'balance',
        order_index: 0,
      },
      {
        key: 'total_invested',
        title: 'Total Investido',
        description: 'Valor total investido',
        icon: 'Target',
        category: 'history',
        order_index: 0,
      },
      {
        key: 'fees_paid',
        title: 'Taxas Pagas',
        description: 'Taxas em operações',
        icon: 'DollarSign',
        category: 'history',
        order_index: 1,
      },
    ];

    for (const cardData of defaultCards) {
      const existingCard = await this.getDashboardCard(cardData.key);
      if (!existingCard) {
        await this.createDashboardCard({
          ...cardData,
          created_by: adminId,
        });
      }
    }
  }

  async initializeDefaultTooltips(adminId?: string): Promise<void> {
    const defaultTooltips = [
      {
        card_key: 'total_margin',
        tooltip_text: 'Valor total da margem utilizada em todas as posições ativas. Representa o capital comprometido com as operações.',
        tooltip_position: 'top' as const,
      },
      {
        card_key: 'estimated_fees',
        tooltip_text: 'Taxas estimadas que serão cobradas pelas posições ativas. Inclui taxas de trading e funding.',
        tooltip_position: 'top' as const,
      },
      {
        card_key: 'available_margin',
        tooltip_text: 'Saldo disponível na sua conta LN Markets. Este valor pode ser usado para abrir novas posições.',
        tooltip_position: 'top' as const,
      },
      {
        card_key: 'total_invested',
        tooltip_text: 'Valor total que você investiu na plataforma. Inclui todos os depósitos e investimentos realizados.',
        tooltip_position: 'top' as const,
      },
      {
        card_key: 'fees_paid',
        tooltip_text: 'Total de taxas pagas em todas as operações realizadas. Inclui taxas de trading, funding e outras taxas.',
        tooltip_position: 'top' as const,
      },
    ];

    for (const tooltipData of defaultTooltips) {
      const existingTooltip = await this.getTooltipConfig(tooltipData.card_key);
      if (!existingTooltip) {
        await this.createTooltipConfig({
          ...tooltipData,
          created_by: adminId,
        });
      }
    }
  }
}
