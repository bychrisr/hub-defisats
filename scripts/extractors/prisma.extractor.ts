/**
 * Prisma schema extractor
 */

import * as fs from 'fs';
import { PrismaModel, Location } from './common';

/**
 * Extract Prisma models from schema file
 */
export async function extractPrismaModels(schemaPath: string): Promise<PrismaModel[]> {
  if (!fs.existsSync(schemaPath)) {
    return [];
  }

  const content = fs.readFileSync(schemaPath, 'utf-8');
  const models: PrismaModel[] = [];
  const lines = content.split('\n');

  let currentModel: PrismaModel | null = null;
  let inModel = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Start of model
    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      if (currentModel) {
        models.push(currentModel);
      }
      
      currentModel = {
        name: modelMatch[1],
        fields: [],
        location: { file: schemaPath, line: lineNumber },
        indexes: []
      };
      inModel = true;
      braceCount = 1;
      continue;
    }

    // End of model
    if (inModel && currentModel) {
      if (line.includes('}')) {
        braceCount--;
        if (braceCount === 0) {
          models.push(currentModel);
          currentModel = null;
          inModel = false;
        }
        continue;
      }

      // Field definition
      const fieldMatch = line.match(/^\s*(\w+)\s+(\w+)(\?)?(\s+@\w+.*)?$/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const optional = !!fieldMatch[3];
        const attributes = fieldMatch[4] ? extractAttributes(fieldMatch[4]) : [];

        currentModel.fields.push({
          name: fieldName,
          type: fieldType,
          optional,
          attributes
        });
      }

      // Index definition
      const indexMatch = line.match(/^\s*@@index\(\[([^\]]+)\]\)/);
      if (indexMatch) {
        const indexFields = indexMatch[1].split(',').map(f => f.trim().replace(/"/g, ''));
        currentModel.indexes = currentModel.indexes || [];
        currentModel.indexes.push(...indexFields);
      }

      // Unique constraint
      const uniqueMatch = line.match(/^\s*@@unique\(\[([^\]]+)\]\)/);
      if (uniqueMatch) {
        const uniqueFields = uniqueMatch[1].split(',').map(f => f.trim().replace(/"/g, ''));
        currentModel.indexes = currentModel.indexes || [];
        currentModel.indexes.push(...uniqueFields.map(f => `unique:${f}`));
      }

      // Primary key
      const pkMatch = line.match(/^\s*@@id\(\[([^\]]+)\]\)/);
      if (pkMatch) {
        const pkFields = pkMatch[1].split(',').map(f => f.trim().replace(/"/g, ''));
        currentModel.indexes = currentModel.indexes || [];
        currentModel.indexes.push(...pkFields.map(f => `primary:${f}`));
      }

      if (line.includes('{')) {
        braceCount++;
      }
    }
  }

  return models;
}

/**
 * Extract attributes from field definition
 */
function extractAttributes(attrString: string): string[] {
  const attributes: string[] = [];
  
  // Match @id, @unique, @default, @relation, etc.
  const attrPatterns = [
    /@id/g,
    /@unique/g,
    /@default\([^)]+\)/g,
    /@relation\([^)]+\)/g,
    /@map\([^)]+\)/g,
    /@updatedAt/g,
    /@createdAt/g,
    /@db\.\w+/g
  ];

  for (const pattern of attrPatterns) {
    const matches = attrString.match(pattern);
    if (matches) {
      attributes.push(...matches);
    }
  }

  return attributes;
}

/**
 * Extract relations from model
 */
function extractRelations(model: PrismaModel): Array<{ name: string; type: string; relation?: string }> {
  const relations: Array<{ name: string; type: string; relation?: string }> = [];

  for (const field of model.fields) {
    // Check if field has relation attributes
    const relationAttr = field.attributes?.find(attr => attr.startsWith('@relation'));
    if (relationAttr) {
      const relationMatch = relationAttr.match(/@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\][^)]*\)/);
      if (relationMatch) {
        relations.push({
          name: field.name,
          type: field.type,
          relation: `${relationMatch[1]} -> ${relationMatch[2]}`
        });
      }
    }
  }

  return relations;
}

/**
 * Get all model names from schema
 */
export function getModelNames(schemaPath: string): string[] {
  if (!fs.existsSync(schemaPath)) {
    return [];
  }

  const content = fs.readFileSync(schemaPath, 'utf-8');
  const models: string[] = [];
  
  const modelMatches = content.match(/^model\s+(\w+)/gm);
  if (modelMatches) {
    models.push(...modelMatches.map(match => match.replace(/^model\s+/, '')));
  }

  return models;
}

/**
 * Get all enum names from schema
 */
export function getEnumNames(schemaPath: string): string[] {
  if (!fs.existsSync(schemaPath)) {
    return [];
  }

  const content = fs.readFileSync(schemaPath, 'utf-8');
  const enums: string[] = [];
  
  const enumMatches = content.match(/^enum\s+(\w+)/gm);
  if (enumMatches) {
    enums.push(...enumMatches.map(match => match.replace(/^enum\s+/, '')));
  }

  return enums;
}
