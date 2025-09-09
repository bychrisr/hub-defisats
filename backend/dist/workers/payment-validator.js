"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const redis = new ioredis_1.Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');
const worker = new bullmq_1.Worker('payment-validator', async (job) => {
    console.log('Payment validator job received:', job.data);
    return { status: 'processed' };
}, { connection: redis });
worker.on('completed', job => {
    console.log(`Payment validator job ${job.id} completed`);
});
worker.on('failed', (job, err) => {
    console.error(`Payment validator job ${job?.id} failed:`, err);
});
console.log('Payment validator worker started');
process.on('SIGTERM', async () => {
    console.log('Shutting down payment validator worker...');
    await worker.close();
    await redis.disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('Shutting down payment validator worker...');
    await worker.close();
    await redis.disconnect();
    process.exit(0);
});
//# sourceMappingURL=payment-validator.js.map