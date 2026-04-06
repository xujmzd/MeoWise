import { useEffect, useRef, ReactNode } from 'react';
import { clsx } from 'clsx';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  snapPoints?: number[];
}

export default function BottomSheet({ isOpen, onClose, title, children, snapPoints = [0.5, 0.7, 0.9] }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (!sheetRef.current) return;
    const diff = currentY.current - startY.current;
    if (diff > 100) {
      onClose();
    }
    sheetRef.current.style.transform = '';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div
        ref={sheetRef}
        className="bg-surface-container-lowest rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-up"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 px-6 pt-4 pb-2 flex items-center justify-between">
            <div className="w-12 h-1 rounded-full bg-outline-variant mx-auto -mt-2" />
            {title && (
              <h3 className="text-xl font-bold text-on-surface">{title}</h3>
            )}
            <button
              onClick={onClose}
              className="tap-target flex items-center justify-center rounded-full hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-secondary">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = '确认', cancelText = '取消', type = 'warning' }: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-error text-on-error';
      case 'warning':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-primary text-on-primary';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm p-6 animate-scale-in">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${type === 'danger' ? 'bg-error-container' : 'bg-warning-container'}`}>
            <span className="material-symbols-outlined text-2xl text-error">{type === 'danger' ? 'warning' : 'help'}</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface flex-1">{title}</h3>
        </div>
        <p className="text-secondary mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full font-semibold bg-surface-container text-on-surface touch-active"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={clsx(
              'flex-1 py-3 rounded-full font-semibold text-white touch-active',
              getTypeStyles()
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}