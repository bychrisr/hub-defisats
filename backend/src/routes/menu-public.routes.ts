import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MenuService } from '@/services/menu.service';

const menuService = new MenuService();

export async function menuPublicRoutes(fastify: FastifyInstance) {
  // GET /api/menu - Buscar menu para frontend (público)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const menu = await menuService.getMenuForFrontend();
      return reply.send({
        success: true,
        data: menu
      });
    } catch (error) {
      console.error('❌ Erro ao buscar menu para frontend:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar menu para frontend'
      });
    }
  });

  // GET /api/menu/types - Buscar tipos de menu (público)
  fastify.get('/types', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const menuTypes = await menuService.getMenuTypes();
      return reply.send({
        success: true,
        data: menuTypes
      });
    } catch (error) {
      console.error('❌ Erro ao buscar tipos de menu:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar tipos de menu'
      });
    }
  });

  // GET /api/menu/items/:type - Buscar itens por tipo (público)
  fastify.get('/items/:type', async (request: FastifyRequest<{ Params: { type: string } }>, reply: FastifyReply) => {
    try {
      const { type } = request.params;
      const menuItems = await menuService.getMenuItemsByType(type);
      return reply.send({
        success: true,
        data: menuItems
      });
    } catch (error) {
      console.error('❌ Erro ao buscar itens de menu por tipo:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar itens de menu por tipo'
      });
    }
  });
}

