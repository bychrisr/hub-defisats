"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LNMarketsService = void 0;
exports.createLNMarketsService = createLNMarketsService;
exports.testSandboxCredentials = testSandboxCredentials;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
class LNMarketsService {
    client;
    credentials;
    constructor(credentials) {
        this.credentials = credentials;
        this.client = axios_1.default.create({
            baseURL: 'https://api.lnmarkets.com',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });
        this.client.interceptors.request.use(config => {
            const authHeaders = this.generateAuthHeaders(config.method?.toUpperCase() || 'GET', config.url || '', config.params, config.data);
            Object.assign(config.headers, authHeaders);
            return config;
        });
        this.client.interceptors.response.use(response => response, error => {
            console.error('LN Markets API Error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                url: error.config?.url,
                method: error.config?.method,
            });
            throw error;
        });
    }
    generateAuthHeaders(method, path, params, data) {
        const { apiKey, apiSecret, passphrase } = this.credentials;
        const timestamp = Date.now().toString();
        let paramsStr = '';
        if (method === 'GET' || method === 'DELETE') {
            if (params) {
                paramsStr = new URLSearchParams(params).toString();
            }
        }
        else if (data) {
            paramsStr = JSON.stringify(data);
        }
        const message = `${timestamp}${method}${path}${paramsStr}`;
        const signature = (0, crypto_1.createHmac)('sha256', apiSecret)
            .update(message)
            .digest('base64');
        return {
            'LNM-ACCESS-KEY': apiKey,
            'LNM-ACCESS-SIGNATURE': signature,
            'LNM-ACCESS-PASSPHRASE': passphrase,
            'LNM-ACCESS-TIMESTAMP': timestamp,
        };
    }
    async tryAlternativeAuth(endpoint) {
        const { apiKey, apiSecret } = this.credentials;
        try {
            const response = await axios_1.default.get(`${this.client.defaults.baseURL}${endpoint}`, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            console.log('✅ Basic auth successful');
            return response;
        }
        catch (error) {
            console.log('❌ Basic auth failed');
        }
        try {
            const response = await axios_1.default.get(`${this.client.defaults.baseURL}${endpoint}`, {
                headers: {
                    'X-API-Key': apiKey,
                    'X-API-Secret': apiSecret,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            console.log('✅ API key headers successful');
            return response;
        }
        catch (error) {
            console.log('❌ API key headers failed');
        }
        try {
            const response = await axios_1.default.get(`${this.client.defaults.baseURL}${endpoint}`, {
                params: {
                    api_key: apiKey,
                    api_secret: apiSecret,
                },
                timeout: 10000,
            });
            console.log('✅ Query parameters successful');
            return response;
        }
        catch (error) {
            console.log('❌ Query parameters failed');
        }
        throw new Error('All authentication methods failed');
    }
    async getMarginInfo() {
        try {
            const response = await this.client.get('/v2/user');
            return response.data;
        }
        catch (error) {
            console.error('Error fetching margin info:', error);
            throw new Error('Failed to fetch margin information');
        }
    }
    async getPositions() {
        try {
            const response = await this.client.get('/v2/futures/positions');
            return response.data || [];
        }
        catch (error) {
            console.error('Error fetching positions:', error);
            throw new Error('Failed to fetch positions');
        }
    }
    async getRunningTrades() {
        try {
            const response = await this.client.get('/v2/futures/trades', {
                params: { type: 'running' },
            });
            return response.data || [];
        }
        catch (error) {
            console.error('Error fetching running trades:', error);
            throw new Error('Failed to fetch running trades');
        }
    }
    async getBalance() {
        try {
            const response = await this.client.get('/v2/user');
            return response.data;
        }
        catch (error) {
            console.error('Error fetching balance:', error);
            throw new Error('Failed to fetch balance');
        }
    }
    async validateCredentials() {
        try {
            console.log('🔍 Starting LN Markets credentials validation...');
            console.log('📋 Credentials provided:', {
                hasApiKey: !!this.credentials.apiKey,
                hasApiSecret: !!this.credentials.apiSecret,
                hasPassphrase: !!this.credentials.passphrase,
                apiKeyLength: this.credentials.apiKey?.length,
                apiSecretLength: this.credentials.apiSecret?.length,
                passphraseLength: this.credentials.passphrase?.length,
            });
            const endpoints = [
                '/v2/user',
                '/v2/futures/positions',
                '/v2/futures/trades',
            ];
            for (const endpoint of endpoints) {
                try {
                    console.log(`🔗 Testing endpoint: ${endpoint}`);
                    const response = await this.client.get(endpoint);
                    console.log(`✅ LN Markets API validation successful with endpoint: ${endpoint}`);
                    console.log(`📊 Response status: ${response.status}`);
                    return true;
                }
                catch (error) {
                    console.log(`❌ Main auth failed for ${endpoint}:`, {
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                        message: error.message,
                    });
                    try {
                        console.log(`🔄 Trying alternative auth for ${endpoint}...`);
                        await this.tryAlternativeAuth(endpoint);
                        console.log(`✅ Alternative auth successful for ${endpoint}`);
                        return true;
                    }
                    catch (altError) {
                        console.log(`❌ Alternative auth also failed for ${endpoint}:`, {
                            status: altError.response?.status,
                            statusText: altError.response?.statusText,
                            data: altError.response?.data,
                            message: altError.message,
                        });
                        continue;
                    }
                }
            }
            console.error('❌ All LN Markets API endpoints and auth methods failed');
            return false;
        }
        catch (error) {
            console.error('❌ LN Markets API validation error:', {
                message: error.message,
                stack: error.stack,
                response: error.response?.data,
            });
            return false;
        }
    }
    async testConnectivity() {
        try {
            const endpoints = [
                'https://api.lnmarkets.com/v2/futures/markets',
                'https://api.lnmarkets.com/v2/futures/ticker',
                'https://api.lnmarkets.com/v2/health',
            ];
            for (const endpoint of endpoints) {
                try {
                    const response = await axios_1.default.get(endpoint, { timeout: 5000 });
                    return {
                        success: true,
                        message: `Basic connectivity test successful with ${endpoint}`,
                        details: {
                            status: response.status,
                            endpoint,
                            dataSize: JSON.stringify(response.data).length,
                        },
                    };
                }
                catch (error) {
                    console.log(`Endpoint ${endpoint} failed:`, error.response?.status);
                    continue;
                }
            }
            return {
                success: false,
                message: 'All connectivity tests failed',
                details: 'No public endpoints responded',
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Basic connectivity test failed',
                details: error.message,
            };
        }
    }
    async closePosition(positionId) {
        try {
            const response = await this.client.post(`/futures/position/${positionId}/close`);
            return response.data;
        }
        catch (error) {
            console.error('Error closing position:', error);
            throw new Error('Failed to close position');
        }
    }
    async reducePosition(market, side, size) {
        try {
            const response = await this.client.post('/futures/order', {
                market,
                side,
                type: 'm',
                size,
                reduce_only: true,
            });
            return response.data;
        }
        catch (error) {
            console.error('Error reducing position:', error);
            throw new Error('Failed to reduce position');
        }
    }
    async getMarketData(market) {
        try {
            const response = await this.client.get(`/futures/market/${market}`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching market data:', error);
            throw new Error('Failed to fetch market data');
        }
    }
    calculateLiquidationRisk(marginInfo, positions) {
        if (!marginInfo || !positions) {
            return {
                atRisk: false,
                riskLevel: 'low',
                message: 'Unable to calculate risk',
            };
        }
        const marginLevel = marginInfo.marginLevel || 0;
        const liquidationThreshold = 10;
        if (marginLevel <= liquidationThreshold) {
            return {
                atRisk: true,
                riskLevel: 'critical',
                message: `Critical: Margin level at ${marginLevel.toFixed(2)}% - Immediate liquidation risk!`,
            };
        }
        else if (marginLevel <= 20) {
            return {
                atRisk: true,
                riskLevel: 'high',
                message: `High Risk: Margin level at ${marginLevel.toFixed(2)}% - Close positions immediately`,
            };
        }
        else if (marginLevel <= 50) {
            return {
                atRisk: true,
                riskLevel: 'medium',
                message: `Medium Risk: Margin level at ${marginLevel.toFixed(2)}% - Monitor closely`,
            };
        }
        return {
            atRisk: false,
            riskLevel: 'low',
            message: `Low Risk: Margin level at ${marginLevel.toFixed(2)}% - Position healthy`,
        };
    }
}
exports.LNMarketsService = LNMarketsService;
function createLNMarketsService(credentials) {
    return new LNMarketsService(credentials);
}
async function testSandboxCredentials() {
    console.log('🧪 Testing LN Markets sandbox credentials...');
    const sandboxCredentials = {
        apiKey: 'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
        apiSecret: 'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
        passphrase: 'a6c1bh56jc33',
    };
    console.log('📋 Sandbox credentials:', {
        hasApiKey: !!sandboxCredentials.apiKey,
        hasApiSecret: !!sandboxCredentials.apiSecret,
        hasPassphrase: !!sandboxCredentials.passphrase,
        apiKeyLength: sandboxCredentials.apiKey?.length,
        apiSecretLength: sandboxCredentials.apiSecret?.length,
        passphraseLength: sandboxCredentials.passphrase?.length,
    });
    const service = createLNMarketsService(sandboxCredentials);
    try {
        console.log('🔍 Testing connectivity...');
        const connectivityTest = await service.testConnectivity();
        console.log('📡 Connectivity test result:', connectivityTest);
        console.log('✅ Testing credentials validation...');
        const isValid = await service.validateCredentials();
        console.log('🎯 Credentials validation result:', isValid);
        if (isValid) {
            console.log('✅ Sandbox credentials are valid!');
        }
        else {
            console.log('❌ Sandbox credentials validation failed');
        }
    }
    catch (error) {
        console.error('❌ Test failed:', error);
    }
}
//# sourceMappingURL=lnmarkets.service.js.map