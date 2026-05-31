import { useState } from "react";

/** Short label for the text-chip fallback when no logo image exists. */
function abbrev(name: string): string {
  const words = name.split(/[\s.\-/]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const clean = name.replace(/[^A-Za-z0-9]/g, "");
  return clean.slice(0, 3).toUpperCase();
}

/**
 * Renders a tech logo inside a bordered frame. Falls through the candidate
 * source list, and finally to a labelled chip if every image fails / is empty.
 * `size` = outer frame size; the icon sits inside with padding.
 */
export function TechIcon({
  name,
  srcs,
  size = 40,
}: {
  name: string;
  srcs: string[];
  size?: number;
}) {
  const [idx, setIdx] = useState(0);
  const failed = srcs.length === 0 || idx >= srcs.length;
  const inner = Math.round(size * 0.62); // icon a bit smaller than the frame

  return (
    <span
      className="inline-flex items-center justify-center rounded-lg bg-secondary ring-line hover:ring-strong motion-safe:transition-shadow"
      style={{ width: size, height: size }}
    >
      {failed ? (
        <span
          className="font-mono font-semibold text-foreground/80"
          style={{ fontSize: Math.round(size * 0.3) }}
        >
          {abbrev(name)}
        </span>
      ) : (
        <img
          src={srcs[idx]}
          alt={name}
          loading="lazy"
          className="object-contain"
          style={{ width: inner, height: inner }}
          onError={() => setIdx((i) => i + 1)}
        />
      )}
    </span>
  );
}
