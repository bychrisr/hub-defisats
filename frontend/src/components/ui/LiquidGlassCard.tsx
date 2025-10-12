import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ===== INTERFACES =====
export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'success' | 'danger' | 'neutral' | 'info' | 'default';
  interactive?: boolean;
  glassTint?: string;
  morphOnHover?: boolean;
  breathe?: boolean;
  children: React.ReactNode;
}

// ===== SIZE CLASSES =====
const sizeClasses = {
  small: 'p-3 min-h-[100px]',
  medium: 'p-4 min-h-[140px]',
  large: 'p-6 min-h-[180px]',
  xlarge: 'p-8 min-h-[220px]'
};

// ===== VARIANT CLASSES =====
const variantClasses = {
  default: 'liquid-glass-base',
  success: 'liquid-glass-success',
  danger: 'liquid-glass-danger',
  info: 'liquid-glass-info',
  neutral: 'liquid-glass-neutral'
};

// ===== GRADIENT CLASSES =====
const gradientClasses = {
  default: '',
  success: 'liquid-glass-gradient-success',
  danger: 'liquid-glass-gradient-danger',
  info: 'liquid-glass-gradient-info',
  neutral: 'liquid-glass-gradient-neutral'
};

// ===== COMPONENT =====
export const LiquidGlassCard = forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  ({
    size = 'medium',
    variant = 'default',
    interactive = true,
    glassTint,
    morphOnHover = true,
    breathe = false,
    className,
    children,
    style,
    ...props
  }, ref) => {
    // ===== CLASSES COMPUTATION =====
    const baseClasses = cn(
      // Base liquid glass
      'rounded-xl overflow-hidden relative',
      'transition-all duration-300 ease-out',
      variantClasses[variant],
      gradientClasses[variant],
      
      // Size
      sizeClasses[size],
      
      // Interactive effects
      interactive && morphOnHover && 'liquid-glass-morph cursor-pointer',
      breathe && 'liquid-glass-breathe',
      
      // Custom tint overlay
      glassTint && 'before:absolute before:inset-0 before:pointer-events-none',
      
      className
    );

    // ===== STYLE COMPUTATION =====
    const computedStyle = {
      ...style,
      ...(glassTint && {
        '--glass-tint': glassTint
      } as React.CSSProperties)
    };

    // ===== CUSTOM TINT OVERLAY =====
    const tintOverlay = glassTint && (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${glassTint}15 0%, ${glassTint}08 50%, transparent 100%)`,
          borderRadius: 'inherit'
        }}
      />
    );

    return (
      <div
        ref={ref}
        className={baseClasses}
        style={computedStyle}
        {...props}
      >
        {/* Tint overlay */}
        {tintOverlay}
        
        {/* Content */}
        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    );
  }
);

LiquidGlassCard.displayName = 'LiquidGlassCard';

// ===== EXPORT DEFAULT =====
export default LiquidGlassCard;
