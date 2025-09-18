import { Logger } from 'winston';
import { SecurityEvent } from './security-logger.service';

export interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  patterns: {
    eventType?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    timeWindow?: number; // minutes
    threshold?: number; // number of occurrences
  };
  enabled: boolean;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  confidence: number;
  pattern: AnomalyPattern;
  details: {
    detectedAt: string;
    occurrences: number;
    timeWindow: number;
    riskScore: number;
  };
}

export class AnomalyDetectionService {
  private logger: Logger;
  private patterns: Map<string, AnomalyPattern> = new Map();
  private eventHistory: Map<string, SecurityEvent[]> = new Map();
  private anomalyHistory: AnomalyDetectionResult[] = [];

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default anomaly patterns
   */
  private initializeDefaultPatterns(): void {
    const defaultPatterns: AnomalyPattern[] = [
      {
        id: 'multiple_failed_logins',
        name: 'Multiple Failed Login Attempts',
        description: 'Multiple failed login attempts from the same IP',
        severity: 'high',
        patterns: {
          eventType: 'login',
          timeWindow: 15,
          threshold: 5
        },
        enabled: true
      },
      {
        id: 'rapid_api_calls',
        name: 'Rapid API Calls',
        description: 'Unusually high number of API calls from single source',
        severity: 'medium',
        patterns: {
          eventType: 'api_access',
          timeWindow: 5,
          threshold: 100
        },
        enabled: true
      },
      {
        id: 'suspicious_user_agent',
        name: 'Suspicious User Agent',
        description: 'Requests from known bot or scraper user agents',
        severity: 'medium',
        patterns: {
          userAgent: 'bot|crawler|spider|scraper|curl|wget'
        },
        enabled: true
      }
    ];

    defaultPatterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });

    this.logger.info('Anomaly detection patterns initialized', {
      patternCount: this.patterns.size
    });
  }

  /**
   * Analyze security event for anomalies
   */
  analyzeEvent(event: SecurityEvent): AnomalyDetectionResult[] {
    const results: AnomalyDetectionResult[] = [];

    // Add event to history
    this.addEventToHistory(event);

    // Check against all enabled patterns
    for (const pattern of this.patterns.values()) {
      if (!pattern.enabled) continue;

      const result = this.checkPattern(event, pattern);
      if (result.isAnomaly) {
        results.push(result);
        this.anomalyHistory.push(result);
      }
    }

    return results;
  }

  /**
   * Check event against specific pattern
   */
  private checkPattern(event: SecurityEvent, pattern: AnomalyPattern): AnomalyDetectionResult {
    const result: AnomalyDetectionResult = {
      isAnomaly: false,
      confidence: 0,
      pattern,
      details: {
        detectedAt: new Date().toISOString(),
        occurrences: 0,
        timeWindow: pattern.patterns.timeWindow || 0,
        riskScore: 0
      }
    };

    try {
      // Check event type match
      if (pattern.patterns.eventType && event.eventType !== pattern.patterns.eventType) {
        return result;
      }

      // Check user agent pattern
      if (pattern.patterns.userAgent && event.userAgent) {
        const regex = new RegExp(pattern.patterns.userAgent, 'i');
        if (!regex.test(event.userAgent)) {
          return result;
        }
        result.confidence += 0.3;
      }

      // Check endpoint pattern
      if (pattern.patterns.endpoint && event.endpoint) {
        const regex = new RegExp(pattern.patterns.endpoint, 'i');
        if (!regex.test(event.endpoint)) {
          return result;
        }
        result.confidence += 0.2;
      }

      // Check time-based patterns
      if (pattern.patterns.timeWindow && pattern.patterns.threshold) {
        const occurrences = this.countOccurrencesInTimeWindow(
          event,
          pattern.patterns.timeWindow
        );

        result.details.occurrences = occurrences;
        result.details.timeWindow = pattern.patterns.timeWindow;

        if (occurrences >= pattern.patterns.threshold) {
          result.isAnomaly = true;
          result.confidence += 0.5;
        }
      } else {
        // For non-time-based patterns, check if pattern matches
        result.isAnomaly = true;
        result.confidence += 0.8;
      }

      // Calculate risk score
      result.details.riskScore = this.calculateRiskScore(event, pattern, result);

    } catch (error) {
      this.logger.error('Error checking anomaly pattern', {
        patternId: pattern.id,
        error: (error as Error).message
      });
    }

    return result;
  }

  /**
   * Count occurrences in time window
   */
  private countOccurrencesInTimeWindow(
    event: SecurityEvent,
    timeWindowMinutes: number
  ): number {
    const timeWindowMs = timeWindowMinutes * 60 * 1000;
    const cutoffTime = new Date(event.timestamp).getTime() - timeWindowMs;
    
    const key = this.getEventKey(event);
    const events = this.eventHistory.get(key) || [];
    
    return events.filter(e => 
      new Date(e.timestamp).getTime() >= cutoffTime
    ).length;
  }

  /**
   * Get event key for grouping
   */
  private getEventKey(event: SecurityEvent): string {
    return event.ipAddress;
  }

  /**
   * Add event to history
   */
  private addEventToHistory(event: SecurityEvent): void {
    const key = this.getEventKey(event);
    const events = this.eventHistory.get(key) || [];
    
    events.push(event);
    
    // Keep only last 1000 events per key
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
    
    this.eventHistory.set(key, events);
  }

  /**
   * Calculate risk score for anomaly
   */
  private calculateRiskScore(
    event: SecurityEvent,
    pattern: AnomalyPattern,
    result: AnomalyDetectionResult
  ): number {
    let riskScore = event.riskScore;

    // Increase risk based on pattern severity
    const severityMultipliers = {
      low: 1.2,
      medium: 1.5,
      high: 2.0,
      critical: 3.0
    };

    riskScore *= severityMultipliers[pattern.severity];

    // Increase risk based on confidence
    riskScore *= (1 + result.confidence);

    // Increase risk based on frequency
    if (result.details.occurrences > 0) {
      const frequencyMultiplier = Math.min(1 + (result.details.occurrences / 10), 3);
      riskScore *= frequencyMultiplier;
    }

    return Math.min(riskScore, 1.0);
  }

  /**
   * Get all patterns
   */
  getPatterns(): AnomalyPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get anomaly history
   */
  getAnomalyHistory(limit: number = 100): AnomalyDetectionResult[] {
    return this.anomalyHistory
      .sort((a, b) => new Date(b.details.detectedAt).getTime() - new Date(a.details.detectedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get anomaly statistics
   */
  getAnomalyStats(): {
    totalAnomalies: number;
    anomaliesBySeverity: Record<string, number>;
    anomaliesByPattern: Record<string, number>;
    recentAnomalies: number;
  } {
    const anomalies = this.anomalyHistory;
    const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    const anomaliesBySeverity: Record<string, number> = {};
    const anomaliesByPattern: Record<string, number> = {};
    let recentAnomalies = 0;

    anomalies.forEach(anomaly => {
      // Count by severity
      const severity = anomaly.pattern.severity;
      anomaliesBySeverity[severity] = (anomaliesBySeverity[severity] || 0) + 1;

      // Count by pattern
      const patternId = anomaly.pattern.id;
      anomaliesByPattern[patternId] = (anomaliesByPattern[patternId] || 0) + 1;

      // Count recent anomalies
      if (new Date(anomaly.details.detectedAt) > recentCutoff) {
        recentAnomalies++;
      }
    });

    return {
      totalAnomalies: anomalies.length,
      anomaliesBySeverity,
      anomaliesByPattern,
      recentAnomalies
    };
  }
}