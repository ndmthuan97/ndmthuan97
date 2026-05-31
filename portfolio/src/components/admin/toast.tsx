import { useState } from "react";

export type ToastMsg = {
  id: number;
  type: "success" | "error" | "info";
  text: string;
  detail?: string;
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const push = (type: ToastMsg["type"], text: string, detail?: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, text, detail }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), type === "error" ? 6000 : 3500);
  };
  return { toasts, toast: push };
}

export function ToastStack({ toasts }: { toasts: ToastMsg[] }) {
  if (!toasts.length) return null;
  const accent: Record<ToastMsg["type"], string> = {
    success: "text-emerald-600 dark:text-emerald-400",
    error:   "text-red-600 dark:text-red-400",
    info:    "text-muted-foreground",
  };
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className="px-4 py-3 rounded-lg text-sm bg-card shadow-card backdrop-blur-md">
          <p className={`font-semibold ${accent[t.type]}`}>{t.text}</p>
          {t.detail && <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">{t.detail}</p>}
        </div>
      ))}
    </div>
  );
}
