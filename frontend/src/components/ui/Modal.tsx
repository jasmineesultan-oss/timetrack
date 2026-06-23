import React from 'react';
import { X } from 'lucide-react';

interface ModalProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; size?: 'sm'|'md'|'lg'|'xl'; }

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes: Record<string,string> = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full ${sizes[size]}`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X className="h-5 w-5" /></button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
