export declare class MonitoringService {
    private static instance;
    private isInitialized;
    private constructor();
    static getInstance(): MonitoringService;
    initialize(): void;
    captureError(error: Error, context?: Record<string, any>): void;
    captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: Record<string, any>): void;
    captureTransaction<T>(name: string, operation: () => T): T;
    addBreadcrumb(message: string, category: string, level?: 'info' | 'warning' | 'error', data?: Record<string, any>): void;
    setUser(user: {
        id: string;
        email?: string;
        username?: string;
    }): void;
    clearUser(): void;
    setTag(key: string, value: string): void;
    setContext(key: string, context: Record<string, any>): void;
    captureMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): void;
    close(): Promise<void>;
}
export declare const monitoring: MonitoringService;
//# sourceMappingURL=monitoring.service.d.ts.map