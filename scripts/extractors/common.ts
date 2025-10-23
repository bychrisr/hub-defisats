/**
 * Common utilities for symbol extraction
 */

export interface Location {
  file: string;
  line: number;
  column?: number;
}

export interface BaseSymbol {
  name: string;
  location: Location;
  exported: boolean;
  jsdoc?: string;
}

export interface TypeScriptSymbol extends BaseSymbol {
  type: 'class' | 'interface' | 'type' | 'function' | 'component' | 'enum' | 'namespace';
  parameters?: Array<{ name: string; type: string; optional: boolean }>;
  returnType?: string;
  decorators?: string[];
}

export interface FastifyRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  path: string;
  handler: string;
  schema?: string;
  location: Location;
  middleware?: string[];
}

export interface PrismaModel {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    optional: boolean;
    relation?: string;
    attributes?: string[];
  }>;
  location: Location;
  indexes?: string[];
}

export interface ExtractedSymbols {
  typescript: TypeScriptSymbol[];
  fastify: FastifyRoute[];
  prisma: PrismaModel[];
}

/**
 * Extract symbols from a file path
 */
export async function extractSymbolsFromFile(filePath: string): Promise<Partial<ExtractedSymbols>> {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'ts':
    case 'tsx':
      return {
        typescript: await extractTypeScriptSymbols(filePath)
      };
    case 'prisma':
      return {
        prisma: await extractPrismaModels(filePath)
      };
    default:
      return {};
  }
}

/**
 * Calculate freshness score based on code alignment
 */
export function calculateCodeAlignment(
  documentedSymbols: string[],
  codeSymbols: string[]
): number {
  if (codeSymbols.length === 0) return 0;
  
  const intersection = documentedSymbols.filter(symbol => 
    codeSymbols.includes(symbol)
  );
  
  return intersection.length / codeSymbols.length;
}

/**
 * Calculate recency score based on dates
 */
export function calculateRecency(
  docDate: Date,
  codeDate: Date,
  currentDate: Date = new Date()
): number {
  const docAge = currentDate.getTime() - docDate.getTime();
  const codeAge = currentDate.getTime() - codeDate.getTime();
  
  // More recent is better, but code should be more recent than doc
  if (codeAge < docAge) return 0.8; // Code is newer than doc
  if (docAge < codeAge) return 0.6; // Doc is newer than code
  
  return 1.0; // Same age
}

/**
 * Calculate completeness score
 */
export function calculateCompleteness(
  documentedFeatures: string[],
  implementedFeatures: string[]
): number {
  if (implementedFeatures.length === 0) return 0;
  
  const coverage = documentedFeatures.filter(feature =>
    implementedFeatures.includes(feature)
  );
  
  return coverage.length / implementedFeatures.length;
}

/**
 * Calculate final freshness score
 */
export function calculateFreshnessScore(
  codeAlignment: number,
  recency: number,
  completeness: number
): number {
  // Weighted average: code alignment is most important
  return (codeAlignment * 0.5) + (recency * 0.3) + (completeness * 0.2);
}

// Placeholder functions - will be implemented in specific extractors
async function extractTypeScriptSymbols(filePath: string): Promise<TypeScriptSymbol[]> {
  // Implementation in typescript.extractor.ts
  return [];
}

async function extractPrismaModels(filePath: string): Promise<PrismaModel[]> {
  // Implementation in prisma.extractor.ts
  return [];
}
