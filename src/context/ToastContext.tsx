import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showConfirm: (options: ConfirmDialogOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  const showConfirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  }, []);

  // Trap focus & escape in confirm dialog
  useEffect(() => {
    if (!confirmDialog) return;

    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDialog.onCancel) confirmDialog.onCancel();
        setConfirmDialog(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmDialog]);

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsConfirming(true);
    try {
      await confirmDialog.onConfirm();
    } finally {
      setIsConfirming(false);
      setConfirmDialog(null);
    }
  };

  const handleCancelAction = () => {
    if (!confirmDialog) return;
    if (confirmDialog.onCancel) confirmDialog.onCancel();
    setConfirmDialog(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm, dismissToast }}>
      {children}

      {/* Accessible Toast Notification Stack */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          let bgClass = 'bg-[#ffffff] dark:bg-[#15221b] text-[#142b20] dark:text-[#f2efe9] border-[#e8e2d7] dark:border-[#25382d]';
          let iconColor = 'text-[#1a5336] dark:text-[#34d399]';
          let IconComponent = Info;

          if (toast.type === 'success') {
            iconColor = 'text-[#1a5336] dark:text-[#34d399]';
            IconComponent = CheckCircle2;
          } else if (toast.type === 'error') {
            iconColor = 'text-[#a61c1c] dark:text-[#f87171]';
            IconComponent = AlertCircle;
          } else if (toast.type === 'warning') {
            iconColor = 'text-amber-600 dark:text-amber-400';
            IconComponent = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-200 animate-fade-up ${bgClass}`}
            >
              <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="w-8 h-8 -mr-1 -mt-1 flex items-center justify-center rounded-lg text-[#6e7a71] dark:text-[#91a396] hover:bg-[#f3efe6] dark:hover:bg-[#1d2d24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] dark:focus-visible:ring-[#34d399]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Accessible Global Confirmation Modal Dialog */}
      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up"
        >
          <div className="bg-[#ffffff] dark:bg-[#15221b] border border-[#e8e2d7] dark:border-[#25382d] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-[#a61c1c] dark:text-[#f87171]'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#1a5336] dark:text-[#34d399]'
                }`}
              >
                {confirmDialog.isDestructive ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <h3
                  id="confirm-dialog-title"
                  className="text-lg font-semibold text-[#142b20] dark:text-[#f2efe9]"
                >
                  {confirmDialog.title}
                </h3>
                <p
                  id="confirm-dialog-desc"
                  className="text-sm text-[#4a554d] dark:text-[#bac7be] leading-relaxed"
                >
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={handleCancelAction}
                disabled={isConfirming}
                className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#4a554d] dark:text-[#bac7be] hover:bg-[#f3efe6] dark:hover:bg-[#1d2d24] rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] dark:focus-visible:ring-[#34d399]"
              >
                {confirmDialog.cancelText || 'Cancel'}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={handleConfirmAction}
                disabled={isConfirming}
                className={`min-h-[44px] px-5 py-2 text-sm font-semibold text-white rounded-xl transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  confirmDialog.isDestructive
                    ? 'bg-[#a61c1c] hover:bg-[#851616] focus-visible:ring-[#a61c1c]'
                    : 'bg-[#1a5336] hover:bg-[#143e29] focus-visible:ring-[#1a5336] dark:bg-[#34d399] dark:text-[#0e1712] dark:hover:bg-[#2bc48b]'
                }`}
              >
                {isConfirming ? 'Processing...' : confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
