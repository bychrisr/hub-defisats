import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { TooltipService } from '../services/tooltip.service';

const prisma = new PrismaClient();
const tooltipService = new TooltipService(prisma);

export class TooltipController {
  // Tooltip Config endpoints
  static async createTooltipConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { card_key, tooltip_text, tooltip_position, is_enabled } = request.body as any;
      const adminId = (request as any).user?.id;

      if (!card_key || !tooltip_text) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'card_key and tooltip_text are required',
        });
      }

      const tooltipConfig = await tooltipService.createTooltipConfig({
        card_key,
        tooltip_text,
        tooltip_position,
        is_enabled,
        created_by: adminId,
      });

      return reply.send({
        success: true,
        data: tooltipConfig,
        message: 'Tooltip config created successfully',
      });
    } catch (error) {
      console.error('Error creating tooltip config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create tooltip config',
      });
    }
  }

  static async getTooltipConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { cardKey } = request.params as { cardKey: string };

      const tooltipConfig = await tooltipService.getTooltipConfig(cardKey);

      if (!tooltipConfig) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Tooltip config not found',
        });
      }

      return reply.send({
        success: true,
        data: tooltipConfig,
      });
    } catch (error) {
      console.error('Error getting tooltip config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get tooltip config',
      });
    }
  }

  static async getAllTooltipConfigs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const tooltipConfigs = await tooltipService.getAllTooltipConfigs();

      return reply.send({
        success: true,
        data: tooltipConfigs,
      });
    } catch (error) {
      console.error('Error getting all tooltip configs:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get tooltip configs',
      });
    }
  }

  static async updateTooltipConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { cardKey } = request.params as { cardKey: string };
      const updateData = request.body as any;
      const adminId = (request as any).user?.id;

      updateData.updated_by = adminId;

      const tooltipConfig = await tooltipService.updateTooltipConfig(cardKey, updateData);

      return reply.send({
        success: true,
        data: tooltipConfig,
        message: 'Tooltip config updated successfully',
      });
    } catch (error) {
      console.error('Error updating tooltip config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update tooltip config',
      });
    }
  }

  static async deleteTooltipConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { cardKey } = request.params as { cardKey: string };

      await tooltipService.deleteTooltipConfig(cardKey);

      return reply.send({
        success: true,
        message: 'Tooltip config deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting tooltip config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete tooltip config',
      });
    }
  }

  // Dashboard Card endpoints
  static async createDashboardCard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cardData = request.body as any;
      const adminId = (request as any).user?.id;

      if (!cardData.key || !cardData.title) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'key and title are required',
        });
      }

      cardData.created_by = adminId;

      const dashboardCard = await tooltipService.createDashboardCard(cardData);

      return reply.send({
        success: true,
        data: dashboardCard,
        message: 'Dashboard card created successfully',
      });
    } catch (error) {
      console.error('Error creating dashboard card:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create dashboard card',
      });
    }
  }

  static async getDashboardCard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { key } = request.params as { key: string };

      const dashboardCard = await tooltipService.getDashboardCard(key);

      if (!dashboardCard) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Dashboard card not found',
        });
      }

      return reply.send({
        success: true,
        data: dashboardCard,
      });
    } catch (error) {
      console.error('Error getting dashboard card:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get dashboard card',
      });
    }
  }

  static async getAllDashboardCards(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { category, is_active } = request.query as { category?: string; is_active?: string };

      const isActive = is_active === 'true' ? true : is_active === 'false' ? false : undefined;

      const dashboardCards = await tooltipService.getAllDashboardCards(category, isActive);

      return reply.send({
        success: true,
        data: dashboardCards,
      });
    } catch (error) {
      console.error('Error getting all dashboard cards:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get dashboard cards',
      });
    }
  }

  static async updateDashboardCard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { key } = request.params as { key: string };
      const updateData = request.body as any;
      const adminId = (request as any).user?.id;

      updateData.updated_by = adminId;

      const dashboardCard = await tooltipService.updateDashboardCard(key, updateData);

      return reply.send({
        success: true,
        data: dashboardCard,
        message: 'Dashboard card updated successfully',
      });
    } catch (error) {
      console.error('Error updating dashboard card:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update dashboard card',
      });
    }
  }

  static async deleteDashboardCard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { key } = request.params as { key: string };

      await tooltipService.deleteDashboardCard(key);

      return reply.send({
        success: true,
        message: 'Dashboard card deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting dashboard card:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete dashboard card',
      });
    }
  }

  static async reorderDashboardCards(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { cardKeys } = request.body as { cardKeys: string[] };
      const adminId = (request as any).user?.id;

      if (!Array.isArray(cardKeys)) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'cardKeys must be an array',
        });
      }

      await tooltipService.reorderDashboardCards(cardKeys, adminId);

      return reply.send({
        success: true,
        message: 'Dashboard cards reordered successfully',
      });
    } catch (error) {
      console.error('Error reordering dashboard cards:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reorder dashboard cards',
      });
    }
  }

  static async getCardsWithTooltips(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { category, is_active } = request.query as { category?: string; is_active?: string };

      const isActive = is_active === 'true' ? true : is_active === 'false' ? false : undefined;

      const cardsWithTooltips = await tooltipService.getCardsWithTooltips(category, isActive);

      return reply.send({
        success: true,
        data: cardsWithTooltips,
      });
    } catch (error) {
      console.error('Error getting cards with tooltips:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get cards with tooltips',
      });
    }
  }

  static async initializeDefaults(request: FastifyRequest, reply: FastifyReply) {
    try {
      const adminId = (request as any).user?.id;

      await tooltipService.initializeDefaultCards(adminId);
      await tooltipService.initializeDefaultTooltips(adminId);

      return reply.send({
        success: true,
        message: 'Default cards and tooltips initialized successfully',
      });
    } catch (error) {
      console.error('Error initializing defaults:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to initialize defaults',
      });
    }
  }
}
