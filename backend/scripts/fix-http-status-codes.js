#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Função para adicionar status 500 aos schemas de resposta
function add500StatusToSchema(schema) {
  if (schema && schema.response) {
    // Se não tem status 500, adiciona
    if (!schema.response[500]) {
      schema.response[500] = {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      };
    }
  }
  return schema;
}

// Função para processar um arquivo
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Regex para encontrar schemas de resposta
    const responseSchemaRegex = /response:\s*\{[^}]*\}/g;
    
    let newContent = content.replace(responseSchemaRegex, (match) => {
      // Verifica se já tem status 500
      if (match.includes('500:')) {
        return match;
      }
      
      // Adiciona status 500 antes do fechamento do objeto
      const lastBraceIndex = match.lastIndexOf('}');
      const beforeLastBrace = match.substring(0, lastBraceIndex);
      const afterLastBrace = match.substring(lastBraceIndex);
      
      // Adiciona vírgula se necessário
      const needsComma = !beforeLastBrace.trim().endsWith(',') && !beforeLastBrace.trim().endsWith('{');
      const comma = needsComma ? ',' : '';
      
      const status500 = `${comma}
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        }`;
      
      return beforeLastBrace + status500 + afterLastBrace;
    });
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed HTTP status codes in: ${filePath}`);
      modified = true;
    }
    
    return modified;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Função principal
function main() {
  const routesDir = path.join(__dirname, '..', 'src', 'routes');
  const pattern = path.join(routesDir, '*.ts');
  
  console.log('🔧 Fixing HTTP status codes in route files...');
  console.log(`📁 Searching in: ${pattern}`);
  
  const files = glob.sync(pattern);
  let totalFixed = 0;
  
  files.forEach(file => {
    if (processFile(file)) {
      totalFixed++;
    }
  });
  
  console.log(`\n🎉 Fixed ${totalFixed} files`);
}

if (require.main === module) {
  main();
}

module.exports = { processFile, add500StatusToSchema };
