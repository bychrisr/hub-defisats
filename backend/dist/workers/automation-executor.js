"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const redis = new ioredis_1.Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');
const worker = new bullmq_1.Worker('automation-executor', async (job) => {
    console.log('Automation executor job received:', job.data);
    return { status: 'processed' };
}, { connection: redis });
worker.on('completed', job => {
    console.log(`Automation executor job ${job.id} completed`);
});
worker.on('failed', (job, err) => {
    console.error(`Automation executor job ${job?.id} failed:`, err);
});
console.log('Automation executor worker started');
process.on('SIGTERM', async () => {
    console.log('Shutting down automation executor worker...');
    await worker.close();
    await redis.disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('Shutting down automation executor worker...');
    await worker.close();
    await redis.disconnect();
    process.exit(0);
});
//# sourceMappingURL=automation-executor.js.map