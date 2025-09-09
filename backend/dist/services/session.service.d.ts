import { PrismaClient, User } from '@prisma/client';
export declare class SessionService {
    private prisma;
    private redis;
    constructor(prisma: PrismaClient);
    createSession(userId: string): Promise<string>;
    validateSession(sessionId: string): Promise<User | null>;
    destroySession(sessionId: string): Promise<void>;
    destroyAllUserSessions(userId: string): Promise<void>;
    getUserActiveSessions(userId: string): Promise<Array<{
        sessionId: string;
        createdAt: string;
        lastActivity: string;
        ipAddress?: string;
        userAgent?: string;
    }>>;
    cleanExpiredSessions(): Promise<void>;
    hasActiveSession(userId: string): Promise<boolean>;
}
//# sourceMappingURL=session.service.d.ts.map