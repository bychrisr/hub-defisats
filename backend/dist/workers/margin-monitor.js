"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserCredentials = addUserCredentials;
exports.removeUserCredentials = removeUserCredentials;
exports.simulateMarginMonitoring = simulateMarginMonitoring;
exports.startPeriodicMonitoring = startPeriodicMonitoring;
exports.stopPeriodicMonitoring = stopPeriodicMonitoring;
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const lnmarkets_service_1 = require("../services/lnmarkets.service");
const secure_storage_service_1 = require("../services/secure-storage.service");
const redis = new ioredis_1.Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');
const marginCheckQueue = new bullmq_1.Queue('margin-check', {
    connection: redis,
    defaultJobOptions: {
        priority: 10,
        removeOnComplete: 50,
        removeOnFail: 50,
    },
});
const userCredentials = {};
const lnMarketsServices = {};
const worker = new bullmq_1.Worker('margin-check', async (job) => {
    const { userId, config } = job.data;
    console.log(`🔍 Monitoring margin for user ${userId}`);
    try {
        const encryptedCredentials = userCredentials[userId];
        if (!encryptedCredentials) {
            console.warn(`No credentials found for user ${userId}`);
            return { status: 'skipped', reason: 'no_credentials' };
        }
        let credentials;
        try {
            credentials =
                await secure_storage_service_1.secureStorage.decryptCredentials(encryptedCredentials);
        }
        catch (error) {
            console.error(`Failed to decrypt credentials for user ${userId}:`, error);
            return { status: 'error', reason: 'decryption_failed' };
        }
        let lnMarkets = lnMarketsServices[userId];
        if (!lnMarkets) {
            lnMarkets = (0, lnmarkets_service_1.createLNMarketsService)(credentials);
            lnMarketsServices[userId] = lnMarkets;
        }
        const runningTrades = await lnMarkets.getRunningTrades();
        if (runningTrades.length === 0) {
            console.log(`ℹ️  User ${userId} has no running trades`);
            return { status: 'processed', tradesCount: 0, alerts: [] };
        }
        console.log(`📊 User ${userId} has ${runningTrades.length} running trades`);
        const alerts = [];
        for (const trade of runningTrades) {
            const maintenanceMargin = trade.maintenance_margin || 0;
            const margin = trade.margin || 0;
            const pl = trade.pl || 0;
            if (maintenanceMargin === 0) {
                console.warn(`⚠️  Trade ${trade.id} has zero maintenance margin`);
                continue;
            }
            const marginRatio = maintenanceMargin / (margin + pl);
            let level = 'safe';
            if (marginRatio > 0.9) {
                level = 'critical';
            }
            else if (marginRatio > 0.8) {
                level = 'warning';
            }
            console.log(`📈 Trade ${trade.id}: Margin Ratio ${marginRatio.toFixed(4)} (${level})`);
            if (level !== 'safe') {
                const message = `⚠️ Margin ${level.toUpperCase()}: Trade ${trade.id} ratio ${marginRatio.toFixed(4)}`;
                alerts.push({
                    tradeId: trade.id,
                    marginRatio,
                    level,
                    message,
                });
                if (config.notificationEnabled) {
                    console.log(`📱 Sending notification to user ${userId}: ${message}`);
                }
                if (config.autoClose && level === 'critical') {
                    console.log(`🚨 Auto-closing trade ${trade.id} for user ${userId}`);
                    try {
                        await lnMarkets.closePosition(trade.id);
                        console.log(`✅ Closed trade ${trade.id} for user ${userId}`);
                    }
                    catch (error) {
                        console.error(`❌ Failed to close trade ${trade.id}:`, error);
                    }
                }
            }
        }
        return {
            status: 'processed',
            tradesCount: runningTrades.length,
            alertsCount: alerts.length,
            alerts,
        };
    }
    catch (error) {
        console.error(`❌ Error monitoring margin for user ${userId}:`, error);
        return { status: 'error', error: error.message };
    }
}, {
    connection: redis,
    concurrency: 5,
    limiter: {
        max: 10,
        duration: 1000,
    },
});
worker.on('completed', job => {
    console.log(`✅ Margin monitor job ${job.id} completed for user ${job.data.userId}`);
});
worker.on('failed', (job, err) => {
    console.error(`❌ Margin monitor job ${job?.id} failed for user ${job?.data?.userId}:`, err);
});
async function addUserCredentials(userId, apiKey, apiSecret, passphrase) {
    try {
        const credentials = { apiKey, apiSecret, passphrase };
        const encryptedCredentials = await secure_storage_service_1.secureStorage.encryptCredentials(credentials);
        userCredentials[userId] = encryptedCredentials;
        console.log(`🔑 Added encrypted credentials for user ${userId}`);
    }
    catch (error) {
        console.error(`Failed to encrypt credentials for user ${userId}:`, error);
        throw new Error('Failed to store credentials securely');
    }
}
function removeUserCredentials(userId) {
    delete userCredentials[userId];
    delete lnMarketsServices[userId];
    console.log(`🗑️  Removed credentials for user ${userId}`);
}
async function simulateMarginMonitoring(userId, _config) {
    console.log(`🎯 Simulating margin monitoring for user ${userId}`);
    try {
        const encryptedCredentials = userCredentials[userId];
        if (!encryptedCredentials) {
            console.warn(`No credentials found for user ${userId}`);
            return;
        }
        let credentials;
        try {
            credentials =
                await secure_storage_service_1.secureStorage.decryptCredentials(encryptedCredentials);
        }
        catch (error) {
            console.error(`Failed to decrypt credentials for user ${userId}:`, error);
            return;
        }
        const lnMarkets = (0, lnmarkets_service_1.createLNMarketsService)(credentials);
        const marginInfo = await lnMarkets.getMarginInfo();
        const positions = await lnMarkets.getPositions();
        console.log(`📊 Simulated margin check for ${userId}: ${marginInfo.marginLevel?.toFixed(2)}%`);
        const risk = lnMarkets.calculateLiquidationRisk(marginInfo, positions);
        if (risk.atRisk) {
            console.log(`⚠️  ${risk.message}`);
        }
        else {
            console.log(`✅ ${risk.message}`);
        }
    }
    catch (error) {
        console.error(`❌ Simulation failed for user ${userId}:`, error);
    }
}
let monitoringInterval = null;
function startPeriodicMonitoring() {
    if (monitoringInterval) {
        console.log('📅 Periodic monitoring already running');
        return;
    }
    console.log('📅 Starting periodic margin monitoring every 5 seconds');
    monitoringInterval = setInterval(async () => {
        try {
            const userIds = Object.keys(userCredentials);
            if (userIds.length === 0) {
                console.log('ℹ️  No users to monitor');
                return;
            }
            console.log(`🔄 Monitoring ${userIds.length} users`);
            for (const userId of userIds) {
                const config = {
                    userId,
                    enabled: true,
                    threshold: 0.8,
                    autoClose: false,
                    notificationEnabled: true,
                };
                await marginCheckQueue.add('monitor-margin', {
                    userId,
                    config,
                }, {
                    priority: 10,
                    delay: 0,
                    removeOnComplete: 50,
                    removeOnFail: 50,
                });
            }
        }
        catch (error) {
            console.error('❌ Error in periodic monitoring:', error);
        }
    }, 5000);
}
function stopPeriodicMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        console.log('🛑 Stopped periodic margin monitoring');
    }
}
console.log('🚀 Margin monitor worker started');
startPeriodicMonitoring();
process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down margin monitor worker...');
    stopPeriodicMonitoring();
    await worker.close();
    await marginCheckQueue.close();
    await redis.disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down margin monitor worker...');
    stopPeriodicMonitoring();
    await worker.close();
    await marginCheckQueue.close();
    await redis.disconnect();
    process.exit(0);
});
//# sourceMappingURL=margin-monitor.js.map