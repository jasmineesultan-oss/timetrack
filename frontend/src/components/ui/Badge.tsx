import React from 'react';

interface BadgeProps { variant?: 'default'|'success'|'warning'|'danger'|'info'; children: React.ReactNode; className?: string; }

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const v: Record<string,string> = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    info: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v[variant]} ${className}`}>{children}</span>;
};
