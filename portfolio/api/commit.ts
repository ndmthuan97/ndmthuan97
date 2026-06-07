import { requireAuth, getBody, type VercelReq, type VercelRes } from "./_lib.js";
import { getRepo, getFileSha, putFile } from "./_github.js";

// Only these data files may be written from the admin panel.
const ALLOWED_FILES: Record<string, string> = {
  projects:  "portfolio/src/data/projects.json",
  about:      "portfolio/src/data/about.json",
  skills:     "portfolio/src/data/skills.json",
  icons:      "portfolio/src/data/icons.json",
  contact:    "portfolio/src/data/contact.json",
  education:  "portfolio/src/data/education.json",
};

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAuth(req, res)) return;

  const repo = getRepo();
  if (!repo) {
    res.status(500).json({ ok: false, message: "GITHUB_REPO not configured" });
    return;
  }
  if (!process.env.GITHUB_PAT) {
    res.status(500).json({ ok: false, message: "GITHUB_PAT not configured" });
    return;
  }

  // `file` selects which data file to write; defaults to the experience/projects data.
  const { content, file = "projects" } = await getBody<{ content?: string; file?: string }>(req);
  if (typeof content !== "string") {
    res.status(400).json({ ok: false, message: "Missing 'content'" });
    return;
  }
  const filePath = ALLOWED_FILES[file];
  if (!filePath) {
    res.status(400).json({ ok: false, message: `Unknown file "${file}"` });
    return;
  }
  // Reject invalid JSON before committing.
  try { JSON.parse(content); }
  catch { res.status(400).json({ ok: false, message: "Content is not valid JSON" }); return; }

  const sha = await getFileSha(repo, filePath);
  const base64 = Buffer.from(content, "utf-8").toString("base64");
  const result = await putFile(repo, filePath, base64, `chore: update ${file} via admin panel`, sha);
  res.status(result.ok ? 200 : 502).json(result);
}
