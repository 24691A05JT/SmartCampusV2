import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((options) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const toast = {
      id,
      type: options.type || 'info', // 'success' | 'error' | 'warning' | 'info'
      message: options.message || '',
      title: options.title || null,
      duration: options.duration || 4000
    };

    setToasts((prev) => [...prev, toast]);

    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }
  }, [removeToast]);

  const success = useCallback((message, title = 'Success') => {
    showToast({ type: 'success', message, title });
  }, [showToast]);

  const error = useCallback((message, title = 'Error') => {
    showToast({ type: 'error', message, title });
  }, [showToast]);

  const warning = useCallback((message, title = 'Warning') => {
    showToast({ type: 'warning', message, title });
  }, [showToast]);

  const info = useCallback((message, title = 'Note') => {
    showToast({ type: 'info', message, title });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div 
        aria-live="polite" 
        className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
              t.type === 'success'
                ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-100'
                : t.type === 'error'
                ? 'bg-rose-950/85 border-rose-500/30 text-rose-100'
                : t.type === 'warning'
                ? 'bg-amber-950/85 border-amber-500/30 text-amber-100'
                : 'bg-slate-900/90 border-indigo-500/30 text-slate-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 text-sm">
              {t.title && <p className="font-semibold text-white mb-0.5">{t.title}</p>}
              <p className="opacity-90 leading-relaxed">{t.message}</p>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
