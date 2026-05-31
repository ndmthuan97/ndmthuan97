/**
 * Resolves a public asset path with Vite's base URL.
 * Base is "/" on Vercel, so this is effectively a passthrough; it still keeps
 * assets correct if the app is ever served from a subpath again.
 *
 * Absolute URLs (http(s)://, protocol-relative //, or data:) are returned
 * unchanged, so callers can mix local files and external image links freely.
 *
 * @example
 * assetPath("/profile.JPG")        → "/profile.JPG"
 * assetPath("https://x.com/a.png") → "https://x.com/a.png"
 */
export function assetPath(path: string): string {
  // Pass external/absolute URLs through untouched.
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  const base = import.meta.env.BASE_URL;
  // Remove leading slash from path to avoid double-slash
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  // BASE_URL always ends with "/" when configured
  return `${base}${cleanPath}`;
}
