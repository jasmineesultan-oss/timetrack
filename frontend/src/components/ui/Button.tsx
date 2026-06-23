import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed gap-2 whitespace-nowrap';

  const variants: Record<string, string> = {
    primary: 'bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700 shadow-sm',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-sm',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
      {children}
    </button>
  );
};
