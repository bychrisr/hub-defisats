import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';

interface RouteRedirectQuery {
  page?: string;
  limit?: string;
  search?: string;
  is_active?: string;
  redirect_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface CreateRouteRedirectBody {
  from_path: string;
  to_path: string;
  redirect_type?: 'temporary' | 'permanent';
  description?: string;
  expires_at?: string;
}

interface UpdateRouteRedirectBody {
  to_path?: string;
  redirect_type?: 'temporary' | 'permanent';
  is_active?: boolean;
  description?: string;
  expires_at?: string;
}

export async function getRouteRedirects(request: FastifyRequest<{ Querystring: RouteRedirectQuery }>, reply: FastifyReply) {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      is_active,
      redirect_type,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = request.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { from_path: { contains: search, mode: 'insensitive' } },
        { to_path: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    if (redirect_type) {
      where.redirect_type = redirect_type;
    }

    // Check for expired redirects
    where.OR = [
      { expires_at: null },
      { expires_at: { gt: new Date() } }
    ];

    // Get total count
    const total = await prisma.routeRedirect.count({ where });

    // Get redirects with pagination
    const redirects = await prisma.routeRedirect.findMany({
      where,
      skip: offset,
      take: limitNum,
      orderBy: {
        [sort_by]: sort_order
      }
    });

    // Calculate metrics
    const activeRedirects = await prisma.routeRedirect.count({
      where: { ...where, is_active: true }
    });

    const temporaryRedirects = await prisma.routeRedirect.count({
      where: { ...where, redirect_type: 'temporary' }
    });

    const permanentRedirects = await prisma.routeRedirect.count({
      where: { ...where, redirect_type: 'permanent' }
    });

    const expiredRedirects = await prisma.routeRedirect.count({
      where: {
        expires_at: { lte: new Date() }
      }
    });

    return reply.send({
      redirects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      metrics: {
        total,
        active: activeRedirects,
        inactive: total - activeRedirects,
        temporary: temporaryRedirects,
        permanent: permanentRedirects,
        expired: expiredRedirects
      }
    });
  } catch (error) {
    request.log.error('Error getting route redirects: ' + (error as Error).message);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get route redirects'
    });
  }
}

export async function createRouteRedirect(request: FastifyRequest<{ Body: CreateRouteRedirectBody }>, reply: FastifyReply) {
  try {
    const { from_path, to_path, redirect_type = 'temporary', description, expires_at } = request.body;
    const created_by = (request as any).user?.id;

    // Check if redirect already exists
    const existingRedirect = await prisma.routeRedirect.findUnique({
      where: { from_path }
    });

    if (existingRedirect) {
      return reply.status(409).send({
        error: 'CONFLICT',
        message: 'A redirect rule already exists for this path'
      });
    }

    const redirect = await prisma.routeRedirect.create({
      data: {
        from_path,
        to_path,
        redirect_type,
        description,
        created_by,
        expires_at: expires_at ? new Date(expires_at) : null
      }
    });

    return reply.status(201).send(redirect);
  } catch (error) {
    request.log.error('Error creating route redirect: ' + (error as Error).message);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create route redirect'
    });
  }
}

export async function updateRouteRedirect(request: FastifyRequest<{ Params: { id: string }, Body: UpdateRouteRedirectBody }>, reply: FastifyReply) {
  try {
    const { id } = request.params;
    const { to_path, redirect_type, is_active, description, expires_at } = request.body;

    const redirect = await prisma.routeRedirect.update({
      where: { id },
      data: {
        ...(to_path && { to_path }),
        ...(redirect_type && { redirect_type }),
        ...(is_active !== undefined && { is_active }),
        ...(description !== undefined && { description }),
        ...(expires_at !== undefined && { expires_at: expires_at ? new Date(expires_at) : null }),
        updated_at: new Date()
      }
    });

    return reply.send(redirect);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'Route redirect not found'
      });
    }

    request.log.error('Error updating route redirect: ' + (error as Error).message);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update route redirect'
    });
  }
}

export async function deleteRouteRedirect(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id } = request.params;

    await prisma.routeRedirect.delete({
      where: { id }
    });

    return reply.status(204).send();
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'Route redirect not found'
      });
    }

    request.log.error('Error deleting route redirect: ' + (error as Error).message);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete route redirect'
    });
  }
}

export async function getRouteRedirectById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id } = request.params;

    const redirect = await prisma.routeRedirect.findUnique({
      where: { id }
    });

    if (!redirect) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'Route redirect not found'
      });
    }

    return reply.send(redirect);
  } catch (error) {
    request.log.error('Error getting route redirect by ID: ' + (error as Error).message);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get route redirect'
    });
  }
}

export async function toggleRouteRedirect(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id } = request.params;

    const redirect = await prisma.routeRedirect.findUnique({
      where: { id }
    });

    if (!redirect) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'Route redirect not found'
      });
    }

    const updatedRedirect = await prisma.routeRedirect.update({
      where: { id },
      data: {
        is_active: !redirect.is_active,
        updated_at: new Date()
      }
    });

    return reply.send(updatedRedirect);
  } catch (error) {
    request.log.error('Error toggling route redirect: ' + (error as Error).message);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to toggle route redirect'
    });
  }
}
