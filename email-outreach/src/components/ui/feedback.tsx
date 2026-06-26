"use client";

/**
 * Unified feedback system for the app:
 *  - `toast`          — drop-in replacement for sonner's toast API, rendered
 *                       as a clean top-center notification stack.
 *  - `confirmDialog`  — promise-based confirmation modal used in place of the
 *                       native window.confirm().
 *  - `<FeedbackRoot/>`— mount once (in the root layout) to render both.
 *
 * All APIs are imperative and work from anywhere (inside or outside React).
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  XCircle,
  Info,
  TriangleAlert,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------- Toast store ------------------------------ */

type ToastType = "success" | "error" | "info" | "warning" | "loading";

export interface ToastOptions {
  id?: string;
  description?: string;
  duration?: number;
}

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

let toastList: ToastItem[] = [];
const toastSubs = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const notifyToasts = () => toastSubs.forEach((fn) => fn());

function clearTimer(id: string) {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
}

function scheduleRemoval(id: string, duration: number) {
  clearTimer(id);
  if (Number.isFinite(duration) && duration > 0) {
    timers.set(id, setTimeout(() => removeToast(id), duration));
  }
}

function defaultDuration(type: ToastType): number {
  if (type === "loading") return Infinity;
  if (type === "error") return 6000;
  return 4000;
}

function upsertToast(type: ToastType, title: string, options?: ToastOptions): string {
  const id = options?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const duration = options?.duration ?? defaultDuration(type);
  const item: ToastItem = { id, type, title, description: options?.description, duration };

  const idx = toastList.findIndex((t) => t.id === id);
  if (idx >= 0) {
    toastList = toastList.map((t, i) => (i === idx ? item : t));
  } else {
    toastList = [item, ...toastList].slice(0, 5);
  }
  notifyToasts();
  scheduleRemoval(id, duration);
  return id;
}

function removeToast(id: string) {
  toastList = toastList.filter((t) => t.id !== id);
  clearTimer(id);
  notifyToasts();
}

interface ToastFn {
  (title: string, options?: ToastOptions): string;
  success: (title: string, options?: ToastOptions) => string;
  error: (title: string, options?: ToastOptions) => string;
  info: (title: string, options?: ToastOptions) => string;
  warning: (title: string, options?: ToastOptions) => string;
  message: (title: string, options?: ToastOptions) => string;
  loading: (title: string, options?: ToastOptions) => string;
  dismiss: (id?: string) => void;
}

const toastFn = ((title: string, options?: ToastOptions) =>
  upsertToast("info", title, options)) as ToastFn;
toastFn.success = (t, o) => upsertToast("success", t, o);
toastFn.error = (t, o) => upsertToast("error", t, o);
toastFn.info = (t, o) => upsertToast("info", t, o);
toastFn.warning = (t, o) => upsertToast("warning", t, o);
toastFn.message = (t, o) => upsertToast("info", t, o);
toastFn.loading = (t, o) => upsertToast("loading", t, o);
toastFn.dismiss = (id) => {
  if (id) return removeToast(id);
  toastList = [];
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  notifyToasts();
};

export const toast = toastFn;

/* ------------------------------ Confirm store ----------------------------- */

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  onConfirm?: () => Promise<void>;
  successTitle?: string;
  successDescription?: string;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

let confirmState: ConfirmState | null = null;
const confirmSubs = new Set<() => void>();
const notifyConfirm = () => confirmSubs.forEach((fn) => fn());

/** Show a confirmation modal. Resolves true if confirmed, false otherwise. */
export function confirmDialog(options: ConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    // If a dialog is already open, reject the previous one as cancelled.
    if (confirmState) confirmState.resolve(false);
    confirmState = { ...options, resolve };
    notifyConfirm();
  });
}

function settleConfirm(value: boolean) {
  const current = confirmState;
  confirmState = null;
  notifyConfirm();
  current?.resolve(value);
}

/* -------------------------------- Hooks ----------------------------------- */

function useForceSubscribe(subs: Set<() => void>) {
  const [, force] = useState(0);
  useEffect(() => {
    const cb = () => force((n) => n + 1);
    subs.add(cb);
    return () => {
      subs.delete(cb);
    };
  }, [subs]);
}

/* ------------------------------- UI: Toasts ------------------------------- */

const TOAST_META: Record<
  ToastType,
  { icon: React.ReactNode; ring: string; iconColor: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    ring: "border-emerald-200",
    iconColor: "text-emerald-600",
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    ring: "border-red-200",
    iconColor: "text-red-600",
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    ring: "border-indigo-200",
    iconColor: "text-indigo-600",
  },
  warning: {
    icon: <TriangleAlert className="w-5 h-5" />,
    ring: "border-amber-200",
    iconColor: "text-amber-600",
  },
  loading: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    ring: "border-zinc-200",
    iconColor: "text-zinc-500",
  },
};

function ToastCard({ item }: { item: ToastItem }) {
  const meta = TOAST_META[item.type];
  return (
    <div
      className={cn(
        "pointer-events-auto w-[360px] max-w-[90vw] bg-white border rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] p-3.5 flex items-start gap-3 animate-in fade-in slide-in-from-top-3 duration-200",
        meta.ring
      )}
    >
      <span className={cn("shrink-0 mt-0.5", meta.iconColor)}>{meta.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-zinc-900 leading-snug">{item.title}</p>
        {item.description && (
          <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
      {item.type !== "loading" && (
        <button
          onClick={() => removeToast(item.id)}
          className="shrink-0 text-zinc-300 hover:text-zinc-600 transition-colors -mr-1 -mt-1 p-1"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function ToastViewport() {
  useForceSubscribe(toastSubs);
  if (toastList.length === 0) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-2.5">
      {toastList.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}

/* ------------------------------ UI: Confirm ------------------------------- */

function ConfirmModal() {
  useForceSubscribe(confirmSubs);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setErrorMsg(null);
  }, [confirmState]);

  useEffect(() => {
    if (!confirmState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settleConfirm(false);
      if (e.key === "Enter" && !isLoading && !isSuccess) handleConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmState, isLoading, isSuccess]);

  if (!confirmState) return null;

  const {
    title = "Are you sure?",
    description = "",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    onConfirm,
    successTitle = "Deleted!",
    successDescription = "Deleted successfully.",
  } = confirmState;

  const isDanger = variant === "danger";

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        await onConfirm();
        setIsSuccess(true);
        setIsLoading(false);
        setTimeout(() => {
          settleConfirm(true);
        }, 1500);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMsg(err.message || "An error occurred");
      }
    } else {
      settleConfirm(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !isLoading && !isSuccess && settleConfirm(false)}
    >
      <div
        className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex flex-col items-center text-center gap-3">
          <span
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
              isSuccess
                ? "bg-emerald-50 text-emerald-600 scale-110 rotate-3"
                : isDanger
                  ? "bg-red-50 text-red-600"
                  : "bg-indigo-50 text-indigo-600"
            )}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-6 h-6 animate-bounce" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </span>
          <div className="space-y-1.5 transition-all duration-300">
            <h2 className="text-base font-black text-zinc-900">
              {isSuccess ? successTitle : title}
            </h2>
            {(isSuccess ? successDescription : errorMsg || description) && (
              <p
                className={cn(
                  "text-sm font-medium leading-relaxed transition-colors duration-300",
                  errorMsg ? "text-red-500" : "text-zinc-500"
                )}
              >
                {isSuccess ? successDescription : errorMsg || description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            disabled={isLoading || isSuccess}
            onClick={() => settleConfirm(false)}
            className="flex-1 h-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-bold text-zinc-700 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            disabled={isLoading || isSuccess}
            autoFocus
            onClick={handleConfirm}
            className={cn(
              "flex-1 h-10 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50",
              isDanger ? "bg-red-600 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSuccess ? (
              "Done"
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Root ------------------------------------ */

export function FeedbackRoot() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <>
      <ToastViewport />
      <ConfirmModal />
    </>,
    document.body
  );
}
