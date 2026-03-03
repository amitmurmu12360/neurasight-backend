"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

// =============================================================================
// TOAST STYLES
// =============================================================================
const toastStyles: Record<
  ToastType,
  {
    border: string;
    bg: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
  }
> = {
  success: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    titleColor: "text-emerald-400",
  },
  error: {
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    titleColor: "text-red-400",
  },
  info: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    titleColor: "text-blue-400",
  },
};

const toastIcons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

// =============================================================================
// SINGLE TOAST
// =============================================================================
function Toast({ toast, onDismiss }: ToastProps) {
  const styles = toastStyles[toast.type];
  const Icon = toastIcons[toast.type];

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`relative flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-xl ${styles.border} ${styles.bg}`}
    >
      {/* Icon */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.iconBg}`}
      >
        <Icon className={`h-4 w-4 ${styles.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <p className={`text-sm font-semibold ${styles.titleColor}`}>
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-1 text-xs text-slate-400">{toast.description}</p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-700/50 hover:text-slate-300"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 rounded-b-xl ${
          toast.type === "success"
            ? "bg-emerald-500"
            : toast.type === "error"
              ? "bg-red-500"
              : "bg-blue-500"
        }`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: (toast.duration || 5000) / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

// =============================================================================
// TOAST CONTAINER
// =============================================================================
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TOAST HOOK
// =============================================================================
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastType, title: string, description?: string, duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, title, description, duration }]);
      return id;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string) => addToast("success", title, description),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => addToast("error", title, description),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => addToast("info", title, description),
    [addToast]
  );

  return {
    toasts,
    addToast,
    dismissToast,
    success,
    error,
    info,
    ToastContainer: () => <ToastContainer toasts={toasts} onDismiss={dismissToast} />,
  };
}

export default Toast;

