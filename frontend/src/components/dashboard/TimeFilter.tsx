import React from 'react';
import { cn } from '@/lib/utils';

// ===== TYPES =====
export type TimeFilterPeriod = '24H' | '7D' | '30D' | '90D' | 'ALL';

export interface TimeFilterOption {
  value: TimeFilterPeriod;
  label: string;
  days?: number;
}

export interface TimeFilterProps {
  value: TimeFilterPeriod;
  onChange: (period: TimeFilterPeriod) => void;
  options?: TimeFilterOption[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'glass';
}

// ===== DEFAULT OPTIONS =====
const defaultOptions: TimeFilterOption[] = [
  { value: '24H', label: '24H', days: 1 },
  { value: '7D', label: '7D', days: 7 },
  { value: '30D', label: '30D', days: 30 },
  { value: '90D', label: '90D', days: 90 },
  { value: 'ALL', label: 'ALL', days: 365 }
];

// ===== SIZE CLASSES =====
const sizeClasses = {
  sm: {
    container: 'gap-1',
    button: 'px-2 py-1 text-xs rounded-md',
    active: 'px-2 py-1 text-xs'
  },
  md: {
    container: 'gap-2',
    button: 'px-3 py-2 text-sm rounded-lg',
    active: 'px-3 py-2 text-sm'
  },
  lg: {
    container: 'gap-3',
    button: 'px-4 py-2 text-base rounded-lg',
    active: 'px-4 py-2 text-base'
  }
};

// ===== VARIANT CLASSES =====
const variantClasses = {
  default: {
    container: 'bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-1',
    button: 'text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200',
    active: 'bg-primary text-primary-foreground shadow-sm'
  },
  minimal: {
    container: 'gap-2',
    button: 'text-muted-foreground hover:text-foreground transition-colors duration-200',
    active: 'text-foreground font-medium'
  },
  glass: {
    container: 'liquid-glass-base p-2',
    button: 'text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-300 rounded-lg',
    active: 'bg-white/10 text-foreground shadow-sm'
  }
};

// ===== COMPONENT =====
export const TimeFilter: React.FC<TimeFilterProps> = ({
  value,
  onChange,
  options = defaultOptions,
  className,
  size = 'md',
  variant = 'default'
}) => {
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];

  return (
    <div
      className={cn(
        'flex items-center',
        sizeClass.container,
        variantClass.container,
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'font-medium transition-all duration-200 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              sizeClass.button,
              isActive ? variantClass.active : variantClass.button,
              isActive && 'transform scale-105'
            )}
            aria-pressed={isActive}
            aria-label={`Filter by ${option.label}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

// ===== HOOK FOR TIME FILTER LOGIC =====
export const useTimeFilter = (initialValue: TimeFilterPeriod = '7D') => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimeFilterPeriod>(initialValue);
  
  const getDaysFromPeriod = (period: TimeFilterPeriod): number => {
    const option = defaultOptions.find(opt => opt.value === period);
    return option?.days || 30;
  };
  
  const getPeriodFromDays = (days: number): TimeFilterPeriod => {
    // Find closest match
    const closest = defaultOptions.reduce((prev, curr) => {
      const prevDiff = Math.abs((prev.days || 30) - days);
      const currDiff = Math.abs((curr.days || 30) - days);
      return currDiff < prevDiff ? curr : prev;
    });
    return closest.value;
  };
  
  return {
    selectedPeriod,
    setSelectedPeriod,
    getDaysFromPeriod,
    getPeriodFromDays,
    selectedDays: getDaysFromPeriod(selectedPeriod)
  };
};

// ===== EXPORT =====
export default TimeFilter;
