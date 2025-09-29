import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { adminAuthMiddleware } from '../middleware/auth.middleware';
import { CouponService } from '../services/coupon.service';
import { CreateCouponRequestSchema } from '../types/api-contracts';

export async function couponAdminRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const couponService = new CouponService(prisma);

  // Apply admin authentication middleware to all routes
  fastify.addHook('preHandler', adminAuthMiddleware);

  // Get coupon dashboard
  fastify.get('/dashboard', {
    schema: {
      description: 'Get coupon dashboard with metrics and analytics',
      tags: ['Coupon Admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            total_coupons: { type: 'number' },
            active_coupons: { type: 'number' },
            inactive_coupons: { type: 'number' },
            total_uses: { type: 'number' },
            total_revenue_saved: { type: 'number' },
            total_new_users: { type: 'number' },
            average_conversion_rate: { type: 'number' },
            top_coupons: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  code: { type: 'string' },
                  uses_count: { type: 'number' },
                  revenue_saved: { type: 'number' },
                  conversion_rate: { type: 'number' }
                }
              }
            },
            recent_activity: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  code: { type: 'string' },
                  action: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            },
            daily_metrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  views: { type: 'number' },
                  clicks: { type: 'number' },
                  uses: { type: 'number' },
                  new_users: { type: 'number' },
                  revenue_saved: { type: 'number' }
                }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    }
  }, async (_request, reply) => {
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
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  code: { type: 'string' },
                  plan_type: { type: 'string' },
                  usage_limit: { type: 'number' },
                  used_count: { type: 'number' },
                  expires_at: { type: 'string' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                  value_type: { type: 'string' },
                  value_amount: { type: 'number' },
                  time_type: { type: 'string' },
                  time_days: { type: 'number' },
                  is_active: { type: 'boolean' },
                  description: { type: 'string' },
                  created_by: { type: 'string' },
                  total_revenue_saved: { type: 'number' },
                  new_users_count: { type: 'number' },
                  conversion_rate: { type: 'number' }
                }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    }
  }, async (_request, reply) => {
    try {
      const coupons = await couponService.getCoupons();
      return reply.status(200).send({
        success: true,
        data: coupons
      });
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
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                code: { type: 'string' },
                plan_type: { type: 'string' },
                usage_limit: { type: 'number' },
                used_count: { type: 'number' },
                expires_at: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
                value_type: { type: 'string' },
                value_amount: { type: 'number' },
                time_type: { type: 'string' },
                time_days: { type: 'number' },
                is_active: { type: 'boolean' },
                description: { type: 'string' },
                created_by: { type: 'string' },
                total_revenue_saved: { type: 'number' },
                new_users_count: { type: 'number' },
                conversion_rate: { type: 'number' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'string' }
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

      console.log('✅ COUPON ADMIN - Coupon retrieved:', coupon.code);
      return reply.status(200).send({
        success: true,
        data: coupon
      });
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
      body: {
        type: 'object',
        required: ['code', 'plan_type', 'value_type', 'value_amount', 'time_type'],
        properties: {
          code: { type: 'string', minLength: 3, maxLength: 50 },
          plan_type: { type: 'string', enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'] },
          usage_limit: { type: 'number', minimum: 1, maximum: 1000 },
          expires_at: { type: 'string', format: 'date-time' },
          value_type: { type: 'string', enum: ['fixed', 'percentage'] },
          value_amount: { type: 'number', minimum: 1, maximum: 1000000 },
          time_type: { type: 'string', enum: ['fixed', 'lifetime'] },
          time_days: { type: 'number', minimum: 1, maximum: 3650 },
          description: { type: 'string' },
          is_active: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                code: { type: 'string' },
                plan_type: { type: 'string' },
                usage_limit: { type: 'number' },
                used_count: { type: 'number' },
                expires_at: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
                value_type: { type: 'string' },
                value_amount: { type: 'number' },
                time_type: { type: 'string' },
                time_days: { type: 'number' },
                is_active: { type: 'boolean' },
                description: { type: 'string' },
                created_by: { type: 'string' },
                total_revenue_saved: { type: 'number' },
                new_users_count: { type: 'number' },
                conversion_rate: { type: 'number' }
              }
            }
          }
        },
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
      
      console.log('🔍 COUPON ADMIN - Received data:', JSON.stringify(couponData, null, 2));
      
      // Validate with Zod schema
      const validatedData = CreateCouponRequestSchema.parse(couponData);
      
      const coupon = await couponService.createCoupon(validatedData, user.id);
      
      console.log('✅ COUPON ADMIN - Coupon created:', coupon.code);
      return reply.status(201).send({
        success: true,
        data: coupon
      });
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error creating coupon:', error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: error.errors?.map((e: any) => e.message).join(', ') || 'Validation error'
        });
      }
      
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
      body: {
        type: 'object',
        properties: {
          code: { type: 'string', minLength: 3, maxLength: 50 },
          plan_type: { type: 'string', enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'] },
          usage_limit: { type: 'number', minimum: 1, maximum: 1000 },
          expires_at: { type: 'string', format: 'date-time' },
          value_type: { type: 'string', enum: ['fixed', 'percentage'] },
          value_amount: { type: 'number', minimum: 1, maximum: 1000000 },
          time_type: { type: 'string', enum: ['fixed', 'lifetime'] },
          time_days: { type: 'number', minimum: 1, maximum: 3650 },
          description: { type: 'string' },
          is_active: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                code: { type: 'string' },
                plan_type: { type: 'string' },
                usage_limit: { type: 'number' },
                used_count: { type: 'number' },
                expires_at: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
                value_type: { type: 'string' },
                value_amount: { type: 'number' },
                time_type: { type: 'string' },
                time_days: { type: 'number' },
                is_active: { type: 'boolean' },
                description: { type: 'string' },
                created_by: { type: 'string' },
                total_revenue_saved: { type: 'number' },
                new_users_count: { type: 'number' },
                conversion_rate: { type: 'number' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
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
      return reply.status(200).send({
        success: true,
        data: coupon
      });
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error updating coupon:', error);
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
        },
        500: {
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
      body: {
        type: 'object',
        properties: {
          is_active: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                code: { type: 'string' },
                is_active: { type: 'boolean' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
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
      
      console.log('✅ COUPON ADMIN - Coupon status toggled:', coupon.code, 'Active:', coupon.is_active);
      return reply.status(200).send({
        success: true,
        data: {
          id: coupon.id,
          code: coupon.code,
          is_active: coupon.is_active
        }
      });
    } catch (error: any) {
      console.error('❌ COUPON ADMIN - Error toggling coupon status:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to toggle coupon status',
        details: error.message
      });
    }
  });
}
