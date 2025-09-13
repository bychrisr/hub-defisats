import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/middleware/auth.middleware';
import { CouponService } from '@/services/coupon.service';
import { 
  CreateCouponRequestSchema, 
  UpdateCouponRequestSchema, 
  CouponToggleActiveRequestSchema,
  CouponResponseSchema,
  CouponListResponseSchema,
  CouponDashboardSchema
} from '@/types/api-contracts';

export async function couponAdminRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const couponService = new CouponService(prisma);

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Get coupon dashboard
  fastify.get('/dashboard', {
    schema: {
      description: 'Get coupon dashboard with metrics and analytics',
      tags: ['Coupon Admin'],
      response: {
        200: CouponDashboardSchema
      }
    }
  }, async (request, reply) => {
    try {
      const dashboard = await couponService.getCouponDashboard();
      return reply.status(200).send(dashboard);
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error getting dashboard:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get coupon dashboard',
        details: error.message
      });
    }
  });

  // Get all coupons
  fastify.get('/', {
    schema: {
      description: 'Get all coupons',
      tags: ['Coupon Admin'],
      response: {
        200: CouponListResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const coupons = await couponService.getCoupons();
      return reply.status(200).send(coupons);
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error getting coupons:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get coupons',
        details: error.message
      });
    }
  });

  // Get coupon by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get coupon by ID',
      tags: ['Coupon Admin'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        200: CouponResponseSchema,
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const coupon = await couponService.getCouponById(id);

      if (!coupon) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Coupon not found'
        });
      }

      return reply.status(200).send(coupon);
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error getting coupon:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get coupon',
        details: error.message
      });
    }
  });

  // Create coupon
  fastify.post('/', {
    schema: {
      description: 'Create a new coupon',
      tags: ['Coupon Admin'],
      body: CreateCouponRequestSchema,
      response: {
        201: CouponResponseSchema,
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const couponData = request.body as any;
      
      const coupon = await couponService.createCoupon(couponData, user.id);
      
      console.log('✅ COUPON ADMIN - Coupon created:', coupon.code);
      return reply.status(201).send(coupon);
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error creating coupon:', error);
      return reply.status(400).send({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      });
    }
  });

  // Update coupon
  fastify.put('/:id', {
    schema: {
      description: 'Update coupon',
      tags: ['Coupon Admin'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: UpdateCouponRequestSchema,
      response: {
        200: CouponResponseSchema,
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as any;
      
      const coupon = await couponService.updateCoupon(id, updateData);
      
      console.log('✅ COUPON ADMIN - Coupon updated:', coupon.code);
      return reply.status(200).send(coupon);
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error updating coupon:', error);
      
      if (error.message === 'Coupon not found') {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Coupon not found'
        });
      }
      
      return reply.status(400).send({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      });
    }
  });

  // Delete coupon
  fastify.delete('/:id', {
    schema: {
      description: 'Delete coupon',
      tags: ['Coupon Admin'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        204: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      await couponService.deleteCoupon(id);
      
      console.log('✅ COUPON ADMIN - Coupon deleted:', id);
      return reply.status(204).send({
        success: true,
        message: 'Coupon deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error deleting coupon:', error);
      
      if (error.message === 'Coupon not found') {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Coupon not found'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete coupon',
        details: error.message
      });
    }
  });

  // Toggle coupon active status
  fastify.patch('/:id/toggle-active', {
    schema: {
      description: 'Toggle coupon active status',
      tags: ['Coupon Admin'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: CouponToggleActiveRequestSchema,
      response: {
        200: CouponResponseSchema,
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { is_active } = request.body as { is_active: boolean };
      
      const coupon = await couponService.toggleCouponActive(id, is_active);
      
      console.log('✅ COUPON ADMIN - Coupon status toggled:', coupon.code, is_active ? 'ACTIVE' : 'INACTIVE');
      return reply.status(200).send(coupon);
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error toggling coupon status:', error);
      
      if (error.message === 'Coupon not found') {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Coupon not found'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to toggle coupon status',
        details: error.message
      });
    }
  });

  // Track coupon analytics
  fastify.post('/:id/track', {
    schema: {
      description: 'Track coupon analytics event',
      tags: ['Coupon Admin'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          event: { 
            type: 'string', 
            enum: ['view', 'click', 'use'] 
          },
          new_user: { type: 'boolean', default: false },
          revenue_saved: { type: 'number', default: 0 }
        },
        required: ['event']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { event, new_user = false, revenue_saved = 0 } = request.body as { 
        event: 'view' | 'click' | 'use';
        new_user?: boolean;
        revenue_saved?: number;
      };
      
      await couponService.trackCouponAnalytics(id, event, new_user, revenue_saved);
      
      console.log('✅ COUPON ADMIN - Analytics tracked:', id, event);
      return reply.status(200).send({
        success: true,
        message: 'Analytics tracked successfully'
      });
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error tracking analytics:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to track analytics',
        details: error.message
      });
    }
  });
}
