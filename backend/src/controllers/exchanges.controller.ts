import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { adminAuthMiddleware } from '../middleware/auth.middleware';
import { z } from 'zod';

// Zod schemas for validation
const CreateExchangeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  website: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  api_version: z.string().optional(),
  is_active: z.boolean().default(true),
  credential_types: z.array(z.object({
    name: z.string().min(1, 'Credential type name is required'),
    field_name: z.string().min(1, 'Field name is required'),
    field_type: z.enum(['text', 'password', 'email', 'url']),
    is_required: z.boolean().default(true),
    description: z.string().optional(),
    order: z.number().int().min(0).default(0)
  })).optional().default([])
});

const UpdateExchangeSchema = CreateExchangeSchema.partial();

const ExchangeIdParamSchema = z.object({
  id: z.string().uuid(),
});

export class ExchangesController {
  constructor(private prisma: PrismaClient) {}

  async getAllExchanges(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🔍 EXCHANGES CONTROLLER - Fetching all exchanges...');
      
      const exchanges = await this.prisma.exchange.findMany({
        include: {
          credential_types: {
            orderBy: {
              order: 'asc'
            }
          },
          _count: {
            select: {
              user_accounts: true
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      console.log('🔍 EXCHANGES CONTROLLER - Found exchanges:', exchanges.length);

      return reply.send({
        success: true,
        data: exchanges.map(exchange => ({
          ...exchange,
          created_at: exchange.created_at.toISOString(),
          updated_at: exchange.updated_at.toISOString(),
          credential_types: exchange.credential_types.map(ct => ({
            ...ct,
            created_at: ct.created_at.toISOString(),
            updated_at: ct.updated_at.toISOString()
          }))
        }))
      });
    } catch (error: any) {
      console.error('❌ EXCHANGES CONTROLLER - Error fetching exchanges:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch exchanges',
        details: error.message,
      });
    }
  }

  async getExchangeById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = ExchangeIdParamSchema.parse(request.params);
      
      console.log('🔍 EXCHANGES CONTROLLER - Fetching exchange by ID:', id);
      
      const exchange = await this.prisma.exchange.findUnique({
        where: { id },
        include: {
          credential_types: {
            orderBy: {
              order: 'asc'
            }
          },
          _count: {
            select: {
              user_accounts: true
            }
          }
        }
      });

      if (!exchange) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Exchange not found',
        });
      }

      console.log('🔍 EXCHANGES CONTROLLER - Exchange found:', exchange.name);

      return reply.send({
        success: true,
        data: {
          ...exchange,
          created_at: exchange.created_at.toISOString(),
          updated_at: exchange.updated_at.toISOString(),
          credential_types: exchange.credential_types.map(ct => ({
            ...ct,
            created_at: ct.created_at.toISOString(),
            updated_at: ct.updated_at.toISOString()
          }))
        }
      });
    } catch (error: any) {
      console.error('❌ EXCHANGES CONTROLLER - Error fetching exchange:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch exchange',
        details: error.message,
      });
    }
  }

  async createExchange(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = CreateExchangeSchema.parse(request.body);
      
      console.log('🔍 EXCHANGES CONTROLLER - Creating exchange:', data.name);
      
      const exchange = await this.prisma.exchange.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          website: data.website,
          logo_url: data.logo_url,
          api_version: data.api_version,
          is_active: data.is_active,
          credential_types: {
            create: data.credential_types.map(ct => ({
              name: ct.name,
              field_name: ct.field_name,
              field_type: ct.field_type,
              is_required: ct.is_required,
              description: ct.description,
              order: ct.order
            }))
          }
        },
        include: {
          credential_types: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      console.log('🔍 EXCHANGES CONTROLLER - Exchange created:', exchange.name);

      return reply.status(201).send({
        success: true,
        message: 'Exchange created successfully',
        data: {
          ...exchange,
          created_at: exchange.created_at.toISOString(),
          updated_at: exchange.updated_at.toISOString(),
          credential_types: exchange.credential_types.map(ct => ({
            ...ct,
            created_at: ct.created_at.toISOString(),
            updated_at: ct.updated_at.toISOString()
          }))
        }
      });
    } catch (error: any) {
      console.error('❌ EXCHANGES CONTROLLER - Error creating exchange:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create exchange',
        details: error.message,
      });
    }
  }

  async updateExchange(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = ExchangeIdParamSchema.parse(request.params);
      const data = UpdateExchangeSchema.parse(request.body);
      
      console.log('🔍 EXCHANGES CONTROLLER - Updating exchange:', id);
      
      // Check if exchange exists
      const existingExchange = await this.prisma.exchange.findUnique({
        where: { id }
      });

      if (!existingExchange) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Exchange not found',
        });
      }

      const exchange = await this.prisma.exchange.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.slug && { slug: data.slug }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.website !== undefined && { website: data.website }),
          ...(data.logo_url !== undefined && { logo_url: data.logo_url }),
          ...(data.api_version !== undefined && { api_version: data.api_version }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
          ...(data.credential_types && {
            credential_types: {
              deleteMany: {},
              create: data.credential_types.map(ct => ({
                name: ct.name,
                field_name: ct.field_name,
                field_type: ct.field_type,
                is_required: ct.is_required,
                description: ct.description,
                order: ct.order
              }))
            }
          })
        },
        include: {
          credential_types: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      console.log('🔍 EXCHANGES CONTROLLER - Exchange updated:', exchange.name);

      return reply.send({
        success: true,
        message: 'Exchange updated successfully',
        data: {
          ...exchange,
          created_at: exchange.created_at.toISOString(),
          updated_at: exchange.updated_at.toISOString(),
          credential_types: exchange.credential_types.map(ct => ({
            ...ct,
            created_at: ct.created_at.toISOString(),
            updated_at: ct.updated_at.toISOString()
          }))
        }
      });
    } catch (error: any) {
      console.error('❌ EXCHANGES CONTROLLER - Error updating exchange:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update exchange',
        details: error.message,
      });
    }
  }

  async deleteExchange(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = ExchangeIdParamSchema.parse(request.params);
      
      console.log('🔍 EXCHANGES CONTROLLER - Deleting exchange:', id);
      
      // Check if exchange exists
      const existingExchange = await this.prisma.exchange.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              user_accounts: true
            }
          }
        }
      });

      if (!existingExchange) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Exchange not found',
        });
      }

      // Check if exchange has user accounts
      if (existingExchange._count.user_accounts > 0) {
        return reply.status(400).send({
          success: false,
          error: 'EXCHANGE_IN_USE',
          message: 'Cannot delete exchange that has user accounts',
        });
      }

      await this.prisma.exchange.delete({
        where: { id }
      });

      console.log('🔍 EXCHANGES CONTROLLER - Exchange deleted:', existingExchange.name);

      return reply.send({
        success: true,
        message: 'Exchange deleted successfully',
      });
    } catch (error: any) {
      console.error('❌ EXCHANGES CONTROLLER - Error deleting exchange:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete exchange',
        details: error.message,
      });
    }
  }

  async toggleExchangeStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = ExchangeIdParamSchema.parse(request.params);
      
      console.log('🔍 EXCHANGES CONTROLLER - Toggling exchange status:', id);
      
      const exchange = await this.prisma.exchange.findUnique({
        where: { id }
      });

      if (!exchange) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Exchange not found',
        });
      }

      const updatedExchange = await this.prisma.exchange.update({
        where: { id },
        data: { is_active: !exchange.is_active },
        include: {
          credential_types: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      console.log('🔍 EXCHANGES CONTROLLER - Exchange status toggled:', updatedExchange.name, updatedExchange.is_active);

      return reply.send({
        success: true,
        message: `Exchange ${updatedExchange.name} ${updatedExchange.is_active ? 'activated' : 'deactivated'}`,
        data: {
          ...updatedExchange,
          created_at: updatedExchange.created_at.toISOString(),
          updated_at: updatedExchange.updated_at.toISOString(),
          credential_types: updatedExchange.credential_types.map(ct => ({
            ...ct,
            created_at: ct.created_at.toISOString(),
            updated_at: ct.updated_at.toISOString()
          }))
        }
      });
    } catch (error: any) {
      console.error('❌ EXCHANGES CONTROLLER - Error toggling exchange status:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to toggle exchange status',
        details: error.message,
      });
    }
  }
}

export const exchangesController = new ExchangesController(new PrismaClient());
