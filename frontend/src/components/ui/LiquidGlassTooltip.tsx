import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

// ===== INTERFACES =====
export interface LiquidGlassTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  iconPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// ===== POSITION CLASSES =====
const positionClasses = {
  top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
};

const arrowClasses = {
  top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white/15',
  bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white/15',
  left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white/15',
  right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white/15'
};

const iconPositionClasses = {
  'top-right': 'absolute top-2 right-2',
  'top-left': 'absolute top-2 left-2',
  'bottom-right': 'absolute bottom-2 right-2',
  'bottom-left': 'absolute bottom-2 left-2'
};

// ===== COMPONENT =====
export const LiquidGlassTooltip: React.FC<LiquidGlassTooltipProps> = ({
  content,
  position = 'top',
  delay = 200,
  maxWidth = 280,
  className,
  children,
  showIcon = true,
  iconPosition = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDelayed, setIsDelayed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ===== SHOW/HIDE LOGIC =====
  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsDelayed(true);
      setTimeout(() => setIsVisible(true), 50);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsVisible(false);
    setTimeout(() => setIsDelayed(false), 200);
  };

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ===== RENDER TOOLTIP CONTENT =====
  const renderTooltipContent = () => (
    <div
      ref={containerRef}
      className={cn(
        'liquid-glass-tooltip',
        positionClasses[position],
        'absolute z-50 whitespace-normal break-words',
        isDelayed ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{ maxWidth }}
      data-state={isVisible ? 'open' : 'closed'}
    >
      {/* Arrow */}
      <div
        className={cn(
          'absolute w-0 h-0 border-4',
          arrowClasses[position]
        )}
      />
      
      {/* Content */}
      <div className="text-sm leading-relaxed">
        {content}
      </div>
    </div>
  );

  // ===== RENDER ICON =====
  const renderIcon = () => {
    if (!showIcon) return null;

    return (
      <div
        className={cn(
          'z-10 transition-colors duration-200',
          iconPositionClasses[iconPosition],
          'cursor-help hover:text-vibrant text-muted-foreground'
        )}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
      </div>
    );
  };

  // ===== RENDER CHILDREN WITH TOOLTIP =====
  if (children) {
    return (
      <div className="relative inline-block">
        <div
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          className="cursor-help"
        >
          {children}
        </div>
        {isDelayed && renderTooltipContent()}
      </div>
    );
  }

  // ===== RENDER STANDALONE ICON =====
  return (
    <div className="relative inline-block">
      {renderIcon()}
      {isDelayed && renderTooltipContent()}
    </div>
  );
};

// ===== WRAPPER COMPONENT =====
export const LiquidGlassTooltipWrapper: React.FC<{
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
  className?: string;
}> = ({ children, content, position, delay, maxWidth, className }) => {
  return (
    <LiquidGlassTooltip
      content={content}
      position={position}
      delay={delay}
      maxWidth={maxWidth}
      className={className}
    >
      {children}
    </LiquidGlassTooltip>
  );
};

// ===== EXPORT =====
export default LiquidGlassTooltip;
