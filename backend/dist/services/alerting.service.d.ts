export interface AlertRule {
    id: string;
    name: string;
    condition: () => Promise<boolean>;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    cooldown: number;
    lastTriggered?: Date;
}
export interface Alert {
    id: string;
    ruleId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
}
export declare class AlertingService {
    private static instance;
    private alerts;
    private rules;
    private isInitialized;
    private checkInterval;
    private constructor();
    static getInstance(): AlertingService;
    private initializeRules;
    initialize(): void;
    private checkAlerts;
    private createAlert;
    private sendAlertNotification;
    resolveAlert(alertId: string): void;
    getActiveAlerts(): Alert[];
    getAllAlerts(): Alert[];
    getAlertsBySeverity(severity: string): Alert[];
    cleanupOldAlerts(maxAge?: number): void;
    close(): void;
}
export declare const alerting: AlertingService;
//# sourceMappingURL=alerting.service.d.ts.map