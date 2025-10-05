// src/types/emaIndicator.ts
export interface EMAPoint {
  time: number;
  value: number;
}

export interface EMAConfig {
  enabled: boolean;
  period: number;
  color: string;
  lineWidth: number;
  height?: number;
}

export interface EMAResult {
  type: 'ema';
  data: EMAPoint[];
  config: EMAConfig;
  timestamp: number;
  valid: boolean;
  stats: {
    dataPoints: number;
    firstValue: number | null;
    lastValue: number | null;
    period: number;
  };
}

export interface EMACalculationOptions {
  period: number;
  smoothingFactor?: number;
}

export interface EMAValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
