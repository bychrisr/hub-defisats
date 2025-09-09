import { FastifyReply } from 'fastify';
export declare class CookieUtils {
    static setRefreshTokenCookie(reply: FastifyReply, token: string): void;
    static clearRefreshTokenCookie(reply: FastifyReply): void;
    static setSessionCookie(reply: FastifyReply, sessionId: string): void;
    static clearSessionCookie(reply: FastifyReply): void;
    static setCSRFTokenCookie(reply: FastifyReply, token: string): void;
    static clearCSRFTokenCookie(reply: FastifyReply): void;
}
//# sourceMappingURL=cookie.utils.d.ts.map