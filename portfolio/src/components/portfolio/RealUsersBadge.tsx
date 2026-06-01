import { UserCheck } from "lucide-react";

/**
 * Marks a project that is deployed and used by real users (as opposed to a
 * personal / learning / demo build). Styled like the role meta text — a small
 * muted label with a coloured icon, not a filled pill. Renders nothing when
 * the project has no real users.
 */
export function RealUsersBadge({
  active,
  size = 12,
  className = "",
}: {
  active?: boolean;
  size?: number;
  className?: string;
}) {
  if (!active) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[11px] text-foreground/70 ${className}`}
    >
      <UserCheck size={size} className="text-emerald-500" />
      Real Users
    </span>
  );
}
