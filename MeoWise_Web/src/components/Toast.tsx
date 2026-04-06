import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-tertiary text-white';
      case 'error':
        return 'bg-error text-white';
      case 'warning':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-inverse-surface text-on-surface';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-[calc(env(safe-area-inset-top,0px)+16px)] left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto animate-slide-down',
              getToastStyles(toast.type)
            )}
          >
            <span className="material-symbols-outlined text-xl">{getToastIcon(toast.type)}</span>
            <span className="flex-1 font-medium text-sm">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="p-1 hover:opacity-70"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default function Toast() {
  return null;
}