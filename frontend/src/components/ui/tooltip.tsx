import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  disabled = false,
  className,
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled || !content) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updateTooltipPosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updateTooltipPosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = -tooltipRect.height - 12;
        left = (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.height + 8;
        left = (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = (triggerRect.height - tooltipRect.height) / 2;
        left = -tooltipRect.width - 8;
        break;
      case 'right':
        top = (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.width + 8;
        break;
    }

    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updateTooltipPosition();
      const handleResize = () => updateTooltipPosition();
      const handleScroll = () => updateTooltipPosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 transform rotate-45';
    
    switch (position) {
      case 'top':
        return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2 bg-gray-900 border-r border-b border-gray-700`;
      case 'bottom':
        return `${baseClasses} -top-1 left-1/2 -translate-x-1/2 bg-popover border-l border-t border-border`;
      case 'left':
        return `${baseClasses} -right-1 top-1/2 -translate-y-1/2 bg-popover border-t border-r border-border`;
      case 'right':
        return `${baseClasses} -left-1 top-1/2 -translate-y-1/2 bg-popover border-b border-l border-border`;
      default:
        return baseClasses;
    }
  };

  return (
    <div
      ref={triggerRef}
      className={cn('inline-block relative', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-[9999] px-4 py-3 text-sm text-white bg-gray-900 border border-gray-700 rounded-lg shadow-xl',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            'backdrop-blur-sm bg-gray-900/95',
            'min-w-64 max-w-[32rem] whitespace-normal break-words'
          )}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {content}
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  );
};

// Tooltip Context
interface TooltipContextType {
  delayDuration?: number;
  skipDelayDuration?: number;
}

const TooltipContext = createContext<TooltipContextType>({});

export const TooltipProvider: React.FC<{
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}> = ({ children, delayDuration = 200, skipDelayDuration = 300 }) => {
  return (
    <TooltipContext.Provider value={{ delayDuration, skipDelayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const useTooltip = () => {
  const context = useContext(TooltipContext);
  return context;
};

export default Tooltip;