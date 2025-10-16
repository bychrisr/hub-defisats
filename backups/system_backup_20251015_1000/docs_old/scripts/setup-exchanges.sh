#!/bin/bash

# Script para configurar exchanges no banco de dados
# Executa migração e seeder para popular exchanges

echo "🚀 Configurando exchanges no banco de dados..."

# Verificar se estamos no diretório correto
if [ ! -f "backend/package.json" ]; then
    echo "❌ Execute este script a partir da raiz do projeto"
    exit 1
fi

# Navegar para o diretório backend
cd backend

echo "📊 Executando migração do Prisma..."
npx prisma migrate dev --name add_exchanges

if [ $? -ne 0 ]; then
    echo "❌ Erro na migração do Prisma"
    exit 1
fi

echo "🌱 Executando seeder de exchanges..."
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Erro no seeder"
    exit 1
fi

echo "✅ Exchanges configuradas com sucesso!"
echo ""
echo "📋 Exchanges criadas:"
echo "   - LN Markets (ln-markets)"
echo "   - Tipos de credenciais: API Key, API Secret, Passphrase"
echo ""
echo "🔍 Para verificar, execute:"
echo "   npx prisma studio"
