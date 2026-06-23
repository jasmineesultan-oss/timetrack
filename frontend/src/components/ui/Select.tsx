import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, className, children, ...props }) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-foreground">{label}</label>}
    <select
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error && 'border-red-500',
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);
