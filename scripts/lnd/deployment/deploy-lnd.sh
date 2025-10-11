#!/bin/bash
# LND Deployment Script
# Deploy complete LND infrastructure for testnet and production

set -e

echo "🚀 Deploying LND Infrastructure"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "🔍 Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker not found. Please install Docker."
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose not found. Please install Docker Compose."
    exit 1
fi

if ! command_exists jq; then
    print_warning "jq not found. Installing jq for JSON processing..."
    sudo apt-get update && sudo apt-get install -y jq
fi

print_success "Prerequisites check completed"

# Create necessary directories
print_status "📁 Creating directories..."
mkdir -p config/lnd
mkdir -p config/bitcoin
mkdir -p logs/lnd
mkdir -p logs/bitcoin
mkdir -p scripts/lnd/backup
print_success "Directories created"

# Create Docker network if it doesn't exist
print_status "🌐 Creating Docker network..."
docker network create axisor-network 2>/dev/null || print_warning "Network already exists"
print_success "Docker network ready"

# Stop existing services
print_status "🛑 Stopping existing services..."
docker-compose -f config/docker/docker-compose.dev.yml down 2>/dev/null || print_warning "No existing services to stop"
print_success "Existing services stopped"

# Build and start services
print_status "🏗️ Building and starting services..."
docker-compose -f config/docker/docker-compose.dev.yml up -d
print_success "Services started"

# Wait for initialization
print_status "⏳ Waiting for services to initialize..."
sleep 30
print_success "Initialization period completed"

# Check service health
print_status "🏥 Checking service health..."
docker-compose -f config/docker/docker-compose.dev.yml ps

# Test LND connectivity
print_status "🔗 Testing LND connectivity..."
if curl -k -s https://localhost:18080/v1/getinfo > /dev/null 2>&1; then
    print_success "LND Testnet is accessible"
else
    print_error "LND Testnet is not accessible"
    print_status "📋 Checking logs for errors..."
    docker-compose -f config/docker/docker-compose.dev.yml logs --tail=20 lnd-testnet
    exit 1
fi

# Test LND API via backend
print_status "🔗 Testing LND API via backend..."
if curl -s http://localhost:13010/api/lnd/info > /dev/null 2>&1; then
    print_success "LND Backend API is accessible"
else
    print_warning "LND Backend API is not accessible (backend may still be starting)"
fi

print_success "✅ LND deployment completed successfully!"
print_status "📋 Next steps:"
echo "  1. Run: ./scripts/lnd/deployment/init-lnd-wallet.sh"
echo "  2. Run: ./scripts/lnd/monitoring/monitor-lnd-sync.sh"
echo "  3. Run: ./scripts/lnd/testing/test-lnd-functionality.sh"
