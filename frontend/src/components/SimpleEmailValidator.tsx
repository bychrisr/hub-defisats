import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface SimpleEmailValidatorProps {
  email: string;
  onValidationChange?: (isValid: boolean, isAvailable: boolean, suggestions: string[]) => void;
  className?: string;
}

export default function SimpleEmailValidator({
  email,
  onValidationChange,
  className = ''
}: SimpleEmailValidatorProps) {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!email || email.length < 5) {
      setValidationResult(null);
      onValidationChange?.(false, false, []);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      try {
        // Validação básica de formato
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const formatValid = emailRegex.test(email);
        
        if (!formatValid) {
          const result = {
            valid: false,
            available: false,
            format: false,
            suggestions: ['Enter a valid email address (e.g., user@example.com)']
          };
          setValidationResult(result);
          onValidationChange?.(false, false, result.suggestions);
          return;
        }

        // Testar se email já existe tentando fazer login
        try {
          console.log(`🔍 SimpleEmailValidator: Checking email ${email}`);
          const response = await api.post('/api/auth/check-email', { email });
          console.log(`📧 SimpleEmailValidator: Response for ${email}:`, response.data);
          
          const result = {
            valid: true,
            available: response.data.available,
            format: true,
            suggestions: response.data.available ? [] : ['This email is already registered']
          };
          
          console.log(`✅ SimpleEmailValidator: Result for ${email}:`, result);
          setValidationResult(result);
          onValidationChange?.(result.valid, result.available, result.suggestions);
          console.log(`📤 SimpleEmailValidator: Called onValidationChange with valid=${result.valid}, available=${result.available}`);
        } catch (error) {
          console.log(`❌ SimpleEmailValidator: Error checking ${email}:`, error);
          // Se falhar, assumir disponível
          const result = {
            valid: true,
            available: true,
            format: true,
            suggestions: []
          };
          setValidationResult(result);
          onValidationChange?.(true, true, []);
          console.log(`📤 SimpleEmailValidator: Called onValidationChange with valid=true, available=true (fallback)`);
        }
      } catch (error) {
        console.error('Email validation error:', error);
        setValidationResult(null);
        onValidationChange?.(false, false, ['Failed to validate email']);
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email]);

  if (!email || email.length < 5) {
    return null;
  }

  const getIcon = (isValid: boolean, isAvailable: boolean) => {
    if (isValidating) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    if (!isValid) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    
    if (isValid && isAvailable) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    if (isValid && !isAvailable) {
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
    
    return null;
  };

  const getStatusMessage = () => {
    if (isValidating) {
      return 'Checking email availability...';
    }
    
    if (!validationResult) {
      return null;
    }
    
    if (!validationResult.valid) {
      return 'Invalid email format';
    }
    
    if (validationResult.valid && validationResult.available) {
      return 'Email is available';
    }
    
    if (validationResult.valid && !validationResult.available) {
      return 'This email is already registered';
    }
    
    return null;
  };

  const getStatusColor = () => {
    if (isValidating) {
      return 'text-blue-600';
    }
    
    if (!validationResult) {
      return 'text-gray-500';
    }
    
    if (!validationResult.valid) {
      return 'text-red-600';
    }
    
    if (validationResult.valid && validationResult.available) {
      return 'text-green-600';
    }
    
    if (validationResult.valid && !validationResult.available) {
      return 'text-orange-600';
    }
    
    return 'text-gray-500';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Email Status */}
      <div className="flex items-center space-x-2">
        {getIcon(validationResult?.valid || false, validationResult?.available || false)}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusMessage()}
        </span>
      </div>

      {/* Email Already Exists Warning */}
      {validationResult?.valid && !validationResult?.available && (
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-800 dark:text-orange-200">
                Email already registered
              </p>
              <p className="text-orange-700 dark:text-orange-300 mt-1">
                This email is already in use. Please use a different email or try logging in instead.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
