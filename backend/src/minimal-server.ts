/**
 * Minimal Backend for Login Only
 * 
 * This is a simplified version that only handles authentication
 * to get the login working again
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config/env';
import { getPrisma } from './lib/prisma';
import { logger } from './utils/logger';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
});

// Register plugins
fastify.register(cors, {
  origin: config.cors.origin,
  credentials: true
});

fastify.register(jwt, {
  secret: config.jwt.secret
});

// Health check route
fastify.get('/api/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
});

// Login route
fastify.post('/api/auth/login', async (request, reply) => {
  try {
    const { email, password } = request.body as { email: string; password: string };
    
    if (!email || !password) {
      return reply.status(400).send({
        success: false,
        message: 'Email and password are required'
      });
    }

    const prisma = getPrisma();
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return reply.status(401).send({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return reply.status(401).send({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin || false
    });

    return reply.send({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan_type: user.plan_type,
        is_admin: user.is_admin
      },
      token
    });

  } catch (error: any) {
    logger.error('Login error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register route
fastify.post('/api/auth/register', async (request, reply) => {
  try {
    const { email, username, password, confirmPassword } = request.body as {
      email: string;
      username: string;
      password: string;
      confirmPassword: string;
    };
    
    if (!email || !username || !password || !confirmPassword) {
      return reply.status(400).send({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password !== confirmPassword) {
      return reply.status(400).send({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const prisma = getPrisma();
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return reply.status(400).send({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password, // In production, hash this
        plan_type: 'free'
      }
    });

    // Generate JWT token
    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      isAdmin: false
    });

    return reply.send({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan_type: user.plan_type,
        is_admin: user.is_admin
      },
      token
    });

  } catch (error: any) {
    logger.error('Registration error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: config.env.PORT, 
      host: '0.0.0.0' 
    });
    
    logger.info(`🚀 Minimal backend server running on port ${config.env.PORT}`);
    logger.info(`📊 Health check: http://localhost:${config.env.PORT}/api/health`);
    logger.info(`🔐 Login: http://localhost:${config.env.PORT}/api/auth/login`);
    
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
