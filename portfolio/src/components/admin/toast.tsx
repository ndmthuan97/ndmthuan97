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
  const colors: Record<ToastMsg["type"], string> = {
    success: "bg-[#0d2b1a] shadow-[0_0_0_1px_rgba(74,222,128,0.25)] text-green-300",
    error:   "bg-[#2b0d0d] shadow-[0_0_0_1px_rgba(248,113,113,0.3)] text-red-300",
    info:    "bg-[#111] shadow-[0_0_0_1px_rgba(255,255,255,0.12)] text-[#ccc]",
  };
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className={`px-4 py-3 rounded-[8px] text-sm backdrop-blur-md ${colors[t.type]}`}>
          <p className="font-semibold">{t.text}</p>
          {t.detail && <p className="mt-1 text-[11px] opacity-75 leading-relaxed whitespace-pre-line">{t.detail}</p>}
        </div>
      ))}
    </div>
  );
}
