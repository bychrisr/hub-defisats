---
title: Margin Guard Troubleshooting
category: automations
subcategory: margin-guard
tags: [margin-guard, troubleshooting, debugging, errors, issues]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team"]
---

# Margin Guard Troubleshooting

## Summary

Comprehensive troubleshooting guide for the Margin Guard system. This document provides solutions for common issues, debugging techniques, error analysis, and recovery procedures to help diagnose and resolve problems with Margin Guard automations.

## Common Issues and Solutions

### Configuration Issues

#### Issue: Invalid Configuration Schema

**Symptoms:**
- Automation fails to save
- Configuration validation errors
- "Invalid configuration schema" error messages

**Root Causes:**
- Missing required fields
- Invalid data types
- Plan limitations exceeded
- Malformed JSON

**Solutions:**

```typescript
// 1. Validate configuration structure
function validateMarginGuardConfig(config: any): ValidationResult {
  const requiredFields = ['margin_threshold', 'action', 'selected_positions', 'notifications'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    };
  }

  // 2. Validate data types
  if (typeof config.margin_threshold !== 'number' || config.margin_threshold < 0 || config.margin_threshold > 100) {
    return {
      isValid: false,
      error: 'margin_threshold must be a number between 0 and 100'
    };
  }

  // 3. Validate action type
  const validActions = ['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance'];
  if (!validActions.includes(config.action)) {
    return {
      isValid: false,
      error: `Invalid action type. Must be one of: ${validActions.join(', ')}`
    };
  }

  // 4. Validate positions array
  if (!Array.isArray(config.selected_positions)) {
    return {
      isValid: false,
      error: 'selected_positions must be an array'
    };
  }

  return { isValid: true };
}

// 5. Fix configuration example
const fixedConfig = {
  margin_threshold: 85, // Number between 0-100
  action: 'close_position', // Valid action type
  selected_positions: ['pos_123', 'pos_456'], // Array of position IDs
  notifications: {
    email: true,
    telegram: false,
    webhook: false,
    sms: false
  },
  protection_mode: 'unitario', // Valid protection mode
  real_time_monitoring: true,
  auto_execution: true
};
```

#### Issue: Plan Limitations Exceeded

**Symptoms:**
- "Plan limitations exceeded" error
- Automation rejected during validation
- Upgrade prompts

**Root Causes:**
- Too many positions selected
- Unsupported action for plan
- Invalid protection mode
- Threshold below plan minimum

**Solutions:**

```typescript
// 1. Check plan limitations
async function checkPlanLimitations(userId: string, config: MarginGuardConfig): Promise<PlanCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true }
  });

  const planLimits = await planLimitsService.getMarginGuardFeatures(user.plan.type);
  
  const issues = [];

  // Check position count
  if (config.selected_positions.length > planLimits.maxPositions) {
    issues.push({
      type: 'position_count',
      current: config.selected_positions.length,
      limit: planLimits.maxPositions,
      message: `Maximum ${planLimits.maxPositions} positions allowed for ${user.plan.type} plan`
    });
  }

  // Check action availability
  if (!planLimits.availableActions.includes(config.action)) {
    issues.push({
      type: 'action_not_available',
      current: config.action,
      available: planLimits.availableActions,
      message: `Action '${config.action}' not available for ${user.plan.type} plan`
    });
  }

  // Check protection mode
  if (!planLimits.availableModes.includes(config.protection_mode)) {
    issues.push({
      type: 'protection_mode_not_available',
      current: config.protection_mode,
      available: planLimits.availableModes,
      message: `Protection mode '${config.protection_mode}' not available for ${user.plan.type} plan`
    });
  }

  // Check threshold
  if (config.margin_threshold < planLimits.minThreshold) {
    issues.push({
      type: 'threshold_too_low',
      current: config.margin_threshold,
      minimum: planLimits.minThreshold,
      message: `Minimum threshold is ${planLimits.minThreshold}% for ${user.plan.type} plan`
    });
  }

  return {
    hasIssues: issues.length > 0,
    issues,
    suggestedUpgrade: issues.length > 0 ? getSuggestedUpgrade(user.plan.type, config) : null
  };
}

// 2. Fix configuration based on plan
function fixConfigurationForPlan(config: MarginGuardConfig, planType: string): MarginGuardConfig {
  const planLimits = getPlanLimits(planType);
  const fixedConfig = { ...config };

  // Fix position count
  if (fixedConfig.selected_positions.length > planLimits.maxPositions) {
    fixedConfig.selected_positions = fixedConfig.selected_positions.slice(0, planLimits.maxPositions);
  }

  // Fix action if not available
  if (!planLimits.availableActions.includes(fixedConfig.action)) {
    fixedConfig.action = planLimits.availableActions[0];
  }

  // Fix protection mode if not available
  if (!planLimits.availableModes.includes(fixedConfig.protection_mode)) {
    fixedConfig.protection_mode = planLimits.availableModes[0];
  }

  // Fix threshold if too low
  if (fixedConfig.margin_threshold < planLimits.minThreshold) {
    fixedConfig.margin_threshold = planLimits.minThreshold;
  }

  return fixedConfig;
}
```

### Authentication Issues

#### Issue: Invalid Exchange Credentials

**Symptoms:**
- "Invalid credentials" error
- API authentication failures
- Account validation failures

**Root Causes:**
- Expired API keys
- Invalid API secret
- Incorrect permissions
- Rate limit exceeded

**Solutions:**

```typescript
// 1. Validate credentials
async function validateExchangeCredentials(accountId: string): Promise<CredentialValidationResult> {
  try {
    const account = await prisma.userExchangeAccount.findUnique({
      where: { id: accountId },
      include: { credentials: true, exchange: true }
    });

    if (!account) {
      return {
        isValid: false,
        error: 'Account not found'
      };
    }

    // Test API connection
    const apiService = new LNMarketsAPIv2({
      apiKey: account.credentials.apiKey,
      apiSecret: account.credentials.apiSecret,
      environment: account.exchange.environment
    });

    const testResult = await apiService.user.getInfo();
    
    if (testResult.success) {
      return {
        isValid: true,
        lastValidated: new Date(),
        userInfo: testResult.data
      };
    } else {
      return {
        isValid: false,
        error: testResult.error,
        lastValidated: new Date()
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
      lastValidated: new Date()
    };
  }
}

// 2. Fix credential issues
async function fixCredentialIssues(accountId: string): Promise<FixResult> {
  const validation = await validateExchangeCredentials(accountId);
  
  if (validation.isValid) {
    return { success: true, message: 'Credentials are valid' };
  }

  const fixes = [];

  // Check if API key is expired
  if (validation.error.includes('expired') || validation.error.includes('invalid')) {
    fixes.push({
      issue: 'expired_api_key',
      solution: 'Update API key in account settings',
      action: 'update_api_key'
    });
  }

  // Check if permissions are insufficient
  if (validation.error.includes('permission') || validation.error.includes('scope')) {
    fixes.push({
      issue: 'insufficient_permissions',
      solution: 'Ensure API key has futures trading permissions',
      action: 'update_permissions'
    });
  }

  // Check if rate limit exceeded
  if (validation.error.includes('rate limit') || validation.error.includes('429')) {
    fixes.push({
      issue: 'rate_limit_exceeded',
      solution: 'Wait for rate limit to reset or upgrade API tier',
      action: 'wait_or_upgrade'
    });
  }

  return {
    success: false,
    fixes,
    error: validation.error
  };
}
```

#### Issue: Account Status Issues

**Symptoms:**
- Account validation failures
- "Account not active" errors
- Trading restrictions

**Root Causes:**
- Account suspended
- Insufficient balance
- KYC requirements
- Trading restrictions

**Solutions:**

```typescript
// 1. Check account status
async function checkAccountStatus(accountId: string): Promise<AccountStatusResult> {
  try {
    const account = await prisma.userExchangeAccount.findUnique({
      where: { id: accountId },
      include: { credentials: true, exchange: true }
    });

    const apiService = new LNMarketsAPIv2({
      apiKey: account.credentials.apiKey,
      apiSecret: account.credentials.apiSecret,
      environment: account.exchange.environment
    });

    // Check account info
    const accountInfo = await apiService.user.getInfo();
    if (!accountInfo.success) {
      return {
        status: 'error',
        error: accountInfo.error
      };
    }

    // Check account balance
    const balance = await apiService.user.getBalance();
    if (!balance.success) {
      return {
        status: 'error',
        error: balance.error
      };
    }

    // Check trading permissions
    const permissions = await apiService.user.getPermissions();
    if (!permissions.success) {
      return {
        status: 'error',
        error: permissions.error
      };
    }

    return {
      status: 'active',
      accountInfo: accountInfo.data,
      balance: balance.data,
      permissions: permissions.data
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// 2. Fix account status issues
async function fixAccountStatusIssues(accountId: string): Promise<FixResult> {
  const statusCheck = await checkAccountStatus(accountId);
  
  if (statusCheck.status === 'active') {
    return { success: true, message: 'Account is active' };
  }

  const fixes = [];

  // Check if account is suspended
  if (statusCheck.error.includes('suspended') || statusCheck.error.includes('disabled')) {
    fixes.push({
      issue: 'account_suspended',
      solution: 'Contact exchange support to reactivate account',
      action: 'contact_support'
    });
  }

  // Check if insufficient balance
  if (statusCheck.error.includes('insufficient') || statusCheck.error.includes('balance')) {
    fixes.push({
      issue: 'insufficient_balance',
      solution: 'Deposit funds to account',
      action: 'deposit_funds'
    });
  }

  // Check if KYC required
  if (statusCheck.error.includes('kyc') || statusCheck.error.includes('verification')) {
    fixes.push({
      issue: 'kyc_required',
      solution: 'Complete KYC verification process',
      action: 'complete_kyc'
    });
  }

  return {
    success: false,
    fixes,
    error: statusCheck.error
  };
}
```

### Execution Issues

#### Issue: Execution Failures

**Symptoms:**
- Automation executions failing
- "Execution failed" error messages
- No actions taken despite threshold breach

**Root Causes:**
- API errors
- Network timeouts
- Insufficient permissions
- Market conditions

**Solutions:**

```typescript
// 1. Analyze execution failures
async function analyzeExecutionFailures(executionId: string): Promise<FailureAnalysisResult> {
  try {
    const execution = await prisma.automationLog.findUnique({
      where: { executionId },
      include: { automation: true }
    });

    if (!execution) {
      return {
        found: false,
        error: 'Execution not found'
      };
    }

    const failureReasons = [];

    // Check API errors
    if (execution.error && execution.error.includes('API')) {
      failureReasons.push({
        type: 'api_error',
        description: 'External API error',
        solution: 'Check API status and credentials'
      });
    }

    // Check network errors
    if (execution.error && (execution.error.includes('timeout') || execution.error.includes('ECONNRESET'))) {
      failureReasons.push({
        type: 'network_error',
        description: 'Network connectivity issue',
        solution: 'Check network connection and retry'
      });
    }

    // Check permission errors
    if (execution.error && execution.error.includes('permission')) {
      failureReasons.push({
        type: 'permission_error',
        description: 'Insufficient permissions',
        solution: 'Update API key permissions'
      });
    }

    // Check market conditions
    if (execution.error && execution.error.includes('market')) {
      failureReasons.push({
        type: 'market_error',
        description: 'Market conditions prevent execution',
        solution: 'Check market status and try again'
      });
    }

    return {
      found: true,
      execution,
      failureReasons,
      recommendations: generateRecommendations(failureReasons)
    };
  } catch (error) {
    return {
      found: false,
      error: error.message
    };
  }
}

// 2. Fix execution failures
async function fixExecutionFailures(executionId: string): Promise<FixResult> {
  const analysis = await analyzeExecutionFailures(executionId);
  
  if (!analysis.found) {
    return {
      success: false,
      error: analysis.error
    };
  }

  const fixes = [];

  for (const reason of analysis.failureReasons) {
    switch (reason.type) {
      case 'api_error':
        fixes.push({
          issue: 'api_error',
          solution: 'Verify API credentials and check API status',
          action: 'verify_api_credentials'
        });
        break;
      
      case 'network_error':
        fixes.push({
          issue: 'network_error',
          solution: 'Check network connectivity and retry execution',
          action: 'retry_execution'
        });
        break;
      
      case 'permission_error':
        fixes.push({
          issue: 'permission_error',
          solution: 'Update API key permissions for futures trading',
          action: 'update_permissions'
        });
        break;
      
      case 'market_error':
        fixes.push({
          issue: 'market_error',
          solution: 'Wait for market conditions to improve',
          action: 'wait_and_retry'
        });
        break;
    }
  }

  return {
    success: false,
    fixes,
    error: 'Execution failed'
  };
}
```

#### Issue: No Actions Taken

**Symptoms:**
- Threshold breached but no actions executed
- Automation running but not responding
- Positions not being monitored

**Root Causes:**
- Configuration issues
- Data fetching failures
- Threshold calculation errors
- Position filtering problems

**Solutions:**

```typescript
// 1. Debug automation execution
async function debugAutomationExecution(automationId: string): Promise<DebugResult> {
  try {
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
      include: { user: true }
    });

    if (!automation) {
      return {
        found: false,
        error: 'Automation not found'
      };
    }

    const debugSteps = [];

    // Step 1: Check configuration
    const configValidation = await validateMarginGuardConfig(automation.user.id, automationId);
    if (!configValidation.isValid) {
      debugSteps.push({
        step: 'configuration_validation',
        status: 'failed',
        error: configValidation.error,
        solution: 'Fix configuration issues'
      });
    } else {
      debugSteps.push({
        step: 'configuration_validation',
        status: 'passed',
        message: 'Configuration is valid'
      });
    }

    // Step 2: Check account status
    const accountStatus = await checkAccountStatus(automation.userExchangeAccountId);
    if (accountStatus.status !== 'active') {
      debugSteps.push({
        step: 'account_status',
        status: 'failed',
        error: accountStatus.error,
        solution: 'Fix account status issues'
      });
    } else {
      debugSteps.push({
        step: 'account_status',
        status: 'passed',
        message: 'Account is active'
      });
    }

    // Step 3: Check position data
    const positionData = await fetchPositionData([automation.userExchangeAccount], automation.config);
    if (!positionData.success) {
      debugSteps.push({
        step: 'position_data',
        status: 'failed',
        error: positionData.error,
        solution: 'Check API connectivity and permissions'
      });
    } else {
      debugSteps.push({
        step: 'position_data',
        status: 'passed',
        message: `Found ${positionData.positions.length} positions`
      });
    }

    // Step 4: Check market data
    const marketData = await fetchMarketData(positionData.positions);
    if (!marketData.success) {
      debugSteps.push({
        step: 'market_data',
        status: 'failed',
        error: marketData.error,
        solution: 'Check market data API connectivity'
      });
    } else {
      debugSteps.push({
        step: 'market_data',
        status: 'passed',
        message: `Found market data for ${marketData.prices.length} symbols`
      });
    }

    // Step 5: Check margin calculations
    const marginCalculations = await calculateMarginLevels(positionData.positions, marketData.prices);
    if (!marginCalculations.success) {
      debugSteps.push({
        step: 'margin_calculations',
        status: 'failed',
        error: marginCalculations.error,
        solution: 'Check margin calculation logic'
      });
    } else {
      debugSteps.push({
        step: 'margin_calculations',
        status: 'passed',
        message: `Calculated margins for ${marginCalculations.calculations.length} positions`
      });
    }

    // Step 6: Check threshold checks
    const thresholdChecks = await checkMarginThresholds(marginCalculations.calculations, automation.config);
    if (!thresholdChecks.success) {
      debugSteps.push({
        step: 'threshold_checks',
        status: 'failed',
        error: thresholdChecks.error,
        solution: 'Check threshold calculation logic'
      });
    } else {
      debugSteps.push({
        step: 'threshold_checks',
        status: 'passed',
        message: `Found ${thresholdChecks.positionsRequiringAction.length} positions requiring action`
      });
    }

    return {
      found: true,
      automation,
      debugSteps,
      recommendations: generateDebugRecommendations(debugSteps)
    };
  } catch (error) {
    return {
      found: false,
      error: error.message
    };
  }
}

// 2. Fix automation issues
async function fixAutomationIssues(automationId: string): Promise<FixResult> {
  const debug = await debugAutomationExecution(automationId);
  
  if (!debug.found) {
    return {
      success: false,
      error: debug.error
    };
  }

  const fixes = [];

  for (const step of debug.debugSteps) {
    if (step.status === 'failed') {
      fixes.push({
        issue: step.step,
        solution: step.solution,
        action: getActionForStep(step.step)
      });
    }
  }

  return {
    success: false,
    fixes,
    error: 'Automation issues found'
  };
}
```

### Notification Issues

#### Issue: Notifications Not Sent

**Symptoms:**
- No email notifications received
- Telegram messages not delivered
- Webhook callbacks not received

**Root Causes:**
- Notification service failures
- Invalid notification preferences
- Rate limiting
- External service issues

**Solutions:**

```typescript
// 1. Check notification status
async function checkNotificationStatus(userId: string): Promise<NotificationStatusResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true }
    });

    const notificationLogs = await prisma.notificationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const status = {
      email: {
        enabled: user.preferences.emailNotifications,
        lastSent: null,
        successRate: 0
      },
      telegram: {
        enabled: user.preferences.telegramNotifications,
        chatId: user.telegramChatId,
        lastSent: null,
        successRate: 0
      },
      webhook: {
        enabled: user.preferences.webhookNotifications,
        url: user.webhookUrl,
        lastSent: null,
        successRate: 0
      },
      sms: {
        enabled: user.preferences.smsNotifications,
        phoneNumber: user.phoneNumber,
        lastSent: null,
        successRate: 0
      }
    };

    // Calculate success rates
    for (const log of notificationLogs) {
      if (status[log.channel]) {
        if (!status[log.channel].lastSent) {
          status[log.channel].lastSent = log.deliveredAt;
        }
      }
    }

    return {
      status,
      recentLogs: notificationLogs,
      issues: identifyNotificationIssues(status)
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

// 2. Fix notification issues
async function fixNotificationIssues(userId: string): Promise<FixResult> {
  const status = await checkNotificationStatus(userId);
  
  if (status.error) {
    return {
      success: false,
      error: status.error
    };
  }

  const fixes = [];

  // Check email issues
  if (status.status.email.enabled && status.status.email.successRate < 0.8) {
    fixes.push({
      issue: 'email_notifications',
      solution: 'Check SMTP configuration and email delivery',
      action: 'verify_smtp_config'
    });
  }

  // Check telegram issues
  if (status.status.telegram.enabled && !status.status.telegram.chatId) {
    fixes.push({
      issue: 'telegram_chat_id',
      solution: 'Set up Telegram chat ID for notifications',
      action: 'setup_telegram_chat_id'
    });
  }

  // Check webhook issues
  if (status.status.webhook.enabled && !status.status.webhook.url) {
    fixes.push({
      issue: 'webhook_url',
      solution: 'Configure webhook URL for notifications',
      action: 'setup_webhook_url'
    });
  }

  // Check SMS issues
  if (status.status.sms.enabled && !status.status.sms.phoneNumber) {
    fixes.push({
      issue: 'sms_phone_number',
      solution: 'Configure phone number for SMS notifications',
      action: 'setup_sms_phone_number'
    });
  }

  return {
    success: false,
    fixes,
    error: 'Notification issues found'
  };
}
```

## Debugging Techniques

### Log Analysis

```typescript
// 1. Analyze execution logs
async function analyzeExecutionLogs(automationId: string, timeRange: string): Promise<LogAnalysisResult> {
  try {
    const logs = await prisma.automationLog.findMany({
      where: {
        automationId,
        createdAt: {
          gte: new Date(Date.now() - getTimeRangeMs(timeRange))
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const analysis = {
      totalExecutions: logs.length,
      successfulExecutions: logs.filter(log => log.status === 'completed').length,
      failedExecutions: logs.filter(log => log.status === 'failed').length,
      averageDuration: 0,
      commonErrors: {},
      executionPattern: [],
      recommendations: []
    };

    // Calculate average duration
    const successfulLogs = logs.filter(log => log.status === 'completed');
    if (successfulLogs.length > 0) {
      analysis.averageDuration = successfulLogs.reduce((sum, log) => sum + log.duration, 0) / successfulLogs.length;
    }

    // Find common errors
    const errorLogs = logs.filter(log => log.status === 'failed');
    for (const log of errorLogs) {
      const error = log.error || 'Unknown error';
      analysis.commonErrors[error] = (analysis.commonErrors[error] || 0) + 1;
    }

    // Analyze execution pattern
    for (const log of logs) {
      analysis.executionPattern.push({
        timestamp: log.createdAt,
        status: log.status,
        duration: log.duration,
        error: log.error
      });
    }

    // Generate recommendations
    if (analysis.failedExecutions > analysis.successfulExecutions) {
      analysis.recommendations.push('High failure rate detected. Check configuration and credentials.');
    }

    if (analysis.averageDuration > 30000) {
      analysis.recommendations.push('Slow execution times detected. Check system performance.');
    }

    return analysis;
  } catch (error) {
    return {
      error: error.message
    };
  }
}

// 2. Analyze notification logs
async function analyzeNotificationLogs(userId: string, timeRange: string): Promise<NotificationLogAnalysisResult> {
  try {
    const logs = await prisma.notificationLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - getTimeRangeMs(timeRange))
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const analysis = {
      totalNotifications: logs.length,
      successfulNotifications: logs.filter(log => log.status === 'delivered').length,
      failedNotifications: logs.filter(log => log.status === 'failed').length,
      channelBreakdown: {},
      commonErrors: {},
      deliveryPattern: [],
      recommendations: []
    };

    // Analyze by channel
    for (const log of logs) {
      if (!analysis.channelBreakdown[log.channel]) {
        analysis.channelBreakdown[log.channel] = {
          total: 0,
          successful: 0,
          failed: 0
        };
      }
      
      analysis.channelBreakdown[log.channel].total++;
      if (log.status === 'delivered') {
        analysis.channelBreakdown[log.channel].successful++;
      } else {
        analysis.channelBreakdown[log.channel].failed++;
      }
    }

    // Find common errors
    const errorLogs = logs.filter(log => log.status === 'failed');
    for (const log of errorLogs) {
      const error = log.error || 'Unknown error';
      analysis.commonErrors[error] = (analysis.commonErrors[error] || 0) + 1;
    }

    // Analyze delivery pattern
    for (const log of logs) {
      analysis.deliveryPattern.push({
        timestamp: log.createdAt,
        channel: log.channel,
        status: log.status,
        error: log.error
      });
    }

    // Generate recommendations
    for (const [channel, stats] of Object.entries(analysis.channelBreakdown)) {
      if (stats.failed > stats.successful) {
        analysis.recommendations.push(`High failure rate for ${channel} notifications. Check configuration.`);
      }
    }

    return analysis;
  } catch (error) {
    return {
      error: error.message
    };
  }
}
```

### Performance Debugging

```typescript
// 1. Profile execution performance
async function profileExecutionPerformance(automationId: string): Promise<PerformanceProfileResult> {
  try {
    const logs = await prisma.automationLog.findMany({
      where: { automationId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const profile = {
      averageExecutionTime: 0,
      slowestExecution: 0,
      fastestExecution: Infinity,
      performanceBottlenecks: [],
      recommendations: []
    };

    // Calculate performance metrics
    const successfulLogs = logs.filter(log => log.status === 'completed');
    if (successfulLogs.length > 0) {
      profile.averageExecutionTime = successfulLogs.reduce((sum, log) => sum + log.duration, 0) / successfulLogs.length;
      profile.slowestExecution = Math.max(...successfulLogs.map(log => log.duration));
      profile.fastestExecution = Math.min(...successfulLogs.map(log => log.duration));
    }

    // Identify bottlenecks
    if (profile.averageExecutionTime > 30000) {
      profile.performanceBottlenecks.push('Slow average execution time');
    }

    if (profile.slowestExecution > 60000) {
      profile.performanceBottlenecks.push('Very slow executions detected');
    }

    // Generate recommendations
    if (profile.performanceBottlenecks.length > 0) {
      profile.recommendations.push('Consider optimizing database queries and API calls');
      profile.recommendations.push('Check system resource usage and scaling');
    }

    return profile;
  } catch (error) {
    return {
      error: error.message
    };
  }
}

// 2. Debug memory usage
async function debugMemoryUsage(): Promise<MemoryUsageResult> {
  try {
    const memoryUsage = process.memoryUsage();
    
    const analysis = {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      heapUsagePercentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      issues: [],
      recommendations: []
    };

    // Check for memory issues
    if (analysis.heapUsagePercentage > 80) {
      analysis.issues.push('High heap usage detected');
    }

    if (analysis.heapUsed > 100 * 1024 * 1024) { // 100MB
      analysis.issues.push('High memory consumption');
    }

    // Generate recommendations
    if (analysis.issues.length > 0) {
      analysis.recommendations.push('Consider garbage collection optimization');
      analysis.recommendations.push('Check for memory leaks in automation execution');
      analysis.recommendations.push('Consider scaling worker processes');
    }

    return analysis;
  } catch (error) {
    return {
      error: error.message
    };
  }
}
```

## Recovery Procedures

### System Recovery

```typescript
// 1. Recover failed automations
async function recoverFailedAutomations(): Promise<RecoveryResult> {
  try {
    const failedAutomations = await prisma.automation.findMany({
      where: {
        status: 'active',
        logs: {
          some: {
            status: 'failed',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }
      },
      include: { logs: true }
    });

    const recoveryResults = [];

    for (const automation of failedAutomations) {
      try {
        // Check if automation is still valid
        const validation = await validateMarginGuardConfig(automation.userId, automation.id);
        
        if (validation.isValid) {
          // Attempt to recover
          const recoveryResult = await attemptAutomationRecovery(automation);
          recoveryResults.push({
            automationId: automation.id,
            success: recoveryResult.success,
            message: recoveryResult.message
          });
        } else {
          recoveryResults.push({
            automationId: automation.id,
            success: false,
            message: 'Automation configuration is invalid',
            error: validation.error
          });
        }
      } catch (error) {
        recoveryResults.push({
          automationId: automation.id,
          success: false,
          message: 'Recovery failed',
          error: error.message
        });
      }
    }

    return {
      totalAutomations: failedAutomations.length,
      recoveryResults,
      successCount: recoveryResults.filter(r => r.success).length,
      failureCount: recoveryResults.filter(r => !r.success).length
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

// 2. Recover notification system
async function recoverNotificationSystem(): Promise<RecoveryResult> {
  try {
    const failedNotifications = await prisma.notificationLog.findMany({
      where: {
        status: 'failed',
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    const recoveryResults = [];

    for (const notification of failedNotifications) {
      try {
        // Attempt to resend notification
        const resendResult = await resendNotification(notification);
        recoveryResults.push({
          notificationId: notification.id,
          success: resendResult.success,
          message: resendResult.message
        });
      } catch (error) {
        recoveryResults.push({
          notificationId: notification.id,
          success: false,
          message: 'Resend failed',
          error: error.message
        });
      }
    }

    return {
      totalNotifications: failedNotifications.length,
      recoveryResults,
      successCount: recoveryResults.filter(r => r.success).length,
      failureCount: recoveryResults.filter(r => !r.success).length
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}
```

## How to Use This Document

- **For Issue Diagnosis**: Use the common issues section to identify and resolve problems
- **For Debugging**: Follow the debugging techniques to analyze system behavior
- **For Recovery**: Use the recovery procedures to restore system functionality
- **For Prevention**: Implement the recommended solutions to prevent future issues
- **For Monitoring**: Use the troubleshooting techniques to maintain system health

