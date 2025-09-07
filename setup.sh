#!/bin/bash

# Hub-defisats Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up hub-defisats development environment..."

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "All prerequisites are installed"

# Create environment files
print_status "Creating environment files..."

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    print_success "Created backend/.env from .env.example"
    print_warning "Please update backend/.env with your actual configuration"
else
    print_warning "backend/.env already exists, skipping..."
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
print_success "Backend dependencies installed"

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd ../frontend
npm install
print_success "Frontend dependencies installed"

cd ..

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p infra/nginx
mkdir -p infra/certs
mkdir -p scripts
print_success "Directories created"

# Start development environment
print_status "Starting development environment..."
docker-compose -f docker-compose.dev.yml up -d postgres redis
print_success "Database and Redis started"

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 10

# Run database migrations
print_status "Running database migrations..."
cd backend
npx prisma db push
print_success "Database migrations completed"

cd ..

print_success "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your actual configuration"
echo "2. Start the development environment:"
echo "   docker-compose -f docker-compose.dev.yml up"
echo "3. Or start individual services:"
echo "   docker-compose -f docker-compose.dev.yml up backend frontend"
echo ""
echo "Available commands:"
echo "- Start all services: docker-compose -f docker-compose.dev.yml up"
echo "- Start only backend: docker-compose -f docker-compose.dev.yml up backend"
echo "- Start only frontend: docker-compose -f docker-compose.dev.yml up frontend"
echo "- View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "- Stop services: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "Backend will be available at: http://localhost:3000"
echo "Frontend will be available at: http://localhost:3001"
echo "Database will be available at: localhost:5432"
echo "Redis will be available at: localhost:6379"
