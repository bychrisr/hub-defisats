import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[#2A3441] bg-[#1A1F2E] px-3 py-2 text-base text-[#E6E6E6] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#B8BCC8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3773F5] focus-visible:ring-offset-2 focus-visible:border-[#3773F5] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300 hover:border-[#3773F5]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
