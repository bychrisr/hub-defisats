import { z } from 'zod';

// Password validation schema
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/,
    'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?~`)'
  );

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isValid: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one lowercase letter');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one uppercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one number');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?~`)');
  }

  // Additional strength checks
  if (password.length >= 12) {
    score += 1;
  }

  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{12,}/.test(password)) {
    score += 1;
  }

  return {
    score,
    feedback,
    isValid: score >= 5,
  };
}

// Common password checker
export const COMMON_PASSWORDS = [
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

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}
