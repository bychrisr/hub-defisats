import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { checkPasswordStrength, isCommonPassword } from '../utils/password.validator';
import { PrismaClient } from '@prisma/client';

// Schema para validação de senha
const passwordValidationSchema = z.object({
  password: z.string().min(1, 'Password is required')
});

export async function validationRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  // Endpoint para validar senha
  fastify.post('/validation/password', {
    schema: {
      description: 'Validate password strength and requirements',
      tags: ['Validation'],
      body: {
        type: 'object',
        required: ['password'],
        properties: {
          password: {
            type: 'string',
            description: 'Password to validate'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            strength: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                level: { type: 'string' },
                feedback: { type: 'array', items: { type: 'string' } }
              }
            },
            requirements: {
              type: 'object',
              properties: {
                length: { type: 'boolean' },
                lowercase: { type: 'boolean' },
                uppercase: { type: 'boolean' },
                number: { type: 'boolean' },
                special: { type: 'boolean' }
              }
            },
            isCommon: { type: 'boolean' },
            suggestions: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { password } = passwordValidationSchema.parse(request.body);
      
      // Verificar requisitos básicos
      const requirements = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
      };
      
      // Verificar se é senha comum
      const isCommon = isCommonPassword(password);
      
      // Calcular força da senha
      const strength = checkPasswordStrength(password);
      
      // Determinar nível de força
      const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
      const level = levels[Math.min(strength.score - 1, levels.length - 1)] || 'Very Weak';
      
      // Gerar sugestões
      const suggestions: string[] = [];
      if (!requirements.length) suggestions.push('Use at least 8 characters');
      if (!requirements.lowercase) suggestions.push('Add lowercase letters');
      if (!requirements.uppercase) suggestions.push('Add uppercase letters');
      if (!requirements.number) suggestions.push('Add numbers');
      if (!requirements.special) suggestions.push('Add special characters (!@#$%^&*()_+-=[]{}|;:,.<>?~`)');
      if (isCommon) suggestions.push('Avoid common passwords');
      if (password.length < 12) suggestions.push('Consider using 12+ characters for better security');
      
      // Verificar se a senha é válida
      const valid = strength.isValid && !isCommon && Object.values(requirements).every(req => req);
      
      return reply.status(200).send({
        valid,
        strength: {
          score: strength.score,
          level,
          feedback: strength.feedback
        },
        requirements,
        isCommon,
        suggestions
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }
      
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to validate password'
      });
    }
  });

  // Endpoint para verificar força da senha em tempo real
  fastify.post('/api/validation/password-strength', {
    schema: {
      description: 'Get password strength score',
      tags: ['Validation'],
      body: {
        type: 'object',
        required: ['password'],
        properties: {
          password: {
            type: 'string',
            description: 'Password to check strength'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            level: { type: 'string' },
            isValid: { type: 'boolean' },
            feedback: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { password } = passwordValidationSchema.parse(request.body);
      
      const strength = checkPasswordStrength(password);
      const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
      const level = levels[Math.min(strength.score - 1, levels.length - 1)] || 'Very Weak';
      
      return reply.status(200).send({
        score: strength.score,
        level,
        isValid: strength.isValid,
        feedback: strength.feedback
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }
      
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to check password strength'
      });
    }
  });

  // Endpoint para validar email
  fastify.post('/validation/email', {
    schema: {
      description: 'Validate email format and availability',
      tags: ['Validation'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            description: 'Email to validate'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            available: { type: 'boolean' },
            format: { type: 'boolean' },
            suggestions: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = z.object({ email: z.string() }).parse(request.body);
      
      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const formatValid = emailRegex.test(email);
      
      let available = true;
      let suggestions: string[] = [];
      
      if (!formatValid) {
        suggestions.push('Enter a valid email address (e.g., user@example.com)');
      } else {
        // Verificar se email já existe
        try {
          console.log(`🔍 Checking email availability for: ${email}`);
          console.log(`🔍 Email to search: ${email.toLowerCase()}`);
          
          const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
          });
          
          console.log(`📧 Existing user found:`, existingUser ? 'YES' : 'NO');
          console.log(`📧 User data:`, existingUser);
          
          available = !existingUser;
          
          if (!available) {
            suggestions.push('This email is already registered');
            console.log(`❌ Email ${email} is already registered`);
          } else {
            console.log(`✅ Email ${email} is available`);
          }
        } catch (error) {
          console.error('Error checking email availability:', error);
          console.error('Error details:', error);
          // Se não conseguir verificar no banco, assumir disponível
          available = true;
        }
      }
      
      return reply.status(200).send({
        valid: formatValid && available,
        available,
        format: formatValid,
        suggestions
      });
      
    } catch (error) {
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to validate email'
      });
    }
  });

  // Endpoint para validar username
  fastify.post('/validation/username', {
    schema: {
      description: 'Validate username format and availability',
      tags: ['Validation'],
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: {
            type: 'string',
            description: 'Username to validate'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            available: { type: 'boolean' },
            format: { type: 'boolean' },
            suggestions: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { username } = z.object({ username: z.string() }).parse(request.body);
      
      // Validar formato do username
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      
      // Lista de domínios de email comuns que não podem ser usados como sufixo de username
      const emailDomains = [
        '.com', '.com.br', '.org', '.net', '.edu', '.gov', '.mil', '.int',
        '.co.uk', '.co.jp', '.co.kr', '.co.in', '.co.za', '.co.nz',
        '.com.au', '.com.mx', '.com.ar', '.com.pe', '.com.co', '.com.ve',
        '.org.br', '.net.br', '.edu.br', '.gov.br', '.mil.br',
        '.info', '.biz', '.name', '.pro', '.aero', '.coop', '.museum',
        '.travel', '.jobs', '.mobi', '.tel', '.asia', '.cat', '.post',
        '.xxx', '.arpa', '.local', '.test', '.example', '.invalid'
      ];
      
      // Verificar se username termina com domínio de email
      const endsWithEmailDomain = emailDomains.some(domain => 
        username.toLowerCase().endsWith(domain.toLowerCase())
      );
      
      const formatValid = usernameRegex.test(username) && 
                         username.length >= 3 && 
                         username.length <= 20 &&
                         !username.includes('@') &&
                         !endsWithEmailDomain;
      
      let available = true;
      let suggestions: string[] = [];
      
      if (!formatValid) {
        if (username.length < 3) suggestions.push('Username must be at least 3 characters');
        if (username.length > 20) suggestions.push('Username must be at most 20 characters');
        if (!usernameRegex.test(username)) suggestions.push('Username can only contain letters, numbers, and underscores');
        if (username.includes('@')) suggestions.push('Username cannot contain @ symbol');
        if (endsWithEmailDomain) suggestions.push('Username cannot end with email domains like .com, .com.br, .org, etc.');
      } else {
        // Verificar se username já existe
        try {
          const existingUser = await prisma.user.findUnique({
            where: { username: username.toLowerCase() }
          });
          available = !existingUser;
          
          if (!available) {
            suggestions.push('This username is already taken');
          }
        } catch (error) {
          // Se não conseguir verificar no banco, assumir disponível
          available = true;
        }
      }
      
      return reply.status(200).send({
        valid: formatValid && available,
        available,
        format: formatValid,
        suggestions
      });
      
    } catch (error) {
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to validate username'
      });
    }
  });

  // Endpoint para validar API keys
  fastify.post('/validation/api-keys', {
    schema: {
      description: 'Validate LN Markets API keys format',
      tags: ['Validation'],
      body: {
        type: 'object',
        required: ['api_key', 'api_secret', 'passphrase'],
        properties: {
          api_key: {
            type: 'string',
            description: 'API key to validate'
          },
          api_secret: {
            type: 'string',
            description: 'API secret to validate'
          },
          passphrase: {
            type: 'string',
            description: 'Passphrase to validate'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            api_key: { type: 'object', properties: { valid: { type: 'boolean' }, suggestions: { type: 'array', items: { type: 'string' } } } },
            api_secret: { type: 'object', properties: { valid: { type: 'boolean' }, suggestions: { type: 'array', items: { type: 'string' } } } },
            passphrase: { type: 'object', properties: { valid: { type: 'boolean' }, suggestions: { type: 'array', items: { type: 'string' } } } }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { api_key, api_secret, passphrase } = z.object({
        api_key: z.string(),
        api_secret: z.string(),
        passphrase: z.string()
      }).parse(request.body);
      
      // Validar API key
      const apiKeyValid = api_key.length >= 16 && api_key.length <= 500;
      const apiKeySuggestions = [];
      if (!apiKeyValid) {
        if (api_key.length < 16) apiKeySuggestions.push('API key must be at least 16 characters');
        if (api_key.length > 500) apiKeySuggestions.push('API key is too long (max 500 characters)');
      }
      
      // Validar API secret
      const apiSecretValid = api_secret.length >= 16 && api_secret.length <= 500;
      const apiSecretSuggestions = [];
      if (!apiSecretValid) {
        if (api_secret.length < 16) apiSecretSuggestions.push('API secret must be at least 16 characters');
        if (api_secret.length > 500) apiSecretSuggestions.push('API secret is too long (max 500 characters)');
      }
      
      // Validar passphrase
      const passphraseValid = passphrase.length >= 8 && passphrase.length <= 128;
      const passphraseSuggestions = [];
      if (!passphraseValid) {
        if (passphrase.length < 8) passphraseSuggestions.push('Passphrase must be at least 8 characters');
        if (passphrase.length > 128) passphraseSuggestions.push('Passphrase must be at most 128 characters');
      }
      
      const allValid = apiKeyValid && apiSecretValid && passphraseValid;
      
      return reply.status(200).send({
        valid: allValid,
        api_key: {
          valid: apiKeyValid,
          suggestions: apiKeySuggestions
        },
        api_secret: {
          valid: apiSecretValid,
          suggestions: apiSecretSuggestions
        },
        passphrase: {
          valid: passphraseValid,
          suggestions: passphraseSuggestions
        }
      });
      
    } catch (error) {
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to validate API keys'
      });
    }
  });

  // Endpoint para validar formulário completo de registro (simplificado)
  fastify.post('/validation/register-form', {
    schema: {
      description: 'Validate complete registration form',
      tags: ['Validation'],
      body: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: { type: 'string' },
          username: { type: 'string' },
          password: { type: 'string' },
          coupon_code: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            fields: { type: 'object' },
            global_suggestions: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const formData = z.object({
        email: z.string(),
        username: z.string(),
        password: z.string(),
        coupon_code: z.string().optional()
      }).parse(request.body);
      
      const results: any = {
        valid: true,
        fields: {},
        global_suggestions: []
      };
      
      // Validar email
      const emailResult = await fastify.inject({
        method: 'POST',
        url: '/api/validation/email',
        payload: { email: formData.email }
      });
      results.fields.email = emailResult.json();
      if (!results.fields.email.valid) results.valid = false;
      
      // Validar username
      const usernameResult = await fastify.inject({
        method: 'POST',
        url: '/api/validation/username',
        payload: { username: formData.username }
      });
      results.fields.username = usernameResult.json();
      if (!results.fields.username.valid) results.valid = false;
      
      // Validar senha
      const passwordResult = await fastify.inject({
        method: 'POST',
        url: '/api/validation/password',
        payload: { password: formData.password }
      });
      results.fields.password = passwordResult.json();
      if (!results.fields.password.valid) results.valid = false;
      
      return reply.status(200).send(results);
      
    } catch (error) {
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to validate registration form'
      });
    }
  });
}
