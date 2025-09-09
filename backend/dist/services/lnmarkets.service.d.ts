export interface LNMarketsCredentials {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
}
export interface MarginInfo {
    margin: number;
    availableMargin: number;
    marginLevel: number;
    totalValue: number;
    totalUnrealizedPnl: number;
    positions: Position[];
}
export interface Position {
    id: string;
    market: string;
    side: 'b' | 's';
    size: number;
    entryPrice: number;
    liquidationPrice: number;
    unrealizedPnl: number;
}
export declare class LNMarketsService {
    private client;
    private credentials;
    constructor(credentials: LNMarketsCredentials);
    private generateAuthHeaders;
    private tryAlternativeAuth;
    getMarginInfo(): Promise<MarginInfo>;
    getPositions(): Promise<Position[]>;
    getRunningTrades(): Promise<any[]>;
    getBalance(): Promise<any>;
    validateCredentials(): Promise<boolean>;
    testConnectivity(): Promise<{
        success: boolean;
        message: string;
        details?: Record<string, unknown>;
    }>;
    closePosition(positionId: string): Promise<any>;
    reducePosition(market: string, side: 'b' | 's', size: number): Promise<any>;
    getMarketData(market: string): Promise<any>;
    calculateLiquidationRisk(marginInfo: MarginInfo, positions: Position[]): {
        atRisk: boolean;
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        message: string;
    };
}
export declare function createLNMarketsService(credentials: LNMarketsCredentials): LNMarketsService;
export declare function testSandboxCredentials(): Promise<void>;
//# sourceMappingURL=lnmarkets.service.d.ts.map