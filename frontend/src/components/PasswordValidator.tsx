import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useValidation } from '@/hooks/useValidation';

interface PasswordValidatorProps {
  password: string;
  onValidationChange?: (isValid: boolean, suggestions: string[]) => void;
  showStrength?: boolean;
  className?: string;
}

export default function PasswordValidator({
  password,
  onValidationChange,
  showStrength = true,
  className = ''
}: PasswordValidatorProps) {
  const { validatePassword, isValidating } = useValidation();
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValid, setIsValid] = useState(false);

  const validatePasswordRealTime = useCallback(async (pwd: string) => {
    if (!pwd || pwd.length < 3) {
      setValidationResult(null);
      setIsValid(false);
      onValidationChange?.(false, []);
      return;
    }

    try {
      const result = await validatePassword(pwd);
      setValidationResult(result);
      setIsValid(result.valid);
      onValidationChange?.(result.valid, result.suggestions || []);
    } catch (error) {
      console.error('Password validation error:', error);
      setValidationResult(null);
      setIsValid(false);
      onValidationChange?.(false, ['Failed to validate password']);
    }
  }, [validatePassword, onValidationChange]);

  // Debounced validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validatePasswordRealTime(password);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [password, validatePasswordRealTime]);

  if (!password || password.length < 3) {
    return null;
  }

  const getRequirementIcon = (isValid: boolean) => {
    if (isValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Password Strength Indicator */}
      {showStrength && validationResult?.strength && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password Strength
            </span>
            <span className={`text-sm font-medium ${
              validationResult.strength.score <= 2 ? 'text-red-600' :
              validationResult.strength.score <= 3 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {getStrengthLabel(validationResult.strength.score)}
            </span>
          </div>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`h-2 w-full rounded ${
                  level <= validationResult.strength.score
                    ? getStrengthColor(validationResult.strength.score)
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      {validationResult?.requirements && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password Requirements
          </h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {getRequirementIcon(validationResult.requirements.length)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {getRequirementIcon(validationResult.requirements.lowercase)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                One lowercase letter
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {getRequirementIcon(validationResult.requirements.uppercase)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                One uppercase letter
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {getRequirementIcon(validationResult.requirements.number)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                One number
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {getRequirementIcon(validationResult.requirements.special)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                One special character
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {validationResult?.suggestions && validationResult.suggestions.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Suggestions
          </h4>
          <div className="space-y-1">
            {validationResult.suggestions.map((suggestion: string, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  {suggestion}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isValidating && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Validating password...</span>
        </div>
      )}

      {/* Common Password Warning */}
      {validationResult?.isCommon && (
        <div className="flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">
            This password is too common. Please choose a more unique password.
          </span>
        </div>
      )}
    </div>
  );
}