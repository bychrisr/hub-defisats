import { useState, useEffect } from 'react';
import { FieldError } from 'react-hook-form';

export type ValidationState = 'idle' | 'valid' | 'invalid' | 'checking';

export interface FieldValidationState {
  state: ValidationState;
  hasBeenTouched: boolean;
  hasBeenFocused: boolean;
}

export interface UseFieldValidationProps {
  fieldName: string;
  error?: FieldError;
  isValid?: boolean;
  isChecking?: boolean;
  value?: string;
}

export const useFieldValidation = ({
  fieldName,
  error,
  isValid,
  isChecking,
  value
}: UseFieldValidationProps) => {
  const [validationState, setValidationState] = useState<FieldValidationState>({
    state: 'idle',
    hasBeenTouched: false,
    hasBeenFocused: false
  });

  // Update validation state based on props
  useEffect(() => {
    if (isChecking) {
      setValidationState(prev => ({ ...prev, state: 'checking' }));
      return;
    }

    if (value && value.length > 0) {
      if (error) {
        setValidationState(prev => ({ ...prev, state: 'invalid' }));
      } else if (isValid) {
        setValidationState(prev => ({ ...prev, state: 'valid' }));
      } else {
        setValidationState(prev => ({ ...prev, state: 'idle' }));
      }
    } else {
      setValidationState(prev => ({ ...prev, state: 'idle' }));
    }
  }, [error, isValid, isChecking, value]);

  const handleFocus = () => {
    setValidationState(prev => ({ ...prev, hasBeenFocused: true }));
  };

  const handleBlur = () => {
    setValidationState(prev => ({ ...prev, hasBeenTouched: true }));
  };

  const getBorderColor = () => {
    if (!validationState.hasBeenFocused && !validationState.hasBeenTouched) {
      return 'border-slate-600'; // Default border
    }

    switch (validationState.state) {
      case 'valid':
        return 'border-green-500';
      case 'invalid':
        return 'border-red-500';
      case 'checking':
        return 'border-yellow-500';
      default:
        return 'border-slate-600';
    }
  };

  const getFocusBorderColor = () => {
    if (!validationState.hasBeenFocused && !validationState.hasBeenTouched) {
      return 'focus:border-blue-500'; // Default focus border
    }

    switch (validationState.state) {
      case 'valid':
        return 'focus:border-green-500';
      case 'invalid':
        return 'focus:border-red-500';
      case 'checking':
        return 'focus:border-yellow-500';
      default:
        return 'focus:border-blue-500';
    }
  };

  const getRingColor = () => {
    if (!validationState.hasBeenFocused && !validationState.hasBeenTouched) {
      return 'focus:ring-blue-500/20'; // Default ring
    }

    switch (validationState.state) {
      case 'valid':
        return 'focus:ring-green-500/20';
      case 'invalid':
        return 'focus:ring-red-500/20';
      case 'checking':
        return 'focus:ring-yellow-500/20';
      default:
        return 'focus:ring-blue-500/20';
    }
  };

  const getValidationIcon = () => {
    switch (validationState.state) {
      case 'valid':
        return '✓';
      case 'invalid':
        return '✗';
      case 'checking':
        return '⟳';
      default:
        return null;
    }
  };

  const getValidationIconColor = () => {
    switch (validationState.state) {
      case 'valid':
        return 'text-green-400';
      case 'invalid':
        return 'text-red-400';
      case 'checking':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  return {
    validationState,
    handleFocus,
    handleBlur,
    getBorderColor,
    getFocusBorderColor,
    getRingColor,
    getValidationIcon,
    getValidationIconColor,
    isFieldValid: validationState.state === 'valid',
    isFieldInvalid: validationState.state === 'invalid',
    isFieldChecking: validationState.state === 'checking',
    shouldShowValidation: validationState.hasBeenFocused || validationState.hasBeenTouched
  };
};
