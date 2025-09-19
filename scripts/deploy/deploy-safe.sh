#!/bin/bash

# 🛡️ DEPLOY SEGURO - Hub DeFiSats
# Script para deploy seguro sem quebrar produção

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_critical() {
    echo -e "${RED}[CRITICAL]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Configuration
PRODUCTION_DOMAIN="defisats.site"
API_DOMAIN="api.defisats.site"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
STAGING_DOMAIN="staging.defisats.site"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Don't run as root! Use a regular user with sudo privileges."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Function to check if production is accessible
check_production_health() {
    print_step "🔍 Checking production health..."
    
    # Check if production is responding
    if curl -s -f "https://${PRODUCTION_DOMAIN}" > /dev/null 2>&1; then
        print_success "Production frontend is accessible"
    else
        print_error "Production frontend is not accessible!"
        return 1
    fi
    
    if curl -s -f "https://${API_DOMAIN}/health" > /dev/null 2>&1; then
        print_success "Production API is accessible"
    else
        print_error "Production API is not accessible!"
        return 1
    fi
}

# Function to create backup
create_backup() {
    print_step "💾 Creating backup of current production..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current Docker images
    print_status "Backing up current Docker images..."
    docker images | grep "hub-defisats" > "$BACKUP_DIR/docker_images.txt"
    
    # Backup current environment
    if [ -f "config/env/.env.production" ]; then
        cp "config/env/.env.production" "$BACKUP_DIR/.env.production.backup"
        print_success "Environment backup created"
    fi
    
    # Backup current docker-compose
    if [ -f "docker-compose.prod.yml" ]; then
        cp "docker-compose.prod.yml" "$BACKUP_DIR/docker-compose.prod.yml.backup"
        print_success "Docker Compose backup created"
    fi
    
    print_success "Backup created in: $BACKUP_DIR"
}

# Function to test staging environment
test_staging() {
    print_step "🧪 Testing staging environment..."
    
    # Check if staging is configured
    if [ ! -f "config/env/.env.staging" ]; then
        print_warning "Staging environment not configured. Creating from production..."
        cp "config/env/.env.production" "config/env/.env.staging"
        # Update staging URLs
        sed -i 's/defisats\.site/staging.defisats.site/g' "config/env/.env.staging"
        sed -i 's/api\.defisats\.site/staging-api.defisats.site/g' "config/env/.env.staging"
    fi
    
    print_status "Starting staging environment..."
    docker compose -f docker-compose.staging.yml up -d
    
    # Wait for staging to be ready
    print_status "Waiting for staging to be ready..."
    sleep 30
    
    # Test staging
    if curl -s -f "http://localhost:13000" > /dev/null 2>&1; then
        print_success "Staging frontend is working"
    else
        print_error "Staging frontend failed!"
        return 1
    fi
    
    if curl -s -f "http://localhost:13010/health" > /dev/null 2>&1; then
        print_success "Staging API is working"
    else
        print_error "Staging API failed!"
        return 1
    fi
    
    print_success "Staging environment is working correctly!"
}

# Function to prepare production deploy
prepare_production() {
    print_step "🚀 Preparing production deployment..."
    
    # Ensure we have the latest code
    print_status "Pulling latest code..."
    git pull origin main
    
    # Build new images
    print_status "Building new Docker images..."
    docker compose -f docker-compose.prod.yml build --no-cache
    
    # Test new images locally
    print_status "Testing new images locally..."
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    sleep 30
    
    # Test locally
    if curl -s -f "http://localhost:13000" > /dev/null 2>&1; then
        print_success "New frontend image is working locally"
    else
        print_error "New frontend image failed locally!"
        return 1
    fi
    
    if curl -s -f "http://localhost:13010/health" > /dev/null 2>&1; then
        print_success "New API image is working locally"
    else
        print_error "New API image failed locally!"
        return 1
    fi
    
    # Stop local test
    docker compose -f docker-compose.prod.yml down
    
    print_success "Production deployment prepared successfully!"
}

# Function to execute production deploy
deploy_production() {
    print_step "🚀 Executing production deployment..."
    
    # Stop current production (with grace period)
    print_status "Stopping current production services..."
    docker compose -f docker-compose.prod.yml down --timeout 30
    
    # Start new production
    print_status "Starting new production services..."
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 60
    
    # Health check
    print_status "Performing health checks..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Health check attempt $attempt/$max_attempts..."
        
        if curl -s -f "https://${PRODUCTION_DOMAIN}" > /dev/null 2>&1 && \
           curl -s -f "https://${API_DOMAIN}/health" > /dev/null 2>&1; then
            print_success "Production is healthy!"
            return 0
        fi
        
        print_warning "Health check failed, waiting 30 seconds..."
        sleep 30
        ((attempt++))
    done
    
    print_error "Production health check failed after $max_attempts attempts!"
    return 1
}

# Function to rollback
rollback() {
    print_critical "🔄 ROLLBACK INITIATED!"
    
    print_status "Stopping current services..."
    docker compose -f docker-compose.prod.yml down
    
    print_status "Restoring backup..."
    if [ -f "$BACKUP_DIR/.env.production.backup" ]; then
        cp "$BACKUP_DIR/.env.production.backup" "config/env/.env.production"
    fi
    
    if [ -f "$BACKUP_DIR/docker-compose.prod.yml.backup" ]; then
        cp "$BACKUP_DIR/docker-compose.prod.yml.backup" "docker-compose.prod.yml"
    fi
    
    print_status "Starting previous version..."
    docker compose -f docker-compose.prod.yml up -d
    
    print_warning "Rollback completed. Please check production status."
}

# Main execution
main() {
    print_status "🛡️ Starting SAFE DEPLOY process..."
    echo ""
    
    # Step 1: Check production health
    if ! check_production_health; then
        print_error "Production is not healthy. Aborting deploy."
        exit 1
    fi
    
    # Step 2: Create backup
    create_backup
    
    # Step 3: Test staging
    if ! test_staging; then
        print_error "Staging test failed. Aborting deploy."
        exit 1
    fi
    
    # Step 4: Prepare production
    if ! prepare_production; then
        print_error "Production preparation failed. Aborting deploy."
        exit 1
    fi
    
    # Step 5: Confirm before deploy
    echo ""
    print_warning "⚠️  READY TO DEPLOY TO PRODUCTION ⚠️"
    echo ""
    print_status "Backup created in: $BACKUP_DIR"
    print_status "Staging test: PASSED"
    print_status "Local test: PASSED"
    echo ""
    read -p "Do you want to proceed with production deployment? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deploy cancelled by user."
        exit 0
    fi
    
    # Step 6: Deploy production
    if ! deploy_production; then
        print_error "Production deployment failed!"
        print_critical "Initiating rollback..."
        rollback
        exit 1
    fi
    
    print_success "🎉 DEPLOY COMPLETED SUCCESSFULLY!"
    print_status "Production is running the new version."
    print_status "Backup available in: $BACKUP_DIR"
}

# Handle Ctrl+C
trap 'print_error "Deploy interrupted by user. Initiating rollback..."; rollback; exit 1' INT

# Run main function
main "$@"
