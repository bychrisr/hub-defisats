/**
 * Symbol extractors index
 */

export * from './common';
export * from './typescript.extractor';
export * from './fastify.extractor';
export * from './prisma.extractor';

import { extractTypeScriptSymbols } from './typescript.extractor';
import { extractFastifyRoutes } from './fastify.extractor';
import { extractPrismaModels } from './prisma.extractor';
import { ExtractedSymbols } from './common';

/**
 * Extract all symbols from a project
 */
export async function extractAllSymbols(projectPath: string): Promise<ExtractedSymbols> {
  const symbols: ExtractedSymbols = {
    typescript: [],
    fastify: [],
    prisma: []
  };

  try {
    // Extract TypeScript symbols from backend and frontend
    const backendPath = `${projectPath}/backend/src`;
    const frontendPath = `${projectPath}/frontend/src`;
    
    if (require('fs').existsSync(backendPath)) {
      const backendSymbols = await extractSymbolsFromDirectory(backendPath, 'typescript');
      symbols.typescript.push(...backendSymbols);
    }
    
    if (require('fs').existsSync(frontendPath)) {
      const frontendSymbols = await extractSymbolsFromDirectory(frontendPath, 'typescript');
      symbols.typescript.push(...frontendSymbols);
    }

    // Extract Fastify routes
    if (require('fs').existsSync(`${projectPath}/backend/src/routes`)) {
      symbols.fastify = await extractFastifyRoutes(`${projectPath}/backend/src/routes`);
    }

    // Extract Prisma models
    const schemaPath = `${projectPath}/backend/prisma/schema.prisma`;
    if (require('fs').existsSync(schemaPath)) {
      symbols.prisma = await extractPrismaModels(schemaPath);
    }

  } catch (error) {
    console.error('Error extracting symbols:', error);
  }

  return symbols;
}

/**
 * Extract symbols from a directory recursively
 */
async function extractSymbolsFromDirectory(dirPath: string, type: 'typescript'): Promise<any[]> {
  const symbols: any[] = [];
  const fs = require('fs');
  const path = require('path');

  function traverse(currentPath: string) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        if (type === 'typescript') {
          extractTypeScriptSymbols(fullPath).then(s => symbols.push(...s));
        }
      }
    }
  }
  
  traverse(dirPath);
  return symbols;
}
