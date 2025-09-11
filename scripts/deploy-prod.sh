#!/bin/bash

echo "🚀 Deploying Hub-defisats to Production..."

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

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found. Please create it with production environment variables."
    exit 1
fi

print_status "Loading production environment variables..."
source .env.production

print_status "Stopping existing production containers..."
docker compose -f docker-compose.prod.yml down

print_status "Building production images..."
docker compose -f docker-compose.prod.yml build --no-cache

print_status "Starting production containers..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if containers are running
if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_success "Production containers are running!"
else
    print_error "Some containers failed to start. Check logs with: docker compose -f docker-compose.prod.yml logs"
    exit 1
fi

print_status "Running database migrations..."
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

print_status "Checking service health..."

# Check backend health
if curl -f http://localhost:23000/health > /dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_warning "Backend health check failed"
fi

# Check frontend health
if curl -f http://localhost:23001 > /dev/null 2>&1; then
    print_success "Frontend is healthy"
else
    print_warning "Frontend health check failed"
fi

print_success "🎉 Production deployment completed!"
echo ""
echo "Services are available at:"
echo "- Frontend: http://localhost:23001"
echo "- Backend API: http://localhost:23000"
echo "- Database: localhost:15432"
echo "- Redis: localhost:16379"
echo ""
echo "To view logs:"
echo "docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To stop services:"
echo "docker compose -f docker-compose.prod.yml down"
