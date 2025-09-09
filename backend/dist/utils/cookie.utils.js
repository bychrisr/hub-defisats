"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieUtils = void 0;
const env_1 = require("@/config/env");
class CookieUtils {
    static setRefreshTokenCookie(reply, token) {
        reply.setCookie('refresh_token', token, {
            httpOnly: true,
            secure: env_1.config.isProduction,
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            domain: env_1.config.isProduction ? '.hubdefisats.com' : undefined,
        });
    }
    static clearRefreshTokenCookie(reply) {
        reply.clearCookie('refresh_token', {
            httpOnly: true,
            secure: env_1.config.isProduction,
            sameSite: 'strict',
            path: '/',
            domain: env_1.config.isProduction ? '.hubdefisats.com' : undefined,
        });
    }
    static setSessionCookie(reply, sessionId) {
        reply.setCookie('session_id', sessionId, {
            httpOnly: true,
            secure: env_1.config.isProduction,
            sameSite: 'strict',
            path: '/',
            maxAge: 30 * 60 * 1000,
            domain: env_1.config.isProduction ? '.hubdefisats.com' : undefined,
        });
    }
    static clearSessionCookie(reply) {
        reply.clearCookie('session_id', {
            httpOnly: true,
            secure: env_1.config.isProduction,
            sameSite: 'strict',
            path: '/',
            domain: env_1.config.isProduction ? '.hubdefisats.com' : undefined,
        });
    }
    static setCSRFTokenCookie(reply, token) {
        reply.setCookie('csrf_token', token, {
            httpOnly: false,
            secure: env_1.config.isProduction,
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 1000,
            domain: env_1.config.isProduction ? '.hubdefisats.com' : undefined,
        });
    }
    static clearCSRFTokenCookie(reply) {
        reply.clearCookie('csrf_token', {
            httpOnly: false,
            secure: env_1.config.isProduction,
            sameSite: 'strict',
            path: '/',
            domain: env_1.config.isProduction ? '.hubdefisats.com' : undefined,
        });
    }
}
exports.CookieUtils = CookieUtils;
//# sourceMappingURL=cookie.utils.js.map