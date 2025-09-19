#!/bin/bash

# 🔧 Setup Environment Script
# Script para configurar variáveis de ambiente para produção

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production already exists
if [ -f "config/env/.env.production" ]; then
    print_warning ".env.production already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Keeping existing .env.production file"
        exit 0
    fi
fi

# Copy example file
print_status "Creating .env.production from template..."
cp config/env/env.production.example config/env/.env.production

print_success ".env.production created successfully!"
echo ""

print_status "📝 Please edit config/env/.env.production with your production values:"
echo ""
echo "Required variables to configure:"
echo "  - POSTGRES_PASSWORD: Your secure database password"
echo "  - JWT_SECRET: Your secure JWT secret (32+ characters)"
echo "  - ENCRYPTION_KEY: Your secure encryption key (32 characters)"
echo "  - CORS_ORIGIN: Your production domain"
echo "  - VITE_API_URL: Your production API URL"
echo ""

print_status "You can edit the file with:"
echo "  nano config/env/.env.production"
echo "  vim config/env/.env.production"
echo "  code config/env/.env.production"
echo ""

print_warning "⚠️  IMPORTANT: Never commit .env.production to version control!"
print_warning "⚠️  Make sure to add it to .gitignore"

print_success "Environment setup completed!"
