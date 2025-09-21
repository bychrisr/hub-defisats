import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gradient-primary text-white hover:neon-primary',
        secondary:
          'border-transparent bg-gradient-secondary text-white hover:neon-secondary',
        destructive:
          'border-transparent bg-axisor-destructive text-white hover:neon-success',
        outline: 'text-foreground border-axisor-primary',
        accent:
          'border-transparent bg-gradient-accent text-black hover:neon-accent',
        // Custom variants for market data
        success:
          'border-transparent bg-axisor-success text-white',
        danger:
          'border-transparent bg-axisor-destructive text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
