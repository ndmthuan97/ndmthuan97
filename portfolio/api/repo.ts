import { requireAuth, type VercelReq, type VercelRes } from "./_lib.js";
import { GH, ghHeaders, isRepoAllowed } from "./_github.js";

// Read a single repo's metadata (?part=info, default) or its README (?part=readme).
export default async function handler(req: VercelReq, res: VercelRes) {
  if (!requireAuth(req, res)) return;

  const repoRaw = req.query.repo;
  const repo = (Array.isArray(repoRaw) ? repoRaw[0] : repoRaw) || "";
  const partRaw = req.query.part;
  const part = (Array.isArray(partRaw) ? partRaw[0] : partRaw) || "info";
  if (!repo) {
    res.status(400).json({ error: "Missing 'repo'" });
    return;
  }
  if (!isRepoAllowed(repo)) {
    res.status(403).json({ error: "Repo not allowed" });
    return;
  }

  if (part === "readme") {
    const r = await fetch(`${GH}/repos/${repo}/readme`, { headers: ghHeaders() });
    if (!r.ok) {
      res.status(200).json({ readme: null });
      return;
    }
    const data = (await r.json()) as { content?: string; encoding?: string };
    if (data.encoding !== "base64" || !data.content) {
      res.status(200).json({ readme: null });
      return;
    }
    const text = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
    const cleaned = text
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, "")
      .replace(/[ \t]+/g, " ")
      .trim()
      .slice(0, 3000);
    res.status(200).json({ readme: cleaned });
    return;
  }

  // part === "info"
  const r = await fetch(`${GH}/repos/${repo}`, { headers: ghHeaders() });
  if (!r.ok) {
    res.status(r.status).json({ error: `GitHub API ${r.status}` });
    return;
  }
  const data = (await r.json()) as {
    name: string;
    description: string | null;
    language: string | null;
    topics?: string[];
    stargazers_count: number;
    html_url: string;
  };
  res.status(200).json({
    name: data.name,
    description: data.description,
    language: data.language,
    topics: data.topics ?? [],
    stargazers_count: data.stargazers_count,
    html_url: data.html_url,
  });
}
