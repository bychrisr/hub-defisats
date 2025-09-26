/**
 * WebSocket Data Validator
 * 
 * Provides rigorous validation for WebSocket data to prevent
 * corrupted or malicious data from breaking the application
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean;
  sanitize?: (value: any) => any;
}

export class WebSocketDataValidator {
  private rules: Map<string, ValidationRule[]> = new Map();

  constructor() {
    this.setupDefaultRules();
  }

  /**
   * Setup default validation rules for common data types
   */
  private setupDefaultRules(): void {
    // Market data validation rules
    this.addRules('marketData', [
      {
        field: 'symbol',
        type: 'string',
        required: true,
        pattern: /^[A-Z]{2,10}$/,
        sanitize: (value: string) => value.toUpperCase().trim()
      },
      {
        field: 'price',
        type: 'number',
        required: true,
        min: 0,
        max: 1000000,
        custom: (value: number) => !isNaN(value) && isFinite(value)
      },
      {
        field: 'volume',
        type: 'number',
        required: true,
        min: 0,
        max: 1000000000
      },
      {
        field: 'timestamp',
        type: 'number',
        required: true,
        min: 0,
        custom: (value: number) => {
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          return value >= now - oneHour && value <= now + oneHour;
        }
      },
      {
        field: 'open',
        type: 'number',
        min: 0,
        max: 1000000
      },
      {
        field: 'high',
        type: 'number',
        min: 0,
        max: 1000000
      },
      {
        field: 'low',
        type: 'number',
        min: 0,
        max: 1000000
      },
      {
        field: 'close',
        type: 'number',
        min: 0,
        max: 1000000
      }
    ]);

    // Position data validation rules
    this.addRules('positionData', [
      {
        field: 'id',
        type: 'string',
        required: true,
        pattern: /^[a-f0-9-]{36}$/
      },
      {
        field: 'symbol',
        type: 'string',
        required: true,
        pattern: /^[A-Z]{2,10}$/
      },
      {
        field: 'side',
        type: 'string',
        required: true,
        enum: ['long', 'short']
      },
      {
        field: 'size',
        type: 'number',
        required: true,
        min: 0,
        max: 1000000
      },
      {
        field: 'entryPrice',
        type: 'number',
        required: true,
        min: 0,
        max: 1000000
      },
      {
        field: 'markPrice',
        type: 'number',
        required: true,
        min: 0,
        max: 1000000
      },
      {
        field: 'unrealizedPnl',
        type: 'number',
        required: true
      },
      {
        field: 'timestamp',
        type: 'number',
        required: true,
        min: 0
      }
    ]);

    // Margin data validation rules
    this.addRules('marginData', [
      {
        field: 'balance',
        type: 'number',
        required: true,
        min: 0,
        max: 1000000000
      },
      {
        field: 'synthetic_usd_balance',
        type: 'number',
        required: true,
        min: 0,
        max: 1000000000
      },
      {
        field: 'uid',
        type: 'string',
        required: true,
        pattern: /^[a-f0-9-]{36}$/
      },
      {
        field: 'role',
        type: 'string',
        required: true,
        enum: ['user', 'admin']
      },
      {
        field: 'username',
        type: 'string',
        required: true,
        min: 1,
        max: 50,
        pattern: /^[a-zA-Z0-9_-]+$/
      },
      {
        field: 'email',
        type: 'string',
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      {
        field: 'timestamp',
        type: 'number',
        required: true,
        min: 0
      }
    ]);

    // WebSocket message validation rules
    this.addRules('websocketMessage', [
      {
        field: 'type',
        type: 'string',
        required: true,
        enum: ['ping', 'pong', 'subscribe_market', 'subscribe_positions', 'subscribe_margin', 'unsubscribe']
      },
      {
        field: 'symbol',
        type: 'string',
        pattern: /^[A-Z]{2,10}$/,
        sanitize: (value: string) => value?.toUpperCase().trim()
      },
      {
        field: 'userId',
        type: 'string',
        pattern: /^[a-f0-9-]{36}$/
      },
      {
        field: 'timestamp',
        type: 'number',
        min: 0
      }
    ]);
  }

  /**
   * Add validation rules for a data type
   */
  addRules(dataType: string, rules: ValidationRule[]): void {
    this.rules.set(dataType, rules);
  }

  /**
   * Validate data against rules
   */
  validate(data: any, dataType: string): ValidationResult {
    const rules = this.rules.get(dataType);
    
    if (!rules) {
      return {
        isValid: false,
        errors: [`No validation rules found for data type: ${dataType}`],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData: any = {};

    // Validate each field
    for (const rule of rules) {
      const fieldValue = data[rule.field];
      
      // Check if required field is present
      if (rule.required && (fieldValue === undefined || fieldValue === null)) {
        errors.push(`Required field '${rule.field}' is missing`);
        continue;
      }

      // Skip validation if field is not present and not required
      if (!rule.required && (fieldValue === undefined || fieldValue === null)) {
        continue;
      }

      // Type validation
      const typeError = this.validateType(fieldValue, rule.type);
      if (typeError) {
        errors.push(`Field '${rule.field}': ${typeError}`);
        continue;
      }

      // Additional validations
      const validationError = this.validateField(fieldValue, rule);
      if (validationError) {
        errors.push(`Field '${rule.field}': ${validationError}`);
        continue;
      }

      // Sanitize value if sanitizer is provided
      const sanitizedValue = rule.sanitize ? rule.sanitize(fieldValue) : fieldValue;
      sanitizedData[rule.field] = sanitizedValue;

      // Add warning if value was sanitized
      if (rule.sanitize && sanitizedValue !== fieldValue) {
        warnings.push(`Field '${rule.field}' was sanitized`);
      }
    }

    // Check for unknown fields
    const knownFields = rules.map(rule => rule.field);
    const unknownFields = Object.keys(data).filter(key => !knownFields.includes(key));
    
    if (unknownFields.length > 0) {
      warnings.push(`Unknown fields detected: ${unknownFields.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  /**
   * Validate field type
   */
  private validateType(value: any, expectedType: string): string | null {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (actualType !== expectedType) {
      return `Expected ${expectedType}, got ${actualType}`;
    }
    
    return null;
  }

  /**
   * Validate individual field against rule
   */
  private validateField(value: any, rule: ValidationRule): string | null {
    // Min/Max validation for numbers
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `Value ${value} is below minimum ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Value ${value} is above maximum ${rule.max}`;
      }
    }

    // Min/Max validation for strings
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        return `String length ${value.length} is below minimum ${rule.min}`;
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return `String length ${value.length} is above maximum ${rule.max}`;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return `Value '${value}' does not match required pattern`;
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return `Value '${value}' is not in allowed values: ${rule.enum.join(', ')}`;
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      return `Value '${value}' failed custom validation`;
    }

    return null;
  }

  /**
   * Quick validation for common data types
   */
  validateMarketData(data: any): ValidationResult {
    return this.validate(data, 'marketData');
  }

  validatePositionData(data: any): ValidationResult {
    return this.validate(data, 'positionData');
  }

  validateMarginData(data: any): ValidationResult {
    return this.validate(data, 'marginData');
  }

  validateWebSocketMessage(data: any): ValidationResult {
    return this.validate(data, 'websocketMessage');
  }

  /**
   * Get available data types
   */
  getAvailableDataTypes(): string[] {
    return Array.from(this.rules.keys());
  }

  /**
   * Get rules for a data type
   */
  getRules(dataType: string): ValidationRule[] {
    return this.rules.get(dataType) || [];
  }
}

// Export singleton instance
export const websocketDataValidator = new WebSocketDataValidator();
