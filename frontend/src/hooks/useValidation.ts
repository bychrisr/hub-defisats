import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface ValidationResult {
  valid: boolean;
  suggestions?: string[];
  available?: boolean;
  format?: boolean;
  strength?: {
    score: number;
    level: string;
    isValid: boolean;
    feedback: string[];
  };
  requirements?: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
  isCommon?: boolean;
}

interface UseValidationReturn {
  validateEmail: (email: string) => Promise<ValidationResult>;
  validateUsername: (username: string) => Promise<ValidationResult>;
  validatePassword: (password: string) => Promise<ValidationResult>;
  validatePasswordStrength: (password: string) => Promise<ValidationResult>;
  validateApiKeys: (apiKey: string, apiSecret: string, passphrase: string) => Promise<ValidationResult>;
  validateRegisterForm: (formData: any) => Promise<ValidationResult>;
  isValidating: boolean;
}

export const useValidation = (): UseValidationReturn => {
  const [isValidating, setIsValidating] = useState(false);

  const validateEmail = useCallback(async (email: string): Promise<ValidationResult> => {
    if (!email) {
      return { valid: false, suggestions: ['Email is required'] };
    }

    setIsValidating(true);
    try {
      const response = await api.post('/api/validation/email', { email });
      return response.data;
    } catch (error) {
      console.error('Email validation error:', error);
      return { 
        valid: false, 
        suggestions: ['Failed to validate email. Please try again.'] 
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateUsername = useCallback(async (username: string): Promise<ValidationResult> => {
    if (!username) {
      return { valid: false, suggestions: ['Username is required'] };
    }

    setIsValidating(true);
    try {
      const response = await api.post('/api/validation/username', { username });
      return response.data;
    } catch (error) {
      console.error('Username validation error:', error);
      return { 
        valid: false, 
        suggestions: ['Failed to validate username. Please try again.'] 
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validatePassword = useCallback(async (password: string): Promise<ValidationResult> => {
    if (!password) {
      return { valid: false, suggestions: ['Password is required'] };
    }

    setIsValidating(true);
    try {
      const response = await api.post('/api/validation/password', { password });
      return response.data;
    } catch (error) {
      console.error('Password validation error:', error);
      return { 
        valid: false, 
        suggestions: ['Failed to validate password. Please try again.'] 
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validatePasswordStrength = useCallback(async (password: string): Promise<ValidationResult> => {
    if (!password) {
      return { valid: false, suggestions: ['Password is required'] };
    }

    setIsValidating(true);
    try {
      const response = await api.post('/api/validation/password-strength', { password });
      return response.data;
    } catch (error) {
      console.error('Password strength validation error:', error);
      return { 
        valid: false, 
        suggestions: ['Failed to validate password strength. Please try again.'] 
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateApiKeys = useCallback(async (
    apiKey: string, 
    apiSecret: string, 
    passphrase: string
  ): Promise<ValidationResult> => {
    if (!apiKey || !apiSecret || !passphrase) {
      return { valid: false, suggestions: ['All API credentials are required'] };
    }

    setIsValidating(true);
    try {
      const response = await api.post('/api/validation/api-keys', {
        api_key: apiKey,
        api_secret: apiSecret,
        passphrase: passphrase
      });
      return response.data;
    } catch (error) {
      console.error('API keys validation error:', error);
      return { 
        valid: false, 
        suggestions: ['Failed to validate API keys. Please try again.'] 
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateRegisterForm = useCallback(async (formData: any): Promise<ValidationResult> => {
    setIsValidating(true);
    try {
      const response = await api.post('/api/validation/register-form', formData);
      return response.data;
    } catch (error) {
      console.error('Register form validation error:', error);
      return { 
        valid: false, 
        suggestions: ['Failed to validate form. Please try again.'] 
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validateEmail,
    validateUsername,
    validatePassword,
    validatePasswordStrength,
    validateApiKeys,
    validateRegisterForm,
    isValidating
  };
};
