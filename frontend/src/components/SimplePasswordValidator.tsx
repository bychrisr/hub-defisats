import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useValidation } from '@/hooks/useValidation';

interface SimplePasswordValidatorProps {
  password: string;
  className?: string;
}

export default function SimplePasswordValidator({
  password,
  className = ''
}: SimplePasswordValidatorProps) {
  const { validatePassword, isValidating } = useValidation();
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    if (!password || password.length < 3) {
      setValidationResult(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const result = await validatePassword(password);
        setValidationResult(result);
      } catch (error) {
        console.error('Password validation error:', error);
        setValidationResult(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [password, validatePassword]);

  if (!password || password.length < 3) {
    return null;
  }

  const getIcon = (isValid: boolean) => {
    return isValid ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> :
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (score: number) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[Math.min(score - 1, 4)] || 'Very Weak';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Loading State */}
      {isValidating && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Validating password...</span>
        </div>
      )}

      {/* Password Strength */}
      {validationResult?.strength && (
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

      {/* Requirements */}
      {validationResult?.requirements && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Requirements
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              {getIcon(validationResult.requirements.length)}
              <span>At least 8 characters</span>
            </div>
            <div className="flex items-center space-x-2">
              {getIcon(validationResult.requirements.lowercase)}
              <span>One lowercase letter</span>
            </div>
            <div className="flex items-center space-x-2">
              {getIcon(validationResult.requirements.uppercase)}
              <span>One uppercase letter</span>
            </div>
            <div className="flex items-center space-x-2">
              {getIcon(validationResult.requirements.number)}
              <span>One number</span>
            </div>
            <div className="flex items-center space-x-2">
              {getIcon(validationResult.requirements.special)}
              <span>One special character</span>
            </div>
          </div>
        </div>
      )}

      {/* Common Password Warning */}
      {validationResult?.isCommon && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">
              This password is too common. Please choose a more unique password.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
