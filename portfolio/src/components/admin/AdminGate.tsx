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
      <div className="w-full max-w-sm bg-figma-header border border-figma-border rounded-2xl p-8 space-y-6">
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
            className={`w-full bg-figma-card border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-figma-accent/60 transition-colors ${
              error ? "border-red-500 animate-pulse" : "border-figma-border"
            }`}
          />
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
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
