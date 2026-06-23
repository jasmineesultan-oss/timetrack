import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`} {...props}>{children}</div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between ${className}`} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', ...props }) => (
  <h3 className={`text-sm font-semibold text-slate-800 dark:text-slate-100 ${className}`} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`px-5 py-4 ${className}`} {...props} />
);
