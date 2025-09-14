import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateMenuItemData {
  name: string;
  mobileName?: string;
  href: string;
  icon: string;
  order: number;
  menuTypeId: string;
  target?: string;
  badge?: string;
  badgeColor?: string;
  description?: string;
  isActive?: boolean;
  isVisible?: boolean;
}

export interface UpdateMenuItemData extends Partial<CreateMenuItemData> {
  id: string;
}

export class MenuService {
  // Buscar todos os tipos de menu
  async getMenuTypes() {
    return await prisma.menuType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  // Buscar itens de menu por tipo
  async getMenuItemsByType(menuTypeName: string) {
    return await prisma.menuItem.findMany({
      where: {
        menuType: { name: menuTypeName },
        isActive: true,
        isVisible: true
      },
      include: {
        menuType: true
      },
      orderBy: { order: 'asc' }
    });
  }

  // Buscar todos os itens de menu
  async getAllMenuItems() {
    return await prisma.menuItem.findMany({
      include: {
        menuType: true
      },
      orderBy: [
        { menuType: { name: 'asc' } },
        { order: 'asc' }
      ]
    });
  }

  // Buscar item de menu por ID
  async getMenuItemById(id: string) {
    return await prisma.menuItem.findUnique({
      where: { id },
      include: {
        menuType: true
      }
    });
  }

  // Criar novo item de menu
  async createMenuItem(data: CreateMenuItemData) {
    return await prisma.menuItem.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
        isVisible: data.isVisible ?? true,
        target: data.target ?? '_self'
      },
      include: {
        menuType: true
      }
    });
  }

  // Atualizar item de menu
  async updateMenuItem(data: UpdateMenuItemData) {
    const { id, ...updateData } = data;
    
    return await prisma.menuItem.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date()
      },
      include: {
        menuType: true
      }
    });
  }

  // Deletar item de menu
  async deleteMenuItem(id: string) {
    return await prisma.menuItem.delete({
      where: { id }
    });
  }

  // Reordenar itens de menu
  async reorderMenuItems(_menuTypeId: string, itemOrders: { id: string; order: number }[]) {
    const transaction = await prisma.$transaction(
      itemOrders.map(({ id, order }) =>
        prisma.menuItem.update({
          where: { id },
          data: { order, updated_at: new Date() }
        })
      )
    );

    return transaction;
  }

  // Ativar/desativar item de menu
  async toggleMenuItemVisibility(id: string, isVisible: boolean) {
    return await prisma.menuItem.update({
      where: { id },
      data: {
        isVisible,
        updated_at: new Date()
      },
      include: {
        menuType: true
      }
    });
  }

  // Buscar configurações do sistema
  async getSystemConfigs() {
    return await prisma.systemConfig.findMany({
      where: { isActive: true },
      orderBy: { key: 'asc' }
    });
  }

  // Atualizar configuração do sistema
  async updateSystemConfig(key: string, value: string, type: string = 'string') {
    return await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value,
        type,
        updated_at: new Date()
      },
      create: {
        key,
        value,
        type,
        isActive: true
      }
    });
  }

  // Buscar menu completo para frontend
  async getMenuForFrontend() {
    const [mainMenu, secondaryMenu, userMenu] = await Promise.all([
      this.getMenuItemsByType('main'),
      this.getMenuItemsByType('secondary'),
      this.getMenuItemsByType('user')
    ]);

    return {
      main: mainMenu,
      secondary: secondaryMenu,
      user: userMenu
    };
  }
}

