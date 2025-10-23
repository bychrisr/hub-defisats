/**
 * TypeScript symbol extractor
 */

import * as fs from 'fs';
import * as path from 'path';
import { TypeScriptSymbol, Location } from './common';

/**
 * Extract TypeScript symbols from a file
 */
export async function extractTypeScriptSymbols(filePath: string): Promise<TypeScriptSymbol[]> {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const symbols: TypeScriptSymbol[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Extract classes
    const classMatch = line.match(/^(export\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[2],
        type: 'class',
        location: { file: filePath, line: lineNumber },
        exported: !!classMatch[1],
        jsdoc: extractJSDoc(lines, i)
      });
    }

    // Extract interfaces
    const interfaceMatch = line.match(/^(export\s+)?interface\s+(\w+)/);
    if (interfaceMatch) {
      symbols.push({
        name: interfaceMatch[2],
        type: 'interface',
        location: { file: filePath, line: lineNumber },
        exported: !!interfaceMatch[1],
        jsdoc: extractJSDoc(lines, i)
      });
    }

    // Extract types
    const typeMatch = line.match(/^(export\s+)?type\s+(\w+)/);
    if (typeMatch) {
      symbols.push({
        name: typeMatch[2],
        type: 'type',
        location: { file: filePath, line: lineNumber },
        exported: !!typeMatch[1],
        jsdoc: extractJSDoc(lines, i)
      });
    }

    // Extract functions
    const functionMatch = line.match(/^(export\s+)?(async\s+)?function\s+(\w+)/);
    if (functionMatch) {
      symbols.push({
        name: functionMatch[3],
        type: 'function',
        location: { file: filePath, line: lineNumber },
        exported: !!functionMatch[1],
        jsdoc: extractJSDoc(lines, i),
        parameters: extractFunctionParameters(line),
        returnType: extractReturnType(line)
      });
    }

    // Extract arrow functions
    const arrowMatch = line.match(/^(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\(/);
    if (arrowMatch) {
      symbols.push({
        name: arrowMatch[2],
        type: 'function',
        location: { file: filePath, line: lineNumber },
        exported: !!arrowMatch[1],
        jsdoc: extractJSDoc(lines, i),
        parameters: extractFunctionParameters(line),
        returnType: extractReturnType(line)
      });
    }

    // Extract React components
    const componentMatch = line.match(/^(export\s+)?(const|function)\s+(\w+)\s*[=\(]/);
    if (componentMatch && isReactComponent(componentMatch[3])) {
      symbols.push({
        name: componentMatch[3],
        type: 'component',
        location: { file: filePath, line: lineNumber },
        exported: !!componentMatch[1],
        jsdoc: extractJSDoc(lines, i)
      });
    }

    // Extract enums
    const enumMatch = line.match(/^(export\s+)?enum\s+(\w+)/);
    if (enumMatch) {
      symbols.push({
        name: enumMatch[2],
        type: 'enum',
        location: { file: filePath, line: lineNumber },
        exported: !!enumMatch[1],
        jsdoc: extractJSDoc(lines, i)
      });
    }

    // Extract namespaces
    const namespaceMatch = line.match(/^(export\s+)?namespace\s+(\w+)/);
    if (namespaceMatch) {
      symbols.push({
        name: namespaceMatch[2],
        type: 'namespace',
        location: { file: filePath, line: lineNumber },
        exported: !!namespaceMatch[1],
        jsdoc: extractJSDoc(lines, i)
      });
    }
  }

  return symbols;
}

/**
 * Extract JSDoc comments
 */
function extractJSDoc(lines: string[], lineIndex: number): string | undefined {
  const jsdocLines: string[] = [];
  let i = lineIndex - 1;

  // Look backwards for JSDoc
  while (i >= 0 && lines[i].trim().startsWith('*')) {
    jsdocLines.unshift(lines[i].trim());
    i--;
  }

  // Check if we found a JSDoc start
  if (i >= 0 && lines[i].trim().startsWith('/**')) {
    jsdocLines.unshift(lines[i].trim());
    return jsdocLines.join('\n');
  }

  return undefined;
}

/**
 * Extract function parameters
 */
function extractFunctionParameters(line: string): Array<{ name: string; type: string; optional: boolean }> {
  const paramMatch = line.match(/\(([^)]*)\)/);
  if (!paramMatch) return [];

  const params = paramMatch[1].split(',').map(p => p.trim()).filter(p => p);
  return params.map(param => {
    const optional = param.includes('?');
    const typeMatch = param.match(/(\w+)(\?)?\s*:\s*([^=]+)/);
    if (typeMatch) {
      return {
        name: typeMatch[1],
        type: typeMatch[3].trim(),
        optional
      };
    }
    return {
      name: param.replace('?', '').trim(),
      type: 'any',
      optional
    };
  });
}

/**
 * Extract return type
 */
function extractReturnType(line: string): string | undefined {
  const returnMatch = line.match(/\)\s*:\s*([^{=]+)/);
  return returnMatch ? returnMatch[1].trim() : undefined;
}

/**
 * Check if a name looks like a React component
 */
function isReactComponent(name: string): boolean {
  return /^[A-Z]/.test(name) && (
    name.endsWith('Component') ||
    name.endsWith('Page') ||
    name.endsWith('Modal') ||
    name.endsWith('Button') ||
    name.endsWith('Form') ||
    name.endsWith('Card') ||
    name.endsWith('Layout') ||
    name.endsWith('Header') ||
    name.endsWith('Footer') ||
    name.endsWith('Sidebar') ||
    name.endsWith('Nav') ||
    name.endsWith('Menu') ||
    name.endsWith('List') ||
    name.endsWith('Item') ||
    name.endsWith('Container') ||
    name.endsWith('Wrapper') ||
    name.endsWith('Provider') ||
    name.endsWith('Context') ||
    name.endsWith('Hook') ||
    name.endsWith('Service') ||
    name.endsWith('Controller') ||
    name.endsWith('Handler') ||
    name.endsWith('Manager') ||
    name.endsWith('Helper') ||
    name.endsWith('Util') ||
    name.endsWith('Tool')
  );
}
