"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_PASSWORDS = exports.PasswordSchema = void 0;
exports.checkPasswordStrength = checkPasswordStrength;
exports.isCommonPassword = isCommonPassword;
const zod_1 = require("zod");
exports.PasswordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)');
function checkPasswordStrength(password) {
    const feedback = [];
    let score = 0;
    if (password.length >= 8) {
        score += 1;
    }
    else {
        feedback.push('At least 8 characters');
    }
    if (/[a-z]/.test(password)) {
        score += 1;
    }
    else {
        feedback.push('At least one lowercase letter');
    }
    if (/[A-Z]/.test(password)) {
        score += 1;
    }
    else {
        feedback.push('At least one uppercase letter');
    }
    if (/\d/.test(password)) {
        score += 1;
    }
    else {
        feedback.push('At least one number');
    }
    if (/[@$!%*?&]/.test(password)) {
        score += 1;
    }
    else {
        feedback.push('At least one special character (@$!%*?&)');
    }
    if (password.length >= 12) {
        score += 1;
    }
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}/.test(password)) {
        score += 1;
    }
    return {
        score,
        feedback,
        isValid: score >= 5,
    };
}
exports.COMMON_PASSWORDS = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
    'password1',
    'qwerty123',
    'dragon',
    'master',
    'hello',
    'freedom',
    'whatever',
    'qazwsx',
    'trustno1',
    '654321',
    'jordan23',
    'harley',
    'password1',
    'shadow',
    'superman',
    'qwertyuiop',
    '123321',
    'dragon',
    '1234567890',
];
function isCommonPassword(password) {
    return exports.COMMON_PASSWORDS.includes(password.toLowerCase());
}
//# sourceMappingURL=password.validator.js.map