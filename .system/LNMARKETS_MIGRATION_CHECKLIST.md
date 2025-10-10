# LN Markets v2 Migration Checklist

> **Created**: 2025-01-09  
> **Status**: In Progress  
> **Total Files**: 48  

## Migration Priority

### ✅ Phase 1: Core Services (COMPLETED)
- [x] `backend/src/services/dashboard-data.service.ts` - **MIGRATED TO v2**

### 🔄 Phase 2: Critical Routes (HIGH PRIORITY)
**Routes that directly serve frontend:**

1. [ ] `backend/src/routes/dashboard-optimized.routes.ts` - Dashboard data
2. [ ] `backend/src/routes/market-data.routes.ts` - Market data endpoints
3. [ ] `backend/src/routes/lnmarkets.routes.ts` - General LN Markets routes
4. [ ] `backend/src/routes/lnmarkets-centralized.routes.ts` - Centralized routes
5. [ ] `backend/src/routes/public-dashboard.routes.ts` - Public endpoints
6. [ ] `backend/src/routes/auth.routes.ts` - Authentication routes

**Admin Routes:**
7. [ ] `backend/src/routes/admin/lnmarkets-admin.routes.ts` - Admin panel

### 🎯 Phase 3: Controllers (MEDIUM PRIORITY)
**Controllers handling business logic:**

8. [ ] `backend/src/controllers/lnmarkets-trading-refactored.controller.ts`
9. [ ] `backend/src/controllers/lnmarkets-user.controller.ts`
10. [ ] `backend/src/controllers/lnmarkets-market.controller.ts`
11. [ ] `backend/src/controllers/lnmarkets-options.controller.ts`
12. [ ] `backend/src/controllers/lnmarkets-futures.controller.ts`

### ⚙️ Phase 4: Workers (MEDIUM PRIORITY)
**Background workers and automation:**

13. [ ] `backend/src/workers/automation-worker.ts`
14. [ ] `backend/src/workers/automation-executor.ts`
15. [ ] `backend/src/workers/margin-monitor.ts`

### 🔧 Phase 5: Supporting Services (MEDIUM PRIORITY)
**Services used by routes/controllers:**

16. [ ] `backend/src/services/trading-confirmation.service.ts`
17. [ ] `backend/src/services/credential-test.service.ts`
18. [ ] `backend/src/services/trading-validation.service.ts`
19. [ ] `backend/src/services/portfolio-tracking.service.ts`
20. [ ] `backend/src/services/risk-management.service.ts`
21. [ ] `backend/src/services/backtesting.service.ts`
22. [ ] `backend/src/services/backtest.service.ts`
23. [ ] `backend/src/services/machine-learning.service.ts`
24. [ ] `backend/src/services/ExchangeServiceFactory.ts`
25. [ ] `backend/src/services/auth.service.ts`

### 🧪 Phase 6: Tests (LOW PRIORITY)
**Test files can be migrated later:**

26. [ ] `backend/src/tests/risk-management.test.ts`
27. [ ] `backend/src/tests/trading-validation-service.test.ts`
28. [ ] `backend/src/tests/risk-management-basic.test.ts`
29. [ ] `backend/src/tests/backtesting-basic.test.ts`
30. [ ] `backend/src/tests/registration.test.ts`
31. [ ] `backend/src/tests/trading-logs.test.ts`
32. [ ] `backend/src/tests/backtesting.test.ts`
33. [ ] `backend/src/tests/portfolio-tracking.test.ts`
34. [ ] `backend/src/tests/margin-monitor.test.ts`
35. [ ] `backend/src/tests/trading-confirmation.test.ts`
36. [ ] `backend/src/tests/trading-real.test.ts`
37. [ ] `backend/src/tests/machine-learning.test.ts`
38. [ ] `backend/src/tests/trading-confirmation-service.test.ts`
39. [ ] `backend/src/tests/trading-confirmation-simple.test.ts`
40. [ ] `backend/src/tests/trading-validation-simple.test.ts`
41. [ ] `backend/src/tests/trading-validation.test.ts`
42. [ ] `backend/src/tests/portfolio-tracking-basic.test.ts`

### 🛠️ Phase 7: Utilities (LOW PRIORITY)
**Utility files:**

43. [ ] `backend/src/utils/lnmarkets-factory.ts`

### ⚠️ Phase 8: Obsolete Services (TO BE REMOVED)
**These files will be DELETED after migration:**

44. [ ] `backend/src/services/lnmarkets-api.service.ts` - **OLD v1 SERVICE**
45. [ ] `backend/src/services/lnmarkets.service.ts` - **OLD v1 SERVICE**
46. [ ] `backend/src/services/lnmarkets-api-v2.service.ts` - **DUPLICATE/OLD**
47. [ ] `backend/src/services/lnmarkets-fallback.service.ts` - **FALLBACK LOGIC**

## Migration Statistics

- **Total Files**: 48
- **Migrated**: 1 (2%)
- **Remaining**: 47 (98%)
- **Estimated Time**: 8-10 hours

## Migration Pattern

For each file:
1. Read current implementation
2. Update imports: `LNMarketsAPIService` → `LNMarketsAPIv2`
3. Update instantiation with credentials object
4. Map old methods to new domain methods
5. Update error handling
6. Test endpoint/functionality
7. Mark as completed in this checklist

## Notes

- Routes and Controllers are highest priority (directly impact user)
- Workers are critical for automation but can tolerate brief downtime
- Tests can be migrated last as they don't affect production
- Old services will be removed only after all migrations complete

---
*Last Updated: 2025-01-09*

