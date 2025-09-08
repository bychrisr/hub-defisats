#!/bin/bash

echo "🚀 Setting up Hub-defisats Development Environment..."

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose and try again."
    exit 1
fi

print_status "Creating environment files..."

# Create backend .env file
if [ ! -f "backend/.env" ]; then
    cp backend/env.development backend/.env
    print_success "Created backend/.env file"
else
    print_warning "backend/.env already exists, skipping..."
fi

# Create frontend .env file
if [ ! -f "frontend/.env" ]; then
    cp frontend/env.development frontend/.env
    print_success "Created frontend/.env file"
else
    print_warning "frontend/.env already exists, skipping..."
fi

print_status "Building and starting containers..."

# Stop any existing containers
docker compose -f docker-compose.dev.yml down

# Build and start containers
docker compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if containers are running
if docker compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    print_success "Containers are running!"
else
    print_error "Some containers failed to start. Check logs with: docker compose -f docker-compose.dev.yml logs"
    exit 1
fi

print_status "Running database migrations..."

# Run database migrations
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name init

print_status "Generating Prisma client..."
docker compose -f docker-compose.dev.yml exec backend npx prisma generate

print_success "🎉 Development environment is ready!"

echo ""
echo "📋 Services available:"
echo "  • Frontend: http://localhost:3001"
echo "  • Backend API: http://localhost:3010"
echo "  • API Documentation: http://localhost:3010/docs"
echo "  • Database: localhost:5432 (hubdefisats/hubdefisats_dev_password)"
echo "  • Redis: localhost:6379"
echo ""
echo "🔧 Useful commands:"
echo "  • View logs: docker compose -f docker-compose.dev.yml logs -f"
echo "  • Stop services: docker compose -f docker-compose.dev.yml down"
echo "  • Restart services: docker compose -f docker-compose.dev.yml restart"
echo "  • Database studio: docker compose -f docker-compose.dev.yml exec backend npx prisma studio"
echo ""
echo "🚀 You can now register and test the application!"
