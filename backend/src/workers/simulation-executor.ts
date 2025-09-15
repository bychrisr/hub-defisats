import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { SimulationService } from '../services/simulation.service';

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// Create Prisma client
const prisma = new PrismaClient();

// Create simulation service
const simulationService = new SimulationService();

// Create worker
const worker = new Worker(
  'simulation',
  async job => {
    const { simulationId, userId } = job.data;

    console.log(`🎯 Starting simulation ${simulationId} for user ${userId}`);

    try {
      // Get simulation details
      const simulation = await prisma.simulation.findUnique({
        where: { id: simulationId },
      });

      if (!simulation) {
        throw new Error(`Simulation ${simulationId} not found`);
      }

      // Generate price data based on scenario
      const priceData = simulationService.generatePriceData(
        simulation.price_scenario,
        simulation.initial_price,
        simulation.duration
      );

      console.log(`📊 Generated ${priceData.length} price data points for scenario: ${simulation.price_scenario}`);

      // Simulation state
      let accountBalance = 100000; // Starting balance in sats
      let positionSize = 0;
      let entryPrice = 0;
      let totalPnL = 0;
      let totalActions = 0;
      let successfulActions = 0;
      let trailingStopLevel = 0;

      // Execute simulation step by step
      for (let i = 0; i < priceData.length; i++) {
        const pricePoint = priceData[i];
        if (!pricePoint) continue;

        const currentPrice = pricePoint.price;

        // Calculate current P&L if we have a position
        let currentPnL = 0;
        let marginLevel = 1;

        if (positionSize > 0 && entryPrice > 0) {
          currentPnL = (currentPrice - entryPrice) * positionSize;
          const marginUsed = entryPrice * positionSize * 0.1; // 10% maintenance margin
          marginLevel = (accountBalance + currentPnL) / marginUsed;
        }

        // Execute automation logic
        const automationResult = simulationService.executeAutomationLogic(
          simulation.automation_type,
          currentPrice,
          simulation.initial_price,
          accountBalance,
          positionSize,
          currentPnL
        );

        let actionType: string | undefined;
        let actionDetails: any;

        if (automationResult) {
          actionType = automationResult.action;
          actionDetails = automationResult.details;
          totalActions++;

          try {
            // Execute the action
            switch (automationResult.action) {
              case 'close_position':
                if (positionSize > 0) {
                  accountBalance += currentPnL;
                  positionSize = 0;
                  entryPrice = 0;
                  trailingStopLevel = 0;
                  totalPnL += currentPnL;
                  successfulActions++;
                  console.log(`✅ Position closed at ${currentPrice}, P&L: ${currentPnL}`);
                }
                break;

              case 'take_profit':
                if (positionSize > 0) {
                  accountBalance += currentPnL;
                  positionSize = 0;
                  entryPrice = 0;
                  trailingStopLevel = 0;
                  totalPnL += currentPnL;
                  successfulActions++;
                  console.log(`💰 Take profit executed at ${currentPrice}, P&L: ${currentPnL}`);
                }
                break;

              case 'adjust_stop':
                trailingStopLevel = actionDetails.newStopLevel;
                successfulActions++;
                console.log(`🎯 Trailing stop adjusted to ${trailingStopLevel}`);
                break;

              case 'enter_position':
                if (positionSize === 0) {
                  positionSize = 0.001; // 0.1% of account for position size
                  entryPrice = currentPrice;
                  accountBalance -= entryPrice * positionSize * 0.1; // 10% margin
                  successfulActions++;
                  console.log(`📈 Position entered at ${currentPrice}`);
                }
                break;
            }
          } catch (error) {
            console.error(`❌ Failed to execute action ${automationResult.action}:`, error);
          }
        }

        // Save result every 10 iterations (1 second worth of data)
        if (i % 10 === 0 || i === priceData.length - 1) {
          const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;
          const currentPricePoint = priceData[i];

          if (currentPricePoint) {
            await prisma.simulationResult.create({
              data: {
                simulation_id: simulationId,
                timestamp: currentPricePoint.timestamp,
                price: currentPrice,
                action_type: actionType || null,
                action_details: actionDetails || null,
                account_balance: accountBalance,
                position_size: positionSize,
                pnl: currentPnL,
                margin_level: marginLevel,
                success_rate: successRate,
                total_actions: totalActions,
                executed_at: new Date(),
              },
            });
          }
        }

        // Update progress in Redis for real-time tracking
        const progress = ((i + 1) / priceData.length) * 100;
        await redis.set(`simulation:${simulationId}:progress`, progress.toString());
        await redis.set(`simulation:${simulationId}:current_price`, currentPrice.toString());

        // Add small delay to simulate real-time execution
        if (i % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay every 5 iterations
        }
      }

      // Mark simulation as completed
      await prisma.simulation.update({
        where: { id: simulationId },
        data: {
          status: 'completed',
          completed_at: new Date(),
        },
      });

      console.log(`✅ Simulation ${simulationId} completed successfully`);
      console.log(`📊 Final results: Balance: ${accountBalance}, Total P&L: ${totalPnL}, Success Rate: ${(totalActions > 0 ? (successfulActions / totalActions) * 100 : 0).toFixed(2)}%`);

      return {
        status: 'completed',
        simulationId,
        finalBalance: accountBalance,
        totalPnL,
        successRate: totalActions > 0 ? (successfulActions / totalActions) * 100 : 0,
        totalActions,
      };

    } catch (error) {
      console.error(`❌ Simulation ${simulationId} failed:`, error);

      // Mark simulation as failed
      await prisma.simulation.update({
        where: { id: simulationId },
        data: {
          status: 'failed',
        },
      });

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2, // Run up to 2 simulations simultaneously
    limiter: {
      max: 5, // Max 5 jobs per duration
      duration: 1000, // Per second
    },
  }
);

// Event handlers
worker.on('completed', job => {
  console.log(`✅ Simulation job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Simulation job ${job?.id} failed:`, err);
});

worker.on('progress', (job, progress) => {
  console.log(`📈 Simulation job ${job.id} progress: ${progress}%`);
});

console.log('🎮 Simulation executor worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down simulation executor worker...');
  await worker.close();
  await redis.disconnect();
  await simulationService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down simulation executor worker...');
  await worker.close();
  await redis.disconnect();
  await simulationService.close();
  process.exit(0);
});
