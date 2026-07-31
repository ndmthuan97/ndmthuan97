import { requireAuth, getBody, type VercelReq, type VercelRes } from "./_lib.js";
import { getRepo, getFileSha, putFile } from "./_github.js";
import { validateUpload } from "./_upload-rules.js";

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

  const { filename, contentBase64 } = await getBody<{ filename?: unknown; contentBase64?: unknown }>(req);

  // Type/extension/size/magic-byte rules live in _upload-rules.ts (see its self-check).
  // A ".pdf" upload always lands on public/CV.pdf, replacing the previous CV.
  const check = validateUpload(filename, contentBase64);
  if (!check.ok) {
    res.status(check.status).json({ ok: false, message: check.message });
    return;
  }

  const repoPath = `portfolio/public/${check.name}`;
  // The Contents API needs the current blob sha to REPLACE a file and answers 409
  // without it. null (file absent on the remote) is the create case. The CV always
  // reuses the same name, so replacing is its normal path.
  const sha = await getFileSha(repo, repoPath);
  const message =
    check.kind === "pdf" ? "chore: replace CV via admin panel" : `chore: upload project image ${check.name}`;

  const result = await putFile(repo, repoPath, check.content, message, sha);
  if (!result.ok) {
    res.status(502).json(result);
    return;
  }
  res.status(200).json({
    ok: true,
    path: `/${check.name}`,
    message: check.kind === "pdf" ? "CV replaced!" : "Uploaded!",
  });
}
