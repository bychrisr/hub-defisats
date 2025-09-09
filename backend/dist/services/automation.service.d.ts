import { PrismaClient, Automation, AutomationType } from '@prisma/client';
export interface CreateAutomationData {
    userId: string;
    type: AutomationType;
    config: any;
}
export interface UpdateAutomationData {
    automationId: string;
    userId: string;
    updates: {
        config?: any;
        is_active?: boolean;
    };
}
export interface GetAutomationData {
    automationId: string;
    userId: string;
}
export interface GetUserAutomationsData {
    userId: string;
    type?: AutomationType;
    isActive?: boolean;
}
export interface ToggleAutomationData {
    automationId: string;
    userId: string;
}
export declare class AutomationService {
    private prisma;
    constructor(prisma: PrismaClient);
    private validateAutomationConfig;
    createAutomation(data: CreateAutomationData): Promise<Automation>;
    getUserAutomations(data: GetUserAutomationsData): Promise<Automation[]>;
    getAutomation(data: GetAutomationData): Promise<Automation | null>;
    updateAutomation(data: UpdateAutomationData): Promise<Automation | null>;
    deleteAutomation(data: GetAutomationData): Promise<boolean>;
    toggleAutomation(data: ToggleAutomationData): Promise<Automation | null>;
    getAutomationStats(userId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        byType: Record<AutomationType, number>;
        recentActivity: any[];
    }>;
    getActiveAutomations(userId: string): Promise<Automation[]>;
    getAllActiveAutomations(): Promise<Automation[]>;
    validateConfig(type: AutomationType, config: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
}
//# sourceMappingURL=automation.service.d.ts.map