#!/bin/bash

echo "🧪 Testing Axisor Local Environment..."

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

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "✓ Node.js is installed: $NODE_VERSION"
    ((TESTS_PASSED++))
else
    print_error "✗ Node.js is not installed"
    ((TESTS_FAILED++))
    exit 1
fi

# Check if npm is installed
print_status "Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "✓ npm is installed: $NPM_VERSION"
    ((TESTS_PASSED++))
else
    print_error "✗ npm is not installed"
    ((TESTS_FAILED++))
    exit 1
fi

# Check if backend dependencies are installed
print_status "Checking backend dependencies..."
if [ -d "backend/node_modules" ]; then
    print_success "✓ Backend dependencies are installed"
    ((TESTS_PASSED++))
else
    print_warning "⚠ Backend dependencies not found, installing..."
    cd backend && npm install && cd ..
    if [ -d "backend/node_modules" ]; then
        print_success "✓ Backend dependencies installed successfully"
        ((TESTS_PASSED++))
    else
        print_error "✗ Failed to install backend dependencies"
        ((TESTS_FAILED++))
    fi
fi

# Check if frontend dependencies are installed
print_status "Checking frontend dependencies..."
if [ -d "frontend/node_modules" ]; then
    print_success "✓ Frontend dependencies are installed"
    ((TESTS_PASSED++))
else
    print_warning "⚠ Frontend dependencies not found, installing..."
    cd frontend && npm install && cd ..
    if [ -d "frontend/node_modules" ]; then
        print_success "✓ Frontend dependencies installed successfully"
        ((TESTS_PASSED++))
    else
        print_error "✗ Failed to install frontend dependencies"
        ((TESTS_FAILED++))
    fi
fi

# Check if TypeScript can compile backend
print_status "Testing backend TypeScript compilation..."
cd backend
if npm run build > /dev/null 2>&1; then
    print_success "✓ Backend TypeScript compilation successful"
    ((TESTS_PASSED++))
else
    print_error "✗ Backend TypeScript compilation failed"
    ((TESTS_FAILED++))
fi
cd ..

# Check if TypeScript can compile frontend
print_status "Testing frontend TypeScript compilation..."
cd frontend
if npm run build > /dev/null 2>&1; then
    print_success "✓ Frontend TypeScript compilation successful"
    ((TESTS_PASSED++))
else
    print_error "✗ Frontend TypeScript compilation failed"
    ((TESTS_FAILED++))
fi
cd ..

# Check if Prisma schema is valid
print_status "Testing Prisma schema..."
cd backend
if npx prisma validate > /dev/null 2>&1; then
    print_success "✓ Prisma schema is valid"
    ((TESTS_PASSED++))
else
    print_error "✗ Prisma schema is invalid"
    ((TESTS_FAILED++))
fi
cd ..

# Check if environment files exist
print_status "Checking environment files..."
if [ -f "backend/.env" ]; then
    print_success "✓ Backend .env file exists"
    ((TESTS_PASSED++))
else
    print_warning "⚠ Backend .env file not found"
fi

if [ -f "frontend/.env" ]; then
    print_success "✓ Frontend .env file exists"
    ((TESTS_PASSED++))
else
    print_warning "⚠ Frontend .env file not found"
fi

# Check if production files exist
print_status "Checking production files..."
if [ -f "docker-compose.prod.yml" ]; then
    print_success "✓ Production Docker Compose file exists"
    ((TESTS_PASSED++))
else
    print_error "✗ Production Docker Compose file not found"
    ((TESTS_FAILED++))
fi

if [ -f "backend/Dockerfile.prod" ]; then
    print_success "✓ Backend production Dockerfile exists"
    ((TESTS_PASSED++))
else
    print_error "✗ Backend production Dockerfile not found"
    ((TESTS_FAILED++))
fi

if [ -f "frontend/Dockerfile.prod" ]; then
    print_success "✓ Frontend production Dockerfile exists"
    ((TESTS_PASSED++))
else
    print_error "✗ Frontend production Dockerfile not found"
    ((TESTS_FAILED++))
fi

if [ -f "infra/nginx/nginx.conf" ]; then
    print_success "✓ Nginx configuration exists"
    ((TESTS_PASSED++))
else
    print_error "✗ Nginx configuration not found"
    ((TESTS_FAILED++))
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
    print_success "🎉 All tests passed! The platform is ready for production deployment."
    echo ""
    echo "Next steps:"
    echo "1. Fix Docker issues if any"
    echo "2. Configure production environment variables"
    echo "3. Deploy to production: ./scripts/deploy-prod.sh"
    echo "4. Test production: ./scripts/test-production.sh"
else
    print_error "❌ Some tests failed. Please fix the issues above before going to production."
    exit 1
fi
