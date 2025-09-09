"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimitMiddleware = apiRateLimitMiddleware;
exports.automationRateLimitMiddleware = automationRateLimitMiddleware;
exports.tradeRateLimitMiddleware = tradeRateLimitMiddleware;
exports.loginRateLimitMiddleware = loginRateLimitMiddleware;
exports.registrationRateLimitMiddleware = registrationRateLimitMiddleware;
exports.passwordResetRateLimitMiddleware = passwordResetRateLimitMiddleware;
const rate_limit_middleware_1 = require("./rate-limit.middleware");
const rateLimitMiddleware = new rate_limit_middleware_1.RateLimitMiddleware();
async function apiRateLimitMiddleware(request, reply) {
    await rateLimitMiddleware.apiRateLimit(request, reply);
}
async function automationRateLimitMiddleware(request, reply) {
    await rateLimitMiddleware.automationRateLimit(request, reply);
}
async function tradeRateLimitMiddleware(request, reply) {
    await rateLimitMiddleware.tradeRateLimit(request, reply);
}
async function loginRateLimitMiddleware(request, reply) {
    await rateLimitMiddleware.userRateLimit(request, reply, 'login_attempts', 5, 900000);
}
async function registrationRateLimitMiddleware(request, reply) {
    await rateLimitMiddleware.userRateLimit(request, reply, 'registration_attempts', 3, 3600000);
}
async function passwordResetRateLimitMiddleware(request, reply) {
    await rateLimitMiddleware.userRateLimit(request, reply, 'password_reset_attempts', 3, 3600000);
}
//# sourceMappingURL=user-rate-limit.middleware.js.map