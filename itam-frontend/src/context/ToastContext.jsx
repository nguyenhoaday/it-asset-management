/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          let bgColor = 'bg-white dark:bg-slate-800 border-gray-100 dark:border-gray-700';
          let textColor = 'text-gray-900 dark:text-white';
          let Icon = AlertCircle;
          let iconColor = 'text-blue-500';

          if (toast.type === 'success') {
            bgColor = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50';
            textColor = 'text-emerald-900 dark:text-emerald-200';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-500';
          } else if (toast.type === 'error') {
            bgColor = 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-900/50';
            textColor = 'text-red-900 dark:text-red-200';
            Icon = XCircle;
            iconColor = 'text-red-500';
          } else if (toast.type === 'warning') {
            bgColor = 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-900/50';
            textColor = 'text-amber-900 dark:text-amber-200';
            Icon = AlertCircle;
            iconColor = 'text-amber-500';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgColor} animate-slide-in pointer-events-auto transition-all`}
              role="alert"
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <div className={`flex-1 text-sm font-medium leading-5 ${textColor}`}>
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg p-0.5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
