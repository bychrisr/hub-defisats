import { describe, it, expect } from '@jest/globals';
import { PasswordSchema, checkPasswordStrength, isCommonPassword } from '../utils/password.validator';

describe('Password Validation Tests', () => {
  describe('PasswordSchema', () => {
    it('should accept password with # character', () => {
      const password = 'Test123#';
      expect(() => PasswordSchema.parse(password)).not.toThrow();
    });

    it('should accept password with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', ':', '"', '\\', '|', ',', '.', '<', '>', '/', '?', '~', '`'];
      
      specialChars.forEach(char => {
        const password = `Test123${char}`;
        expect(() => PasswordSchema.parse(password)).not.toThrow();
      });
    });

    it('should reject password without special characters', () => {
      const password = 'Test123';
      expect(() => PasswordSchema.parse(password)).toThrow();
    });

    it('should reject password that is too short', () => {
      const password = 'Test1#';
      expect(() => PasswordSchema.parse(password)).toThrow();
    });

    it('should reject password without uppercase', () => {
      const password = 'test123#';
      expect(() => PasswordSchema.parse(password)).toThrow();
    });

    it('should reject password without lowercase', () => {
      const password = 'TEST123#';
      expect(() => PasswordSchema.parse(password)).toThrow();
    });

    it('should reject password without numbers', () => {
      const password = 'TestAbc#';
      expect(() => PasswordSchema.parse(password)).toThrow();
    });
  });

  describe('checkPasswordStrength', () => {
    it('should give high score for strong password with #', () => {
      const password = 'MyStrong123#';
      const result = checkPasswordStrength(password);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(5);
      expect(result.feedback).toHaveLength(0);
    });

    it('should provide feedback for weak passwords', () => {
      const password = 'weak';
      const result = checkPasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(5);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should recognize various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', ':', '"', '\\', '|', ',', '.', '<', '>', '/', '?', '~', '`'];
      
      specialChars.forEach(char => {
        const password = `Test123${char}`;
        const result = checkPasswordStrength(password);
        
        expect(result.feedback).not.toContain('At least one special character');
      });
    });
  });

  describe('isCommonPassword', () => {
    it('should identify common passwords', () => {
      expect(isCommonPassword('password')).toBe(true);
      expect(isCommonPassword('123456')).toBe(true);
      expect(isCommonPassword('qwerty')).toBe(true);
    });

    it('should not identify strong passwords as common', () => {
      expect(isCommonPassword('MyStrong123#')).toBe(false);
      expect(isCommonPassword('ComplexP@ssw0rd!')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isCommonPassword('PASSWORD')).toBe(true);
      expect(isCommonPassword('Password')).toBe(true);
    });
  });

  describe('Real-world password examples', () => {
    it('should accept common strong password patterns', () => {
      const strongPasswords = [
        'MyPassword123#',
        'SecureP@ssw0rd!',
        'Complex$tr0ng#',
        'Test123$',
        'Password1!',
        'MyStr0ng#Pass',
        'Secure123$',
        'ComplexP@ss1'
      ];

      strongPasswords.forEach(password => {
        expect(() => PasswordSchema.parse(password)).not.toThrow();
        const strength = checkPasswordStrength(password);
        expect(strength.isValid).toBe(true);
      });
    });

    it('should reject weak password patterns', () => {
      const weakPasswords = [
        'password',      // No numbers, no special chars
        '12345678',      // No letters, no special chars
        'Password',      // No numbers, no special chars
        'Pass123',       // Too short
        'MyPassword',    // No numbers, no special chars
        '1234567890'     // No letters, no special chars
      ];

      weakPasswords.forEach(password => {
        expect(() => PasswordSchema.parse(password)).toThrow();
      });
    });
  });
});
