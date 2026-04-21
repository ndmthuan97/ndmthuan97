import { useState } from "react";

const PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(false);

  // If no password configured, deny access
  if (!PASSWORD) {
    return (
      <div className="min-h-screen bg-figma-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-4xl">🔒</p>
          <p className="text-muted-foreground text-sm">Admin panel is not configured in this build.</p>
          <p className="text-muted-foreground text-xs">Set VITE_ADMIN_PASSWORD in .env.local</p>
        </div>
      </div>
    );
  }

  if (authed) return <>{children}</>;

  return (
    <div className="min-h-screen bg-figma-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#111111] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <p className="text-3xl mb-2">🛡️</p>
          <h1 className="text-xl font-black text-foreground">Portfolio Admin</h1>
          <p className="text-muted-foreground text-xs mt-1">Enter your admin password</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input === PASSWORD) {
              setAuthed(true);
            } else {
              setError(true);
              setInput("");
              setTimeout(() => setError(false), 2000);
            }
          }}
          className="space-y-4"
        >
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Password"
            autoFocus
            className={`w-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-4 py-3 text-white placeholder:text-[#666666] text-sm outline-none motion-safe:transition-all ${
              error ? "shadow-[0_0_0_1px_rgba(239,68,68,0.8)] animate-pulse" : "focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]"
            }`}
          />
          <button
            type="submit"
            className="w-full bg-white hover:bg-white/90 text-[#0a0a0a] font-bold py-3 rounded-[6px] motion-safe:transition-all active:scale-95 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
          >
            Unlock
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-xs text-center">Incorrect password. Try again.</p>
        )}
      </div>
    </div>
  );
}
