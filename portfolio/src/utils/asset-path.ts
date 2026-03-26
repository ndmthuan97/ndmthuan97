/**
 * Resolves a public asset path with Vite's base URL.
 * Ensures assets load correctly when deployed to a subpath (e.g., GitHub Pages).
 *
 * @example
 * assetPath("/profile.JPG") → "/ndmthuan97/profile.JPG" (production)
 * assetPath("/profile.JPG") → "/profile.JPG" (dev)
 */
export function assetPath(path: string): string {
  const base = import.meta.env.BASE_URL;
  // Remove leading slash from path to avoid double-slash
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  // BASE_URL always ends with "/" when configured
  return `${base}${cleanPath}`;
}
