import { User, Users, Briefcase, Clock } from "lucide-react";
import { projectTypeMeta } from "../../lib/portfolio-helpers";
import type { ProjectType } from "../../types/portfolio";

const ICONS = { User, Users, Briefcase, Clock } as const;

/**
 * Small pill showing how a project was undertaken
 * (Personal / Team / Company / Freelance). Renders nothing for unknown types.
 */
export function ProjectTypeBadge({
  type,
  size = 11,
  className = "",
}: {
  type?: ProjectType | string;
  size?: number;
  className?: string;
}) {
  const meta = projectTypeMeta(type);
  if (!meta) return null;
  const Icon = ICONS[meta.icon as keyof typeof ICONS] ?? User;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-medium uppercase tracking-wider ${meta.badge} ${className}`}
    >
      <Icon size={size} />
      {meta.label}
    </span>
  );
}
