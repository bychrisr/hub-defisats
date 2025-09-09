"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sanitizer = void 0;
const validator_1 = __importDefault(require("validator"));
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
class Sanitizer {
    static sanitizeString(input) {
        if (typeof input !== 'string') {
            return '';
        }
        let sanitized = input.replace(/\0/g, '');
        sanitized = sanitized.trim();
        sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        sanitized = sanitized.substring(0, 10000);
        return sanitized;
    }
    static sanitizeEmail(email) {
        const sanitized = this.sanitizeString(email);
        return validator_1.default.normalizeEmail(sanitized) || '';
    }
    static sanitizeHtml(html) {
        if (typeof html !== 'string') {
            return '';
        }
        return isomorphic_dompurify_1.default.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
            ALLOWED_ATTR: [],
        });
    }
    static sanitizeJson(input) {
        if (typeof input === 'string') {
            return this.sanitizeString(input);
        }
        if (Array.isArray(input)) {
            return input.map(item => this.sanitizeJson(item));
        }
        if (input && typeof input === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(input)) {
                const sanitizedKey = this.sanitizeString(key);
                sanitized[sanitizedKey] = this.sanitizeJson(value);
            }
            return sanitized;
        }
        return input;
    }
    static sanitizeSql(input) {
        const sanitized = this.sanitizeString(input);
        return sanitized
            .replace(/[';\\*|%+=<>\[\]{}()^$!@#&~`-]/g, '')
            .replace(/(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)/gi, '');
    }
    static escapeHtml(input) {
        if (typeof input !== 'string') {
            return '';
        }
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    static sanitizeUrl(url) {
        const sanitized = this.sanitizeString(url);
        if (!validator_1.default.isURL(sanitized, {
            protocols: ['http', 'https'],
            require_protocol: true,
        })) {
            return '';
        }
        return sanitized;
    }
    static sanitizePhone(phone) {
        const sanitized = this.sanitizeString(phone);
        return validator_1.default.isMobilePhone(sanitized) ? sanitized : '';
    }
    static sanitizeNumber(input) {
        if (typeof input === 'number') {
            return isNaN(input) ? 0 : input;
        }
        const sanitized = this.sanitizeString(input);
        const number = parseFloat(sanitized);
        return isNaN(number) ? 0 : number;
    }
    static sanitizeInteger(input) {
        const number = this.sanitizeNumber(input);
        return Math.floor(number);
    }
}
exports.Sanitizer = Sanitizer;
//# sourceMappingURL=sanitizer.js.map