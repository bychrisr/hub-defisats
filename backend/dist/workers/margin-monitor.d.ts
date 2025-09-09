interface MarginGuardConfig {
    userId: string;
    enabled: boolean;
    threshold: number;
    autoClose: boolean;
    notificationEnabled: boolean;
}
export declare function addUserCredentials(userId: string, apiKey: string, apiSecret: string, passphrase: string): Promise<void>;
export declare function removeUserCredentials(userId: string): void;
export declare function simulateMarginMonitoring(userId: string, _config: MarginGuardConfig): Promise<void>;
export declare function startPeriodicMonitoring(): void;
export declare function stopPeriodicMonitoring(): void;
export {};
//# sourceMappingURL=margin-monitor.d.ts.map