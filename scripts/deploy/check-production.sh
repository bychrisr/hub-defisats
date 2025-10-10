#!/bin/bash

# 🔍 CHECK PRODUCTION STATUS
# Script para verificar o status atual do servidor de produção

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_DOMAIN="defisats.site"
API_DOMAIN="api.defisats.site"

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

# Function to check domain accessibility
check_domain() {
    local domain=$1
    local name=$2
    
    print_status "Checking $name ($domain)..."
    
    if curl -s -f "https://$domain" > /dev/null 2>&1; then
        print_success "$name is accessible"
        return 0
    else
        print_error "$name is not accessible"
        return 1
    fi
}

# Function to check API health
check_api_health() {
    local api_domain=$1
    
    print_status "Checking API health ($api_domain)..."
    
    local response=$(curl -s -w "%{http_code}" "https://$api_domain/health" 2>/dev/null || echo "000")
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        print_success "API health check passed (HTTP $http_code)"
        return 0
    else
        print_error "API health check failed (HTTP $http_code)"
        return 1
    fi
}

# Function to check API endpoints
check_api_endpoints() {
    local api_domain=$1
    
    print_status "Checking API endpoints..."
    
    # Check auth endpoint
    local auth_response=$(curl -s -w "%{http_code}" "https://$api_domain/api/auth/status" 2>/dev/null || echo "000")
    local auth_code="${auth_response: -3}"
    
    if [ "$auth_code" = "200" ] || [ "$auth_code" = "401" ]; then
        print_success "Auth endpoint responding (HTTP $auth_code)"
    else
        print_error "Auth endpoint failed (HTTP $auth_code)"
    fi
    
    # Check automations endpoint
    local auto_response=$(curl -s -w "%{http_code}" "https://$api_domain/api/automations" 2>/dev/null || echo "000")
    local auto_code="${auto_response: -3}"
    
    if [ "$auto_code" = "200" ] || [ "$auto_code" = "401" ]; then
        print_success "Automations endpoint responding (HTTP $auto_code)"
    else
        print_error "Automations endpoint failed (HTTP $auto_code)"
    fi
}

# Function to check SSL certificate
check_ssl() {
    local domain=$1
    
    print_status "Checking SSL certificate for $domain..."
    
    local ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate is valid"
        echo "$ssl_info" | grep "notAfter" | sed 's/notAfter=/Expires: /'
    else
        print_error "SSL certificate check failed"
    fi
}

# Function to check response times
check_response_times() {
    local domain=$1
    local name=$2
    
    print_status "Checking response time for $name..."
    
    local response_time=$(curl -s -w "%{time_total}" "https://$domain" -o /dev/null 2>/dev/null || echo "0")
    
    if (( $(echo "$response_time < 5.0" | bc -l) )); then
        print_success "$name response time: ${response_time}s (Good)"
    elif (( $(echo "$response_time < 10.0" | bc -l) )); then
        print_warning "$name response time: ${response_time}s (Slow)"
    else
        print_error "$name response time: ${response_time}s (Very Slow)"
    fi
}

# Function to check Docker containers (if accessible)
check_docker_containers() {
    print_status "Checking Docker containers..."
    
    if command -v docker >/dev/null 2>&1; then
        local containers=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(axisor|defisats)" || echo "No containers found")
        echo "$containers"
    else
        print_warning "Docker not available locally"
    fi
}

# Main execution
main() {
    print_status "🔍 Checking production status for Hub DeFiSats..."
    echo ""
    
    local frontend_ok=false
    local api_ok=false
    local api_health_ok=false
    
    # Check frontend
    if check_domain "$PRODUCTION_DOMAIN" "Frontend"; then
        frontend_ok=true
        check_response_times "$PRODUCTION_DOMAIN" "Frontend"
    fi
    
    echo ""
    
    # Check API
    if check_domain "$API_DOMAIN" "API"; then
        api_ok=true
        check_response_times "$API_DOMAIN" "API"
        
        if check_api_health "$API_DOMAIN"; then
            api_health_ok=true
        fi
        
        check_api_endpoints "$API_DOMAIN"
    fi
    
    echo ""
    
    # Check SSL
    check_ssl "$PRODUCTION_DOMAIN"
    check_ssl "$API_DOMAIN"
    
    echo ""
    
    # Check Docker containers
    check_docker_containers
    
    echo ""
    print_status "📊 SUMMARY:"
    
    if [ "$frontend_ok" = true ]; then
        print_success "✅ Frontend: OK"
    else
        print_error "❌ Frontend: FAILED"
    fi
    
    if [ "$api_ok" = true ]; then
        print_success "✅ API: OK"
    else
        print_error "❌ API: FAILED"
    fi
    
    if [ "$api_health_ok" = true ]; then
        print_success "✅ API Health: OK"
    else
        print_error "❌ API Health: FAILED"
    fi
    
    echo ""
    
    if [ "$frontend_ok" = true ] && [ "$api_ok" = true ] && [ "$api_health_ok" = true ]; then
        print_success "🎉 Production is healthy and ready for deployment!"
    else
        print_error "⚠️  Production has issues. Please fix before deploying."
    fi
}

# Run main function
main "$@"
