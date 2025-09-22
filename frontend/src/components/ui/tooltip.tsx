import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, width: 0 });
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
    
    // Encontrar o card pai (elemento com classe que contém 'card')
    const cardElement = triggerRef.current.closest('[class*="card"]') || 
                       triggerRef.current.closest('.bg-gradient-to-br') ||
                       triggerRef.current.closest('.bg-gradient-to-r');
    
    const cardRect = cardElement ? cardElement.getBoundingClientRect() : triggerRect;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        // Altura que expande para cima
        top = cardRect.top - tooltipRect.height - 12;
        // Centralizar o tooltip (1.5x maior) em relação ao card
        left = cardRect.left - (cardRect.width * 0.25);
        break;
      case 'bottom':
        top = cardRect.bottom + 8;
        left = cardRect.left - (cardRect.width * 0.25);
        break;
      case 'left':
        top = cardRect.top + (cardRect.height - tooltipRect.height) / 2;
        left = cardRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = cardRect.top + (cardRect.height - tooltipRect.height) / 2;
        left = cardRect.right + 8;
        break;
    }

    setTooltipPosition({ top, left, width: cardRect.width * 1.5 });
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
        return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-r border-b border-gray-600/30`;
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
    <>
      <div
        ref={triggerRef}
        className={cn('inline-block relative', className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      
      {isVisible && content && createPortal(
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-[99999] px-4 py-3 text-sm text-white bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-600/30 rounded-xl shadow-2xl',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            'backdrop-blur-md',
            'whitespace-normal break-words',
            'ring-1 ring-gray-700/20'
          )}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: tooltipPosition.width || 'auto',
            minHeight: 'auto',
            maxHeight: 'none',
          }}
        >
          {content}
          <div className={getArrowClasses()} />
        </div>,
        document.body
      )}
    </>
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