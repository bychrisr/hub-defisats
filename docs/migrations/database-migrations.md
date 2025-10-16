---
title: Database Migrations
category: migrations
subcategory: database-migrations
tags: [database, migrations, prisma, schema, data-migration, rollback]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team", "DevOps Team"]
---

# Database Migrations

## Summary

Comprehensive guide to database migrations in the Axisor platform using Prisma ORM. This document covers migration strategies, best practices, data migration techniques, and rollback procedures for maintaining database schema integrity across different environments.

## Migration Strategy

### 1. Migration Types

**Schema Migrations**
- Table structure changes
- Column additions/modifications
- Index creation/modification
- Constraint changes
- Foreign key modifications

**Data Migrations**
- Data transformation
- Data cleanup
- Data seeding
- Data archival
- Data validation

**Rollback Migrations**
- Schema rollback
- Data rollback
- Dependency rollback
- State restoration

### 2. Migration Workflow

**Development Environment**
```bash
# 1. Create migration
npx prisma migrate dev --name add_user_preferences

# 2. Review generated migration
cat backend/prisma/migrations/*/migration.sql

# 3. Test migration
npx prisma migrate dev

# 4. Verify schema
npx prisma db pull
npx prisma generate
```

**Production Environment**
```bash
# 1. Backup database
pg_dump axisor_production > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migration
npx prisma migrate deploy

# 3. Verify migration
npx prisma migrate status

# 4. Update application
docker compose restart backend
```

## Prisma Migration Commands

### 1. Development Migrations

**Create Migration**
```bash
# Create new migration
npx prisma migrate dev --name descriptive_migration_name

# Create migration with custom schema
npx prisma migrate dev --name add_automation_tables --schema=./prisma/schema.prisma

# Create migration without applying
npx prisma migrate dev --name add_user_roles --create-only
```

**Apply Migrations**
```bash
# Apply all pending migrations
npx prisma migrate dev

# Apply specific migration
npx prisma migrate dev --name specific_migration

# Reset database and apply all migrations
npx prisma migrate reset
```

**Migration Status**
```bash
# Check migration status
npx prisma migrate status

# Check migration history
npx prisma migrate status --verbose

# Check database schema
npx prisma db pull
```

### 2. Production Migrations

**Deploy Migrations**
```bash
# Deploy migrations to production
npx prisma migrate deploy

# Deploy with custom schema
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Deploy with custom database URL
npx prisma migrate deploy --schema=./prisma/schema.prisma --url=$DATABASE_URL
```

**Migration Verification**
```bash
# Verify migration status
npx prisma migrate status

# Verify database connection
npx prisma db pull

# Verify schema consistency
npx prisma validate
```

## Schema Migration Examples

### 1. Adding New Tables

**Example: Adding User Preferences Table**
```sql
-- Migration: add_user_preferences
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'en',
    "notifications" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create unique index
CREATE UNIQUE INDEX "UserPreferences_user_id_key" ON "UserPreferences"("user_id");
```

**Prisma Schema Update**
```prisma
model UserPreferences {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  theme        String   @default("light")
  language     String   @default("en")
  notifications Json    @default("{}")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId])
  @@map("UserPreferences")
}
```

### 2. Modifying Existing Tables

**Example: Adding User Roles**
```sql
-- Migration: add_user_roles
-- Add new column
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';

-- Create enum type
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- Update column type
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";

-- Add constraint
ALTER TABLE "User" ADD CONSTRAINT "User_role_check" CHECK ("role" IN ('USER', 'ADMIN', 'SUPER_ADMIN'));

-- Create index
CREATE INDEX "User_role_idx" ON "User"("role");
```

**Prisma Schema Update**
```prisma
enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  role      UserRole @default(USER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([role])
  @@map("User")
}
```

### 3. Adding Indexes

**Example: Performance Optimization**
```sql
-- Migration: add_performance_indexes
-- Add composite index for user queries
CREATE INDEX "TradeLog_user_id_created_at_idx" ON "TradeLog"("user_id", "created_at");

-- Add partial index for active users
CREATE INDEX "User_active_idx" ON "User"("is_active") WHERE "is_active" = true;

-- Add text search index
CREATE INDEX "User_email_text_idx" ON "User" USING gin(to_tsvector('english', "email"));

-- Add foreign key index
CREATE INDEX "Automation_user_id_idx" ON "Automation"("user_id");
```

## Data Migration Examples

### 1. Data Transformation

**Example: User Data Migration**
```sql
-- Migration: migrate_user_data
-- Add new columns
ALTER TABLE "User" ADD COLUMN "first_name" TEXT;
ALTER TABLE "User" ADD COLUMN "last_name" TEXT;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Migrate data from existing fields
UPDATE "User" 
SET 
  "first_name" = split_part("full_name", ' ', 1),
  "last_name" = split_part("full_name", ' ', 2)
WHERE "full_name" IS NOT NULL;

-- Clean up old data
ALTER TABLE "User" DROP COLUMN "full_name";
```

**Data Migration Script**
```typescript
// scripts/migrate-user-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserData() {
  console.log('Starting user data migration...');
  
  try {
    // Get all users with full_name
    const users = await prisma.user.findMany({
      where: {
        fullName: {
          not: null
        }
      },
      select: {
        id: true,
        fullName: true
      }
    });
    
    console.log(`Found ${users.length} users to migrate`);
    
    // Migrate each user
    for (const user of users) {
      const nameParts = user.fullName?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName
        }
      });
      
      console.log(`Migrated user ${user.id}: ${user.fullName} -> ${firstName} ${lastName}`);
    }
    
    console.log('User data migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateUserData();
```

### 2. Data Cleanup

**Example: Cleanup Orphaned Records**
```sql
-- Migration: cleanup_orphaned_records
-- Delete orphaned automation logs
DELETE FROM "AutomationLog" 
WHERE "automation_id" NOT IN (
  SELECT "id" FROM "Automation"
);

-- Delete orphaned trade logs
DELETE FROM "TradeLog" 
WHERE "user_id" NOT IN (
  SELECT "id" FROM "User"
);

-- Delete orphaned notifications
DELETE FROM "Notification" 
WHERE "user_id" NOT IN (
  SELECT "id" FROM "User"
);
```

**Cleanup Script**
```typescript
// scripts/cleanup-orphaned-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphanedData() {
  console.log('Starting orphaned data cleanup...');
  
  try {
    // Cleanup orphaned automation logs
    const deletedAutomationLogs = await prisma.automationLog.deleteMany({
      where: {
        automation: {
          is: null
        }
      }
    });
    console.log(`Deleted ${deletedAutomationLogs.count} orphaned automation logs`);
    
    // Cleanup orphaned trade logs
    const deletedTradeLogs = await prisma.tradeLog.deleteMany({
      where: {
        user: {
          is: null
        }
      }
    });
    console.log(`Deleted ${deletedTradeLogs.count} orphaned trade logs`);
    
    // Cleanup orphaned notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        user: {
          is: null
        }
      }
    });
    console.log(`Deleted ${deletedNotifications.count} orphaned notifications`);
    
    console.log('Orphaned data cleanup completed successfully');
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedData();
```

### 3. Data Seeding

**Example: Seed Initial Data**
```sql
-- Migration: seed_initial_data
-- Insert default user roles
INSERT INTO "UserRole" ("id", "name", "description") VALUES
  ('role_user', 'User', 'Standard user role'),
  ('role_admin', 'Admin', 'Administrator role'),
  ('role_super_admin', 'Super Admin', 'Super administrator role');

-- Insert default system settings
INSERT INTO "SystemSetting" ("key", "value", "description") VALUES
  ('app_name', 'Axisor', 'Application name'),
  ('app_version', '2.0.0', 'Application version'),
  ('maintenance_mode', 'false', 'Maintenance mode status');

-- Insert default notification templates
INSERT INTO "NotificationTemplate" ("id", "type", "subject", "body") VALUES
  ('welcome_email', 'email', 'Welcome to Axisor', 'Welcome to Axisor platform!'),
  ('password_reset', 'email', 'Password Reset', 'Click here to reset your password'),
  ('trade_alert', 'email', 'Trade Alert', 'Your trade has been executed');
```

**Seeding Script**
```typescript
// scripts/seed-initial-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedInitialData() {
  console.log('Starting initial data seeding...');
  
  try {
    // Seed user roles
    const userRoles = [
      { id: 'role_user', name: 'User', description: 'Standard user role' },
      { id: 'role_admin', name: 'Admin', description: 'Administrator role' },
      { id: 'role_super_admin', name: 'Super Admin', description: 'Super administrator role' }
    ];
    
    for (const role of userRoles) {
      await prisma.userRole.upsert({
        where: { id: role.id },
        update: role,
        create: role
      });
    }
    
    // Seed system settings
    const systemSettings = [
      { key: 'app_name', value: 'Axisor', description: 'Application name' },
      { key: 'app_version', value: '2.0.0', description: 'Application version' },
      { key: 'maintenance_mode', value: 'false', description: 'Maintenance mode status' }
    ];
    
    for (const setting of systemSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: setting,
        create: setting
      });
    }
    
    // Seed notification templates
    const notificationTemplates = [
      {
        id: 'welcome_email',
        type: 'email',
        subject: 'Welcome to Axisor',
        body: 'Welcome to Axisor platform!'
      },
      {
        id: 'password_reset',
        type: 'email',
        subject: 'Password Reset',
        body: 'Click here to reset your password'
      },
      {
        id: 'trade_alert',
        type: 'email',
        subject: 'Trade Alert',
        body: 'Your trade has been executed'
      }
    ];
    
    for (const template of notificationTemplates) {
      await prisma.notificationTemplate.upsert({
        where: { id: template.id },
        update: template,
        create: template
      });
    }
    
    console.log('Initial data seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedInitialData();
```

## Rollback Procedures

### 1. Schema Rollback

**Rollback Migration**
```bash
# Rollback last migration
npx prisma migrate rollback

# Rollback to specific migration
npx prisma migrate rollback --to migration_name

# Rollback all migrations
npx prisma migrate rollback --all
```

**Manual Rollback**
```sql
-- Rollback: remove_user_preferences
-- Drop table
DROP TABLE "UserPreferences";

-- Drop index
DROP INDEX "UserPreferences_user_id_key";

-- Drop foreign key constraint
ALTER TABLE "UserPreferences" DROP CONSTRAINT "UserPreferences_user_id_fkey";
```

### 2. Data Rollback

**Data Rollback Script**
```typescript
// scripts/rollback-user-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function rollbackUserData() {
  console.log('Starting user data rollback...');
  
  try {
    // Restore full_name from first_name and last_name
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { firstName: { not: null } },
          { lastName: { not: null } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log(`Found ${users.length} users to rollback`);
    
    // Rollback each user
    for (const user of users) {
      const fullName = `${user.firstName} ${user.lastName}`.trim();
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName
        }
      });
      
      console.log(`Rolled back user ${user.id}: ${user.firstName} ${user.lastName} -> ${fullName}`);
    }
    
    console.log('User data rollback completed successfully');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

rollbackUserData();
```

## Migration Best Practices

### 1. Migration Planning

**Pre-Migration Checklist**
- [ ] Backup production database
- [ ] Test migration in staging environment
- [ ] Review migration SQL for potential issues
- [ ] Plan rollback strategy
- [ ] Schedule maintenance window if needed
- [ ] Notify team of migration
- [ ] Prepare monitoring and alerting

**Migration Execution**
- [ ] Apply migration during low-traffic period
- [ ] Monitor database performance during migration
- [ ] Verify data integrity after migration
- [ ] Test application functionality
- [ ] Monitor error logs
- [ ] Update documentation

### 2. Data Safety

**Backup Strategy**
```bash
# Full database backup
pg_dump -h localhost -U postgres -d axisor > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema-only backup
pg_dump -h localhost -U postgres -d axisor --schema-only > schema_backup_$(date +%Y%m%d_%H%M%S).sql

# Data-only backup
pg_dump -h localhost -U postgres -d axisor --data-only > data_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Data Validation**
```typescript
// scripts/validate-migration.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateMigration() {
  console.log('Starting migration validation...');
  
  try {
    // Validate user count
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    
    // Validate data integrity
    const orphanedRecords = await prisma.tradeLog.count({
      where: {
        user: {
          is: null
        }
      }
    });
    
    if (orphanedRecords > 0) {
      throw new Error(`Found ${orphanedRecords} orphaned trade logs`);
    }
    
    // Validate foreign key constraints
    const foreignKeyViolations = await prisma.$queryRaw`
      SELECT COUNT(*) as violations
      FROM "TradeLog" t
      LEFT JOIN "User" u ON t.user_id = u.id
      WHERE u.id IS NULL
    `;
    
    console.log('Migration validation completed successfully');
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

validateMigration();
```

## Troubleshooting

### 1. Common Migration Issues

**Migration Conflicts**
```bash
# Resolve migration conflicts
npx prisma migrate resolve --applied migration_name

# Mark migration as applied
npx prisma migrate resolve --applied migration_name

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back migration_name
```

**Schema Drift**
```bash
# Check for schema drift
npx prisma db pull

# Compare schema with database
npx prisma validate

# Reset schema to match database
npx prisma migrate reset
```

### 2. Migration Recovery

**Recovery Procedures**
```bash
# Restore from backup
psql -h localhost -U postgres -d axisor < backup_file.sql

# Recreate database
npx prisma migrate reset

# Apply migrations from scratch
npx prisma migrate deploy
```

## Checklist

### Pre-Migration
- [ ] Backup production database
- [ ] Test migration in staging
- [ ] Review migration SQL
- [ ] Plan rollback strategy
- [ ] Schedule maintenance window
- [ ] Notify team
- [ ] Prepare monitoring

### Migration Execution
- [ ] Apply migration
- [ ] Monitor performance
- [ ] Verify data integrity
- [ ] Test application
- [ ] Monitor error logs
- [ ] Update documentation

### Post-Migration
- [ ] Verify all functionality
- [ ] Monitor system health
- [ ] Update team on completion
- [ ] Archive backup files
- [ ] Update runbooks
- [ ] Schedule cleanup tasks
