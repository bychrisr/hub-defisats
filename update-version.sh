#!/bin/bash

# Script para atualizar versões do sistema
# Uso: ./update-version.sh [backend|frontend] [nova_versao]

set -e

BACKEND_FILE="backend/build-info.json"
FRONTEND_FILE="frontend/.env"

if [ $# -ne 2 ]; then
    echo "❌ Uso: $0 [backend|frontend] [nova_versao]"
    echo "Exemplos:"
    echo "  $0 backend 1.6.0    # Atualiza versão do backend"
    echo "  $0 frontend 1.6.0   # Atualiza versão do frontend"
    exit 1
fi

COMPONENT=$1
NEW_VERSION=$2

echo "🔄 Atualizando versão do $COMPONENT para $NEW_VERSION..."

if [ "$COMPONENT" = "backend" ]; then
    # Atualizar backend/build-info.json
    if [ -f "$BACKEND_FILE" ]; then
        # Backup do arquivo original
        cp "$BACKEND_FILE" "$BACKEND_FILE.backup"
        
        # Atualizar versão usando jq (se disponível) ou sed
        if command -v jq &> /dev/null; then
            jq --arg version "$NEW_VERSION" '.version = $version' "$BACKEND_FILE" > "$BACKEND_FILE.tmp" && mv "$BACKEND_FILE.tmp" "$BACKEND_FILE"
        else
            sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" "$BACKEND_FILE"
        fi
        
        echo "✅ Backend version updated to $NEW_VERSION"
        echo "🔄 Restarting backend container..."
        docker compose -f config/docker/docker-compose.dev.yml restart backend
        
    else
        echo "❌ Arquivo $BACKEND_FILE não encontrado!"
        exit 1
    fi

elif [ "$COMPONENT" = "frontend" ]; then
    # Atualizar frontend/.env
    if [ -f "$FRONTEND_FILE" ]; then
        # Backup do arquivo original
        cp "$FRONTEND_FILE" "$FRONTEND_FILE.backup"
        
        # Atualizar versão
        sed -i "s/VITE_APP_VERSION=.*/VITE_APP_VERSION=$NEW_VERSION/" "$FRONTEND_FILE"
        
        echo "✅ Frontend version updated to $NEW_VERSION"
        echo "🔄 Restarting frontend container..."
        docker compose -f config/docker/docker-compose.dev.yml restart frontend
        
    else
        echo "❌ Arquivo $FRONTEND_FILE não encontrado!"
        exit 1
    fi

else
    echo "❌ Componente inválido: $COMPONENT"
    echo "Use 'backend' ou 'frontend'"
    exit 1
fi

echo "🎉 Versão atualizada com sucesso!"
echo "📊 Status atual:"
echo "  Backend:  $(grep -o '"version": "[^"]*"' "$BACKEND_FILE" | cut -d'"' -f4)"
echo "  Frontend: $(grep "VITE_APP_VERSION" "$FRONTEND_FILE" | cut -d'=' -f2)"
