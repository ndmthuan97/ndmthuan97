// GET /api/icons?i=dotnet,cs,spring,java&perline=6&size=48
// Returns a composite SVG image of tech skill icons.
// Reuses the same slug → CDN mapping from the portfolio frontend.
import type { VercelReq, VercelRes } from "./_lib.js";

// ── Slug → icon source (shared with portfolio frontend) ────────────────────
// Value can be:
//   • a domain name  → resolved via Google Favicon Service (e.g. "react.dev")
//   • a full URL     → used directly (e.g. "https://cdn.example.com/icon.png")
// Edit src/data/icons.json to add/change icons — both API and frontend read from it.
import ICONS from "../src/data/icons.json";

/** Resolve a slug to an icon URL, or null if unknown. */
function resolveIconUrl(slug: string): string | null {
  const value = ICONS[slug];
  if (!value) return null;
  if (value.startsWith("http")) return value;
  return `https://www.google.com/s2/favicons?domain=${value}&sz=128`;
}

/** Fetch an image and return it as a base64 data-URI (PNG/SVG). */
async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = ct.includes("svg") ? "image/svg+xml" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const raw = (req.query.i as string) ?? "";
  const slugs = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!slugs.length) return res.status(400).json({ error: "Missing ?i= parameter" });

  const perLine = Math.min(Number(req.query.perline) || 15, 30);
  const size = Math.min(Number(req.query.size) || 48, 128);
  const gap = 12;

  // Fetch all icons in parallel
  const results = await Promise.all(
    slugs.map(async (slug) => {
      const url = resolveIconUrl(slug);
      if (!url) return { slug, dataUri: null };
      const dataUri = await fetchAsDataUri(url);
      return { slug, dataUri };
    })
  );

  const cols = Math.min(slugs.length, perLine);
  const rows = Math.ceil(slugs.length / perLine);
  const totalW = cols * size + (cols - 1) * gap;
  const totalH = rows * size + (rows - 1) * gap;

  // Build inner SVG elements
  const elements = results
    .map(({ slug, dataUri }, idx) => {
      const col = idx % perLine;
      const row = Math.floor(idx / perLine);
      const x = col * (size + gap);
      const y = row * (size + gap);

      if (dataUri) {
        return `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${dataUri}" />`;
      }
      // Text fallback for unresolvable slugs
      const label = slug.slice(0, 3).toUpperCase();
      return [
        `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="8" fill="#1a1a2e" />`,
        `<text x="${x + size / 2}" y="${y + size / 2 + 5}" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="600" fill="#ccc">${label}</text>`,
      ].join("");
    })
    .join("\n    ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
    ${elements}
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return res.status(200).end(svg);
}
