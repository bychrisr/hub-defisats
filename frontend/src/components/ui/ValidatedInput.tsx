import React from 'react';
import { Input } from '@/components/ui/input';
import { useFieldValidation, UseFieldValidationProps } from '@/hooks/useFieldValidation';
import { cn } from '@/lib/utils';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName: string;
  error?: any;
  isValid?: boolean;
  isChecking?: boolean;
  value?: string;
  showValidationIcon?: boolean;
  className?: string;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ 
    fieldName, 
    error, 
    isValid, 
    isChecking, 
    value, 
    showValidationIcon = true,
    className,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const {
      handleFocus,
      handleBlur,
      getBorderColor,
      getFocusBorderColor,
      getRingColor,
      getValidationIcon,
      getValidationIconColor,
      shouldShowValidation
    } = useFieldValidation({
      fieldName,
      error,
      isValid,
      isChecking,
      value
    });

    const handleFocusInternal = (e: React.FocusEvent<HTMLInputElement>) => {
      handleFocus();
      onFocus?.(e);
    };

    const handleBlurInternal = (e: React.FocusEvent<HTMLInputElement>) => {
      handleBlur();
      onBlur?.(e);
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          {...props}
          onFocus={handleFocusInternal}
          onBlur={handleBlurInternal}
          className={cn(
            'bg-slate-700/50 text-white placeholder-slate-400 transition-all duration-200',
            getBorderColor(),
            getFocusBorderColor(),
            getRingColor(),
            'focus:ring-2',
            className
          )}
        />
        {showValidationIcon && shouldShowValidation && getValidationIcon() && (
          <div className={cn(
            'absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-bold',
            getValidationIconColor()
          )}>
            {getValidationIcon()}
          </div>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';
