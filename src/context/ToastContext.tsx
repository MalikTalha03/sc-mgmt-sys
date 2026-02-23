import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ConfirmState {
  message: string;
  resolve: (value: boolean) => void;
}

export interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
  confirm: (msg: string) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const counter = useRef(0);

  const addToast = useCallback((message: string, type: ToastType, duration: number) => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const confirmFn = useCallback((message: string): Promise<boolean> => {
    return new Promise(resolve => setConfirmState({ message, resolve }));
  }, []);

  const handleConfirmAnswer = (answer: boolean) => {
    confirmState?.resolve(answer);
    setConfirmState(null);
  };

  const value: ToastContextValue = {
    success: (msg) => addToast(msg, "success", 4000),
    error:   (msg) => addToast(msg, "error",   6000),
    warning: (msg) => addToast(msg, "warning", 5000),
    info:    (msg) => addToast(msg, "info",    4000),
    confirm: confirmFn,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* ── Toast Stack ────────────────────────────────────────────────── */}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <Toast key={t.id} item={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* ── Confirm Modal ──────────────────────────────────────────────── */}
      {confirmState && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <div className="confirm-icon-wrap">
              <AlertTriangle size={32} color="#f59e0b" />
            </div>
            <p className="confirm-message">{confirmState.message}</p>
            <div className="confirm-actions">
              <button className="confirm-btn-cancel" onClick={() => handleConfirmAnswer(false)}>
                Cancel
              </button>
              <button className="confirm-btn-ok" onClick={() => handleConfirmAnswer(true)}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

// ─── Toast Component ──────────────────────────────────────────────────────────

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={18} />,
  error:   <XCircle    size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info       size={18} />,
};

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  return (
    <div className={`toast toast-${item.type}`}>
      <span className="toast-icon">{ICONS[item.type]}</span>
      <span className="toast-message">{item.message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <X size={14} />
      </button>
      <div
        className="toast-progress"
        style={{ animationDuration: `${item.duration}ms` }}
      />
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
