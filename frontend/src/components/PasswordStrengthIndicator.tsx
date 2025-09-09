import { memo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  strength: number;
  labels: string[];
  colors: string[];
}

const PasswordStrengthIndicator = memo(
  ({ password, strength, labels, colors }: PasswordStrengthIndicatorProps) => {
    if (!password) return null;

    return (
      <div className="space-y-1">
        <div
          className="flex space-x-1"
          role="progressbar"
          aria-valuenow={strength}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-label={`Password strength: ${strength > 0 ? labels[strength - 1] : 'Very Weak'}`}
        >
          {[1, 2, 3, 4, 5].map(level => (
            <div
              key={level}
              className={`h-1 w-full rounded ${
                level <= strength ? colors[strength - 1] : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300">
          Password strength: {strength > 0 ? labels[strength - 1] : 'Very Weak'}
        </p>
      </div>
    );
  }
);

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';

export default PasswordStrengthIndicator;
