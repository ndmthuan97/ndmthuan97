import { requireAuth, getBody, type VercelReq, type VercelRes } from "./_lib.js";
import { getRepo, putFile } from "./_github.js";

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAuth(req, res)) return;

  const repo = getRepo();
  if (!repo || !process.env.GITHUB_PAT) {
    res.status(500).json({ ok: false, message: "GITHUB_REPO or GITHUB_PAT not configured" });
    return;
  }

  const { filename, contentBase64 } = await getBody<{ filename?: string; contentBase64?: string }>(req);
  if (!filename || !contentBase64) {
    res.status(400).json({ ok: false, message: "Missing 'filename' or 'contentBase64'" });
    return;
  }

  // Only allow image extensions.
  const ALLOWED = ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"];
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED.includes(ext)) {
    res.status(400).json({ ok: false, message: `Unsupported file type ".${ext}" (images only)` });
    return;
  }

  // Cap decoded size at ~5MB (base64 is ~4/3 of raw bytes).
  const MAX_BYTES = 5 * 1024 * 1024;
  const approxBytes = Math.floor((contentBase64.length * 3) / 4);
  if (approxBytes > MAX_BYTES) {
    res.status(413).json({ ok: false, message: "Image too large (max 5MB)" });
    return;
  }

  // Sanitize: strip path separators, keep a safe base name.
  const safe = filename.replace(/[^a-z0-9._-]/gi, "-");
  const repoPath = `portfolio/public/${safe}`;
  const result = await putFile(repo, repoPath, contentBase64, `chore: upload project image ${safe}`);
  if (!result.ok) {
    res.status(502).json(result);
    return;
  }
  res.status(200).json({ ok: true, path: `/${safe}`, message: "Uploaded!" });
}
