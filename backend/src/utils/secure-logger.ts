/**
 * Secure Logger - Prevents logging of sensitive data
 */

interface LogData {
  [key: string]: any;
}

const SENSITIVE_KEYS = [
  'password',
  'apiKey', 'api_key',
  'apiSecret', 'api_secret',
  'passphrase',
  'token',
  'jwt',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session'
];

/**
 * Sanitize object to remove sensitive data
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Check if string contains sensitive patterns
    const lowerStr = obj.toLowerCase();
    for (const key of SENSITIVE_KEYS) {
      if (lowerStr.includes(key)) {
        return '[REDACTED]';
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sensitiveKey => 
        lowerKey.includes(sensitiveKey)
      );
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Secure logger wrapper
 */
export const secureLog = {
  info: (message: string, data?: LogData) => {
    const sanitizedData = data ? sanitizeObject(data) : undefined;
    console.log(message, sanitizedData);
  },
  
  error: (message: string, error?: any) => {
    const sanitizedError = error ? sanitizeObject(error) : undefined;
    console.error(message, sanitizedError);
  },
  
  warn: (message: string, data?: LogData) => {
    const sanitizedData = data ? sanitizeObject(data) : undefined;
    console.warn(message, sanitizedData);
  },
  
  debug: (message: string, data?: LogData) => {
    if (process.env['NODE_ENV'] === 'development') {
      const sanitizedData = data ? sanitizeObject(data) : undefined;
      console.debug(message, sanitizedData);
    }
  }
};

export { sanitizeObject };
