"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaptchaService = void 0;
const axios_1 = __importDefault(require("axios"));
class CaptchaService {
    recaptchaSecretKey;
    recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
    constructor() {
        this.recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY || '';
    }
    async verifyRecaptcha(token, remoteip) {
        if (!this.recaptchaSecretKey) {
            console.warn('RECAPTCHA_SECRET_KEY not configured, skipping verification');
            return { success: true };
        }
        try {
            const response = await axios_1.default.post(this.recaptchaUrl, null, {
                params: {
                    secret: this.recaptchaSecretKey,
                    response: token,
                    remoteip,
                },
                timeout: 10000,
            });
            const { success, score, 'error-codes': errorCodes } = response.data;
            if (!success) {
                return {
                    success: false,
                    error: errorCodes?.join(', ') || 'reCAPTCHA verification failed',
                };
            }
            if (score !== undefined && score < 0.5) {
                return {
                    success: false,
                    score,
                    error: 'reCAPTCHA score too low',
                };
            }
            return {
                success: true,
                score,
            };
        }
        catch (error) {
            console.error('reCAPTCHA verification error:', error);
            return {
                success: false,
                error: 'reCAPTCHA service unavailable',
            };
        }
    }
    async verifyHcaptcha(token, remoteip) {
        const hcaptchaSecretKey = process.env.HCAPTCHA_SECRET_KEY;
        if (!hcaptchaSecretKey) {
            console.warn('HCAPTCHA_SECRET_KEY not configured, skipping verification');
            return { success: true };
        }
        try {
            const response = await axios_1.default.post('https://hcaptcha.com/siteverify', null, {
                params: {
                    secret: hcaptchaSecretKey,
                    response: token,
                    remoteip,
                },
                timeout: 10000,
            });
            const { success, 'error-codes': errorCodes } = response.data;
            if (!success) {
                return {
                    success: false,
                    error: errorCodes?.join(', ') || 'hCaptcha verification failed',
                };
            }
            return { success: true };
        }
        catch (error) {
            console.error('hCaptcha verification error:', error);
            return {
                success: false,
                error: 'hCaptcha service unavailable',
            };
        }
    }
}
exports.CaptchaService = CaptchaService;
//# sourceMappingURL=captcha.service.js.map