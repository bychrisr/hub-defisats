#!/bin/bash

echo "🔧 Fixing TypeScript errors for production..."

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

cd backend

print_status "Fixing TypeScript errors..."

# Fix error handling in index.ts
print_status "Fixing error handling in index.ts..."
sed -i 's/fastify.log.error('\''Error during shutdown:'\''/fastify.log.error('\''Error during shutdown:'\''/g' src/index.ts
sed -i 's/fastify.log.error('\''Error starting server:'\''/fastify.log.error('\''Error starting server:'\''/g' src/index.ts

# Fix error handling in admin.routes.ts
print_status "Fixing error handling in admin.routes.ts..."
sed -i 's/error.message/(error as Error).message/g' src/routes/admin.routes.ts
sed -i 's/error.stack/(error as Error).stack/g' src/routes/admin.routes.ts

# Fix unused variables
print_status "Fixing unused variables..."
sed -i 's/async (request: FastifyRequest, reply: FastifyReply) => {/async (_request: FastifyRequest, _reply: FastifyReply) => {/g' src/routes/admin.routes.ts
sed -i 's/async (request, reply) => {/async (_request, _reply) => {/g' src/routes/profile.routes.ts

# Fix Prisma types
print_status "Fixing Prisma types..."
sed -i 's/import { PrismaClient, User, SocialProvider } from '\''@prisma\/client'\'';/import { PrismaClient, User } from '\''@prisma\/client'\'';/g' src/services/auth.service.ts
sed -i 's/import { PrismaClient, Automation, AutomationType } from '\''@prisma\/client'\'';/import { PrismaClient, Automation } from '\''@prisma\/client'\'';/g' src/services/automation.service.ts
sed -i 's/import { PrismaClient, \/\* Coupon, \*\/ PlanType } from '\''@prisma\/client'\'';/import { PrismaClient } from '\''@prisma\/client'\'';/g' src/services/coupon.service.ts

# Fix API contracts
print_status "Fixing API contracts..."
sed -i 's/PlanType,/\/\/ PlanType,/g' src/types/api-contracts.ts
sed -i 's/AutomationType,/\/\/ AutomationType,/g' src/types/api-contracts.ts
sed -i 's/TradeStatus,/\/\/ TradeStatus,/g' src/types/api-contracts.ts
sed -i 's/NotificationType,/\/\/ NotificationType,/g' src/types/api-contracts.ts
sed -i 's/PaymentStatus,/\/\/ PaymentStatus,/g' src/types/api-contracts.ts

# Fix unused variables in workers
print_status "Fixing unused variables in workers..."
sed -i 's/const { userId, automationId, action, config } = job.data;/const { userId, automationId, action } = job.data;/g' src/workers/automation-executor.ts
sed -i 's/const { userId, type, channel, message, data } = job.data;/const { userId, type, channel, message } = job.data;/g' src/workers/notification.ts
sed -i 's/const { paymentId, userId, invoiceId, amount } = job.data;/const { paymentId, userId, amount } = job.data;/g' src/workers/payment-validator.ts

# Fix unused variables in utils
print_status "Fixing unused variables in utils..."
sed -i 's/recordHttpRequest(method: string, path: string, statusCode: number, duration: number) {/recordHttpRequest(_method: string, _path: string, statusCode: number, duration: number) {/g' src/utils/metrics.ts

print_status "Attempting to build..."
if npm run build > /dev/null 2>&1; then
    print_success "✓ TypeScript compilation successful!"
else
    print_warning "⚠ Some errors may remain. Check manually."
fi

print_success "TypeScript error fixes applied!"
echo ""
echo "Next steps:"
echo "1. Review the changes made"
echo "2. Test the build: npm run build"
echo "3. Deploy to production: ./scripts/deploy-prod.sh"
