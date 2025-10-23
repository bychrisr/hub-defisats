/**
 * Fastify routes extractor
 */

import * as fs from 'fs';
import * as path from 'path';
import { FastifyRoute, Location } from './common';

/**
 * Extract Fastify routes from a directory
 */
export async function extractFastifyRoutes(dirPath: string): Promise<FastifyRoute[]> {
  const routes: FastifyRoute[] = [];
  
  if (!fs.existsSync(dirPath)) {
    return routes;
  }

  const files = await getTypeScriptFiles(dirPath);
  
  for (const file of files) {
    const fileRoutes = await extractRoutesFromFile(file);
    routes.push(...fileRoutes);
  }

  return routes;
}

/**
 * Get all TypeScript files in a directory recursively
 */
async function getTypeScriptFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  
  function traverse(currentPath: string) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dirPath);
  return files;
}

/**
 * Extract routes from a single file
 */
async function extractRoutesFromFile(filePath: string): Promise<FastifyRoute[]> {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const routes: FastifyRoute[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Match Fastify route patterns
    const routePatterns = [
      // fastify.get('/path', handler)
      /fastify\.(get|post|put|delete|patch|head|options)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^,)]+)/,
      // fastify.route({ method: 'GET', url: '/path', handler })
      /fastify\.route\s*\(\s*\{\s*method\s*:\s*['"`]([^'"`]+)['"`]\s*,\s*url\s*:\s*['"`]([^'"`]+)['"`]\s*,\s*handler\s*:\s*([^,}]+)/,
      // app.get('/path', handler)
      /app\.(get|post|put|delete|patch|head|options)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^,)]+)/,
      // app.route({ method: 'GET', url: '/path', handler })
      /app\.route\s*\(\s*\{\s*method\s*:\s*['"`]([^'"`]+)['"`]\s*,\s*url\s*:\s*['"`]([^'"`]+)['"`]\s*,\s*handler\s*:\s*([^,}]+)/
    ];

    for (const pattern of routePatterns) {
      const match = line.match(pattern);
      if (match) {
        let method: string;
        let path: string;
        let handler: string;

        if (match.length === 4) {
          // Pattern 1: fastify.method('/path', handler)
          method = match[1].toUpperCase();
          path = match[2];
          handler = match[3].trim();
        } else if (match.length === 5) {
          // Pattern 2: fastify.route({ method: 'GET', url: '/path', handler })
          method = match[1].toUpperCase();
          path = match[2];
          handler = match[3].trim();
        } else {
          continue;
        }

        // Extract middleware if present
        const middleware = extractMiddleware(line, lines, i);

        routes.push({
          method: method as any,
          path,
          handler,
          location: { file: filePath, line: lineNumber },
          middleware
        });
      }
    }

    // Match route registration patterns
    const registerPattern = /\.register\s*\(\s*([^,]+)\s*,\s*\{\s*prefix\s*:\s*['"`]([^'"`]+)['"`]/;
    const registerMatch = line.match(registerPattern);
    if (registerMatch) {
      // This is a route registration, we might want to track it differently
      // For now, we'll skip as it's not a direct route definition
    }
  }

  return routes;
}

/**
 * Extract middleware from route definition
 */
function extractMiddleware(line: string, lines: string[], lineIndex: number): string[] {
  const middleware: string[] = [];
  
  // Look for middleware in the same line or following lines
  const middlewarePattern = /(?:preHandler|preValidation|preSerialization|onRequest|onResponse|onError|onSend|onTimeout)\s*:\s*\[([^\]]+)\]|(?:preHandler|preValidation|preSerialization|onRequest|onResponse|onError|onSend|onTimeout)\s*:\s*([^,}]+)/;
  
  const match = line.match(middlewarePattern);
  if (match) {
    const middlewareList = match[1] || match[2];
    if (middlewareList) {
      const items = middlewareList.split(',').map(item => item.trim());
      middleware.push(...items);
    }
  }

  return middleware;
}

/**
 * Extract schema information from route
 */
function extractSchema(line: string, lines: string[], lineIndex: number): string | undefined {
  // Look for schema definition in the route
  const schemaPattern = /schema\s*:\s*\{([^}]+)\}/;
  const match = line.match(schemaPattern);
  
  if (match) {
    return match[1].trim();
  }

  // Look for schema in following lines
  for (let i = lineIndex + 1; i < Math.min(lineIndex + 10, lines.length); i++) {
    const nextLine = lines[i];
    if (nextLine.includes('schema:')) {
      const schemaMatch = nextLine.match(/schema\s*:\s*\{([^}]+)\}/);
      if (schemaMatch) {
        return schemaMatch[1].trim();
      }
    }
  }

  return undefined;
}
