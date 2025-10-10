#!/bin/bash

echo "🧪 Testing Axisor Production Environment..."

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

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    print_status "Testing: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        if [ "$expected_status" = "200" ]; then
            print_success "✓ $test_name - PASSED"
            ((TESTS_PASSED++))
        else
            print_error "✗ $test_name - FAILED (Expected $expected_status, got 200)"
            ((TESTS_FAILED++))
        fi
    else
        if [ "$expected_status" = "200" ]; then
            print_error "✗ $test_name - FAILED (Expected 200, got non-200)"
            ((TESTS_FAILED++))
        else
            print_success "✓ $test_name - PASSED (Expected non-200, got non-200)"
            ((TESTS_PASSED++))
        fi
    fi
}

# Check if containers are running
print_status "Checking if production containers are running..."
if ! docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_error "Production containers are not running. Please start them first with: ./scripts/deploy-prod.sh"
    exit 1
fi

print_success "Production containers are running"

# Wait a bit for services to be fully ready
print_status "Waiting for services to be fully ready..."
sleep 10

# Test backend health
run_test "Backend Health Check" "curl -f http://localhost:23000/health" "200"

# Test frontend availability
run_test "Frontend Availability" "curl -f http://localhost:23001" "200"

# Test API endpoints
run_test "API Root" "curl -f http://localhost:23000/api" "200"

# Test database connection
print_status "Testing database connection..."
if docker compose -f docker-compose.prod.yml exec backend npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    print_success "✓ Database Connection - PASSED"
    ((TESTS_PASSED++))
else
    print_error "✗ Database Connection - FAILED"
    ((TESTS_FAILED++))
fi

# Test Redis connection
print_status "Testing Redis connection..."
if docker compose -f docker-compose.prod.yml exec redis redis-cli ping | grep -q "PONG"; then
    print_success "✓ Redis Connection - PASSED"
    ((TESTS_PASSED++))
else
    print_error "✗ Redis Connection - FAILED"
    ((TESTS_FAILED++))
fi

# Test worker processes
print_status "Testing worker processes..."
if docker compose -f docker-compose.prod.yml ps | grep -q "margin-monitor.*Up"; then
    print_success "✓ Margin Monitor Worker - PASSED"
    ((TESTS_PASSED++))
else
    print_warning "⚠ Margin Monitor Worker - NOT RUNNING"
fi

if docker compose -f docker-compose.prod.yml ps | grep -q "automation-executor.*Up"; then
    print_success "✓ Automation Executor Worker - PASSED"
    ((TESTS_PASSED++))
else
    print_warning "⚠ Automation Executor Worker - NOT RUNNING"
fi

# Test SSL/TLS (if configured)
print_status "Testing SSL/TLS configuration..."
if curl -k -f https://localhost:443 > /dev/null 2>&1; then
    print_success "✓ SSL/TLS - PASSED"
    ((TESTS_PASSED++))
else
    print_warning "⚠ SSL/TLS - NOT CONFIGURED (Expected for local testing)"
fi

# Summary
echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "🎉 All critical tests passed! The platform is ready for production."
    echo ""
    echo "Next steps:"
    echo "1. Configure SSL certificates in infra/certs/"
    echo "2. Set up domain name and DNS"
    echo "3. Configure monitoring and alerting"
    echo "4. Set up backup procedures"
    echo "5. Configure firewall and security"
else
    print_error "❌ Some tests failed. Please check the issues above before going to production."
    exit 1
fi
