import { Fragment } from "react";

/**
 * Renders the one markup marker the project copy carries: `**emphasis**`.
 *
 * The text lives in projects.json and is edited by hand and from the admin
 * panel, so it stays plain text with a single markdown-ish marker rather than
 * HTML — nothing here goes near dangerouslySetInnerHTML.
 *
 * Used by the project page AND the card: cardHighlights() reads the same
 * `highlights`/`features` strings, so a card rendering them raw would print
 * literal asterisks.
 */
export function RichText({ children }: { children: string }) {
  // Capturing split → even indices are plain runs, odd ones are emphasised.
  // [\s\S] rather than `.` because some bullets wrap across newlines.
  const parts = children.split(/\*\*([\s\S]+?)\*\*/g);

  if (parts.length === 1) return <>{children}</>;

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">{part}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
