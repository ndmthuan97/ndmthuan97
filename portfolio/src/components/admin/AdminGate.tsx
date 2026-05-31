import { useState } from "react";
import { login, isAuthed } from "../../lib/admin-session";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState("");
  // Restore an existing, non-expired session so a reload doesn't force re-login.
  const [authed, setAuthed] = useState(() => isAuthed());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authed) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || loading) return;
    setLoading(true);
    setError("");
    const result = await login(input);
    setLoading(false);
    if (result.ok) {
      setAuthed(true);
    } else {
      setError(result.message ?? "Incorrect password");
      setInput("");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm surface p-8 space-y-6">
        <div className="text-center">
          <p className="text-3xl mb-2">🛡️</p>
          <h1 className="font-display text-xl font-bold text-foreground">Portfolio Admin</h1>
          <p className="text-muted-foreground text-xs mt-1">Enter your admin password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Password"
            autoFocus
            disabled={loading}
            className={`w-full bg-secondary rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm outline-none motion-safe:transition-all ${
              error ? "ring-2 ring-red-500 animate-pulse" : "ring-line focus:ring-strong"
            }`}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background font-medium py-3 rounded-md hover:opacity-90 motion-safe:transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </form>

        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
      </div>
    </div>
  );
}
