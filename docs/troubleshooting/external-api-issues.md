---
title: External API Integration Issues
category: troubleshooting
subcategory: external-api-issues
tags: [external-apis, ln-markets, lnd, tradingview, integration, troubleshooting]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team", "Integration Team"]
---

# External API Integration Issues

## Summary

Comprehensive guide to troubleshooting external API integration issues in the Axisor platform. This document covers LN Markets API, LND (Lightning Network Daemon), TradingView, and other external service integration problems, providing step-by-step solutions and best practices.

## LN Markets API Issues

### 1. Authentication Problems

**Symptoms:**
- 401 Unauthorized errors
- Invalid credentials errors
- Token expiration issues
- HMAC signature failures

**Root Causes:**
- Invalid API credentials
- Incorrect HMAC signature generation
- Clock synchronization issues
- Credential storage problems

**Solutions:**

```bash
# 1. Check LN Markets API credentials
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.userExchangeCredentials.findMany({
  where: { exchange: 'lnmarkets' },
  select: { user_id: true, is_active: true, created_at: true }
}).then(creds => {
  console.log('LN Markets credentials:', creds.length);
  creds.forEach(cred => {
    console.log('User ID:', cred.user_id);
    console.log('Active:', cred.is_active);
    console.log('Created:', cred.created_at);
  });
});
"

# 2. Test LN Markets API connectivity
kubectl exec -n axisor <backend-pod> -- node -e "
const axios = require('axios');
const crypto = require('crypto');

async function testLNMarketsAPI() {
  try {
    // Test public endpoint
    const response = await axios.get('https://api.lnmarkets.com/v2/futures/price');
    console.log('Public API test:', response.status);
    console.log('Price data:', response.data);
  } catch (error) {
    console.error('Public API test failed:', error.message);
  }
}

testLNMarketsAPI();
"

# 3. Check HMAC signature generation
kubectl exec -n axisor <backend-pod> -- node -e "
const crypto = require('crypto');

function generateHMACSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

const message = 'test message';
const secret = 'test secret';
const signature = generateHMACSignature(message, secret);
console.log('HMAC signature:', signature);
"

# 4. Verify timestamp synchronization
kubectl exec -n axisor <backend-pod> -- node -e "
const now = Date.now();
const timestamp = Math.floor(now / 1000);
console.log('Current timestamp:', timestamp);
console.log('Current time:', new Date(now).toISOString());
"

# 5. Test authenticated endpoint
kubectl exec -n axisor <backend-pod> -- node -e "
const axios = require('axios');
const crypto = require('crypto');

async function testAuthenticatedEndpoint() {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const method = 'GET';
    const path = '/v2/user/me';
    const body = '';
    
    const message = method + path + body + timestamp;
    const signature = crypto.createHmac('sha256', process.env.LNMARKETS_SECRET || 'test').update(message).digest('hex');
    
    const response = await axios.get('https://api.lnmarkets.com/v2/user/me', {
      headers: {
        'X-LNMARKETS-API-KEY': process.env.LNMARKETS_API_KEY || 'test',
        'X-LNMARKETS-SIGNATURE': signature,
        'X-LNMARKETS-TIMESTAMP': timestamp
      }
    });
    
    console.log('Authenticated API test:', response.status);
    console.log('User data:', response.data);
  } catch (error) {
    console.error('Authenticated API test failed:', error.message);
  }
}

testAuthenticatedEndpoint();
"
```

**LN Markets API Debugging**
```typescript
// LN Markets API debugging service
export class LNMarketsAPIDebugger {
  private client: LNMarketsClient;
  private logger: Logger;
  
  constructor(client: LNMarketsClient, logger: Logger) {
    this.client = client;
    this.logger = logger;
  }
  
  async debugAPIConnection(): Promise<APIDebugInfo> {
    const debugInfo: APIDebugInfo = {
      timestamp: new Date().toISOString(),
      tests: [],
      issues: [],
      recommendations: []
    };
    
    try {
      // Test 1: Public endpoint connectivity
      const publicTest = await this.testPublicEndpoint();
      debugInfo.tests.push(publicTest);
      
      if (!publicTest.success) {
        debugInfo.issues.push('Public endpoint connectivity failed');
        debugInfo.recommendations.push('Check network connectivity and DNS resolution');
      }
      
      // Test 2: Authentication
      const authTest = await this.testAuthentication();
      debugInfo.tests.push(authTest);
      
      if (!authTest.success) {
        debugInfo.issues.push('Authentication failed');
        debugInfo.recommendations.push('Verify API credentials and HMAC signature generation');
      }
      
      // Test 3: Rate limiting
      const rateLimitTest = await this.testRateLimiting();
      debugInfo.tests.push(rateLimitTest);
      
      if (!rateLimitTest.success) {
        debugInfo.issues.push('Rate limiting issues detected');
        debugInfo.recommendations.push('Implement proper rate limiting and backoff strategies');
      }
      
      // Test 4: Data validation
      const dataTest = await this.testDataValidation();
      debugInfo.tests.push(dataTest);
      
      if (!dataTest.success) {
        debugInfo.issues.push('Data validation issues detected');
        debugInfo.recommendations.push('Verify data format and validation logic');
      }
      
      return debugInfo;
    } catch (error) {
      debugInfo.issues.push(`Debug error: ${error.message}`);
      return debugInfo;
    }
  }
  
  private async testPublicEndpoint(): Promise<APITestResult> {
    try {
      const response = await this.client.request({
        method: 'GET',
        url: '/futures/price'
      });
      
      return {
        name: 'Public Endpoint Test',
        success: true,
        details: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`
      };
    } catch (error) {
      return {
        name: 'Public Endpoint Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testAuthentication(): Promise<APITestResult> {
    try {
      const response = await this.client.request({
        method: 'GET',
        url: '/user/me'
      });
      
      return {
        name: 'Authentication Test',
        success: true,
        details: `Status: ${response.status}, User: ${response.data.email || 'N/A'}`
      };
    } catch (error) {
      return {
        name: 'Authentication Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testRateLimiting(): Promise<APITestResult> {
    try {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(5).fill(null).map(() => 
        this.client.request({ method: 'GET', url: '/futures/price' })
      );
      
      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.status === 200).length;
      
      return {
        name: 'Rate Limiting Test',
        success: successCount === 5,
        details: `Successful requests: ${successCount}/5`
      };
    } catch (error) {
      return {
        name: 'Rate Limiting Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testDataValidation(): Promise<APITestResult> {
    try {
      const response = await this.client.request({
        method: 'GET',
        url: '/futures/price'
      });
      
      // Validate response structure
      const isValid = response.data && 
        typeof response.data.price === 'number' &&
        response.data.price > 0;
      
      return {
        name: 'Data Validation Test',
        success: isValid,
        details: `Price: ${response.data.price}, Valid: ${isValid}`
      };
    } catch (error) {
      return {
        name: 'Data Validation Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
}
```

### 2. Rate Limiting Issues

**Symptoms:**
- 429 Too Many Requests errors
- API quota exceeded
- Request throttling
- Service degradation

**Root Causes:**
- Exceeding API rate limits
- Inefficient request patterns
- Missing rate limiting implementation
- Burst traffic spikes

**Solutions:**

```bash
# 1. Check current rate limiting status
kubectl exec -n axisor <backend-pod> -- node -e "
const { Queue } = require('bullmq');
const redis = require('ioredis');
const queue = new Queue('lnmarkets-api', { 
  connection: new redis(process.env.REDIS_URL) 
});

async function checkRateLimiting() {
  const activeJobs = await queue.getActive();
  const waitingJobs = await queue.getWaiting();
  
  console.log('Active API jobs:', activeJobs.length);
  console.log('Waiting API jobs:', waitingJobs.length);
  
  // Check rate limiting headers
  activeJobs.forEach(job => {
    console.log('Job:', job.id, 'Data:', job.data);
  });
}

checkRateLimiting();
"

# 2. Monitor API request patterns
kubectl logs -n axisor <backend-pod> | grep -E "(LN Markets|API)" | tail -50

# 3. Check rate limiting configuration
kubectl exec -n axisor <backend-pod> -- node -e "
console.log('Rate limit configuration:');
console.log('Requests per minute:', process.env.LNMARKETS_RATE_LIMIT || 'Not set');
console.log('Burst limit:', process.env.LNMARKETS_BURST_LIMIT || 'Not set');
"

# 4. Test rate limiting implementation
kubectl exec -n axisor <backend-pod> -- node -e "
const { RateLimiter } = require('limiter');
const limiter = new RateLimiter(10, 'minute'); // 10 requests per minute

async function testRateLimiting() {
  for (let i = 0; i < 15; i++) {
    try {
      await limiter.removeTokens(1);
      console.log('Request', i + 1, 'allowed');
    } catch (error) {
      console.log('Request', i + 1, 'rate limited');
    }
  }
}

testRateLimiting();
"

# 5. Check API response headers
kubectl exec -n axisor <backend-pod> -- node -e "
const axios = require('axios');

async function checkRateLimitHeaders() {
  try {
    const response = await axios.get('https://api.lnmarkets.com/v2/futures/price');
    console.log('Rate limit headers:');
    console.log('X-RateLimit-Limit:', response.headers['x-ratelimit-limit']);
    console.log('X-RateLimit-Remaining:', response.headers['x-ratelimit-remaining']);
    console.log('X-RateLimit-Reset:', response.headers['x-ratelimit-reset']);
  } catch (error) {
    console.error('Rate limit check failed:', error.message);
  }
}

checkRateLimitHeaders();
"
```

**Rate Limiting Implementation**
```typescript
// Enhanced rate limiting service
export class LNMarketsRateLimiter {
  private limiter: RateLimiter;
  private redis: Redis;
  private keyPrefix = 'lnmarkets:rate_limit:';
  
  constructor(redis: Redis) {
    this.redis = redis;
    this.limiter = new RateLimiter({
      tokensPerInterval: 100,
      interval: 'minute',
      fireImmediately: true
    });
  }
  
  async checkRateLimit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.keyPrefix}${identifier}`;
    
    try {
      // Check current rate limit status
      const current = await this.redis.get(key);
      const count = current ? parseInt(current) : 0;
      
      if (count >= 100) { // 100 requests per minute
        const ttl = await this.redis.ttl(key);
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + (ttl * 1000),
          retryAfter: ttl
        };
      }
      
      // Increment counter
      const multi = this.redis.multi();
      multi.incr(key);
      multi.expire(key, 60); // 60 seconds
      await multi.exec();
      
      return {
        allowed: true,
        remaining: 100 - count - 1,
        resetTime: Date.now() + 60000,
        retryAfter: 0
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return {
        allowed: true, // Allow on error
        remaining: 100,
        resetTime: Date.now() + 60000,
        retryAfter: 0
      };
    }
  }
  
  async waitForRateLimit(identifier: string): Promise<void> {
    const result = await this.checkRateLimit(identifier);
    
    if (!result.allowed && result.retryAfter > 0) {
      console.log(`Rate limit exceeded, waiting ${result.retryAfter} seconds`);
      await new Promise(resolve => setTimeout(resolve, result.retryAfter * 1000));
    }
  }
}
```

## LND (Lightning Network Daemon) Issues

### 1. Connection Problems

**Symptoms:**
- LND service unavailable
- Connection timeout errors
- Certificate validation failures
- Macaroon authentication issues

**Root Causes:**
- LND service not running
- Network connectivity issues
- Invalid TLS certificates
- Incorrect macaroon permissions

**Solutions:**

```bash
# 1. Check LND service status
kubectl get pods -n axisor -l app=lnd
kubectl describe pod <lnd-pod> -n axisor

# 2. Check LND logs
kubectl logs -n axisor <lnd-pod> --tail=100 -f

# 3. Test LND connectivity
kubectl exec -n axisor <lnd-pod> -- curl -k https://localhost:8080/v1/getinfo

# 4. Check LND configuration
kubectl exec -n axisor <lnd-pod> -- cat /root/.lnd/lnd.conf

# 5. Verify TLS certificates
kubectl exec -n axisor <lnd-pod> -- ls -la /root/.lnd/tls.cert
kubectl exec -n axisor <lnd-pod> -- openssl x509 -in /root/.lnd/tls.cert -text -noout

# 6. Check macaroon permissions
kubectl exec -n axisor <lnd-pod> -- ls -la /root/.lnd/admin.macaroon
kubectl exec -n axisor <lnd-pod> -- xxd /root/.lnd/admin.macaroon | head -5

# 7. Test LND API endpoints
kubectl exec -n axisor <lnd-pod> -- curl -k --cert /root/.lnd/tls.cert --key /root/.lnd/tls.key --macaroon /root/.lnd/admin.macaroon https://localhost:8080/v1/getinfo
```

**LND Connection Debugging**
```typescript
// LND connection debugging service
export class LNDConnectionDebugger {
  private lndService: LNDService;
  private logger: Logger;
  
  constructor(lndService: LNDService, logger: Logger) {
    this.lndService = lndService;
    this.logger = logger;
  }
  
  async debugLNDConnection(): Promise<LNDDebugInfo> {
    const debugInfo: LNDDebugInfo = {
      timestamp: new Date().toISOString(),
      tests: [],
      issues: [],
      recommendations: []
    };
    
    try {
      // Test 1: Basic connectivity
      const connectivityTest = await this.testConnectivity();
      debugInfo.tests.push(connectivityTest);
      
      if (!connectivityTest.success) {
        debugInfo.issues.push('LND service connectivity failed');
        debugInfo.recommendations.push('Check LND service status and network connectivity');
      }
      
      // Test 2: Authentication
      const authTest = await this.testAuthentication();
      debugInfo.tests.push(authTest);
      
      if (!authTest.success) {
        debugInfo.issues.push('LND authentication failed');
        debugInfo.recommendations.push('Verify TLS certificates and macaroon permissions');
      }
      
      // Test 3: API endpoints
      const apiTest = await this.testAPIEndpoints();
      debugInfo.tests.push(apiTest);
      
      if (!apiTest.success) {
        debugInfo.issues.push('LND API endpoints not responding');
        debugInfo.recommendations.push('Check LND service configuration and API endpoints');
      }
      
      // Test 4: Wallet status
      const walletTest = await this.testWalletStatus();
      debugInfo.tests.push(walletTest);
      
      if (!walletTest.success) {
        debugInfo.issues.push('LND wallet not accessible');
        debugInfo.recommendations.push('Check wallet initialization and permissions');
      }
      
      return debugInfo;
    } catch (error) {
      debugInfo.issues.push(`Debug error: ${error.message}`);
      return debugInfo;
    }
  }
  
  private async testConnectivity(): Promise<APITestResult> {
    try {
      const response = await this.lndService.info.getInfo();
      
      return {
        name: 'LND Connectivity Test',
        success: true,
        details: `LND version: ${response.version}, Network: ${response.chains?.[0]?.network || 'unknown'}`
      };
    } catch (error) {
      return {
        name: 'LND Connectivity Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testAuthentication(): Promise<APITestResult> {
    try {
      const response = await this.lndService.info.getInfo();
      
      return {
        name: 'LND Authentication Test',
        success: true,
        details: `Authenticated successfully, Node ID: ${response.identity_pubkey || 'unknown'}`
      };
    } catch (error) {
      return {
        name: 'LND Authentication Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testAPIEndpoints(): Promise<APITestResult> {
    try {
      const [info, wallet, channels] = await Promise.all([
        this.lndService.info.getInfo(),
        this.lndService.wallet.getBalance(),
        this.lndService.channel.listChannels()
      ]);
      
      return {
        name: 'LND API Endpoints Test',
        success: true,
        details: `Info: OK, Wallet: OK, Channels: ${channels.length}`
      };
    } catch (error) {
      return {
        name: 'LND API Endpoints Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testWalletStatus(): Promise<APITestResult> {
    try {
      const balance = await this.lndService.wallet.getBalance();
      
      return {
        name: 'LND Wallet Status Test',
        success: true,
        details: `Total balance: ${balance.total_balance || 0} sats`
      };
    } catch (error) {
      return {
        name: 'LND Wallet Status Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
}
```

### 2. Lightning Network Issues

**Symptoms:**
- Channel opening failures
- Payment routing issues
- Invoice generation problems
- Network connectivity issues

**Root Causes:**
- Insufficient channel capacity
- Network congestion
- Invalid payment requests
- Channel state issues

**Solutions:**

```bash
# 1. Check channel status
kubectl exec -n axisor <lnd-pod> -- curl -k --cert /root/.lnd/tls.cert --key /root/.lnd/tls.key --macaroon /root/.lnd/admin.macaroon https://localhost:8080/v1/channels

# 2. Check peer connections
kubectl exec -n axisor <lnd-pod> -- curl -k --cert /root/.lnd/tls.cert --key /root/.lnd/tls.key --macaroon /root/.lnd/admin.macaroon https://localhost:8080/v1/peers

# 3. Check network info
kubectl exec -n axisor <lnd-pod> -- curl -k --cert /root/.lnd/tls.cert --key /root/.lnd/tls.key --macaroon /root/.lnd/admin.macaroon https://localhost:8080/v1/getinfo

# 4. Check pending channels
kubectl exec -n axisor <lnd-pod> -- curl -k --cert /root/.lnd/tls.cert --key /root/.lnd/tls.key --macaroon /root/.lnd/admin.macaroon https://localhost:8080/v1/channels/pending

# 5. Check wallet balance
kubectl exec -n axisor <lnd-pod> -- curl -k --cert /root/.lnd/tls.cert --key /root/.lnd/tls.key --macaroon /root/.lnd/admin.macaroon https://localhost:8080/v1/balance/blockchain

# 6. Test invoice generation
kubectl exec -n axisor <lnd-pod> -- curl -k --cert /root/.lnd/tls.cert --key /root/.lnd/tls.key --macaroon /root/.lnd/admin.macaroon -X POST https://localhost:8080/v1/invoices -d '{"value": 1000, "memo": "test invoice"}'
```

## TradingView Integration Issues

### 1. Chart Data Problems

**Symptoms:**
- Charts not loading
- Data not updating
- Historical data missing
- Real-time data issues

**Root Causes:**
- Data source connectivity issues
- API rate limiting
- Data format problems
- Chart configuration errors

**Solutions:**

```bash
# 1. Check TradingView data source
kubectl exec -n axisor <backend-pod> -- node -e "
const axios = require('axios');

async function checkTradingViewData() {
  try {
    // Check if we can access market data
    const response = await axios.get('https://api.lnmarkets.com/v2/futures/price');
    console.log('Market data available:', response.data);
    
    // Check historical data
    const historicalResponse = await axios.get('https://api.lnmarkets.com/v2/futures/history', {
      params: {
        symbol: 'BTCUSD',
        interval: '1h',
        limit: 100
      }
    });
    console.log('Historical data points:', historicalResponse.data.length);
  } catch (error) {
    console.error('TradingView data check failed:', error.message);
  }
}

checkTradingViewData();
"

# 2. Check chart configuration
kubectl exec -n axisor <frontend-pod> -- node -e "
console.log('TradingView configuration:');
console.log('Chart library version:', process.env.TRADINGVIEW_VERSION || 'Not set');
console.log('Data refresh interval:', process.env.DATA_REFRESH_INTERVAL || 'Not set');
"

# 3. Test chart data API
kubectl port-forward -n axisor svc/axisor-backend 3000:3000
curl http://localhost:3000/api/charts/data?symbol=BTCUSD&interval=1h&limit=100

# 4. Check WebSocket connection
kubectl exec -n axisor <frontend-pod> -- node -e "
const WebSocket = require('ws');

async function testWebSocketConnection() {
  try {
    const ws = new WebSocket('wss://api.lnmarkets.com/v2/ws');
    
    ws.on('open', () => {
      console.log('WebSocket connection established');
      ws.close();
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket connection failed:', error.message);
    });
  } catch (error) {
    console.error('WebSocket test failed:', error.message);
  }
}

testWebSocketConnection();
"
```

**TradingView Data Debugging**
```typescript
// TradingView data debugging service
export class TradingViewDataDebugger {
  private dataSource: MarketDataService;
  private logger: Logger;
  
  constructor(dataSource: MarketDataService, logger: Logger) {
    this.dataSource = dataSource;
    this.logger = logger;
  }
  
  async debugChartData(symbol: string, interval: string): Promise<ChartDataDebugInfo> {
    const debugInfo: ChartDataDebugInfo = {
      symbol,
      interval,
      timestamp: new Date().toISOString(),
      tests: [],
      issues: [],
      recommendations: []
    };
    
    try {
      // Test 1: Real-time data
      const realtimeTest = await this.testRealtimeData(symbol);
      debugInfo.tests.push(realtimeTest);
      
      if (!realtimeTest.success) {
        debugInfo.issues.push('Real-time data not available');
        debugInfo.recommendations.push('Check market data service connectivity');
      }
      
      // Test 2: Historical data
      const historicalTest = await this.testHistoricalData(symbol, interval);
      debugInfo.tests.push(historicalTest);
      
      if (!historicalTest.success) {
        debugInfo.issues.push('Historical data not available');
        debugInfo.recommendations.push('Check historical data service and storage');
      }
      
      // Test 3: Data format validation
      const formatTest = await this.testDataFormat(symbol, interval);
      debugInfo.tests.push(formatTest);
      
      if (!formatTest.success) {
        debugInfo.issues.push('Data format validation failed');
        debugInfo.recommendations.push('Verify data format and validation logic');
      }
      
      // Test 4: Chart rendering
      const renderingTest = await this.testChartRendering(symbol, interval);
      debugInfo.tests.push(renderingTest);
      
      if (!renderingTest.success) {
        debugInfo.issues.push('Chart rendering failed');
        debugInfo.recommendations.push('Check chart library configuration and data');
      }
      
      return debugInfo;
    } catch (error) {
      debugInfo.issues.push(`Debug error: ${error.message}`);
      return debugInfo;
    }
  }
  
  private async testRealtimeData(symbol: string): Promise<APITestResult> {
    try {
      const data = await this.dataSource.getRealtimePrice(symbol);
      
      return {
        name: 'Real-time Data Test',
        success: !!data && data.price > 0,
        details: `Price: ${data?.price || 'N/A'}, Timestamp: ${data?.timestamp || 'N/A'}`
      };
    } catch (error) {
      return {
        name: 'Real-time Data Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testHistoricalData(symbol: string, interval: string): Promise<APITestResult> {
    try {
      const data = await this.dataSource.getHistoricalData(symbol, interval, 100);
      
      return {
        name: 'Historical Data Test',
        success: !!data && data.length > 0,
        details: `Data points: ${data?.length || 0}, Latest: ${data?.[data.length - 1]?.timestamp || 'N/A'}`
      };
    } catch (error) {
      return {
        name: 'Historical Data Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testDataFormat(symbol: string, interval: string): Promise<APITestResult> {
    try {
      const data = await this.dataSource.getHistoricalData(symbol, interval, 10);
      
      if (!data || data.length === 0) {
        return {
          name: 'Data Format Test',
          success: false,
          details: 'No data available'
        };
      }
      
      const sample = data[0];
      const isValid = sample && 
        typeof sample.timestamp === 'number' &&
        typeof sample.open === 'number' &&
        typeof sample.high === 'number' &&
        typeof sample.low === 'number' &&
        typeof sample.close === 'number' &&
        typeof sample.volume === 'number';
      
      return {
        name: 'Data Format Test',
        success: isValid,
        details: `Sample data: ${JSON.stringify(sample)}, Valid: ${isValid}`
      };
    } catch (error) {
      return {
        name: 'Data Format Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
  
  private async testChartRendering(symbol: string, interval: string): Promise<APITestResult> {
    try {
      // This would typically test chart rendering in a headless environment
      // For now, we'll just validate that we have the necessary data
      const data = await this.dataSource.getHistoricalData(symbol, interval, 100);
      
      return {
        name: 'Chart Rendering Test',
        success: !!data && data.length > 0,
        details: `Data available for rendering: ${data?.length || 0} points`
      };
    } catch (error) {
      return {
        name: 'Chart Rendering Test',
        success: false,
        details: `Error: ${error.message}`
      };
    }
  }
}
```

## API Integration Best Practices

### 1. Error Handling and Retry Logic

**Circuit Breaker Pattern**
```typescript
export class APICircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000,
    private halfOpenMaxCalls: number = 3
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    }
  }
}
```

### 2. API Monitoring and Alerting

**API Health Monitoring**
```typescript
export class APIHealthMonitor {
  private apis: Map<string, APIHealthCheck> = new Map();
  
  constructor() {
    this.apis.set('lnmarkets', {
      name: 'LN Markets API',
      url: 'https://api.lnmarkets.com/v2/health',
      timeout: 5000,
      retries: 3
    });
    
    this.apis.set('lnd', {
      name: 'LND API',
      url: 'https://localhost:8080/v1/getinfo',
      timeout: 10000,
      retries: 2
    });
  }
  
  async checkAllAPIs(): Promise<APIHealthStatus[]> {
    const results: APIHealthStatus[] = [];
    
    for (const [id, check] of this.apis.entries()) {
      const status = await this.checkAPI(id, check);
      results.push(status);
    }
    
    return results;
  }
  
  private async checkAPI(id: string, check: APIHealthCheck): Promise<APIHealthStatus> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(check);
      const duration = Date.now() - startTime;
      
      return {
        id,
        name: check.name,
        status: 'HEALTHY',
        responseTime: duration,
        timestamp: new Date().toISOString(),
        details: `Status: ${response.status}`
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        id,
        name: check.name,
        status: 'UNHEALTHY',
        responseTime: duration,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
  
  private async makeRequest(check: APIHealthCheck): Promise<any> {
    const axios = require('axios');
    
    for (let attempt = 1; attempt <= check.retries; attempt++) {
      try {
        const response = await axios.get(check.url, {
          timeout: check.timeout,
          validateStatus: (status: number) => status < 500
        });
        
        return response;
      } catch (error) {
        if (attempt === check.retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
}
```

## Recent Fixes and Solutions (2025-01-23)

### Credential Decryption Issues

**Problem**: External API routes failing with "Invalid key length" or key corruption errors.

**Root Cause**: `Object.entries()` was causing key corruption during credential decryption.

**Solution**: 
```typescript
// ❌ PROBLEMA: Object.entries() causava corrupção de chaves
Object.entries(encryptedCredentials).forEach(([key, value]) => {
  // key seria corrompido para caracteres especiais
});

// ✅ SOLUÇÃO: Object.keys() com for...of
const keys = Object.keys(encryptedCredentials);
for (const key of keys) {
  const value = encryptedCredentials[key];
  // key permanece intacto
}
```

**Verification Steps**:
1. Check if credentials are being decrypted correctly
2. Verify key names are not corrupted
3. Test API calls with decrypted credentials
4. Monitor logs for decryption errors

### Route Registration Issues

**Problem**: LN Markets header routes not being called due to routing conflicts.

**Root Cause**: Route registration order and prefix conflicts.

**Solution**:
```typescript
// ✅ SOLUÇÃO: Registrar rotas na ordem correta
await fastify.register(lnmarketsRoutes, { prefix: '/api/lnmarkets' });
await fastify.register(lnMarketsHeaderRoutes, { prefix: '/api/lnmarkets' });
```

**Verification Steps**:
1. Check route registration order in `index.ts`
2. Verify route paths are correct
3. Test route accessibility
4. Monitor route loading logs

### Double Decryption Issues

**Problem**: Credentials being decrypted twice causing errors.

**Root Cause**: `AccountCredentialsService` already decrypts credentials, but routes were decrypting again.

**Solution**:
```typescript
// ✅ SOLUÇÃO: Usar credenciais já descriptografadas
const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(user.id);
const decryptedCredentials = activeCredentials.credentials; // Já descriptografadas
```

**Verification Steps**:
1. Check if `AccountCredentialsService` is decrypting credentials
2. Verify routes are not double-decrypting
3. Test API calls with single decryption
4. Monitor decryption logs

### Testnet Detection Issues

**Problem**: Testnet mode not being properly detected and applied.

**Root Cause**: Testnet detection logic not working correctly.

**Solution**:
```typescript
// ✅ SOLUÇÃO: Detecção correta de testnet
const testnetResult = TestnetDetector.detectTestnet(decryptedCredentials);
const isTestnet = testnetResult.isTestnet;
```

**Verification Steps**:
1. Check testnet detection logic
2. Verify testnet credentials are properly set
3. Test API calls with testnet mode
4. Monitor testnet detection logs

## Checklist

### LN Markets API Troubleshooting
- [ ] Verify API credentials
- [ ] Check HMAC signature generation
- [ ] Test authentication endpoints
- [ ] Monitor rate limiting
- [ ] Check API response headers
- [ ] Validate data format
- [ ] Test error handling
- [ ] Monitor API performance
- [ ] **NEW**: Check credential decryption (key corruption fix)
- [ ] **NEW**: Verify route registration order
- [ ] **NEW**: Test testnet detection

### LND Integration Troubleshooting
- [ ] Check LND service status
- [ ] Verify TLS certificates
- [ ] Check macaroon permissions
- [ ] Test API endpoints
- [ ] Monitor channel status
- [ ] Check peer connections
- [ ] Verify wallet status
- [ ] Test payment functionality

### TradingView Integration Troubleshooting
- [ ] Check data source connectivity
- [ ] Verify chart configuration
- [ ] Test real-time data
- [ ] Check historical data
- [ ] Validate data format
- [ ] Test chart rendering
- [ ] Monitor WebSocket connections
- [ ] Check data refresh intervals

### General API Integration
- [ ] Implement circuit breaker pattern
- [ ] Set up API health monitoring
- [ ] Configure rate limiting
- [ ] Implement retry logic
- [ ] Set up error alerting
- [ ] Monitor API performance
- [ ] Test error scenarios
- [ ] Validate API responses
- [ ] **NEW**: Check for double decryption issues
- [ ] **NEW**: Verify credential key integrity
