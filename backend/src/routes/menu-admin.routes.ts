import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MenuService } from '@/services/menu.service';
import { superAdminAuthMiddleware } from '@/middleware/auth.middleware';

const menuService = new MenuService();

export async function menuAdminRoutes(fastify: FastifyInstance) {
  // Middleware para verificar se é superadmin
  fastify.addHook('preHandler', superAdminAuthMiddleware);

  // GET /api/admin/menu/types - Buscar tipos de menu
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

  // GET /api/admin/menu/items - Buscar todos os itens de menu
  fastify.get('/items', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const menuItems = await menuService.getAllMenuItems();
      return reply.send({
        success: true,
        data: menuItems
      });
    } catch (error) {
      console.error('❌ Erro ao buscar itens de menu:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar itens de menu'
      });
    }
  });

  // GET /api/admin/menu/items/:type - Buscar itens por tipo
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

  // GET /api/admin/menu/item/:id - Buscar item específico
  fastify.get('/item/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const menuItem = await menuService.getMenuItemById(id);
      
      if (!menuItem) {
        return reply.status(404).send({
          success: false,
          error: 'Item não encontrado',
          message: 'Item de menu não encontrado'
        });
      }

      return reply.send({
        success: true,
        data: menuItem
      });
    } catch (error) {
      console.error('❌ Erro ao buscar item de menu:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar item de menu'
      });
    }
  });

  // POST /api/admin/menu/item - Criar novo item
  fastify.post('/item', async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const menuItem = await menuService.createMenuItem(request.body);
      return reply.status(201).send({
        success: true,
        data: menuItem,
        message: 'Item de menu criado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao criar item de menu:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao criar item de menu'
      });
    }
  });

  // PUT /api/admin/menu/item/:id - Atualizar item
  fastify.put('/item/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const menuItem = await menuService.updateMenuItem({
        id,
        ...request.body
      });
      
      return reply.send({
        success: true,
        data: menuItem,
        message: 'Item de menu atualizado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar item de menu:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao atualizar item de menu'
      });
    }
  });

  // DELETE /api/admin/menu/item/:id - Deletar item
  fastify.delete('/item/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await menuService.deleteMenuItem(request.params.id);
      return reply.send({
        success: true,
        message: 'Item de menu deletado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao deletar item de menu:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao deletar item de menu'
      });
    }
  });

  // PUT /api/admin/menu/reorder - Reordenar itens
  fastify.put('/reorder', async (request: FastifyRequest<{ Body: { menuTypeId: string; items: { id: string; order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { menuTypeId, items } = request.body;
      await menuService.reorderMenuItems(menuTypeId, items);
      
      return reply.send({
        success: true,
        message: 'Itens reordenados com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao reordenar itens:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao reordenar itens'
      });
    }
  });

  // PUT /api/admin/menu/item/:id/toggle - Ativar/desativar item
  fastify.put('/item/:id/toggle', async (request: FastifyRequest<{ Params: { id: string }; Body: { isVisible: boolean } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { isVisible } = request.body;
      
      const menuItem = await menuService.toggleMenuItemVisibility(id, isVisible);
      
      return reply.send({
        success: true,
        data: menuItem,
        message: `Item ${isVisible ? 'ativado' : 'desativado'} com sucesso`
      });
    } catch (error) {
      console.error('❌ Erro ao alterar visibilidade do item:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao alterar visibilidade do item'
      });
    }
  });

  // GET /api/admin/menu/frontend - Buscar menu para frontend
  fastify.get('/frontend', async (request: FastifyRequest, reply: FastifyReply) => {
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

  // GET /api/admin/config - Buscar configurações do sistema
  fastify.get('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const configs = await menuService.getSystemConfigs();
      return reply.send({
        success: true,
        data: configs
      });
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar configurações'
      });
    }
  });

  // PUT /api/admin/config/:key - Atualizar configuração
  fastify.put('/config/:key', async (request: FastifyRequest<{ Params: { key: string }; Body: { value: string; type?: string } }>, reply: FastifyReply) => {
    try {
      const { key } = request.params;
      const { value, type = 'string' } = request.body;
      
      const config = await menuService.updateSystemConfig(key, value, type);
      
      return reply.send({
        success: true,
        data: config,
        message: 'Configuração atualizada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar configuração:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao atualizar configuração'
      });
    }
  });
}

