#!/bin/bash

echo "🚀 Setting up Staging Environment..."

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

# Check if .env.staging exists
if [ ! -f "env.staging" ]; then
    print_error ".env.staging file not found!"
    print_status "Please create env.staging based on env.production"
    exit 1
fi

print_status "Loading staging environment variables..."
source env.staging

# Stop any existing staging containers
print_status "Stopping existing staging containers..."
docker compose -f docker-compose.staging.yml down 2>/dev/null || true

# Remove old staging containers and volumes (optional - uncomment if needed)
# print_warning "Removing old staging containers and volumes..."
# docker compose -f docker-compose.staging.yml down -v --remove-orphans 2>/dev/null || true

# Build and start staging services
print_status "Building and starting staging services..."
docker compose -f docker-compose.staging.yml up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 15

# Check if PostgreSQL staging is ready
print_status "Checking PostgreSQL staging connection..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker exec hub-defisats-postgres-staging pg_isready -U $POSTGRES_USER -d $POSTGRES_DB_STAGING >/dev/null 2>&1; then
        print_success "PostgreSQL staging is ready!"
        break
    else
        print_status "Waiting for PostgreSQL staging... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    print_error "PostgreSQL staging failed to start within expected time"
    print_status "Checking PostgreSQL staging logs..."
    docker logs hub-defisats-postgres-staging
    exit 1
fi

# Create staging database if it doesn't exist
print_status "Creating staging database if it doesn't exist..."
docker exec hub-defisats-postgres-staging psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB_STAGING;" 2>/dev/null || print_warning "Database might already exist"

# Run Prisma migrations for staging
print_status "Running Prisma migrations for staging..."
cd backend
NODE_ENV=staging npx prisma migrate deploy --schema=./prisma/schema.prisma
if [ $? -eq 0 ]; then
    print_success "Prisma migrations completed successfully"
else
    print_error "Prisma migrations failed"
    print_status "Trying to push schema instead..."
    NODE_ENV=staging npx prisma db push --schema=./prisma/schema.prisma
    if [ $? -eq 0 ]; then
        print_success "Prisma schema pushed successfully"
    else
        print_error "Prisma schema push failed"
        exit 1
    fi
fi
cd ..

# Wait a bit more for all services to be fully ready
print_status "Waiting for all services to be fully ready..."
sleep 10

# Test staging backend health
print_status "Testing staging backend health..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:23010/api/health >/dev/null 2>&1; then
        print_success "Staging backend is healthy!"
        break
    else
        print_status "Waiting for staging backend... (attempt $attempt/$max_attempts)"
        sleep 3
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    print_error "Staging backend health check failed"
    print_status "Checking backend logs..."
    docker logs hub-defisats-backend-staging
    exit 1
fi

# Test staging frontend
print_status "Testing staging frontend..."
if curl -s http://localhost:23000 >/dev/null 2>&1; then
    print_success "Staging frontend is accessible!"
else
    print_warning "Staging frontend might not be ready yet"
    print_status "Checking frontend logs..."
    docker logs hub-defisats-frontend-staging
fi

# Show staging environment status
print_status "Staging environment status:"
echo "=================================="
docker compose -f docker-compose.staging.yml ps

echo ""
print_success "🎉 Staging environment is ready!"
echo ""
print_status "Access URLs:"
echo "  Frontend: http://localhost:23000"
echo "  Backend API: http://localhost:23010"
echo "  Health Check: http://localhost:23010/api/health"
echo ""
print_status "Database:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: $POSTGRES_DB_STAGING"
echo "  User: $POSTGRES_USER"
echo ""
print_status "To stop staging environment:"
echo "  docker compose -f docker-compose.staging.yml down"
echo ""
print_status "To view logs:"
echo "  docker compose -f docker-compose.staging.yml logs -f"
echo ""
print_warning "Remember to configure LN Markets sandbox credentials in env.staging!"
