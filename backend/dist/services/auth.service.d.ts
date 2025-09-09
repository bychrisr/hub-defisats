import { PrismaClient, User, SocialProvider } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { RegisterRequest, LoginRequest, AuthResponse, RefreshTokenResponse } from '@/types/api-contracts';
export declare class AuthService {
    private prisma;
    private fastify;
    private optimizedQueries;
    constructor(prisma: PrismaClient, fastify: FastifyInstance);
    register(data: RegisterRequest): Promise<AuthResponse>;
    login(data: LoginRequest): Promise<AuthResponse>;
    checkUsernameAvailability(username: string): Promise<{
        available: boolean;
    }>;
    refreshToken(refreshToken: string): Promise<RefreshTokenResponse>;
    logout(userId: string): Promise<void>;
    validateSession(token: string): Promise<User>;
    socialLogin(provider: SocialProvider, socialId: string, email: string, _name?: string): Promise<AuthResponse>;
    private generateAccessToken;
    private generateRefreshToken;
    private storeRefreshToken;
    private validateCoupon;
    private updateCouponUsage;
    private encryptData;
    decryptData(encryptedData: string): string;
}
//# sourceMappingURL=auth.service.d.ts.map