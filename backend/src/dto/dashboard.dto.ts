import { z } from 'zod';

export const DashboardSchema = z.object({
  totalPL: z.number(),
  totalMargin: z.number(),
  totalFees: z.number(),
  totalTradingFees: z.number(),
  totalFundingCost: z.number(),
  lastUpdate: z.number().int().positive(),
});

export type DashboardDTO = z.infer<typeof DashboardSchema>;
