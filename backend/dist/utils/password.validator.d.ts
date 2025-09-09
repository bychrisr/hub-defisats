import { z } from 'zod';
export declare const PasswordSchema: z.ZodString;
export declare function checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isValid: boolean;
};
export declare const COMMON_PASSWORDS: string[];
export declare function isCommonPassword(password: string): boolean;
//# sourceMappingURL=password.validator.d.ts.map