'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Render with the mono face — use for URLs, IDs, numeric data. */
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, mono = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border border-[var(--border)] bg-surface px-3 text-sm text-primary',
          'placeholder:text-muted transition-colors duration-150',
          'hover:border-hover',
          'focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          mono && 'font-mono',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
