import React from 'react';
import { useOperations } from '../OperationsContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useOperations();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const config = {
          success: {
            bg: 'bg-slate-900/90 border-green-500/40 text-green-300',
            icon: '✓',
            iconBg: 'bg-green-500/20 text-green-400',
          },
          error: {
            bg: 'bg-slate-900/90 border-red-500/40 text-red-300',
            icon: '✕',
            iconBg: 'bg-red-500/20 text-red-400',
          },
          warning: {
            bg: 'bg-slate-900/90 border-amber-500/40 text-amber-300',
            icon: '⚠',
            iconBg: 'bg-amber-500/20 text-amber-400',
          },
          info: {
            bg: 'bg-slate-900/90 border-blue-500/40 text-blue-300',
            icon: 'ℹ',
            iconBg: 'bg-blue-500/20 text-blue-400',
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-xl animate-fade-in-up ${config.bg}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${config.iconBg}`}>
                {config.icon}
              </span>
              <p className="text-xs font-medium text-white truncate">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors text-xs shrink-0 cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
