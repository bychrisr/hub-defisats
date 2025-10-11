#!/bin/bash
# LND Backup Script
# Backup LND data and configurations

set -e

echo "💾 Backing up LND Data"
echo "====================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Create backup directory
BACKUP_DIR="backups/lnd-$(date +%Y%m%d-%H%M%S)"
print_status "📁 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
print_success "Backup directory created"

# Backup LND Testnet
print_status "📦 Backing up LND Testnet..."
if docker-compose -f config/docker/docker-compose.dev.yml ps lnd-testnet | grep -q "Up"; then
    docker run --rm -v lnd-testnet-data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/lnd-testnet-backup.tar.gz -C /data .
    print_success "LND Testnet backup completed"
else
    print_warning "LND Testnet is not running, skipping backup"
fi

# Backup LND Production (if exists)
print_status "📦 Backing up LND Production..."
if docker-compose -f config/docker/docker-compose.dev.yml ps lnd-production | grep -q "Up"; then
    docker run --rm -v lnd-production-data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/lnd-production-backup.tar.gz -C /data .
    print_success "LND Production backup completed"
else
    print_warning "LND Production is not running, skipping backup"
fi

# Backup configurations
print_status "📋 Backing up configurations..."
if [ -d "config/lnd" ]; then
    cp -r config/lnd "$BACKUP_DIR/"
    print_success "LND configurations backed up"
else
    print_warning "LND configuration directory not found"
fi

if [ -d "config/bitcoin" ]; then
    cp -r config/bitcoin "$BACKUP_DIR/"
    print_success "Bitcoin configurations backed up"
else
    print_warning "Bitcoin configuration directory not found"
fi

# Backup logs
print_status "📝 Backing up logs..."
if [ -d "logs" ]; then
    cp -r logs "$BACKUP_DIR/"
    print_success "Logs backed up"
else
    print_warning "Logs directory not found"
fi

# Backup Docker Compose files
print_status "🐳 Backing up Docker Compose files..."
if [ -f "config/docker/docker-compose.dev.yml" ]; then
    cp config/docker/docker-compose.dev.yml "$BACKUP_DIR/"
    print_success "Docker Compose dev file backed up"
fi

if [ -f "config/docker/docker-compose.prod.yml" ]; then
    cp config/docker/docker-compose.prod.yml "$BACKUP_DIR/"
    print_success "Docker Compose prod file backed up"
fi

# Create backup manifest
print_status "📋 Creating backup manifest..."
cat > "$BACKUP_DIR/backup-manifest.json" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_type": "lnd_full",
  "version": "1.0.0",
  "components": {
    "lnd_testnet": $(docker-compose -f config/docker/docker-compose.dev.yml ps lnd-testnet | grep -q "Up" && echo "true" || echo "false"),
    "lnd_production": $(docker-compose -f config/docker/docker-compose.dev.yml ps lnd-production | grep -q "Up" && echo "true" || echo "false"),
    "configurations": true,
    "logs": true,
    "docker_compose": true
  },
  "backup_size": "$(du -sh "$BACKUP_DIR" | cut -f1)",
  "notes": "LND full backup including data, configurations, and logs"
}
EOF
print_success "Backup manifest created"

# Show backup summary
echo ""
echo "=========================================="
print_status "📊 Backup Summary"
echo "=========================================="
print_success "✅ Backup directory: $BACKUP_DIR"
print_success "✅ Backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"

echo ""
print_status "📁 Backup contents:"
ls -la "$BACKUP_DIR"

echo ""
print_status "📋 Backup manifest:"
cat "$BACKUP_DIR/backup-manifest.json" | jq .

print_success "✅ LND backup completed successfully!"
print_status "📋 To restore from this backup, run:"
echo "  ./scripts/lnd/backup/restore-lnd.sh $BACKUP_DIR"
