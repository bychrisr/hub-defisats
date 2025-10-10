import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIv2 } from './lnmarkets/LNMarketsAPIv2.service';
import { TradingValidationService } from './trading-validation.service';

const prisma = new PrismaClient();

export interface OrderConfirmation {
  id: string;
  userId: string;
  orderType: 'trade' | 'update_tp' | 'update_sl' | 'close_position';
  status: 'pending' | 'confirmed' | 'rejected' | 'expired' | 'cancelled';
  tradeParams?: any;
  tradeId?: string;
  updateValue?: number;
  confirmationToken?: string;
  expiresAt: Date;
  createdAt: Date;
  confirmedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface ConfirmationRequest {
  userId: string;
  orderType: 'trade' | 'update_tp' | 'update_sl' | 'close_position';
  tradeParams?: any;
  tradeId?: string;
  updateValue?: number;
  expiresInMinutes?: number;
}

export class TradingConfirmationService {
  private lnMarketsService: LNMarketsService;
  private validationService: TradingValidationService;

  constructor(lnMarketsService: LNMarketsService, validationService: TradingValidationService) {
    this.lnMarketsService = lnMarketsService;
    this.validationService = validationService;
  }

  /**
   * Create a pending order confirmation
   */
  async createConfirmation(request: ConfirmationRequest): Promise<OrderConfirmation> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (request.expiresInMinutes || 5));

    const confirmationToken = this.generateConfirmationToken();

    // Validate the trade before creating confirmation
    if (request.orderType === 'trade' && request.tradeParams) {
      const validation = await this.validationService.validateTrade(request.tradeParams);
      if (!validation.isValid) {
        throw new Error(`Trade validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Store confirmation in database
    const confirmation = await prisma.orderConfirmation.create({
      data: {
        id: this.generateOrderId(),
        userId: request.userId,
        orderType: request.orderType,
        status: 'pending',
        tradeParams: request.tradeParams ? JSON.stringify(request.tradeParams) : null,
        tradeId: request.tradeId,
        updateValue: request.updateValue,
        confirmationToken,
        expiresAt,
        createdAt: new Date(),
      },
    });

    return {
      id: confirmation.id,
      userId: confirmation.userId,
      orderType: confirmation.orderType as any,
      status: confirmation.status as any,
      tradeParams: confirmation.tradeParams ? JSON.parse(confirmation.tradeParams) : undefined,
      tradeId: confirmation.tradeId,
      updateValue: confirmation.updateValue ? Number(confirmation.updateValue) : undefined,
      confirmationToken: confirmation.confirmationToken,
      expiresAt: confirmation.expiresAt,
      createdAt: confirmation.createdAt,
    };
  }

  /**
   * Confirm a pending order
   */
  async confirmOrder(orderId: string, confirmationToken?: string): Promise<OrderConfirmation> {
    const confirmation = await prisma.orderConfirmation.findUnique({
      where: { id: orderId },
    });

    if (!confirmation) {
      throw new Error('Order confirmation not found');
    }

    if (confirmation.status !== 'pending') {
      throw new Error(`Order is already ${confirmation.status}`);
    }

    if (confirmation.expiresAt < new Date()) {
      await this.expireOrder(orderId);
      throw new Error('Order confirmation has expired');
    }

    if (confirmationToken && confirmation.confirmationToken !== confirmationToken) {
      throw new Error('Invalid confirmation token');
    }

    try {
      let result: any;

      // Execute the order based on type
      switch (confirmation.orderType) {
        case 'trade':
          if (!confirmation.tradeParams) {
            throw new Error('Trade parameters not found');
          }
          result = await this.lnMarketsService.createTrade(JSON.parse(confirmation.tradeParams));
          break;

        case 'update_tp':
          if (!confirmation.tradeId || !confirmation.updateValue) {
            throw new Error('Trade ID and update value required');
          }
          result = await this.lnMarketsService.updateTakeProfit(confirmation.tradeId, Number(confirmation.updateValue));
          break;

        case 'update_sl':
          if (!confirmation.tradeId || !confirmation.updateValue) {
            throw new Error('Trade ID and update value required');
          }
          result = await this.lnMarketsService.updateStopLoss(confirmation.tradeId, Number(confirmation.updateValue));
          break;

        case 'close_position':
          if (!confirmation.tradeId) {
            throw new Error('Trade ID required');
          }
          result = await this.lnMarketsService.closePosition(confirmation.tradeId);
          break;

        default:
          throw new Error('Invalid order type');
      }

      // Update confirmation status
      const updatedConfirmation = await prisma.orderConfirmation.update({
        where: { id: orderId },
        data: {
          status: 'confirmed',
          confirmedAt: new Date(),
        },
      });

      return {
        id: updatedConfirmation.id,
        userId: updatedConfirmation.userId,
        orderType: updatedConfirmation.orderType as any,
        status: updatedConfirmation.status as any,
        tradeParams: updatedConfirmation.tradeParams ? JSON.parse(updatedConfirmation.tradeParams) : undefined,
        tradeId: updatedConfirmation.tradeId,
        updateValue: updatedConfirmation.updateValue ? Number(updatedConfirmation.updateValue) : undefined,
        confirmationToken: updatedConfirmation.confirmationToken,
        expiresAt: updatedConfirmation.expiresAt,
        createdAt: updatedConfirmation.createdAt,
        confirmedAt: updatedConfirmation.confirmedAt,
      };
    } catch (error: any) {
      // Update confirmation status to rejected
      await prisma.orderConfirmation.update({
        where: { id: orderId },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Cancel a pending order
   */
  async cancelOrder(orderId: string): Promise<OrderConfirmation> {
    const confirmation = await prisma.orderConfirmation.findUnique({
      where: { id: orderId },
    });

    if (!confirmation) {
      throw new Error('Order confirmation not found');
    }

    if (confirmation.status !== 'pending') {
      throw new Error(`Order is already ${confirmation.status}`);
    }

    const updatedConfirmation = await prisma.orderConfirmation.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        rejectedAt: new Date(),
        rejectionReason: 'Cancelled by user',
      },
    });

    return {
      id: updatedConfirmation.id,
      userId: updatedConfirmation.userId,
      orderType: updatedConfirmation.orderType as any,
      status: updatedConfirmation.status as any,
      tradeParams: updatedConfirmation.tradeParams ? JSON.parse(updatedConfirmation.tradeParams) : undefined,
      tradeId: updatedConfirmation.tradeId,
      updateValue: updatedConfirmation.updateValue ? Number(updatedConfirmation.updateValue) : undefined,
      confirmationToken: updatedConfirmation.confirmationToken,
      expiresAt: updatedConfirmation.expiresAt,
      createdAt: updatedConfirmation.createdAt,
      rejectedAt: updatedConfirmation.rejectedAt,
      rejectionReason: updatedConfirmation.rejectionReason,
    };
  }

  /**
   * Get order confirmation status
   */
  async getOrderStatus(orderId: string): Promise<OrderConfirmation> {
    const confirmation = await prisma.orderConfirmation.findUnique({
      where: { id: orderId },
    });

    if (!confirmation) {
      throw new Error('Order confirmation not found');
    }

    return {
      id: confirmation.id,
      userId: confirmation.userId,
      orderType: confirmation.orderType as any,
      status: confirmation.status as any,
      tradeParams: confirmation.tradeParams ? JSON.parse(confirmation.tradeParams) : undefined,
      tradeId: confirmation.tradeId,
      updateValue: confirmation.updateValue ? Number(confirmation.updateValue) : undefined,
      confirmationToken: confirmation.confirmationToken,
      expiresAt: confirmation.expiresAt,
      createdAt: confirmation.createdAt,
      confirmedAt: confirmation.confirmedAt,
      rejectedAt: confirmation.rejectedAt,
      rejectionReason: confirmation.rejectionReason,
    };
  }

  /**
   * Auto-cancel expired orders
   */
  async autoCancelExpiredOrders(): Promise<number> {
    const expiredOrders = await prisma.orderConfirmation.findMany({
      where: {
        status: 'pending',
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    let cancelledCount = 0;
    for (const order of expiredOrders) {
      await prisma.orderConfirmation.update({
        where: { id: order.id },
        data: {
          status: 'expired',
          rejectedAt: new Date(),
          rejectionReason: 'Order expired',
        },
      });
      cancelledCount++;
    }

    return cancelledCount;
  }

  /**
   * Get user's pending confirmations
   */
  async getUserPendingConfirmations(userId: string): Promise<OrderConfirmation[]> {
    const confirmations = await prisma.orderConfirmation.findMany({
      where: {
        userId,
        status: 'pending',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return confirmations.map(confirmation => ({
      id: confirmation.id,
      userId: confirmation.userId,
      orderType: confirmation.orderType as any,
      status: confirmation.status as any,
      tradeParams: confirmation.tradeParams ? JSON.parse(confirmation.tradeParams) : undefined,
      tradeId: confirmation.tradeId,
      updateValue: confirmation.updateValue ? Number(confirmation.updateValue) : undefined,
      confirmationToken: confirmation.confirmationToken,
      expiresAt: confirmation.expiresAt,
      createdAt: confirmation.createdAt,
    }));
  }

  /**
   * Bulk confirm orders
   */
  async confirmBulkOrders(orderIds: string[]): Promise<{
    confirmedOrders: string[];
    failedOrders: Array<{ id: string; error: string }>;
    totalConfirmed: number;
    totalFailed: number;
  }> {
    const confirmedOrders: string[] = [];
    const failedOrders: Array<{ id: string; error: string }> = [];

    for (const orderId of orderIds) {
      try {
        await this.confirmOrder(orderId);
        confirmedOrders.push(orderId);
      } catch (error: any) {
        failedOrders.push({
          id: orderId,
          error: error.message,
        });
      }
    }

    return {
      confirmedOrders,
      failedOrders,
      totalConfirmed: confirmedOrders.length,
      totalFailed: failedOrders.length,
    };
  }

  /**
   * Bulk cancel orders
   */
  async cancelBulkOrders(orderIds: string[]): Promise<{
    cancelledOrders: string[];
    failedCancellations: Array<{ id: string; error: string }>;
    totalCancelled: number;
    totalFailed: number;
  }> {
    const cancelledOrders: string[] = [];
    const failedCancellations: Array<{ id: string; error: string }> = [];

    for (const orderId of orderIds) {
      try {
        await this.cancelOrder(orderId);
        cancelledOrders.push(orderId);
      } catch (error: any) {
        failedCancellations.push({
          id: orderId,
          error: error.message,
        });
      }
    }

    return {
      cancelledOrders,
      failedCancellations,
      totalCancelled: cancelledOrders.length,
      totalFailed: failedCancellations.length,
    };
  }

  /**
   * Confirm order with retry logic
   */
  async confirmOrderWithRetry(orderId: string, maxRetries: number = 3): Promise<OrderConfirmation> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.confirmOrder(orderId);
      } catch (error: any) {
        lastError = error;
        
        // Don't retry for certain types of errors
        if (error.message.includes('not found') || 
            error.message.includes('already') ||
            error.message.includes('expired') ||
            error.message.includes('Invalid')) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Private helper methods
   */
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConfirmationToken(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  private async expireOrder(orderId: string): Promise<void> {
    await prisma.orderConfirmation.update({
      where: { id: orderId },
      data: {
        status: 'expired',
        rejectedAt: new Date(),
        rejectionReason: 'Order expired',
      },
    });
  }
}
